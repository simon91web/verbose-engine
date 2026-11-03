import { FLURARTEN, SPIELDATEN, WAREN, type Dorfstufe, type Flurart, type Spieldaten, type Waren } from './spieldaten';
import { findeBaustelle, findeGebaeude, istBauart, keineWaren, versorgt, type Siedlung, type Traegermodus } from './siedlung';
import { ausgleich, leeresProtokoll, verbrauchAnpassen } from './regeln';
import type { Ergebnis } from './tagwerk';

/**
 * Was der Spieler in der Siedlung tut. Jede Aktion gilt zum Zeitpunkt `stand.zeit` – vorher also bis „jetzt“
 * nachrechnen. Die Eingabe bleibt unverändert, zurück kommt ein neuer Stand.
 */

const fehler = (grund: string): { ok: false; grund: string } => ({ ok: false, grund });

// ---------- Gründung ----------

export interface Gruendung {
  seed: number;
  /** Echtzeit der Gründung; Standard 0. */
  gruendung?: number;
  traeger?: Traegermodus;
  traegerAnzahl?: number;
  /** Bestand im Lager; Standard aus den Spieldaten. */
  lager?: Waren;
  /** Gebäude, die schon stehen. Sie bekommen die ids 1, 2, 3 … in dieser Reihenfolge; `anbauAn` nennt eine davon. */
  gebaeude?: { art: string; flur: Flurart; weg: number; anbauAn?: number }[];
  /** Für Tests und Werkstatt: das Dorf in einer späteren Stufe beginnen. */
  dorf?: { stufe?: number; bewohner?: number };
}

export function neueSiedlung(o: Gruendung, d: Spieldaten = SPIELDATEN): Siedlung {
  const bestand = keineWaren();
  for (const w of WAREN) bestand[w] = (o.lager ?? d.lager.start)[w] ?? 0;
  const stufe = o.dorf?.stufe ?? 0;
  const s: Siedlung = {
    version: 1,
    seed: o.seed >>> 0,
    zufall: o.seed >>> 0,
    gruendung: o.gruendung ?? 0,
    zeit: 0,
    einstellungen: { traeger: o.traeger ?? 'echt' },
    naechsteId: 1,
    lager: { bestand, vollSeit: Object.fromEntries(WAREN.map((w) => [w, null])) as Siedlung['lager']['vollSeit'] },
    gebaeude: [],
    baustellen: [],
    vorrang: null,
    traeger: Array.from({ length: o.traegerAnzahl ?? d.traeger.anzahl }, (_, i) => ({
      id: i + 1, name: d.traeger.namen[i] ?? `Träger ${i + 1}`, auftrag: null, gang: null,
    })),
    dorf: {
      stufe, bewohner: o.dorf?.bewohner ?? d.dorf.startBewohner, verbrauch: {}, zuzugUm: null, zuzugRest: null, ausbau: null,
    },
  };
  for (const g of o.gebaeude ?? []) {
    const pruefung = bauPruefen(s, { art: g.art, flur: g.flur, weg: g.weg, anbauAn: g.anbauAn }, d);
    if (!pruefung.ok) throw new Error(pruefung.grund);
    s.gebaeude.push({ id: s.naechsteId++, ...pruefung.wert, fach: 0, eingang: {}, fertigUm: null, zustand: 'ruht', seit: 0 });
  }
  verbrauchAnpassen(s, d);
  ausgleich(s, d, leeresProtokoll());
  return s;
}

// ---------- Bauen ----------

export interface Bauauftrag {
  art: string;
  flur: Flurart;
  /** Weglänge vom Lager in Waben. Bei Anbauten gilt der Weg des Hauptgebäudes. */
  weg: number;
  /** id des Hauptgebäudes, wenn die Bauart ein Anbau ist. */
  anbauAn?: number;
}

function bauPruefen(s: Siedlung, a: Bauauftrag, d: Spieldaten): Ergebnis<{ art: string; flur: Flurart; weg: number; anbauAn: number | null }> {
  if (!istBauart(d, a.art)) return fehler(`Unbekanntes Gebäude: ${a.art}`);
  const art = d.bauarten[a.art];
  if (art.anbauAn) {
    const haupt = a.anbauAn === undefined ? undefined : findeGebaeude(s, a.anbauAn);
    const hauptName = istBauart(d, art.anbauAn) ? d.bauarten[art.anbauAn].name : art.anbauAn;
    if (!haupt || haupt.art !== art.anbauAn) return fehler(`${art.name} ist ein Anbau an einen fertigen ${hauptName}`);
    const belegt = s.gebaeude.filter((g) => g.anbauAn === haupt.id).length + s.baustellen.filter((b) => b.anbauAn === haupt.id && !b.abgebrochen).length;
    if (belegt >= d.anbauPlaetze) return fehler(`Alle ${d.anbauPlaetze} Anbauplätze am ${hauptName} sind belegt`);
    return { ok: true, wert: { art: a.art, flur: haupt.flur, weg: haupt.weg, anbauAn: haupt.id } };
  }
  if (a.anbauAn !== undefined) return fehler(`${art.name} ist kein Anbau`);
  if (art.nur && !art.nur.includes(a.flur)) return fehler(`${art.name} geht nur auf: ${art.nur.map((f) => FLURARTEN[f]).join(', ')}`);
  if (!Number.isFinite(a.weg) || a.weg < 0) return fehler('Ungültige Weglänge');
  return { ok: true, wert: { art: a.art, flur: a.flur, weg: a.weg, anbauAn: null } };
}

/**
 * Platziert eine Baustelle. Das Material wird im Lager vorgemerkt, soweit es da ist; fehlt etwas, wartet die
 * Baustelle darauf. Die Träger bringen es in Körben.
 */
export function bauen(alt: Siedlung, auftrag: Bauauftrag, d: Spieldaten = SPIELDATEN): Ergebnis<{ stand: Siedlung; id: number }> {
  const pruefung = bauPruefen(alt, auftrag, d);
  if (!pruefung.ok) return pruefung;
  const s = structuredClone(alt);
  const id = s.naechsteId++;
  s.baustellen.push({
    id, ...pruefung.wert, kosten: { ...d.bauarten[auftrag.art].kosten }, geliefert: {},
    platziert: s.zeit, fertigUm: null, abgebrochen: false,
  });
  ausgleich(s, d, leeresProtokoll());
  return { ok: true, wert: { stand: s, id } };
}

/** Ausbau zur nächsten Stufe geht, wenn das Dorf voll und versorgt ist. */
export function kannAusbauen(s: Siedlung, d: Spieldaten = SPIELDATEN): Ergebnis<Dorfstufe> {
  const naechste = d.dorf.stufen[s.dorf.stufe + 1];
  const jetzt = d.dorf.stufen[s.dorf.stufe];
  if (s.dorf.ausbau !== null) return fehler('Der Ausbau läuft schon');
  if (!naechste) return fehler(`${jetzt.name} ist die höchste Stufe`);
  if (s.dorf.bewohner < jetzt.plaetze) return fehler(`Erst wenn alle Plätze belegt sind (${s.dorf.bewohner} von ${jetzt.plaetze})`);
  if (!versorgt(s)) return fehler('Erst wenn der Bedarf gedeckt ist');
  return { ok: true, wert: naechste };
}

/** Steckt den Ausbau des Dorfs als Baustelle ab. `weg`: Weglänge vom Lager zum Dorf in Waben. */
export function dorfAusbauen(alt: Siedlung, ort: { weg: number }, d: Spieldaten = SPIELDATEN): Ergebnis<{ stand: Siedlung; id: number }> {
  const pruefung = kannAusbauen(alt, d);
  if (!pruefung.ok) return pruefung;
  const s = structuredClone(alt);
  const id = s.naechsteId++;
  s.baustellen.push({
    id, art: 'dorf', flur: 'lichtung', weg: Math.max(0, ort.weg), anbauAn: null, kosten: { ...pruefung.wert.kosten },
    geliefert: {}, platziert: s.zeit, fertigUm: null, abgebrochen: false,
  });
  s.dorf.ausbau = id;
  ausgleich(s, d, leeresProtokoll());
  return { ok: true, wert: { stand: s, id } };
}

/** Bricht eine Baustelle ab. Die Vormerkung fällt weg; was schon geliefert ist, tragen die Träger zurück ins Lager. */
export function abbrechen(alt: Siedlung, id: number, d: Spieldaten = SPIELDATEN): Ergebnis<Siedlung> {
  const b = findeBaustelle(alt, id);
  if (!b || b.abgebrochen) return fehler('Diese Baustelle gibt es nicht');
  const s = structuredClone(alt);
  const neu = findeBaustelle(s, id)!;
  neu.abgebrochen = true;
  neu.fertigUm = null;
  if (s.dorf.ausbau === id) s.dorf.ausbau = null;
  if (s.vorrang === id) s.vorrang = null;
  ausgleich(s, d, leeresProtokoll());
  return { ok: true, wert: s };
}

/** Diese Baustelle bedienen die Träger zuerst; sie bekommt auch das Material im Lager zuerst. `null` hebt das auf. */
export function vorziehen(alt: Siedlung, id: number | null, d: Spieldaten = SPIELDATEN): Ergebnis<Siedlung> {
  if (id !== null && (!findeBaustelle(alt, id) || findeBaustelle(alt, id)!.abgebrochen)) return fehler('Diese Baustelle gibt es nicht');
  const s = structuredClone(alt);
  s.vorrang = id;
  ausgleich(s, d, leeresProtokoll());
  return { ok: true, wert: s };
}

/** Schalter für den Spieltest: Träger tragen echt, oder Waren landen sofort an ihrem Platz. Laufende Gänge enden normal. */
export function traegerSchalten(alt: Siedlung, modus: Traegermodus, d: Spieldaten = SPIELDATEN): Siedlung {
  const s = structuredClone(alt);
  s.einstellungen.traeger = modus;
  ausgleich(s, d, leeresProtokoll());
  return s;
}
