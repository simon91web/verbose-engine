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
  /** Nur Vorgabe für `neuesTagwerk`, wenn kein Proviant die Schritte bestimmt. */
  schritteProSiedler: 5,
  /** Notfall gegen Festfahren: ohne jeden Proviant geht genau ein Siedler los. */
  leererMagenSchritte: 3,
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

// ---------- Lager: Waren und Proviant ----------

export type Proviant = 'beerenbrei' | 'roestnuesse' | 'waldeintopf';
export type Ware = Rohstoff | 'hase' | 'brett' | 'trockenkraeuter' | Proviant;
export type Lager = Record<Ware, number>;

export const WAREN: Readonly<Record<Ware, { name: string; mehrzahl: string; gruppe: 'rohstoff' | 'ware' | 'proviant' }>> = {
  holz: { name: 'Holz', mehrzahl: 'Holz', gruppe: 'rohstoff' },
  beeren: { name: 'Beere', mehrzahl: 'Beeren', gruppe: 'rohstoff' },
  kraeuter: { name: 'Kraut', mehrzahl: 'Kräuter', gruppe: 'rohstoff' },
  nuesse: { name: 'Nuss', mehrzahl: 'Nüsse', gruppe: 'rohstoff' },
  hase: { name: 'Hase', mehrzahl: 'Hasen', gruppe: 'rohstoff' },
  brett: { name: 'Brett', mehrzahl: 'Bretter', gruppe: 'ware' },
  trockenkraeuter: { name: 'Trockenkraut', mehrzahl: 'Trockenkräuter', gruppe: 'ware' },
  beerenbrei: { name: 'Beerenbrei', mehrzahl: 'Beerenbrei', gruppe: 'proviant' },
  roestnuesse: { name: 'Röstnuss', mehrzahl: 'Röstnüsse', gruppe: 'proviant' },
  waldeintopf: { name: 'Waldeintopf', mehrzahl: 'Waldeintopf', gruppe: 'proviant' },
};

export const WAREN_LISTE = Object.keys(WAREN) as Ware[];

/** Schritte, die ein Siedler mit diesem Proviant hat. Beste zuerst. */
export const PROVIANT: Readonly<Record<Proviant, { schritte: number }>> = {
  waldeintopf: { schritte: 7 },
  roestnuesse: { schritte: 6 },
  beerenbrei: { schritte: 5 },
};

export const PROVIANT_BESTE = Object.keys(PROVIANT) as Proviant[];

export const istProviant = (ware: Ware): ware is Proviant => ware in PROVIANT;

// ---------- Werkstatt ----------

export type RezeptId = 'beerenbrei' | 'roestnuesse' | 'waldeintopf' | 'brett' | 'trockenkraeuter';
export type Zutaten = Partial<Record<Ware, number>>;

export const REZEPTE: Readonly<Record<RezeptId, { name: string; ein: Zutaten; aus: Ware }>> = {
  beerenbrei: { name: 'Beerenbrei', ein: { beeren: 3 }, aus: 'beerenbrei' },
  roestnuesse: { name: 'Röstnüsse', ein: { nuesse: 3 }, aus: 'roestnuesse' },
  waldeintopf: { name: 'Waldeintopf', ein: { beeren: 2, roestnuesse: 1, trockenkraeuter: 1 }, aus: 'waldeintopf' },
  brett: { name: 'Brett', ein: { holz: 3 }, aus: 'brett' },
  trockenkraeuter: { name: 'Trockenkräuter', ein: { kraeuter: 2 }, aus: 'trockenkraeuter' },
};

export type GebaeudeId = 'lagerfeuer' | 'zimmerei' | 'trockengestell';

/** Reihenfolge, in der die Gebäude über Nacht arbeiten. */
export const GEBAEUDE_REIHE: readonly GebaeudeId[] = ['lagerfeuer', 'zimmerei', 'trockengestell'];

export const GEBAEUDE: Readonly<Record<GebaeudeId, { name: string; kosten: Zutaten; baubar: boolean; rezepte: readonly RezeptId[]; leistung: number }>> = {
  lagerfeuer: { name: 'Lagerfeuer', kosten: {}, baubar: false, rezepte: ['beerenbrei', 'roestnuesse', 'waldeintopf'], leistung: 6 },
  zimmerei: { name: 'Zimmerei', kosten: { holz: 30 }, baubar: true, rezepte: ['brett'], leistung: 4 },
  trockengestell: { name: 'Trockengestell', kosten: { brett: 6, kraeuter: 10 }, baubar: true, rezepte: ['trockenkraeuter'], leistung: 4 },
};

/** Was auf einem Fleck stehen kann: ein Gebäude mit Rezepten oder die Hütten (nur Kulisse). */
export type Bebauung = GebaeudeId | 'huetten';

// ---------- Karte ----------

export type FleckId =
  | 'lichtung' | 'nordwald' | 'bachufer' | 'huetten' | 'suedwald' | 'holzplatz' | 'hain'
  | 'moor' | 'eichenhang' | 'flussbett' | 'teich' | 'senke' | 'dickicht' | 'quelle' | 'birken'
  | 'wiese' | 'felshang' | 'eschen' | 'kiefernrand';

export type FleckBiom = 'siedlung' | 'wald' | 'bach' | 'wiese' | 'fels';
export type FleckStart = 'nebel' | 'erkundet' | 'gesperrt' | 'bebaut';

export interface FleckDaten {
  id: FleckId;
  name: string;
  /** Axiale Lage auf der Wabenkarte. */
  q: number;
  r: number;
  biom: FleckBiom;
  /** Gestrüpp, das zu roden ist; 0 bei Flecken ohne Tagwerk. */
  ziel: number;
  start: FleckStart;
  bau?: Bebauung;
}

export const FLECKEN: readonly FleckDaten[] = [
  { id: 'lichtung', name: 'Lichtung', q: 0, r: 0, biom: 'siedlung', ziel: 0, start: 'bebaut', bau: 'lagerfeuer' },
  // erster Ring
  { id: 'nordwald', name: 'Nordwald', q: 1, r: -1, biom: 'wald', ziel: 40, start: 'erkundet' },
  { id: 'bachufer', name: 'Bachufer', q: 1, r: 0, biom: 'bach', ziel: 0, start: 'gesperrt' },
  { id: 'huetten', name: 'Hütten', q: 0, r: 1, biom: 'siedlung', ziel: 0, start: 'bebaut', bau: 'huetten' },
  { id: 'suedwald', name: 'Südwald', q: -1, r: 1, biom: 'wald', ziel: 40, start: 'erkundet' },
  { id: 'holzplatz', name: 'Holzplatz', q: -1, r: 0, biom: 'siedlung', ziel: 0, start: 'bebaut', bau: 'zimmerei' },
  { id: 'hain', name: 'Hain', q: 0, r: -1, biom: 'wald', ziel: 40, start: 'erkundet' },
  // zweiter Ring
  { id: 'moor', name: 'Moor', q: 2, r: -2, biom: 'bach', ziel: 0, start: 'nebel' },
  { id: 'eichenhang', name: 'Eichenhang', q: 2, r: -1, biom: 'wald', ziel: 70, start: 'nebel' },
  { id: 'flussbett', name: 'Flussbett', q: 2, r: 0, biom: 'bach', ziel: 0, start: 'nebel' },
  { id: 'teich', name: 'Teich', q: 1, r: 1, biom: 'bach', ziel: 0, start: 'nebel' },
  { id: 'senke', name: 'Senke', q: 0, r: 2, biom: 'wald', ziel: 60, start: 'nebel' },
  { id: 'dickicht', name: 'Dickicht', q: -1, r: 2, biom: 'wald', ziel: 60, start: 'nebel' },
  { id: 'quelle', name: 'Quelle', q: -2, r: 2, biom: 'bach', ziel: 0, start: 'nebel' },
  { id: 'birken', name: 'Birken', q: -2, r: 1, biom: 'wald', ziel: 60, start: 'nebel' },
  { id: 'wiese', name: 'Wiese', q: -2, r: 0, biom: 'wiese', ziel: 0, start: 'nebel' },
  { id: 'felshang', name: 'Felshang', q: -1, r: -1, biom: 'fels', ziel: 0, start: 'gesperrt' },
  { id: 'eschen', name: 'Eschen', q: 0, r: -2, biom: 'wald', ziel: 70, start: 'nebel' },
  { id: 'kiefernrand', name: 'Kiefernrand', q: 1, r: -2, biom: 'wald', ziel: 80, start: 'nebel' },
];

export const START = {
  lager: { holz: 0, beeren: 0, kraeuter: 0, nuesse: 0, hase: 0, brett: 0, trockenkraeuter: 0, beerenbrei: 6, roestnuesse: 0, waldeintopf: 0 } satisfies Lager,
  auftraege: {
    lagerfeuer: { rezept: 'beerenbrei', menge: 6 },
    zimmerei: { rezept: 'brett', menge: 4 },
    trockengestell: { rezept: 'trockenkraeuter', menge: 0 },
  } satisfies Record<GebaeudeId, { rezept: RezeptId; menge: number }>,
} as const;
