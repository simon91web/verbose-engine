/**
 * Spieldaten der Siedlung: Zeit, Waren, Gebäude, Dorfstufen, Lager und Träger.
 * Balancing geschieht hier, nicht im Code. Alle Mengen und Zeiten sind Platzhalter (MVP, #4).
 */

export const SEKUNDE = 1000;
export const MINUTE = 60 * SEKUNDE;
export const STUNDE = 60 * MINUTE;

// ---------- Zeit ----------

export type Jahreszeit = 'fruehling' | 'sommer' | 'herbst' | 'winter';
export type Tagesphase = 'hell' | 'daemmerung' | 'nacht';

export const JAHRESZEITEN: readonly Jahreszeit[] = ['fruehling', 'sommer', 'herbst', 'winter'];

export const ZEIT = {
  /** Ein Spieltag in Echtzeit. */
  tag: 8 * MINUTE,
  tageJeJahreszeit: 8,
  /** Ablauf eines Tages je Jahreszeit (Konzept › Zeit). Der Tag beginnt mit dem Hellwerden. */
  licht: {
    fruehling: { name: 'Frühling', hell: 4 * MINUTE, daemmerung: 1 * MINUTE, nacht: 3 * MINUTE },
    sommer: { name: 'Sommer', hell: 5 * MINUTE, daemmerung: 1 * MINUTE, nacht: 2 * MINUTE },
    herbst: { name: 'Herbst', hell: 4 * MINUTE, daemmerung: 1 * MINUTE, nacht: 3 * MINUTE },
    winter: { name: 'Winter', hell: 3 * MINUTE, daemmerung: 1 * MINUTE, nacht: 4 * MINUTE },
  },
} as const satisfies {
  tag: number;
  tageJeJahreszeit: number;
  licht: Record<Jahreszeit, { name: string } & Record<Tagesphase, number>>;
};

// ---------- Waren und Fluren ----------

export type Ware = 'holz' | 'bretter' | 'fisch' | 'beeren';
export const WAREN: readonly Ware[] = ['holz', 'bretter', 'fisch', 'beeren'];
export const WARENNAMEN: Readonly<Record<Ware, string>> = { holz: 'Holz', bretter: 'Bretter', fisch: 'Fisch', beeren: 'Beeren' };

/** Mengen je Ware; fehlende Waren zählen als 0. */
export type Waren = Partial<Record<Ware, number>>;

export type Flurart = 'lichtung' | 'wald' | 'ufer' | 'wiese';
export const FLURARTEN: Readonly<Record<Flurart, string>> = { lichtung: 'Lichtung', wald: 'Wald', ufer: 'Ufer', wiese: 'Wiese' };

// ---------- Gebäude ----------

export interface Bauart {
  name: string;
  erzeugt: Ware;
  /** Stück je Stunde ohne Bonus. */
  jeStunde: number;
  /** Zutaten je Stück – nur Werkstätten. */
  zutaten?: Waren;
  /** Anbau an diese Bauart: Die Zutaten kommen ohne Transport direkt aus dem Hauptgebäude. */
  anbauAn?: string;
  kosten: Waren;
  /** Größe des Fachs für das Erzeugnis. */
  fach: number;
  /** Größe des Fachs je Zutat (Werkstätten). */
  eingang?: number;
  /** Mehr Ertrag in Prozent je Flurart. */
  bonus: Partial<Record<Flurart, number>>;
  /** Nur auf diesen Fluren baubar. */
  nur?: readonly Flurart[];
  /** Arbeit nach der letzten Ladung, bis das Gebäude steht. */
  restarbeit: number;
}

export const BAUARTEN = {
  holzfaeller: {
    name: 'Holzfäller', erzeugt: 'holz', jeStunde: 20, kosten: { holz: 10 }, fach: 10,
    bonus: { wald: 50, ufer: 10, wiese: 10 }, restarbeit: 1 * MINUTE,
  },
  saegebock: {
    name: 'Sägebock', erzeugt: 'bretter', jeStunde: 8, zutaten: { holz: 2 }, anbauAn: 'holzfaeller',
    kosten: { holz: 12 }, fach: 10, eingang: 10, bonus: {}, restarbeit: 2 * MINUTE,
  },
  fischer: {
    name: 'Fischer', erzeugt: 'fisch', jeStunde: 20, kosten: { holz: 8, bretter: 6 }, fach: 10,
    bonus: { ufer: 60 }, nur: ['ufer'], restarbeit: 1 * MINUTE,
  },
  sammler: {
    name: 'Sammler', erzeugt: 'beeren', jeStunde: 16, kosten: { holz: 6, bretter: 2 }, fach: 10,
    bonus: { wiese: 50, wald: 20, lichtung: 10 }, restarbeit: 1 * MINUTE,
  },
} as const satisfies Record<string, Bauart>;

export type BauartId = keyof typeof BAUARTEN;

/** Sichtbare Stufen einer Baustelle, je ein Viertel des Materials. */
export const BAUSTUFEN = ['Pflöcke', 'Fundament', 'Gerüst', 'Dach'] as const;

// ---------- Dorf ----------

export interface Dorfstufe {
  name: string;
  plaetze: number;
  /** Neue Wünsche dieser Stufe je Stunde. Der Bedarf ist die Summe aller Stufen bis hierher. */
  wuensche: Waren;
  /** Ausbau zu dieser Stufe (bei der ersten Stufe leer). */
  kosten: Waren;
  restarbeit: number;
}

export const DORFSTUFEN: readonly Dorfstufe[] = [
  { name: 'Weiler', plaetze: 4, wuensche: { fisch: 15, beeren: 15 }, kosten: {}, restarbeit: 0 },
  { name: 'Dorf', plaetze: 8, wuensche: { holz: 10 }, kosten: { holz: 20, bretter: 30 }, restarbeit: 4 * MINUTE },
  { name: 'Marktflecken', plaetze: 14, wuensche: { bretter: 6 }, kosten: { holz: 30, bretter: 50 }, restarbeit: 6 * MINUTE },
];

// ---------- Alles zusammen ----------

export interface Spieldaten {
  bauarten: Readonly<Record<string, Bauart>>;
  /** So viele Anbauten hat jedes Gebäude höchstens. */
  anbauPlaetze: number;
  dorf: {
    stufen: readonly Dorfstufe[];
    startBewohner: number;
    /** Abstand zwischen zwei Zuzügen in Spieltagen, gewürfelt mit Startwert. */
    zuzug: { min: number; max: number };
  };
  lager: {
    /** Platz je Ware. */
    fach: number;
    /** Bestand bei der Gründung. */
    start: Waren;
  };
  traeger: {
    anzahl: number;
    korb: number;
    /** Zeit für eine Wabe Weg, in Millisekunden. */
    jeWabe: number;
    namen: readonly string[];
  };
}

export const SPIELDATEN: Spieldaten = {
  bauarten: BAUARTEN,
  anbauPlaetze: 2,
  dorf: { stufen: DORFSTUFEN, startBewohner: 4, zuzug: { min: 2, max: 3 } },
  lager: { fach: 60, start: { holz: 20, bretter: 10, fisch: 30, beeren: 30 } },
  traeger: { anzahl: 1, korb: 5, jeWabe: 5 * SEKUNDE, namen: ['Ole', 'Wina', 'Bo'] },
};
