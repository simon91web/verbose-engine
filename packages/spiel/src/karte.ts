import { FLECKEN, type Bebauung, type FleckDaten, type FleckId, type GebaeudeId } from './daten';

/** Karte: Nachbarschaft der Waben, Zustand eines Flecks und das Aufdecken aus dem Nebel. */

export type FleckZustand = 'nebel' | 'erkundet' | 'gerodet' | 'bebaut' | 'gesperrt';

export interface FleckStand {
  zustand: FleckZustand;
  /** Gerodetes Gestrüpp über alle Tage. */
  stand: number;
  ziel: number;
  gebaeude?: Bebauung;
  gebautAmTag?: number;
}

export type Flecken = Record<FleckId, FleckStand>;

/** Die sechs Richtungen auf axialen Koordinaten. */
const RICHTUNGEN = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]] as const;

export const fleckDaten = (id: FleckId): FleckDaten => FLECKEN.find((f) => f.id === id)!;

export const fleckIndex = (id: FleckId): number => FLECKEN.findIndex((f) => f.id === id);

export function fleckNachbarn(id: FleckId): FleckId[] {
  const { q, r } = fleckDaten(id);
  return RICHTUNGEN.flatMap(([dq, dr]) => FLECKEN.filter((f) => f.q === q + dq && f.r === r + dr).map((f) => f.id));
}

/** Startzustand der Karte aus den Daten. */
export function startFlecken(): Flecken {
  return Object.fromEntries(
    FLECKEN.map((f) => {
      const stand: FleckStand = { zustand: f.start === 'bebaut' ? 'bebaut' : f.start, stand: 0, ziel: f.ziel };
      if (f.bau) stand.gebaeude = f.bau;
      return [f.id, stand];
    }),
  ) as Flecken;
}

/**
 * Deckt alle Nachbarn im Nebel auf: Wald wird erkundet, alles andere ist gesperrt.
 * Gibt die neue Karte und die neu aufgedeckten Flecken zurück.
 */
export function aufdecken(flecken: Flecken, id: FleckId): { flecken: Flecken; aufgedeckt: FleckId[] } {
  const neu = structuredClone(flecken);
  const aufgedeckt: FleckId[] = [];
  for (const n of fleckNachbarn(id)) {
    if (neu[n].zustand !== 'nebel') continue;
    neu[n].zustand = fleckDaten(n).biom === 'wald' ? 'erkundet' : 'gesperrt';
    aufgedeckt.push(n);
  }
  return { flecken: neu, aufgedeckt };
}

/** Fleck mit diesem Gebäude, falls es schon steht. */
export function gebaeudeFleck(flecken: Flecken, gebaeude: GebaeudeId): FleckId | null {
  return (FLECKEN.find((f) => flecken[f.id].gebaeude === gebaeude)?.id) ?? null;
}
