import { FLECKEN, WAREN_LISTE, neueSiedlung, type Siedlung, type Tagwerk } from '@lichtung/spiel';

/**
 * Datenversion des Spiels. Eine App darf nie einen Stand überschreiben, dessen Version höher ist als ihre eigene
 * (sie würde ihn sonst für unbrauchbar halten); sie sperrt sich dann und bietet „Neu laden“ an.
 */
export const DATENVERSION = 3;

/** Das Spiel selbst: das, was auf den Server geht und zwischen Geräten wandert. */
export interface Spieldaten {
  siedlung: Siedlung;
  /** Höchster Gesamtertrag eines Tagwerks. */
  bester: number;
}

/** Was im Browser gespeichert wird: das Spiel plus der Stand des Abgleichs mit dem Server. */
export interface Spielstand extends Spieldaten {
  version: typeof DATENVERSION;
  /** Zuletzt bekannte Revision auf dem Server; 0 = noch nie abgeglichen. */
  revision: number;
  /** Zeitpunkt (ms) der letzten Spieländerung; 0 = noch nichts gespielt. */
  geaendert: number;
  /** Es gibt Änderungen, die der Server noch nicht kennt. */
  ungespeichert: boolean;
}

/** Spielstand aus Meilenstein 2: Siedlung ohne Abgleich. */
interface SpielstandV2 extends Spieldaten {
  version: 2;
}

/** Spielstand aus Meilenstein 1: ein einzelnes Tagwerk mit Tageszähler. */
interface SpielstandV1 {
  version: 1;
  seed: number;
  tag: number;
  tagwerk: Tagwerk;
  bester: number;
}

const SCHLUESSEL = 'lichtung.spielstand';

const istZahl = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Der Stand stammt von einer neueren App als dieser: nicht anfassen, nicht verwerfen, nicht überschreiben. */
export function istZuNeu(daten: unknown): boolean {
  const v = (daten as { version?: unknown } | null | undefined)?.version;
  return istZahl(v) && v > DATENVERSION;
}

const hatGitter = (t: Tagwerk | undefined): t is Tagwerk => !!t && Array.isArray(t.gitter) && t.gitter.length > 0;

/** Grobe Prüfung, damit ein beschädigter Stand nie die Oberfläche zum Absturz bringt. */
function istSiedlung(s: Siedlung | undefined): s is Siedlung {
  if (!s || !istZahl(s.seed) || !istZahl(s.tag) || !s.lager || !s.flecken || !s.auftraege || !s.ladung) return false;
  if (!WAREN_LISTE.every((w) => istZahl(s.lager[w]))) return false;
  if (!FLECKEN.every((f) => s.flecken[f.id]?.zustand)) return false;
  return s.unterwegs === null || (!!s.unterwegs && !!s.flecken[s.unterwegs.fleck] && hatGitter(s.unterwegs.tagwerk));
}

/** Das laufende Tagwerk wird zum Tagwerk im Nordwald, der Rest ist Startzustand. */
function ausV1(alt: SpielstandV1): SpielstandV2 | null {
  if (!istZahl(alt.seed) || !hatGitter(alt.tagwerk)) return null;
  const start = neueSiedlung(alt.seed);
  const nordwald = start.flecken.nordwald;
  const stand = Math.max(0, Math.min(nordwald.ziel, alt.tagwerk.ziel?.stand ?? 0));
  nordwald.stand = stand;
  const tagwerk: Tagwerk = { ...alt.tagwerk, ziel: { stand, gesamt: nordwald.ziel } };
  const siedlung: Siedlung = {
    ...start,
    tag: istZahl(alt.tag) && alt.tag >= 1 ? Math.floor(alt.tag) : 1,
    ladung: { ...start.ladung, ...alt.tagwerk.ladung },
    unterwegs: { fleck: 'nordwald', tagwerk },
  };
  return { version: 2, siedlung, bester: istZahl(alt.bester) ? alt.bester : 0 };
}

/** Ein Spiel aus Version 2 ist bisher nur auf diesem Gerät und gilt als gerade gespielt. */
function ausV2(alt: SpielstandV2, jetzt: number): Spielstand | null {
  if (!istSiedlung(alt.siedlung)) return null;
  return { version: DATENVERSION, siedlung: alt.siedlung, bester: istZahl(alt.bester) ? alt.bester : 0, revision: 0, geaendert: jetzt, ungespeichert: true };
}

/** Liest einen gespeicherten Stand beliebiger Version (1 → 2 → 3). Null, wenn er unbrauchbar ist. */
export function migriere(stand: unknown, jetzt = Date.now()): Spielstand | null {
  const s = stand as Spielstand | SpielstandV2 | SpielstandV1 | null | undefined;
  if (s?.version === DATENVERSION) {
    if (!istSiedlung(s.siedlung)) return null;
    return {
      version: DATENVERSION,
      siedlung: s.siedlung,
      bester: istZahl(s.bester) ? s.bester : 0,
      revision: istZahl(s.revision) && s.revision >= 0 ? Math.floor(s.revision) : 0,
      geaendert: istZahl(s.geaendert) ? s.geaendert : 0,
      ungespeichert: s.ungespeichert === true,
    };
  }
  if (s?.version === 2) return ausV2(s, jetzt);
  if (s?.version === 1) {
    const v2 = ausV1(s);
    return v2 ? ausV2(v2, jetzt) : null;
  }
  return null;
}

/** Spiel von einem anderen Gerät (Server): Version 2 oder 3 ohne Abgleichsfelder. Null, wenn unbrauchbar. */
export function ausServerDaten(daten: unknown): Spieldaten | null {
  const d = daten as { version?: unknown; siedlung?: Siedlung; bester?: unknown } | null | undefined;
  if (!d || (d.version !== 2 && d.version !== 3) || !istSiedlung(d.siedlung)) return null;
  return { siedlung: d.siedlung, bester: istZahl(d.bester) ? d.bester : 0 };
}

/** Das, was an den Server geht: nur das Spiel, ohne Abgleichsfelder. */
export const zuDaten = (s: Spieldaten): Record<string, unknown> => ({ version: DATENVERSION, siedlung: s.siedlung, bester: s.bester });

/** Gleiches Spiel, unabhängig vom Abgleich. */
export const gleichesSpiel = (a: Spieldaten, b: Spieldaten): boolean => JSON.stringify(zuDaten(a)) === JSON.stringify(zuDaten(b));

/** Ergebnis des Ladens: nichts da oder unbrauchbar (`leer`), brauchbar, oder von einer neueren App gespeichert. */
export type LokalerStand = { art: 'leer' } | { art: 'ok'; stand: Spielstand } | { art: 'zuNeu' };

/** Solange ein zu neuer Stand im Speicher liegt, schreibt diese App nichts mehr dorthin. */
let lokalGesperrt = false;

/** Version des Stands im Speicher, ohne ihn ganz zu lesen (`version` steht beim Schreiben immer vorn). */
const versionImRoh = (roh: string): number | null => {
  const t = /^\s*\{\s*"version"\s*:\s*(\d+)/.exec(roh.slice(0, 40));
  return t ? Number(t[1]) : null;
};

export function ladenGenau(): LokalerStand {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return { art: 'leer' };
    const daten: unknown = JSON.parse(roh);
    if (istZuNeu(daten)) {
      lokalGesperrt = true;
      return { art: 'zuNeu' };
    }
    const stand = migriere(daten);
    return stand ? { art: 'ok', stand } : { art: 'leer' };
  } catch {
    return { art: 'leer' };
  }
}

export function laden(): Spielstand | null {
  const r = ladenGenau();
  return r.art === 'ok' ? r.stand : null;
}

/** Schreibt den Stand, außer im Speicher liegt einer von einer neueren App: der bleibt, wie er ist. */
export function speichern(stand: Spielstand): boolean {
  try {
    if (!lokalGesperrt) {
      const roh = localStorage.getItem(SCHLUESSEL);
      const v = roh ? versionImRoh(roh) : null;
      if (v !== null && v > DATENVERSION) lokalGesperrt = true;
    }
    if (lokalGesperrt) return true;
    localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
    return true;
  } catch {
    return false;
  }
}

/** Nur für Tests. */
export const sperreZuruecksetzen = () => {
  lokalGesperrt = false;
};

/** Frisches Spiel; `geaendert` 0 heißt „noch nichts gespielt“ – so überschreibt es nie einen Stand vom Server. */
export function neuerSpielstand(): Spielstand {
  const seed = (Math.random() * 2 ** 32) >>> 0;
  return { version: DATENVERSION, siedlung: neueSiedlung(seed), bester: 0, revision: 0, geaendert: 0, ungespeichert: false };
}

/** Noch nie gespielt und nie mit dem Server abgeglichen. */
export const istUnberuehrt = (s: Spielstand): boolean => s.geaendert === 0 && s.revision === 0;
