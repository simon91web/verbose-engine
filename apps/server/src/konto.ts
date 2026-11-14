import { createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import type { Datenbank } from './datenbank.ts';
import { transaktion } from './datenbank.ts';

/** Einrichten, Anmelden, Passwort (scrypt), Sitzungen und die Sperre bei zu vielen Fehlversuchen. */

export const MIN_PASSWORT = 10;
export const SITZUNG_TAGE = 365;
export const SITZUNG_SEKUNDEN = SITZUNG_TAGE * 24 * 60 * 60;
const TAG_MS = 24 * 60 * 60 * 1000;

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, laenge: 64 };

// ---------- Passwort ----------

function scryptAsync(passwort: string, salz: Buffer, N: number, r: number, p: number, laenge: number): Promise<Buffer> {
  return new Promise((ok, fehler) => {
    scrypt(passwort, salz, laenge, { N, r, p, maxmem: 256 * N * r }, (e, schluessel) => (e ? fehler(e) : ok(schluessel)));
  });
}

/** Format: scrypt$N$r$p$Salz$Hash (Base64); die Parameter stehen im Hash, damit sie sich später ändern lassen. */
export async function hashePasswort(passwort: string): Promise<string> {
  const salz = randomBytes(16);
  const h = await scryptAsync(passwort, salz, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.laenge);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salz.toString('base64'), h.toString('base64')].join('$');
}

export async function pruefePasswort(passwort: string, gespeichert: string): Promise<boolean> {
  const teile = gespeichert.split('$');
  if (teile.length !== 6 || teile[0] !== 'scrypt') return false;
  const [N, r, p] = [Number(teile[1]), Number(teile[2]), Number(teile[3])];
  const salz = Buffer.from(teile[4]!, 'base64');
  const erwartet = Buffer.from(teile[5]!, 'base64');
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p) || erwartet.length === 0) return false;
  const h = await scryptAsync(passwort, salz, N, r, p, erwartet.length);
  return timingSafeEqual(h, erwartet);
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

// ---------- Einrichtungscode ----------

/** Zeigt den Code gut lesbar: 482913 → „482 913“. */
export function zeigeCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/** Legt einen neuen sechsstelligen Code fest (gespeichert wird nur der Hash); ein alter Code verfällt. */
export function neuerEinrichtungscode(db: Datenbank): string {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  transaktion(db, () => {
    db.prepare('DELETE FROM einrichtung').run();
    db.prepare('INSERT INTO einrichtung (code_hash, angelegt) VALUES (?, ?)').run(sha256(code), Date.now());
  });
  return code;
}

export function istEingerichtet(db: Datenbank): boolean {
  return db.prepare('SELECT 1 FROM konto WHERE hash IS NOT NULL').get() !== undefined;
}

/** Beim Start: Ist noch kein Passwort gesetzt, gibt es einen frischen Code, den das Protokoll zeigt. */
export function einrichtungscodeBeimStart(db: Datenbank): string | null {
  return istEingerichtet(db) ? null : neuerEinrichtungscode(db);
}

export type Ergebnis<T = object> = ({ ok: true } & T) | { ok: false; status: number; fehler: string };

/**
 * Legt das Konto an (oder setzt nach `npm run passwort` das Passwort neu), verbraucht den Code und gibt die
 * Konto-ID zurück. Spielstand und Sicherungen eines bestehenden Kontos bleiben.
 */
export async function richteEin(db: Datenbank, code: string, passwort: string): Promise<Ergebnis<{ konto: number }>> {
  if (istEingerichtet(db)) return { ok: false, status: 409, fehler: 'Lichtung ist schon eingerichtet' };
  const ziffern = String(code ?? '').replace(/\D/g, '');
  const codeHash = sha256(ziffern);
  if (ziffern.length !== 6 || !db.prepare('SELECT 1 FROM einrichtung WHERE code_hash = ?').get(codeHash)) {
    return { ok: false, status: 403, fehler: 'Code stimmt nicht' };
  }
  if (typeof passwort !== 'string' || [...passwort].length < MIN_PASSWORT) {
    return { ok: false, status: 400, fehler: `Passwort braucht mindestens ${MIN_PASSWORT} Zeichen` };
  }
  const hash = await hashePasswort(passwort);
  return transaktion(db, (): Ergebnis<{ konto: number }> => {
    // Zwischen Prüfung und Schreiben kann ein zweiter Aufruf dazwischengekommen sein
    if (istEingerichtet(db)) return { ok: false, status: 409, fehler: 'Lichtung ist schon eingerichtet' };
    if (!db.prepare('SELECT 1 FROM einrichtung WHERE code_hash = ?').get(codeHash)) {
      return { ok: false, status: 403, fehler: 'Code stimmt nicht' };
    }
    const bestehend = db.prepare('SELECT id FROM konto ORDER BY id LIMIT 1').get() as { id: number } | undefined;
    let konto: number;
    if (bestehend) {
      konto = bestehend.id;
      db.prepare('UPDATE konto SET hash = ? WHERE id = ?').run(hash, konto);
    } else {
      konto = Number(db.prepare('INSERT INTO konto (hash, angelegt) VALUES (?, ?)').run(hash, Date.now()).lastInsertRowid);
    }
    db.prepare('DELETE FROM einrichtung').run();
    return { ok: true, konto };
  });
}

/** Prüft das Passwort; bei Erfolg die Konto-ID. */
export async function meldeAn(db: Datenbank, passwort: string): Promise<Ergebnis<{ konto: number }>> {
  const konto = db.prepare('SELECT id, hash FROM konto WHERE hash IS NOT NULL ORDER BY id LIMIT 1').get() as
    | { id: number; hash: string }
    | undefined;
  if (!konto) return { ok: false, status: 409, fehler: 'Lichtung ist noch nicht eingerichtet' };
  if (typeof passwort !== 'string' || !(await pruefePasswort(passwort, konto.hash))) {
    return { ok: false, status: 401, fehler: 'Passwort stimmt nicht' };
  }
  return { ok: true, konto: konto.id };
}

// ---------- Sitzungen ----------

/** Neue Sitzung; zurück kommt der Token fürs Cookie (in der Datenbank steht nur sein Hash). */
export function legeSitzungAn(db: Datenbank, konto: number): string {
  const token = randomBytes(32).toString('base64url');
  const jetzt = Date.now();
  db.prepare('INSERT INTO sitzung (token_hash, konto, angelegt, zuletzt) VALUES (?, ?, ?, ?)').run(sha256(token), konto, jetzt, jetzt);
  // Abgelaufene Sitzungen nebenbei aufräumen
  db.prepare('DELETE FROM sitzung WHERE zuletzt < ?').run(jetzt - SITZUNG_TAGE * TAG_MS);
  return token;
}

export interface SitzungsInfo {
  konto: number;
  /** Das Cookie ist älter als ein Tag und sollte neu gesetzt werden. */
  verlaengern: boolean;
}

/** Sucht die Sitzung zum Token, setzt `zuletzt` neu und sagt, ob das Cookie verlängert werden soll. */
export function pruefeSitzung(db: Datenbank, token: string | undefined): SitzungsInfo | null {
  if (!token) return null;
  const hash = sha256(token);
  const zeile = db.prepare('SELECT konto, zuletzt FROM sitzung WHERE token_hash = ?').get(hash) as
    | { konto: number; zuletzt: number }
    | undefined;
  if (!zeile) return null;
  const jetzt = Date.now();
  if (zeile.zuletzt < jetzt - SITZUNG_TAGE * TAG_MS) {
    db.prepare('DELETE FROM sitzung WHERE token_hash = ?').run(hash);
    return null;
  }
  db.prepare('UPDATE sitzung SET zuletzt = ? WHERE token_hash = ?').run(jetzt, hash);
  return { konto: zeile.konto, verlaengern: jetzt - zeile.zuletzt > TAG_MS };
}

export function beendeSitzung(db: Datenbank, token: string | undefined): void {
  if (token) db.prepare('DELETE FROM sitzung WHERE token_hash = ?').run(sha256(token));
}

// ---------- Sperre ----------

/** Höchstens `max` Fehlversuche je Fenster und Adresse, im Speicher. */
export class Sperre {
  private readonly eintraege = new Map<string, { start: number; anzahl: number }>();

  private readonly max: number;
  private readonly fensterMs: number;

  constructor(max = 5, fensterMs = 60_000) {
    this.max = max;
    this.fensterMs = fensterMs;
  }

  /** Sekunden bis zum nächsten Versuch; 0, wenn frei. */
  wartenSekunden(ip: string): number {
    const e = this.eintraege.get(ip);
    if (!e) return 0;
    const rest = e.start + this.fensterMs - Date.now();
    if (rest <= 0) {
      this.eintraege.delete(ip);
      return 0;
    }
    return e.anzahl >= this.max ? Math.ceil(rest / 1000) : 0;
  }

  fehlversuch(ip: string): void {
    const jetzt = Date.now();
    if (this.eintraege.size > 1000) {
      for (const [k, e] of this.eintraege) if (e.start + this.fensterMs <= jetzt) this.eintraege.delete(k);
    }
    const e = this.eintraege.get(ip);
    if (!e || e.start + this.fensterMs <= jetzt) this.eintraege.set(ip, { start: jetzt, anzahl: 1 });
    else e.anzahl++;
  }

  erfolg(ip: string): void {
    this.eintraege.delete(ip);
  }
}
