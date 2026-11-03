import { BAUSTUFEN, STUNDE, WAREN, type Bauart, type Dorfstufe, type Flurart, type Spieldaten, type Ware, type Waren } from './spieldaten';

/**
 * Der Stand einer Siedlung: Lager, Gebäude, Baustellen, Träger und Dorf.
 * Reine Daten (JSON-fähig). Alle Zeiten sind Spielzeit in Millisekunden seit der Gründung.
 * Jede Ware liegt an genau einem Ort: im Lager, im Fach eines Gebäudes, auf einer Baustelle oder im Korb eines Trägers.
 */

/** Ein Ort für Gänge: das Lager oder ein Gebäude bzw. eine Baustelle (über ihre id). */
export type Ort = 'lager' | number;

/** Ein Transport: ein Weg eines Trägers, mit oder ohne Ladung. Die Position ergibt sich aus Abgang und Ankunft. */
export interface Gang {
  traeger: number;
  /** null, wenn der Träger leer geht. */
  ware: Ware | null;
  menge: number;
  von: Ort;
  nach: Ort;
  abgang: number;
  ankunft: number;
}

/** Was ein Träger gerade erledigt: hin zum Ziel und zurück zum Lager. */
export interface Auftrag {
  art: 'liefern' | 'holen';
  /** Baustelle oder Gebäude. */
  ziel: number;
  ware: Ware;
  /** Liefern: die Ladung. Holen: der im Lager freigehaltene Platz, auf dem Rückweg die Ladung. */
  menge: number;
}

export interface Traeger {
  id: number;
  name: string;
  auftrag: Auftrag | null;
  gang: Gang | null;
}

/** Arbeitet · ruht (Fach voll) · wartet (Zutat fehlt). */
export type Zustand = 'arbeitet' | 'ruht' | 'wartet';

export interface Gebaeude {
  id: number;
  art: string;
  flur: Flurart;
  /** Weglänge vom Lager in Waben – kommt aus den Wegen der Welt. */
  weg: number;
  /** Hauptgebäude, falls das hier ein Anbau ist. */
  anbauAn: number | null;
  /** Erzeugnis im eigenen Fach. */
  fach: number;
  /** Zutaten im Fach der Werkstatt. */
  eingang: Waren;
  /** Das Stück in Arbeit ist dann fertig; null, wenn das Gebäude ruht oder wartet. */
  fertigUm: number | null;
  zustand: Zustand;
  /** Seit wann im jetzigen Zustand. */
  seit: number;
}

export interface Baustelle {
  id: number;
  /** Bauart – oder 'dorf' für den Ausbau des Dorfs. */
  art: string;
  flur: Flurart;
  weg: number;
  anbauAn: number | null;
  kosten: Waren;
  geliefert: Waren;
  platziert: number;
  /** Alles ist da; die Restarbeit endet dann. */
  fertigUm: number | null;
  /** Abgebrochen: Das Gelieferte wird zurück ins Lager getragen, dann verschwindet die Baustelle. */
  abgebrochen: boolean;
}

export interface Verbrauch {
  /** Nächstes Stück wird dann gegessen bzw. verbraucht; null bei Mangel. */
  naechste: number | null;
  /** Seit wann die Ware fehlt; null, wenn sie da ist. */
  mangelSeit: number | null;
}

export interface Dorf {
  /** Index in die Dorfstufen, 0 = Weiler. */
  stufe: number;
  bewohner: number;
  verbrauch: Partial<Record<Ware, Verbrauch>>;
  /** Nächster Zuzug, solange Platz frei und der Bedarf gedeckt ist. */
  zuzugUm: number | null;
  /** Bei Mangel angehaltene Restzeit bis zum Zuzug. */
  zuzugRest: number | null;
  /** Baustelle des Ausbaus. */
  ausbau: number | null;
}

export type Traegermodus = 'echt' | 'sofort';

export interface Siedlung {
  version: 1;
  seed: number;
  /** Zustand des Zufallsstroms. */
  zufall: number;
  /** Echtzeit der Gründung (ms seit 1970). */
  gruendung: number;
  /** Spielzeit dieses Stands. */
  zeit: number;
  einstellungen: { traeger: Traegermodus };
  naechsteId: number;
  lager: { bestand: Record<Ware, number>; vollSeit: Record<Ware, number | null> };
  gebaeude: Gebaeude[];
  baustellen: Baustelle[];
  /** Diese Baustelle bedienen die Träger zuerst. */
  vorrang: number | null;
  traeger: Traeger[];
  dorf: Dorf;
}

// ---------- Kleine Helfer ----------

export const stueck = (waren: Waren, ware: Ware): number => waren[ware] ?? 0;
export const summe = (waren: Waren): number => WAREN.reduce((s, w) => s + stueck(waren, w), 0);
export const keineWaren = (): Record<Ware, number> => Object.fromEntries(WAREN.map((w) => [w, 0])) as Record<Ware, number>;

export const istBauart = (d: Spieldaten, art: string): boolean => Object.hasOwn(d.bauarten, art);

export function bauart(d: Spieldaten, art: string): Bauart {
  if (!istBauart(d, art)) throw new Error(`Unbekannte Bauart ${art}`);
  return d.bauarten[art];
}

export const findeGebaeude = (s: Siedlung, id: number): Gebaeude | undefined => s.gebaeude.find((g) => g.id === id);
export const findeBaustelle = (s: Siedlung, id: number): Baustelle | undefined => s.baustellen.find((b) => b.id === id);

/** Anbauten eines Gebäudes, die fertig sind. */
export const anbauten = (s: Siedlung, haupt: Gebaeude): Gebaeude[] => s.gebaeude.filter((g) => g.anbauAn === haupt.id);

/** Dauer für ein Stück, mit dem Bonus der Flur. */
export function dauerJeStueck(g: Gebaeude, d: Spieldaten): number {
  const art = bauart(d, g.art);
  return Math.round(STUNDE / (art.jeStunde * (1 + (art.bonus[g.flur] ?? 0) / 100)));
}

export const ertragJeStunde = (g: Gebaeude, d: Spieldaten): number => STUNDE / dauerJeStueck(g, d);

/** Alle laufenden Gänge. */
export const gaenge = (s: Siedlung): Gang[] => s.traeger.flatMap((t) => (t.gang ? [t.gang] : []));

// ---------- Dorf ----------

export const dorfstufe = (s: Siedlung, d: Spieldaten): Dorfstufe => d.dorf.stufen[s.dorf.stufe];

/** Laufender Bedarf je Stunde: die Wünsche aller Stufen bis zur genannten. */
export function bedarf(stufe: number, d: Spieldaten): Waren {
  const b: Waren = {};
  for (const st of d.dorf.stufen.slice(0, stufe + 1)) for (const w of WAREN) if (st.wuensche[w]) b[w] = stueck(b, w) + st.wuensche[w];
  return b;
}

/** Der Bedarf ist gedeckt, solange keine Ware fehlt. */
export const versorgt = (s: Siedlung): boolean => WAREN.every((w) => (s.dorf.verbrauch[w]?.mangelSeit ?? null) === null);

// ---------- Lager, Vormerkungen und Wege ----------

/** Ware, die ein Träger gerade zu diesem Ziel bringt. */
export function unterwegs(s: Siedlung, ziel: number, ware: Ware): number {
  let n = 0;
  for (const t of s.traeger) if (t.auftrag?.art === 'liefern' && t.gang?.nach === ziel && t.auftrag.ware === ware) n += t.auftrag.menge;
  return n;
}

/** Was eine Baustelle von dieser Ware noch braucht (weder geliefert noch unterwegs). */
export function offen(s: Siedlung, b: Baustelle, ware: Ware): number {
  if (b.abgebrochen) return 0;
  return Math.max(0, stueck(b.kosten, ware) - stueck(b.geliefert, ware) - unterwegs(s, b.id, ware));
}

/** Baustellen in der Reihenfolge der Träger: die vorgezogene zuerst, dann wie platziert. */
export function baustellenReihe(s: Siedlung): Baustelle[] {
  const erste = s.baustellen.filter((b) => b.id === s.vorrang);
  return [...erste, ...s.baustellen.filter((b) => b.id !== s.vorrang)];
}

/** Vorgemerkt je Baustelle: Das Lager deckt die offenen Mengen in der Reihenfolge der Träger. */
export function vormerkungen(s: Siedlung): Map<number, Waren> {
  const rest = { ...s.lager.bestand };
  const m = new Map<number, Waren>();
  for (const b of baustellenReihe(s)) {
    const v: Waren = {};
    for (const w of WAREN) {
      const n = Math.min(offen(s, b, w), rest[w]);
      if (n > 0) {
        v[w] = n;
        rest[w] -= n;
      }
    }
    m.set(b.id, v);
  }
  return m;
}

/** Im Lager und für keine Baustelle vorgemerkt – nur davon essen die Siedler und nehmen die Werkstätten. */
export function frei(s: Siedlung, ware: Ware): number {
  let gebraucht = 0;
  for (const b of s.baustellen) gebraucht += offen(s, b, ware);
  return Math.max(0, s.lager.bestand[ware] - gebraucht);
}

/** Vorgemerkte Menge je Ware über alle Baustellen. */
export const vorgemerkt = (s: Siedlung): Record<Ware, number> => {
  const v = keineWaren();
  for (const w of WAREN) v[w] = s.lager.bestand[w] - frei(s, w);
  return v;
};

/** Platz im Lager, der weder belegt ist noch für einen Träger auf dem Weg freigehalten wird. */
export function platzImLager(s: Siedlung, ware: Ware, d: Spieldaten): number {
  let zulauf = 0;
  for (const t of s.traeger) if (t.auftrag?.art === 'holen' && t.auftrag.ware === ware) zulauf += t.auftrag.menge;
  return Math.max(0, d.lager.fach - s.lager.bestand[ware] - zulauf);
}

/** Alle Waren der Siedlung, wo immer sie liegen. Was verschwindet, ist gegessen, verarbeitet oder verbaut. */
export function inventur(s: Siedlung, d: Spieldaten): Record<Ware, number> {
  const n = { ...s.lager.bestand };
  for (const g of s.gebaeude) {
    n[bauart(d, g.art).erzeugt] += g.fach;
    for (const w of WAREN) n[w] += stueck(g.eingang, w);
  }
  for (const b of s.baustellen) for (const w of WAREN) n[w] += stueck(b.geliefert, w);
  for (const g of gaenge(s)) if (g.ware) n[g.ware] += g.menge;
  return n;
}

// ---------- Baustellen ----------

export interface Baustellenlage {
  /** Gelieferter Anteil, 0–1. */
  anteil: number;
  /** 0 Pflöcke · 1 Fundament · 2 Gerüst · 3 Dach. */
  stufe: number;
  stufenname: (typeof BAUSTUFEN)[number];
  vorgemerkt: Waren;
  unterwegs: Waren;
  /** Weder geliefert noch unterwegs noch im Lager – darauf wartet die Baustelle. */
  fehlt: Waren;
  /** Alles ist da, die Restarbeit läuft. */
  restarbeit: boolean;
}

export function baustellenlage(s: Siedlung, b: Baustelle): Baustellenlage {
  const v = vormerkungen(s).get(b.id) ?? {};
  const weg: Waren = {};
  const fehlt: Waren = {};
  for (const w of WAREN) {
    const u = unterwegs(s, b.id, w);
    if (u) weg[w] = u;
    const f = offen(s, b, w) - stueck(v, w);
    if (f > 0) fehlt[w] = f;
  }
  const anteil = summe(b.kosten) ? summe(b.geliefert) / summe(b.kosten) : 1;
  const stufe = Math.min(BAUSTUFEN.length - 1, Math.floor(anteil * BAUSTUFEN.length));
  return { anteil, stufe, stufenname: BAUSTUFEN[stufe], vorgemerkt: v, unterwegs: weg, fehlt, restarbeit: b.fertigUm !== null };
}
