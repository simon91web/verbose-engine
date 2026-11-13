import { FLECKEN, WAREN_LISTE, neueSiedlung, type Siedlung, type Tagwerk } from '@lichtung/spiel';

/** Was im Browser gespeichert wird. Ab Meilenstein 3 zusätzlich auf dem Server. */
export interface Spielstand {
  version: 2;
  siedlung: Siedlung;
  /** Höchster Gesamtertrag eines Tagwerks. */
  bester: number;
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
function ausV1(alt: SpielstandV1): Spielstand | null {
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

export function laden(): Spielstand | null {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return null;
    const stand = JSON.parse(roh) as Spielstand | SpielstandV1 | null;
    if (stand?.version === 2) return istSiedlung(stand.siedlung) ? { ...stand, bester: istZahl(stand.bester) ? stand.bester : 0 } : null;
    if (stand?.version === 1) return ausV1(stand);
    return null;
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

export function neuerSpielstand(): Spielstand {
  const seed = (Math.random() * 2 ** 32) >>> 0;
  return { version: 2, siedlung: neueSiedlung(seed), bester: 0 };
}
