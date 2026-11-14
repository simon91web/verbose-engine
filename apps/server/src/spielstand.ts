import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Datenbank } from './datenbank.ts';
import { transaktion } from './datenbank.ts';

/** Spielstand mit Revision, Sicherungen und die Nachtsicherung. Der Server speichert nur, er rechnet nicht nach. */

export const MAX_DATEN_BYTES = 1024 * 1024;
export const MAX_SICHERUNGEN = 50;
export const NACHT = 'Nachtsicherung';
export const VOR_WIEDERHERSTELLEN = 'Vor Wiederherstellen';
const BEHALTE_NACHTDATEIEN = 7;

export interface Stand {
  revision: number;
  daten: Record<string, unknown> | null;
  geaendert?: number;
  geraet?: string;
}

export interface Eingang {
  daten: Record<string, unknown>;
  geaendert: number;
  geraet: string;
}

export interface SicherungInfo {
  id: number;
  zeitpunkt: number;
  grund: string;
  geraet: string;
  tag: number | null;
}

/** Prüft grob: JSON-Objekt mit `version`, höchstens 1 MB. Fehlermeldung oder null. */
export function pruefeEingang(daten: unknown, geaendert: unknown, geraet: unknown): string | null {
  if (typeof daten !== 'object' || daten === null || Array.isArray(daten)) return 'Spielstand ungültig';
  if (!('version' in daten)) return 'Spielstand ungültig';
  if (typeof geaendert !== 'number' || !Number.isFinite(geaendert)) return 'Spielstand ungültig';
  if (geraet !== undefined && typeof geraet !== 'string') return 'Spielstand ungültig';
  if (Buffer.byteLength(JSON.stringify(daten)) > MAX_DATEN_BYTES) return 'Spielstand ist zu groß';
  return null;
}

function tagVon(daten: unknown): number | null {
  const siedlung = (daten as { siedlung?: { tag?: unknown } } | null)?.siedlung;
  const tag = siedlung?.tag;
  return typeof tag === 'number' && Number.isFinite(tag) ? tag : null;
}

interface StandZeile {
  revision: number;
  daten: string;
  geaendert: number;
  geraet: string;
}

function zeile(db: Datenbank, konto: number): StandZeile | undefined {
  return db.prepare('SELECT revision, daten, geaendert, geraet FROM spielstand WHERE konto = ?').get(konto) as
    | StandZeile
    | undefined;
}

function alsStand(z: StandZeile | undefined): Stand {
  if (!z) return { revision: 0, daten: null };
  return { revision: z.revision, daten: JSON.parse(z.daten), geaendert: z.geaendert, geraet: z.geraet };
}

export function ladeStand(db: Datenbank, konto: number): Stand {
  return alsStand(zeile(db, konto));
}

/** Legt eine Sicherung ab und hält die Liste bei höchstens 50 (Nachtsicherungen zählen nicht und bleiben). */
export function legeSicherungAb(
  db: Datenbank,
  konto: number,
  s: { zeitpunkt: number; grund: string; geraet: string; daten: string },
): void {
  db.prepare('INSERT INTO sicherung (konto, zeitpunkt, grund, geraet, tag, daten) VALUES (?, ?, ?, ?, ?, ?)').run(
    konto,
    s.zeitpunkt,
    s.grund,
    s.geraet,
    tagVon(JSON.parse(s.daten)),
    s.daten,
  );
  db.prepare(
    `DELETE FROM sicherung WHERE konto = ? AND grund <> ? AND id NOT IN
       (SELECT id FROM sicherung WHERE konto = ? AND grund <> ? ORDER BY id DESC LIMIT ?)`,
  ).run(konto, NACHT, konto, NACHT, MAX_SICHERUNGEN);
}

function sichereAktuellen(db: Datenbank, konto: number, grund: string): void {
  const alt = zeile(db, konto);
  if (alt) legeSicherungAb(db, konto, { zeitpunkt: alt.geaendert, grund, geraet: alt.geraet, daten: alt.daten });
}

function schreibe(db: Datenbank, konto: number, revision: number, daten: string, geaendert: number, geraet: string): void {
  db.prepare(
    `INSERT INTO spielstand (konto, revision, daten, geaendert, geraet) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(konto) DO UPDATE SET revision = excluded.revision, daten = excluded.daten,
       geaendert = excluded.geaendert, geraet = excluded.geraet`,
  ).run(konto, revision, daten, geaendert, geraet);
}

/** Speichert, wenn `basis` zur aktuellen Revision passt; sonst kommt der Serverstand zurück (für 409). */
export function speichere(
  db: Datenbank,
  konto: number,
  basis: number,
  e: Eingang,
): { ok: true; revision: number } | { ok: false; stand: Stand } {
  return transaktion(db, () => {
    const aktuell = zeile(db, konto);
    const revision = aktuell?.revision ?? 0;
    if (basis !== revision) return { ok: false as const, stand: alsStand(aktuell) };
    schreibe(db, konto, revision + 1, JSON.stringify(e.daten), e.geaendert, e.geraet);
    return { ok: true as const, revision: revision + 1 };
  });
}

/** Setzt den Stand unabhängig von der Revision; der bisherige wird Sicherung. */
export function erzwinge(db: Datenbank, konto: number, e: Eingang, grund: string): { revision: number } {
  return transaktion(db, () => {
    const revision = (zeile(db, konto)?.revision ?? 0) + 1;
    sichereAktuellen(db, konto, grund);
    schreibe(db, konto, revision, JSON.stringify(e.daten), e.geaendert, e.geraet);
    return { revision };
  });
}

export function listeSicherungen(db: Datenbank, konto: number): SicherungInfo[] {
  return db
    .prepare('SELECT id, zeitpunkt, grund, geraet, tag FROM sicherung WHERE konto = ? ORDER BY id DESC')
    .all(konto) as unknown as SicherungInfo[];
}

/** Aktueller Stand wird Sicherung „Vor Wiederherstellen“, die gewählte Sicherung wird der aktuelle Stand. */
export function stelleWiederHer(db: Datenbank, konto: number, id: number): Stand | null {
  return transaktion(db, () => {
    const s = db.prepare('SELECT daten, geraet FROM sicherung WHERE id = ? AND konto = ?').get(id, konto) as
      | { daten: string; geraet: string }
      | undefined;
    if (!s) return null;
    const revision = (zeile(db, konto)?.revision ?? 0) + 1;
    sichereAktuellen(db, konto, VOR_WIEDERHERSTELLEN);
    schreibe(db, konto, revision, s.daten, Date.now(), s.geraet);
    return alsStand(zeile(db, konto));
  });
}

// ---------- Nachtsicherung ----------

function datum(d: Date): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

/**
 * Einmal je Tag (Zeitzone über TZ): Datenbank per VACUUM INTO nach `verzeichnis`, die letzten 7 Dateien bleiben.
 * Dazu eine Zeile „Nachtsicherung“, aber nur, wenn sich der Stand seit der letzten geändert hat.
 * Gibt false zurück, wenn heute schon gesichert wurde.
 */
export function nachtsicherung(db: Datenbank, verzeichnis: string, jetzt = new Date()): boolean {
  mkdirSync(verzeichnis, { recursive: true });
  const datei = join(verzeichnis, `lichtung-${datum(jetzt)}.db`);
  if (existsSync(datei)) return false;
  db.prepare('VACUUM INTO ?').run(datei);

  const dateien = readdirSync(verzeichnis)
    .filter((n) => /^lichtung-\d{4}-\d{2}-\d{2}\.db$/.test(n))
    .sort();
  for (const alt of dateien.slice(0, Math.max(0, dateien.length - BEHALTE_NACHTDATEIEN))) rmSync(join(verzeichnis, alt));

  const staende = db.prepare('SELECT konto, daten, geaendert, geraet FROM spielstand').all() as unknown as (StandZeile & {
    konto: number;
  })[];
  for (const s of staende) {
    const letzte = db
      .prepare('SELECT daten FROM sicherung WHERE konto = ? AND grund = ? ORDER BY id DESC LIMIT 1')
      .get(s.konto, NACHT) as { daten: string } | undefined;
    if (letzte?.daten === s.daten) continue;
    legeSicherungAb(db, s.konto, { zeitpunkt: jetzt.getTime(), grund: NACHT, geraet: s.geraet, daten: s.daten });
  }
  return true;
}

/** Beim Start prüfen, danach stündlich (fängt Tageswechsel und Zeitzone ab). */
export function starteNachtsicherung(db: Datenbank, verzeichnis: string, log: (text: string) => void): () => void {
  const lauf = () => {
    try {
      if (nachtsicherung(db, verzeichnis)) log(`Nachtsicherung angelegt in ${verzeichnis}`);
    } catch (fehler) {
      log(`Nachtsicherung fehlgeschlagen: ${String(fehler)}`);
    }
  };
  lauf();
  const zeitgeber = setInterval(lauf, 60 * 60 * 1000);
  zeitgeber.unref();
  return () => clearInterval(zeitgeber);
}
