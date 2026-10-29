import { folgeSeed, neuesTagwerk, type Tagwerk } from '@lichtung/spiel';

/** Was im Browser gespeichert wird. Ab Meilenstein 3 zusätzlich auf dem Server. */
export interface Spielstand {
  version: 1;
  seed: number;
  tag: number;
  tagwerk: Tagwerk;
  /** Höchster Gesamtertrag eines Tagwerks. */
  bester: number;
}

const SCHLUESSEL = 'lichtung.spielstand';

export function laden(): Spielstand | null {
  try {
    const roh = localStorage.getItem(SCHLUESSEL);
    if (!roh) return null;
    const stand = JSON.parse(roh) as Spielstand;
    return stand?.version === 1 && stand.tagwerk?.gitter?.length ? stand : null;
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
  return { version: 1, seed, tag: 1, tagwerk: neuesTagwerk({ seed: folgeSeed(seed, 1) }), bester: 0 };
}
