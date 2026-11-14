import { WAREN_LISTE, type Ware } from '@lichtung/spiel';
import type { ServerStand } from './api';
import { ausServerDaten, gleichesSpiel, istUnberuehrt, type Spieldaten, type Spielstand } from './spielstand';

/** Die Regeln des Abgleichs, ohne Netz und ohne Oberfläche. */

export type Seite = 'lokal' | 'server';

export type Entscheidung =
  /** Weder hier noch auf dem Server gibt es etwas. */
  | { art: 'nichts' }
  /** Der Server ist leer: der Stand von hier geht hoch. */
  | { art: 'hochladen' }
  /** Beide sind gleich: nur die Revision merken. */
  | { art: 'angleichen' }
  /** Der Server ist neuer und hier gibt es nichts Eigenes: der Serverstand gilt, still. */
  | { art: 'serverUebernehmen' }
  /** Revision stimmt: der Stand hier gilt, ungespeicherte Änderungen gehen hoch. */
  | { art: 'lokalGilt' }
  /** Noch nie abgeglichen und die Stände unterscheiden sich: der Mensch wählt. `neuer` ist vorgewählt. */
  | { art: 'fragen'; neuer: Seite }
  /** Beide haben sich weiterentwickelt: der mit dem späteren `geaendert` gewinnt, der andere wird Sicherung. */
  | { art: 'konflikt'; gewinner: Seite };

/** Der spätere Zeitpunkt gewinnt; bei Gleichstand bleibt der Server unangetastet. */
export const neuerer = (lokal: Spielstand, server: { geaendert?: number }): Seite =>
  lokal.geaendert > (server.geaendert ?? 0) ? 'lokal' : 'server';

export function entscheide(lokal: Spielstand, server: ServerStand): Entscheidung {
  if (server.daten === null) return istUnberuehrt(lokal) ? { art: 'nichts' } : { art: 'hochladen' };
  const spiel = ausServerDaten(server.daten);
  // Unbrauchbarer Stand auf dem Server: der von hier gilt, der andere bleibt als Sicherung
  if (!spiel) return { art: 'konflikt', gewinner: 'lokal' };
  if (gleichesSpiel(lokal, spiel)) return { art: 'angleichen' };
  if (istUnberuehrt(lokal)) return { art: 'serverUebernehmen' };
  if (lokal.revision === 0) return { art: 'fragen', neuer: neuerer(lokal, server) };
  if (lokal.revision === server.revision) return { art: 'lokalGilt' };
  if (server.revision > lokal.revision && !lokal.ungespeichert) return { art: 'serverUebernehmen' };
  return { art: 'konflikt', gewinner: neuerer(lokal, server) };
}

// ---------- Stand in Kurzform (für „Welchen Stand behalten?“) ----------

export interface StandInfo {
  geraet: string;
  tag: number;
  zeit: number;
  lager: { ware: Ware; anzahl: number }[];
  flecken: number;
}

const LAGER_ZEIGEN = 5;

export function standInfo(s: Spieldaten, geraet: string, zeit: number): StandInfo {
  const lager = WAREN_LISTE.map((ware) => ({ ware, anzahl: s.siedlung.lager[ware] })).filter((l) => l.anzahl > 0);
  const flecken = Object.values(s.siedlung.flecken).filter((f) => f.zustand === 'gerodet' || f.zustand === 'bebaut').length;
  return { geraet, tag: s.siedlung.tag, zeit, lager: lager.slice(0, LAGER_ZEIGEN), flecken };
}
