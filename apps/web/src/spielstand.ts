import { FLECKEN, WAREN_LISTE, neueSiedlung, type Siedlung, type Tagwerk } from '@lichtung/spiel';

/** Das Spiel selbst: das, was auf den Server geht und zwischen Geräten wandert. */
export interface Spieldaten {
  siedlung: Siedlung;
  /** Höchster Gesamtertrag eines Tagwerks. */
  bester: number;
}

/** Was im Browser gespeichert wird: das Spiel plus der Stand des Abgleichs mit dem Server. */
export interface Spielstand extends Spieldaten {
  version: 3;
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
  return { version: 3, siedlung: alt.siedlung, bester: istZahl(alt.bester) ? alt.bester : 0, revision: 0, geaendert: jetzt, ungespeichert: true };
}

/** Liest einen gespeicherten Stand beliebiger Version (1 → 2 → 3). Null, wenn er unbrauchbar ist. */
export function migriere(stand: unknown, jetzt = Date.now()): Spielstand | null {
  const s = stand as Spielstand | SpielstandV2 | SpielstandV1 | null | undefined;
  if (s?.version === 3) {
    if (!istSiedlung(s.siedlung)) return null;
    return {
      version: 3,
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
export const zuDaten = (s: Spieldaten): Record<string, unknown> => ({ version: 3, siedlung: s.siedlung, bester: s.bester });

/** Gleiches Spiel, unabhängig vom Abgleich. */
export const gleichesSpiel = (a: Spieldaten, b: Spieldaten): boolean => JSON.stringify(zuDaten(a)) === JSON.stringify(zuDaten(b));

export function laden(): Spielstand | null {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    return roh ? migriere(JSON.parse(roh)) : null;
  } catch {
    return null;
  }
}

export function speichern(stand: Spielstand): boolean {
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
    return true;
  } catch {
    return false;
  }
}

/** Frisches Spiel; `geaendert` 0 heißt „noch nichts gespielt“ – so überschreibt es nie einen Stand vom Server. */
export function neuerSpielstand(): Spielstand {
  const seed = (Math.random() * 2 ** 32) >>> 0;
  return { version: 3, siedlung: neueSiedlung(seed), bester: 0, revision: 0, geaendert: 0, ungespeichert: false };
}

/** Noch nie gespielt und nie mit dem Server abgeglichen. */
export const istUnberuehrt = (s: Spielstand): boolean => s.geaendert === 0 && s.revision === 0;
