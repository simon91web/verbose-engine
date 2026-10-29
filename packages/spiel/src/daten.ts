/** Spieldaten: Kacheln, Wald-Mischung, Siedler, Regelwerte. Balancing geschieht hier, nicht im Code. */

export type Rohstoff = 'holz' | 'beeren' | 'kraeuter' | 'nuesse';
export type Hindernis = 'gestruepp';
export type Tier = 'hase';
export type Art = Rohstoff | Hindernis | Tier;

export const ROHSTOFFE: readonly Rohstoff[] = ['holz', 'beeren', 'kraeuter', 'nuesse'];

export const ARTEN: Readonly<Record<Art, { name: string; mehrzahl: string; typ: 'rohstoff' | 'hindernis' | 'tier' }>> = {
  holz: { name: 'Holz', mehrzahl: 'Holz', typ: 'rohstoff' },
  beeren: { name: 'Beeren', mehrzahl: 'Beeren', typ: 'rohstoff' },
  kraeuter: { name: 'Kräuter', mehrzahl: 'Kräuter', typ: 'rohstoff' },
  nuesse: { name: 'Nüsse', mehrzahl: 'Nüsse', typ: 'rohstoff' },
  gestruepp: { name: 'Gestrüpp', mehrzahl: 'Gestrüpp', typ: 'hindernis' },
  hase: { name: 'Hase', mehrzahl: 'Hasen', typ: 'tier' },
};

export const istRohstoff = (art: Art): art is Rohstoff => ARTEN[art].typ === 'rohstoff';

export const REGELN = {
  /** Kürzeste Kette. */
  minKette: 3,
  /** Kürzeste Kette, die überhaupt etwas umschließen kann (sechs Waben um eine). */
  minRing: 6,
  /** Eingeschlossene Rohstoffe zählen so oft. */
  ringFaktor: 2,
  maxReife: 3,
  /** So viele Kacheln reifen nach jedem Schritt um eins. */
  reifenProSchritt: 3,
  schritteProSiedler: 5,
} as const;

export interface Biom {
  name: string;
  gewichte: Readonly<Record<Art, number>>;
  /** Mehr Tiere kommen nicht gleichzeitig aufs Brett. */
  maxTiere: number;
  /** Anteile für Reife 1, 2, 3 bei neuen Rohstoffen. */
  reife: readonly [number, number, number];
}

export const WALD: Biom = {
  name: 'Wald',
  gewichte: { holz: 26, beeren: 20, kraeuter: 21, nuesse: 19, gestruepp: 9, hase: 5 },
  maxTiere: 2,
  reife: [0.55, 0.35, 0.1],
};

export const BIOME = { wald: WALD } as const satisfies Record<string, Biom>;
export type BiomId = keyof typeof BIOME;

export type SiedlerId = 'ida' | 'jonas' | 'mara';

export interface Siedler {
  name: string;
  beruf: string;
  faehigkeit: string;
  beschreibung: string;
  laedt: Rohstoff;
  voll: number;
}

export const SIEDLER: Readonly<Record<SiedlerId, Siedler>> = {
  ida: { name: 'Ida', beruf: 'Holzfällerin', faehigkeit: 'Fällen', beschreibung: 'Erntet alles Holz ab Reife 2', laedt: 'holz', voll: 15 },
  jonas: { name: 'Jonas', beruf: 'Sammler', faehigkeit: 'Reifen', beschreibung: 'Beeren und Nüsse +1 Reife', laedt: 'beeren', voll: 12 },
  mara: { name: 'Mara', beruf: 'Fallenstellerin', faehigkeit: 'Falle', beschreibung: 'Fängt alle Hasen auf dem Brett', laedt: 'kraeuter', voll: 12 },
};
