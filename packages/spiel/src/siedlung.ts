import {
  FLECKEN, GEBAEUDE, GEBAEUDE_REIHE, PROVIANT, PROVIANT_BESTE, REGELN, REZEPTE, SIEDLER, START, WAREN,
  type FleckId, type GebaeudeId, type Lager, type Proviant, type RezeptId, type SiedlerId, type Ware, type Zutaten,
} from './daten';
import { aufdecken, fleckDaten, fleckIndex, gebaeudeFleck, startFlecken, type FleckZustand, type Flecken } from './karte';
import { neuesTagwerk, type Ergebnis, type Tagwerk } from './tagwerk';
import { folgeSeed } from './zufall';

/**
 * Die Siedlung: Karte, Lager, Aufträge und das eine laufende Tagwerk.
 * Alle Funktionen hier ändern ihre Eingabe nicht, sondern geben einen neuen Stand zurück.
 */

export type Auftraege = Record<GebaeudeId, { rezept: RezeptId; menge: number }>;

export interface Siedlung {
  seed: number;
  tag: number;
  lager: Lager;
  flecken: Flecken;
  auftraege: Auftraege;
  /** Fähigkeits-Ladung der Siedler, bleibt über Tagwerke erhalten. */
  ladung: Record<SiedlerId, number>;
  unterwegs: { fleck: FleckId; tagwerk: Tagwerk } | null;
}

/** Ein Siedler im Trupp und sein Proviant; `null` ist der leere Magen. */
export interface Aufbruch {
  siedler: SiedlerId;
  proviant: Proviant | null;
}

/** Was ein Gebäude über Nacht getan hat. */
export interface Arbeit {
  gebaeude: GebaeudeId;
  rezept: RezeptId;
  /** Aus dem Auftrag. */
  gewollt: number;
  /** Tatsächlich hergestellt. */
  gemacht: number;
  verbraucht: Zutaten;
  /** Was für den ganzen Auftrag noch gefehlt hat. */
  fehlt: Zutaten;
}

export interface Einbracht {
  siedlung: Siedlung;
  fleck: FleckId;
  /** Ziel diesmal erfüllt: der Fleck ist jetzt gerodet. */
  gerodet: boolean;
  aufgedeckt: FleckId[];
  nacht: Arbeit[];
}

const fehler = (grund: string): { ok: false; grund: string } => ({ ok: false, grund });
const ok = <T>(wert: T): Ergebnis<T> => ({ ok: true, wert });

export function neueSiedlung(seed: number): Siedlung {
  return {
    seed: seed >>> 0,
    tag: 1,
    lager: { ...START.lager },
    flecken: startFlecken(),
    auftraege: structuredClone(START.auftraege),
    ladung: { ida: 0, jonas: 0, mara: 0 },
    unterwegs: null,
  };
}

// ---------- Abfragen ----------

export const fleckZustand = (s: Siedlung, id: FleckId): FleckZustand => s.flecken[id].zustand;

export const freieGerodete = (s: Siedlung): FleckId[] => FLECKEN.filter((f) => s.flecken[f.id].zustand === 'gerodet').map((f) => f.id);

/** Fleck, auf dem das Gebäude steht; `null`, solange es nicht gebaut ist. */
export const gebautAuf = (s: Siedlung, gebaeude: GebaeudeId): FleckId | null => gebaeudeFleck(s.flecken, gebaeude);

export const gebaeudeStehtSchon = (s: Siedlung, gebaeude: GebaeudeId): boolean => gebautAuf(s, gebaeude) !== null;

/** Gebäude, die jetzt noch gebaut werden können (baubar und noch nicht vorhanden). */
export const baubareGebaeude = (s: Siedlung): GebaeudeId[] =>
  GEBAEUDE_REIHE.filter((g) => GEBAEUDE[g].baubar && !gebaeudeStehtSchon(s, g));

export const kannBezahlen = (lager: Lager, kosten: Zutaten): boolean =>
  (Object.entries(kosten) as [Ware, number][]).every(([w, n]) => lager[w] >= n);

export const proviantVorrat = (lager: Lager): number => PROVIANT_BESTE.reduce((summe, p) => summe + lager[p], 0);

/**
 * Vorauswahl für den Aufbruch: bester Proviant zuerst, höchstens so viele, wie es gibt.
 * Ohne jeden Proviant bleibt ein einziger leerer Magen übrig.
 */
export function besterProviant(lager: Lager, trupp: number): (Proviant | null)[] {
  const wahl: (Proviant | null)[] = [];
  const rest = { ...lager };
  for (const p of PROVIANT_BESTE) {
    while (rest[p] > 0 && wahl.length < trupp) {
      wahl.push(p);
      rest[p]--;
    }
  }
  return wahl.length ? wahl : trupp > 0 ? [null] : [];
}

// ---------- Tagwerk beginnen ----------

export const fleckSeed = (seed: number, tag: number, fleck: FleckId): number =>
  folgeSeed((seed ^ Math.imul(fleckIndex(fleck) + 1, 0x27d4eb2f)) >>> 0, tag);

/** Schritte eines Aufbruchs: Summe der Schritte je Proviant, 3 beim leeren Magen. */
export const schritteFuer = (auswahl: readonly Aufbruch[]): number =>
  auswahl.reduce((summe, a) => summe + (a.proviant ? PROVIANT[a.proviant].schritte : REGELN.leererMagenSchritte), 0);

export function tagwerkBeginnen(s: Siedlung, fleckId: FleckId, auswahl: readonly Aufbruch[]): Ergebnis<Siedlung> {
  if (s.unterwegs) return fehler(`Erst das Tagwerk im ${fleckDaten(s.unterwegs.fleck).name} beenden`);
  const fleck = s.flecken[fleckId];
  if (!fleck) return fehler('Diesen Fleck gibt es nicht');
  if (fleck.zustand === 'nebel') return fehler('Noch unerkundet');
  if (fleck.zustand === 'gesperrt') return fehler('Noch nicht erreichbar');
  if (fleck.zustand === 'bebaut') return fehler('Hier wird nicht mehr geerntet');
  if (!auswahl.length) return fehler('Mindestens ein Siedler muss mit');
  if (new Set(auswahl.map((a) => a.siedler)).size !== auswahl.length || auswahl.some((a) => !(a.siedler in SIEDLER))) {
    return fehler('Jeder Siedler kann nur einmal mit');
  }

  const lager = { ...s.lager };
  if (auswahl.some((a) => a.proviant === null)) {
    if (proviantVorrat(lager) > 0) return fehler('Nimm Proviant mit');
    if (auswahl.length > 1) return fehler('Ohne Proviant geht nur ein Siedler los');
  } else {
    for (const a of auswahl) {
      if (lager[a.proviant!] <= 0) return fehler(`Nicht genug ${WAREN[a.proviant!].mehrzahl} für alle`);
      lager[a.proviant!]--;
    }
  }

  const tagwerk = neuesTagwerk({
    seed: fleckSeed(s.seed, s.tag, fleckId),
    trupp: auswahl.map((a) => a.siedler),
    schritte: schritteFuer(auswahl),
    ladung: s.ladung,
    ziel: { stand: fleck.stand, gesamt: fleck.ziel },
  });
  return ok({ ...s, lager, unterwegs: { fleck: fleckId, tagwerk } });
}

// ---------- Nacht ----------

function arbeiten(s: Siedlung): { lager: Lager; arbeit: Arbeit[] } {
  const lager = { ...s.lager };
  const arbeit: Arbeit[] = [];
  for (const g of GEBAEUDE_REIHE) {
    if (!gebaeudeStehtSchon(s, g)) continue;
    const { rezept, menge } = s.auftraege[g];
    const gewollt = Math.min(menge, GEBAEUDE[g].leistung);
    if (gewollt <= 0) continue;
    const r = REZEPTE[rezept];
    const zutaten = Object.entries(r.ein) as [Ware, number][];
    const gemacht = zutaten.reduce((m, [w, n]) => Math.min(m, Math.floor(lager[w] / n)), gewollt);
    const verbraucht: Zutaten = {};
    const fehlt: Zutaten = {};
    for (const [w, n] of zutaten) {
      if (gemacht > 0) verbraucht[w] = n * gemacht;
      const luecke = n * gewollt - Math.max(lager[w], 0);
      if (luecke > 0) fehlt[w] = luecke;
      lager[w] -= n * gemacht;
    }
    lager[r.aus] += gemacht;
    arbeit.push({ gebaeude: g, rezept, gewollt, gemacht, verbraucht, fehlt });
  }
  return { lager, arbeit };
}

/** Die Gebäude arbeiten ihre Aufträge ab, in fester Reihenfolge. Der Tag zählt hier nicht weiter. */
export function nacht(s: Siedlung): { siedlung: Siedlung; arbeit: Arbeit[] } {
  const { lager, arbeit } = arbeiten(s);
  return { siedlung: { ...s, lager }, arbeit };
}

export interface NachtVorschau {
  gebaeude: GebaeudeId;
  rezept: RezeptId;
  gewollt: number;
  /** So viel gelingt mit dem Lager von heute. */
  moeglich: number;
  /** Verbrauch und Ertrag, wenn es so läuft („−18 Beeren · +6 Beerenbrei“). */
  verbraucht: Zutaten;
  ertrag: { ware: Ware; menge: number };
  fehlt: Zutaten;
  geht: boolean;
}

/** Werkstatt-Vorschau für ein gebautes Gebäude; `null`, solange es nicht steht. */
export function nachtVorschau(s: Siedlung, gebaeude: GebaeudeId): NachtVorschau | null {
  if (!gebaeudeStehtSchon(s, gebaeude)) return null;
  const { rezept, menge } = s.auftraege[gebaeude];
  const gewollt = Math.min(menge, GEBAEUDE[gebaeude].leistung);
  const tat = arbeiten(s).arbeit.find((a) => a.gebaeude === gebaeude);
  return {
    gebaeude,
    rezept,
    gewollt,
    moeglich: tat?.gemacht ?? 0,
    verbraucht: tat?.verbraucht ?? {},
    ertrag: { ware: REZEPTE[rezept].aus, menge: tat?.gemacht ?? 0 },
    fehlt: tat?.fehlt ?? {},
    geht: !!tat && tat.gemacht >= gewollt && gewollt > 0,
  };
}

export function auftragSetzen(s: Siedlung, gebaeude: GebaeudeId, rezept: RezeptId, menge: number): Ergebnis<Siedlung> {
  const g = GEBAEUDE[gebaeude];
  if (!g) return fehler('Dieses Gebäude gibt es nicht');
  if (!gebaeudeStehtSchon(s, gebaeude)) return fehler(`${g.name} steht noch nicht`);
  if (!g.rezepte.includes(rezept)) return fehler(`${g.name} kocht das nicht`);
  if (!Number.isInteger(menge) || menge < 0) return fehler('Die Menge muss eine ganze Zahl sein');
  if (menge > g.leistung) return fehler(`${g.name} schafft höchstens ${g.leistung} am Tag`);
  return ok({ ...s, auftraege: { ...s.auftraege, [gebaeude]: { rezept, menge } } });
}

// ---------- Einbringen ----------

/** Ertrag ins Lager, Ziel an den Fleck, Aufdecken, Nacht, neuer Tag. */
export function einbringen(s: Siedlung, tagwerk: Tagwerk): Ergebnis<Einbracht> {
  if (!s.unterwegs) return fehler('Es läuft kein Tagwerk');
  const id = s.unterwegs.fleck;
  let flecken = structuredClone(s.flecken);
  const lager = { ...s.lager };
  for (const [ware, menge] of Object.entries(tagwerk.ertrag) as [Ware, number][]) lager[ware] += menge;

  const fleck = flecken[id];
  fleck.stand = Math.max(fleck.stand, Math.min(fleck.ziel, tagwerk.ziel.stand));
  let gerodet = false;
  let aufgedeckt: FleckId[] = [];
  if (fleck.zustand === 'erkundet' && fleck.stand >= fleck.ziel) {
    fleck.zustand = 'gerodet';
    gerodet = true;
    ({ flecken, aufgedeckt } = aufdecken(flecken, id));
  }

  const vorNacht: Siedlung = { ...s, lager, flecken, ladung: { ...tagwerk.ladung }, unterwegs: null };
  const { siedlung, arbeit } = nacht(vorNacht);
  return ok({ siedlung: { ...siedlung, tag: s.tag + 1 }, fleck: id, gerodet, aufgedeckt, nacht: arbeit });
}

// ---------- Bauen ----------

export function bauen(s: Siedlung, gebaeude: GebaeudeId, fleckId: FleckId): Ergebnis<Siedlung> {
  const g = GEBAEUDE[gebaeude];
  if (!g) return fehler('Dieses Gebäude gibt es nicht');
  if (!g.baubar) return fehler(`${g.name} lässt sich nicht bauen`);
  if (gebaeudeStehtSchon(s, gebaeude)) return fehler(`${g.name} steht schon`);
  const fleck = s.flecken[fleckId];
  if (!fleck || fleck.zustand !== 'gerodet') return fehler('Gebaut wird nur auf gerodeten Flecken');
  if (!kannBezahlen(s.lager, g.kosten)) return fehler('Das Lager reicht nicht');

  const lager = { ...s.lager };
  for (const [w, n] of Object.entries(g.kosten) as [Ware, number][]) lager[w] -= n;
  const flecken = { ...s.flecken, [fleckId]: { ...fleck, zustand: 'bebaut' as const, gebaeude, gebautAmTag: s.tag } };
  return ok({ ...s, lager, flecken });
}

/** Nur am Tag des Baus (bis zum nächsten Einbringen); die Kosten kommen voll zurück. */
export function bauZuruecknehmen(s: Siedlung, fleckId: FleckId): Ergebnis<Siedlung> {
  const fleck = s.flecken[fleckId];
  const g = fleck?.gebaeude;
  if (!fleck || fleck.zustand !== 'bebaut' || !g || g === 'huetten' || fleck.gebautAmTag === undefined) {
    return fehler('Hier gibt es nichts zurückzunehmen');
  }
  if (fleck.gebautAmTag !== s.tag) return fehler('Der Bau steht schon zu lange');

  const lager = { ...s.lager };
  for (const [w, n] of Object.entries(GEBAEUDE[g].kosten) as [Ware, number][]) lager[w] += n;
  const { gebaeude: _g, gebautAmTag: _t, ...rest } = fleck;
  return ok({ ...s, lager, flecken: { ...s.flecken, [fleckId]: { ...rest, zustand: 'gerodet' as const } } });
}
