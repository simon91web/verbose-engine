import { STUNDE, SEKUNDE, WAREN, ZEIT, type Spieldaten, type Ware } from './spieldaten';
import {
  anbauten, bauart, baustellenReihe, bedarf, dauerJeStueck, findeBaustelle, findeGebaeude, frei, keineWaren, offen,
  platzImLager, stueck, summe, unterwegs, versorgt, vormerkungen,
  type Auftrag, type Baustelle, type Gebaeude, type Siedlung, type Traeger,
} from './siedlung';
import { Zufall } from './zufall';

/**
 * Die Regeln zwischen zwei Ereignissen. Nur für `nachrechnen` und die Aktionen; nicht Teil der öffentlichen Schnittstelle.
 *
 * Ablauf: Ein Ereignis (Ankunft, Stück fertig, Baustelle fertig, Mahlzeit, Zuzug) ändert den Stand. Danach bringt
 * `ausgleich` alles in Ordnung, was sofort folgt: Anbauten nehmen ihre Zutaten, Gebäude beginnen das nächste Stück,
 * fehlende Waren werden gegessen, sobald sie da sind, Träger gehen los. Bis zum nächsten Ereignis ändert sich nichts.
 */

export interface Protokoll {
  ereignisse: number;
  gaenge: number;
  /** Von Gebäuden hergestellt. */
  erzeugt: Record<Ware, number>;
  /** Vom Dorf verbraucht. */
  verbraucht: Record<Ware, number>;
  /** Von Werkstätten als Zutat genommen. */
  verarbeitet: Record<Ware, number>;
  /** In fertigen Gebäuden und Ausbauten verbaut. */
  verbaut: Record<Ware, number>;
  fertig: { id: number; art: string; zeit: number }[];
  zuzug: number;
}

export const leeresProtokoll = (): Protokoll => ({
  ereignisse: 0, gaenge: 0, erzeugt: keineWaren(), verbraucht: keineWaren(), verarbeitet: keineWaren(), verbaut: keineWaren(),
  fertig: [], zuzug: 0,
});

export type Ereignis =
  | { zeit: number; typ: 'ankunft'; traeger: Traeger }
  | { zeit: number; typ: 'stueck'; gebaeude: Gebaeude }
  | { zeit: number; typ: 'baustelle'; baustelle: Baustelle }
  | { zeit: number; typ: 'mahlzeit'; ware: Ware }
  | { zeit: number; typ: 'zuzug' };

/** Das früheste anstehende Ereignis; bei Gleichstand gilt die Reihenfolge dieser Liste. */
export function naechstesEreignis(s: Siedlung): Ereignis | null {
  let e: Ereignis | null = null;
  const frueher = (zeit: number | null | undefined): zeit is number => zeit != null && (e === null || zeit < e.zeit);
  for (const t of s.traeger) if (frueher(t.gang?.ankunft)) e = { zeit: t.gang!.ankunft, typ: 'ankunft', traeger: t };
  for (const g of s.gebaeude) if (frueher(g.fertigUm)) e = { zeit: g.fertigUm, typ: 'stueck', gebaeude: g };
  for (const b of s.baustellen) if (frueher(b.fertigUm)) e = { zeit: b.fertigUm, typ: 'baustelle', baustelle: b };
  for (const w of WAREN) {
    const n = s.dorf.verbrauch[w]?.naechste;
    if (frueher(n)) e = { zeit: n, typ: 'mahlzeit', ware: w };
  }
  if (frueher(s.dorf.zuzugUm)) e = { zeit: s.dorf.zuzugUm, typ: 'zuzug' };
  return e;
}

export function ausfuehren(s: Siedlung, e: Ereignis, d: Spieldaten, p: Protokoll): void {
  p.ereignisse++;
  switch (e.typ) {
    case 'ankunft': return ankunft(s, e.traeger, d, p);
    case 'stueck': return stueckFertig(s, e.gebaeude, d, p);
    case 'baustelle': return baustelleFertig(s, e.baustelle, d, p);
    case 'mahlzeit': return mahlzeit(s, e.ware, d, p);
    case 'zuzug':
      s.dorf.bewohner++;
      s.dorf.zuzugUm = null;
      p.zuzug++;
      return;
  }
}

// ---------- Ereignisse ----------

function ankunft(s: Siedlung, t: Traeger, d: Spieldaten, p: Protokoll): void {
  const gang = t.gang!;
  const a = t.auftrag!;
  if (gang.nach === 'lager') {
    if (gang.ware && gang.menge) s.lager.bestand[gang.ware] += gang.menge;
    t.gang = null;
    t.auftrag = null;
    p.gaenge++;
    return;
  }
  const b = findeBaustelle(s, gang.nach);
  const g = b ? undefined : findeGebaeude(s, gang.nach);
  let ladung = 0;
  if (a.art === 'liefern') {
    if (b?.abgebrochen && platzImLager(s, a.ware, d) >= a.menge) {
      // Inzwischen abgebrochen: Der Träger nimmt seinen Korb gleich wieder mit.
      ladung = a.menge;
      a.art = 'holen';
    } else if (b) b.geliefert[a.ware] = stueck(b.geliefert, a.ware) + a.menge;
    else if (g) g.eingang[a.ware] = stueck(g.eingang, a.ware) + a.menge;
    else ladung = a.menge; // Ziel gibt es nicht mehr: wieder mitnehmen
  } else {
    if (b) {
      ladung = Math.min(a.menge, stueck(b.geliefert, a.ware));
      b.geliefert[a.ware] = stueck(b.geliefert, a.ware) - ladung;
    } else if (g) {
      ladung = Math.min(a.menge, g.fach);
      g.fach -= ladung;
    }
    a.menge = ladung;
  }
  t.gang = {
    traeger: t.id, ware: ladung ? a.ware : null, menge: ladung, von: gang.nach, nach: 'lager',
    abgang: s.zeit, ankunft: s.zeit + (gang.ankunft - gang.abgang),
  };
}

function stueckFertig(s: Siedlung, g: Gebaeude, d: Spieldaten, p: Protokoll): void {
  const ware = bauart(d, g.art).erzeugt;
  g.fertigUm = null;
  p.erzeugt[ware]++;
  // Anbauten bekommen ihre Zutat direkt, ohne Träger.
  for (const a of anbauten(s, g)) {
    if (stueck(bauart(d, a.art).zutaten ?? {}, ware) && stueck(a.eingang, ware) < (bauart(d, a.art).eingang ?? 0)) {
      a.eingang[ware] = stueck(a.eingang, ware) + 1;
      return;
    }
  }
  g.fach++;
}

function baustelleFertig(s: Siedlung, b: Baustelle, d: Spieldaten, p: Protokoll): void {
  s.baustellen = s.baustellen.filter((x) => x !== b);
  if (s.vorrang === b.id) s.vorrang = null;
  for (const w of WAREN) p.verbaut[w] += stueck(b.geliefert, w);
  p.fertig.push({ id: b.id, art: b.art, zeit: s.zeit });
  if (b.art === 'dorf') {
    s.dorf.stufe++;
    s.dorf.ausbau = null;
    verbrauchAnpassen(s, d);
    return;
  }
  s.gebaeude.push({
    id: b.id, art: b.art, flur: b.flur, weg: b.weg, anbauAn: b.anbauAn,
    fach: 0, eingang: {}, fertigUm: null, zustand: 'ruht', seit: s.zeit,
  });
}

function mahlzeit(s: Siedlung, ware: Ware, d: Spieldaten, p: Protokoll): void {
  const v = s.dorf.verbrauch[ware]!;
  if (frei(s, ware) > 0) {
    s.lager.bestand[ware]--;
    p.verbraucht[ware]++;
    v.naechste = s.zeit + mahlzeitAbstand(s, ware, d);
  } else {
    v.naechste = null;
    v.mangelSeit = s.zeit;
  }
}

const mahlzeitAbstand = (s: Siedlung, ware: Ware, d: Spieldaten): number => Math.round(STUNDE / stueck(bedarf(s.dorf.stufe, d), ware));

/** Nach Gründung oder Aufstieg: für jede Ware des Bedarfs läuft eine Mahlzeit. */
export function verbrauchAnpassen(s: Siedlung, d: Spieldaten): void {
  const b = bedarf(s.dorf.stufe, d);
  for (const w of WAREN) {
    if (stueck(b, w) <= 0) delete s.dorf.verbrauch[w];
    else if (!s.dorf.verbrauch[w]) s.dorf.verbrauch[w] = { naechste: s.zeit + mahlzeitAbstand(s, w, d), mangelSeit: null };
  }
}

// ---------- Ausgleich ----------

export function ausgleich(s: Siedlung, d: Spieldaten, p: Protokoll): void {
  for (let runde = 0; ; runde++) {
    if (runde > 10_000) throw new Error('Ausgleich kommt nicht zur Ruhe');
    let bewegt = hinueber(s, d);
    if (s.einstellungen.traeger === 'sofort') bewegt = sofort(s, d) || bewegt;
    bewegt = mangelBeheben(s, d, p) || bewegt;
    bewegt = gebaeudeStarten(s, d, p) || bewegt;
    bewegt = baustellenPruefen(s, d) || bewegt;
    if (s.einstellungen.traeger === 'echt') bewegt = losschicken(s, d) || bewegt;
    if (!bewegt) break;
  }
  zuzugPruefen(s, d);
  zustaendeMerken(s, d);
}

/** Anbauten nehmen ihre Zutaten direkt aus dem Fach des Hauptgebäudes. */
function hinueber(s: Siedlung, d: Spieldaten): boolean {
  let bewegt = false;
  for (const a of s.gebaeude) {
    if (a.anbauAn === null) continue;
    const haupt = findeGebaeude(s, a.anbauAn);
    const art = bauart(d, a.art);
    if (!haupt || !art.zutaten) continue;
    const ware = bauart(d, haupt.art).erzeugt;
    if (!stueck(art.zutaten, ware)) continue;
    const n = Math.min(haupt.fach, (art.eingang ?? 0) - stueck(a.eingang, ware));
    if (n > 0) {
      haupt.fach -= n;
      a.eingang[ware] = stueck(a.eingang, ware) + n;
      bewegt = true;
    }
  }
  return bewegt;
}

/** Schalter „sofort“: Waren springen ohne Träger an ihren Platz. */
function sofort(s: Siedlung, d: Spieldaten): boolean {
  let bewegt = false;
  const bewegen = (n: number, weg: () => void): void => {
    if (n > 0) {
      weg();
      bewegt = true;
    }
  };
  const bestand = s.lager.bestand;
  for (const b of s.baustellen) {
    if (!b.abgebrochen) continue;
    for (const w of WAREN) {
      const n = Math.min(stueck(b.geliefert, w), platzImLager(s, w, d));
      bewegen(n, () => { b.geliefert[w] = stueck(b.geliefert, w) - n; bestand[w] += n; });
    }
  }
  for (const g of s.gebaeude) {
    const w = bauart(d, g.art).erzeugt;
    const n = Math.min(g.fach, platzImLager(s, w, d));
    bewegen(n, () => { g.fach -= n; bestand[w] += n; });
  }
  for (const b of baustellenReihe(s)) {
    for (const w of WAREN) {
      const n = Math.min(offen(s, b, w), bestand[w]);
      bewegen(n, () => { bestand[w] -= n; b.geliefert[w] = stueck(b.geliefert, w) + n; });
    }
  }
  for (const g of s.gebaeude) {
    const art = bauart(d, g.art);
    if (g.anbauAn !== null || !art.zutaten) continue;
    for (const w of WAREN) {
      if (!stueck(art.zutaten, w)) continue;
      const n = Math.min((art.eingang ?? 0) - stueck(g.eingang, w), frei(s, w));
      bewegen(n, () => { bestand[w] -= n; g.eingang[w] = stueck(g.eingang, w) + n; });
    }
  }
  return bewegt;
}

/** Fehlt eine Ware und ist sie wieder da, wird gleich gegessen; danach läuft der Verbrauch weiter. */
function mangelBeheben(s: Siedlung, d: Spieldaten, p: Protokoll): boolean {
  let bewegt = false;
  for (const w of WAREN) {
    const v = s.dorf.verbrauch[w];
    if (v?.mangelSeit == null || frei(s, w) <= 0) continue;
    s.lager.bestand[w]--;
    p.verbraucht[w]++;
    v.mangelSeit = null;
    v.naechste = s.zeit + mahlzeitAbstand(s, w, d);
    bewegt = true;
  }
  return bewegt;
}

/** Platz für das nächste Stück: im eigenen Fach oder im Zutatenfach eines Anbaus. */
function platzFuerStueck(s: Siedlung, g: Gebaeude, d: Spieldaten): number {
  const art = bauart(d, g.art);
  let platz = art.fach - g.fach;
  for (const a of anbauten(s, g)) {
    const aa = bauart(d, a.art);
    if (stueck(aa.zutaten ?? {}, art.erzeugt)) platz += (aa.eingang ?? 0) - stueck(a.eingang, art.erzeugt);
  }
  return platz;
}

const zutatenDa = (g: Gebaeude, d: Spieldaten): boolean => {
  const z = bauart(d, g.art).zutaten ?? {};
  return WAREN.every((w) => stueck(g.eingang, w) >= stueck(z, w));
};

function gebaeudeStarten(s: Siedlung, d: Spieldaten, p: Protokoll): boolean {
  let bewegt = false;
  for (const g of s.gebaeude) {
    if (g.fertigUm !== null || platzFuerStueck(s, g, d) < 1 || !zutatenDa(g, d)) continue;
    const z = bauart(d, g.art).zutaten ?? {};
    for (const w of WAREN) {
      const n = stueck(z, w);
      if (!n) continue;
      g.eingang[w] = stueck(g.eingang, w) - n;
      p.verarbeitet[w] += n;
    }
    g.fertigUm = s.zeit + dauerJeStueck(g, d);
    bewegt = true;
  }
  return bewegt;
}

/** Alles geliefert → Restarbeit beginnt. Abgebrochen und leer → Baustelle verschwindet. */
function baustellenPruefen(s: Siedlung, d: Spieldaten): boolean {
  let bewegt = false;
  for (const b of [...s.baustellen]) {
    if (b.abgebrochen) {
      if (summe(b.geliefert) === 0 && !s.traeger.some((t) => t.gang?.nach === b.id)) {
        s.baustellen = s.baustellen.filter((x) => x !== b);
        bewegt = true;
      }
    } else if (b.fertigUm === null && WAREN.every((w) => stueck(b.geliefert, w) >= stueck(b.kosten, w))) {
      b.fertigUm = s.zeit + restarbeit(s, b, d);
      bewegt = true;
    }
  }
  return bewegt;
}

const restarbeit = (s: Siedlung, b: Baustelle, d: Spieldaten): number =>
  b.art === 'dorf' ? d.dorf.stufen[s.dorf.stufe + 1].restarbeit : bauart(d, b.art).restarbeit;

// ---------- Träger ----------

function losschicken(s: Siedlung, d: Spieldaten): boolean {
  let bewegt = false;
  for (const t of s.traeger) {
    if (t.gang) continue;
    const a = waehleAuftrag(s, d);
    if (!a) break;
    const ziel = findeBaustelle(s, a.ziel) ?? findeGebaeude(s, a.ziel)!;
    if (a.art === 'liefern') s.lager.bestand[a.ware] -= a.menge;
    t.auftrag = a;
    t.gang = {
      traeger: t.id, ware: a.art === 'liefern' ? a.ware : null, menge: a.art === 'liefern' ? a.menge : 0,
      von: 'lager', nach: a.ziel, abgang: s.zeit, ankunft: s.zeit + Math.max(SEKUNDE, Math.round(ziel.weg * d.traeger.jeWabe)),
    };
    bewegt = true;
  }
  return bewegt;
}

/** Feste Reihenfolge: Baustellen (vorgezogene zuerst) → Zutaten für Werkstätten → volle Fächer abholen. */
function waehleAuftrag(s: Siedlung, d: Spieldaten): Auftrag | null {
  const korb = d.traeger.korb;
  const geholt = (ziel: number, w: Ware): number =>
    s.traeger.reduce((n, t) => n + (t.auftrag?.art === 'holen' && t.auftrag.ziel === ziel && t.auftrag.ware === w && t.gang?.nach === ziel ? t.auftrag.menge : 0), 0);

  const vm = vormerkungen(s);
  for (const b of baustellenReihe(s)) {
    for (const w of WAREN) {
      if (b.abgebrochen) {
        const n = Math.min(korb, stueck(b.geliefert, w) - geholt(b.id, w), platzImLager(s, w, d));
        if (n > 0) return { art: 'holen', ziel: b.id, ware: w, menge: n };
      } else {
        const n = Math.min(korb, stueck(vm.get(b.id) ?? {}, w));
        if (n > 0) return { art: 'liefern', ziel: b.id, ware: w, menge: n };
      }
    }
  }

  for (const g of s.gebaeude) {
    const art = bauart(d, g.art);
    if (g.anbauAn !== null || !art.zutaten) continue;
    const groesse = art.eingang ?? 0;
    for (const w of WAREN) {
      if (!stueck(art.zutaten, w)) continue;
      const platz = groesse - stueck(g.eingang, w) - unterwegs(s, g.id, w);
      const n = Math.min(korb, platz, frei(s, w));
      if (platz >= Math.min(korb, groesse) && n > 0) return { art: 'liefern', ziel: g.id, ware: w, menge: n };
    }
  }

  // Volle Fächer: zuerst die Ware, für die im Lager am meisten Platz ist, dann das vollste Fach.
  // So holt der Träger keine Einzelstücke fast voller Waren, während anderswo ein ganzer Korb wartet.
  let beste: { g: Gebaeude; grad: number; ware: Ware; platz: number } | null = null;
  for (const g of s.gebaeude) {
    const art = bauart(d, g.art);
    if (g.fach < Math.min(korb, art.fach) || s.traeger.some((t) => t.auftrag?.art === 'holen' && t.gang?.nach === g.id)) continue;
    const platz = platzImLager(s, art.erzeugt, d);
    const grad = g.fach / art.fach;
    if (platz > 0 && (!beste || platz > beste.platz || (platz === beste.platz && grad > beste.grad))) beste = { g, grad, ware: art.erzeugt, platz };
  }
  return beste ? { art: 'holen', ziel: beste.g.id, ware: beste.ware, menge: Math.min(korb, beste.platz) } : null;
}

// ---------- Dorf ----------

/** Zuzug läuft, solange Platz frei und der Bedarf gedeckt ist; bei Mangel hält er an und läuft danach weiter. */
function zuzugPruefen(s: Siedlung, d: Spieldaten): void {
  const dorf = s.dorf;
  if (dorf.bewohner >= d.dorf.stufen[dorf.stufe].plaetze) {
    dorf.zuzugUm = null;
    dorf.zuzugRest = null;
  } else if (versorgt(s)) {
    if (dorf.zuzugUm === null) {
      dorf.zuzugUm = s.zeit + (dorf.zuzugRest ?? zuzugAbstand(s, d));
      dorf.zuzugRest = null;
    }
  } else if (dorf.zuzugUm !== null) {
    dorf.zuzugRest = dorf.zuzugUm - s.zeit;
    dorf.zuzugUm = null;
  }
}

function zuzugAbstand(s: Siedlung, d: Spieldaten): number {
  const z = new Zufall(s.zufall);
  const { min, max } = d.dorf.zuzug;
  const tage = min + z.zahl() * (max - min);
  s.zufall = z.zustand;
  return Math.round(tage * ZEIT.tag);
}

/** Merkt sich, seit wann ein Gebäude ruht oder wartet und seit wann ein Fach im Lager voll ist. */
function zustaendeMerken(s: Siedlung, d: Spieldaten): void {
  for (const g of s.gebaeude) {
    const z = g.fertigUm !== null ? 'arbeitet' : platzFuerStueck(s, g, d) < 1 ? 'ruht' : 'wartet';
    if (z !== g.zustand) {
      g.zustand = z;
      g.seit = s.zeit;
    }
  }
  for (const w of WAREN) {
    const voll = s.lager.bestand[w] >= d.lager.fach;
    if (!voll) s.lager.vollSeit[w] = null;
    else if (s.lager.vollSeit[w] === null) s.lager.vollSeit[w] = s.zeit;
  }
}
