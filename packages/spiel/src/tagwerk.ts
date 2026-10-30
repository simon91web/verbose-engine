import { ARTEN, BIOME, REGELN, SIEDLER, istRohstoff, type Art, type BiomId, type Rohstoff, type SiedlerId } from './daten';
import { SPALTEN, ZEILEN, alleZellen, benachbart, eingeschlossen, gleich, imBrett, nachbarn, schluessel, type Zelle } from './geometrie';
import { Zufall } from './zufall';

/**
 * Ein Tagwerk: das Brett eines Flecks, die Schritte des Trupps und der Ertrag des Tages.
 * Alle Funktionen hier ändern ihre Eingabe nicht, sondern geben einen neuen Stand zurück.
 */

export interface Kachel {
  id: number;
  art: Art;
  /** 1–3 bei Rohstoffen, 0 bei Hindernis und Tier. */
  reife: number;
}

export type Ertrag = Record<Rohstoff, number> & { hase: number };

export interface Tagwerk {
  biom: BiomId;
  /** Zustand des Zufallsstroms – alles Neue auf dem Brett kommt von hier. */
  zufall: number;
  naechsteId: number;
  /** [Spalte][Zeile], Zeile 0 oben. */
  gitter: Kachel[][];
  schritte: number;
  maxSchritte: number;
  ertrag: Ertrag;
  /** Ziel des Flecks über alle Tage, z. B. Gestrüpp roden 38 / 60. */
  ziel: { stand: number; gesamt: number };
  gerodetHeute: number;
  trupp: SiedlerId[];
  ladung: Record<SiedlerId, number>;
}

export type Bericht =
  | { typ: 'kette'; art: Rohstoff; laenge: number; summe: number; ring: number; gerodet: number; hasen: number; zielErreicht: boolean; gemischt: boolean }
  | { typ: 'faehigkeit'; siedler: SiedlerId; wert: number; gemischt: boolean };

export interface Zug {
  /** Sofort zeigen: geerntet und nachgefallen. */
  zwischen: Tagwerk;
  /** Kurz danach zeigen: Tiere gehüpft, Kacheln gereift. Gilt als neuer Stand. */
  danach: Tagwerk;
  entfernt: { kachel: Kachel; zelle: Zelle }[];
  /** Neue Kacheln: id → Zeile, aus der sie hereinfallen (negativ, über dem Brett). */
  herkunft: Record<number, number>;
  bericht: Bericht;
}

export type Ergebnis<T> = { ok: true; wert: T } | { ok: false; grund: string };

export interface Vorschau {
  art: Rohstoff;
  laenge: number;
  gueltig: boolean;
  summe: number;
  innen: Zelle[];
  ring: { ertrag: number; hasen: number; gestruepp: number };
}

const fehler = (grund: string): { ok: false; grund: string } => ({ ok: false, grund });

export const kachel = (t: Tagwerk, [s, z]: Zelle): Kachel => t.gitter[s][z];
export const istVorbei = (t: Tagwerk): boolean => t.schritte <= 0;
export const gesamtErtrag = (t: Tagwerk): number => Object.values(t.ertrag).reduce((a, b) => a + b, 0);

// ---------- Neues Tagwerk ----------

export interface Optionen {
  seed: number;
  biom?: BiomId;
  trupp?: SiedlerId[];
  ladung?: Partial<Record<SiedlerId, number>>;
  ziel?: { stand: number; gesamt: number };
}

export function neuesTagwerk(o: Optionen): Tagwerk {
  const trupp = o.trupp ?? ['ida', 'jonas', 'mara'];
  const schritte = trupp.length * REGELN.schritteProSiedler;
  const t: Tagwerk = {
    biom: o.biom ?? 'wald',
    zufall: o.seed >>> 0,
    naechsteId: 1,
    gitter: Array.from({ length: SPALTEN }, () => []),
    schritte,
    maxSchritte: schritte,
    ertrag: { holz: 0, beeren: 0, kraeuter: 0, nuesse: 0, hase: 0 },
    ziel: { ...(o.ziel ?? { stand: 0, gesamt: 60 }) },
    gerodetHeute: 0,
    trupp: [...trupp],
    ladung: { ida: 0, jonas: 0, mara: 0, ...o.ladung },
  };
  const z = new Zufall(t.zufall);
  for (let s = 0; s < SPALTEN; s++) for (let r = 0; r < ZEILEN; r++) t.gitter[s].push(ziehe(t, z));
  sichereZug(t, z);
  t.zufall = z.zustand;
  return t;
}

/** Nächster Tag auf demselben Fleck: Trupp, Ladung und Ziel bleiben, das Brett ist neu. */
export function folgeTagwerk(vorher: Tagwerk, seed: number): Tagwerk {
  return neuesTagwerk({ seed, biom: vorher.biom, trupp: vorher.trupp, ladung: vorher.ladung, ziel: vorher.ziel });
}

// ---------- Kette ziehen ----------

export const kannStarten = (t: Tagwerk, zelle: Zelle): boolean =>
  !istVorbei(t) && imBrett(zelle) && istRohstoff(kachel(t, zelle).art);

/** Zieht die Kette zu einer Zelle weiter: anhängen, auf die vorletzte zurückziehen oder unverändert lassen. */
export function pfadErweitern(t: Tagwerk, pfad: readonly Zelle[], zelle: Zelle): Zelle[] {
  if (!imBrett(zelle)) return [...pfad];
  if (!pfad.length) return kannStarten(t, zelle) ? [zelle] : [];
  const letzte = pfad[pfad.length - 1];
  if (gleich(letzte, zelle)) return [...pfad];
  if (pfad.length > 1 && gleich(pfad[pfad.length - 2], zelle)) return pfad.slice(0, -1);
  if (pfad.some((p) => gleich(p, zelle)) || !benachbart(letzte, zelle)) return [...pfad];
  if (kachel(t, zelle).art !== kachel(t, pfad[0]).art) return [...pfad];
  return [...pfad, zelle];
}

function gueltigeKette(t: Tagwerk, pfad: readonly Zelle[]): boolean {
  if (!pfad.length || !pfad.every(imBrett)) return false;
  const art = kachel(t, pfad[0]).art;
  if (!istRohstoff(art)) return false;
  if (new Set(pfad.map(schluessel)).size !== pfad.length) return false;
  return pfad.every((z, i) => kachel(t, z).art === art && (i === 0 || benachbart(pfad[i - 1], z)));
}

export function vorschau(t: Tagwerk, pfad: readonly Zelle[]): Vorschau | null {
  if (!gueltigeKette(t, pfad)) return null;
  const art = kachel(t, pfad[0]).art as Rohstoff;
  const innen = pfad.length >= REGELN.minRing ? eingeschlossen(pfad) : [];
  const ring = { ertrag: 0, hasen: 0, gestruepp: 0 };
  for (const zelle of innen) {
    const k = kachel(t, zelle);
    if (istRohstoff(k.art)) ring.ertrag += REGELN.ringFaktor * k.reife;
    else if (ARTEN[k.art].typ === 'tier') ring.hasen++;
    else ring.gestruepp++;
  }
  return {
    art,
    laenge: pfad.length,
    gueltig: pfad.length >= REGELN.minKette && !istVorbei(t),
    summe: pfad.reduce((s, z) => s + kachel(t, z).reife, 0),
    innen,
    ring,
  };
}

/** Erntet eine Kette: Ertrag = Summe der Reife; Eingeschlossenes zählt doppelt; Gestrüpp daneben wird gerodet. */
export function ernten(alt: Tagwerk, pfad: readonly Zelle[]): Ergebnis<Zug> {
  if (istVorbei(alt)) return fehler('Keine Schritte mehr');
  if (!gueltigeKette(alt, pfad)) return fehler('Keine gültige Kette');
  if (pfad.length < REGELN.minKette) return fehler(`Mindestens ${REGELN.minKette} gleiche Kacheln`);

  const t = structuredClone(alt);
  const z = new Zufall(t.zufall);
  const art = kachel(t, pfad[0]).art as Rohstoff;
  const weg = new Map<number, Zelle>();
  let summe = 0, ring = 0, gerodet = 0, hasen = 0;

  for (const zelle of pfad) {
    summe += kachel(t, zelle).reife;
    weg.set(schluessel(zelle), zelle);
  }
  t.ertrag[art] += summe;
  laden(t, art, pfad.length);

  if (pfad.length >= REGELN.minRing) {
    for (const zelle of eingeschlossen(pfad)) {
      const k = kachel(t, zelle);
      if (istRohstoff(k.art)) {
        ring += REGELN.ringFaktor * k.reife;
        t.ertrag[k.art] += REGELN.ringFaktor * k.reife;
        laden(t, k.art, 1);
      } else if (ARTEN[k.art].typ === 'tier') hasen++;
      else gerodet++;
      weg.set(schluessel(zelle), zelle);
    }
  }
  for (const zelle of pfad) {
    for (const n of nachbarn(zelle)) {
      if (!weg.has(schluessel(n)) && ARTEN[kachel(t, n).art].typ === 'hindernis') {
        gerodet++;
        weg.set(schluessel(n), n);
      }
    }
  }

  t.ertrag.hase += hasen;
  const vorherErreicht = t.ziel.stand >= t.ziel.gesamt;
  t.ziel.stand = Math.min(t.ziel.gesamt, t.ziel.stand + gerodet);
  t.gerodetHeute += gerodet;
  t.schritte--;

  const entfernt = [...weg.values()].map((zelle) => ({ kachel: kachel(t, zelle), zelle }));
  const herkunft = fallenLassen(t, z, new Set(weg.keys()));
  t.zufall = z.zustand;
  const zwischen = structuredClone(t);
  const gemischt = nachDemSchritt(t, z);
  t.zufall = z.zustand;

  return {
    ok: true,
    wert: {
      zwischen,
      danach: t,
      entfernt,
      herkunft,
      bericht: { typ: 'kette', art, laenge: pfad.length, summe, ring, gerodet, hasen, zielErreicht: !vorherErreicht && t.ziel.stand >= t.ziel.gesamt, gemischt },
    },
  };
}

// ---------- Fähigkeiten ----------

export function faehigkeitPruefen(t: Tagwerk, id: SiedlerId): Ergebnis<null> {
  const s = SIEDLER[id];
  if (!t.trupp.includes(id)) return fehler(`${s.name} ist heute nicht dabei`);
  if (istVorbei(t)) return fehler('Keine Schritte mehr');
  const fehlt = s.voll - t.ladung[id];
  if (fehlt > 0) return fehler(`${s.name} lädt durch ${ARTEN[s.laedt].name} – noch ${fehlt}`);
  if (id === 'ida' && !alleZellen().some((zelle) => holzZumFaellen(kachel(t, zelle)))) return fehler('Kein Holz ab Reife 2');
  if (id === 'mara' && !alleZellen().some((zelle) => ARTEN[kachel(t, zelle).art].typ === 'tier')) return fehler('Kein Hase auf dem Brett');
  return { ok: true, wert: null };
}

const holzZumFaellen = (k: Kachel): boolean => k.art === 'holz' && k.reife >= 2;

/** Setzt die Fähigkeit eines Siedlers ein. Kostet keinen Schritt, die Ladung beginnt von vorn. */
export function faehigkeit(alt: Tagwerk, id: SiedlerId): Ergebnis<Zug> {
  const pruefung = faehigkeitPruefen(alt, id);
  if (!pruefung.ok) return pruefung;

  const t = structuredClone(alt);
  const z = new Zufall(t.zufall);
  let wert = 0;
  let entfernt: Zug['entfernt'] = [];
  let herkunft: Zug['herkunft'] = {};

  if (id === 'jonas') {
    for (const zelle of alleZellen()) {
      const k = kachel(t, zelle);
      if ((k.art === 'beeren' || k.art === 'nuesse') && k.reife < REGELN.maxReife) {
        k.reife++;
        wert++;
      }
    }
  } else {
    const ziele = alleZellen().filter((zelle) =>
      id === 'ida' ? holzZumFaellen(kachel(t, zelle)) : ARTEN[kachel(t, zelle).art].typ === 'tier',
    );
    if (id === 'ida') {
      wert = ziele.reduce((s, zelle) => s + kachel(t, zelle).reife, 0);
      t.ertrag.holz += wert;
    } else {
      wert = ziele.length;
      t.ertrag.hase += wert;
    }
    entfernt = ziele.map((zelle) => ({ kachel: kachel(t, zelle), zelle }));
    herkunft = fallenLassen(t, z, new Set(ziele.map(schluessel)));
  }
  t.ladung[id] = 0;
  const gemischt = sichereZug(t, z);
  t.zufall = z.zustand;
  return { ok: true, wert: { zwischen: t, danach: t, entfernt, herkunft, bericht: { typ: 'faehigkeit', siedler: id, wert, gemischt } } };
}

// ---------- Innenleben ----------

function laden(t: Tagwerk, art: Rohstoff, n: number): void {
  for (const id of t.trupp) {
    const s = SIEDLER[id];
    if (s.laedt === art) t.ladung[id] = Math.min(s.voll, t.ladung[id] + n);
  }
}

function ziehe(t: Tagwerk, z: Zufall): Kachel {
  const biom = BIOME[t.biom];
  let art = z.gewichtet(biom.gewichte);
  if (ARTEN[art].typ === 'tier' && zaehleTiere(t) >= biom.maxTiere) {
    art = z.gewichtet(Object.fromEntries(Object.entries(biom.gewichte).filter(([a]) => istRohstoff(a as Art))) as Record<Art, number>);
  }
  let reife = 0;
  if (istRohstoff(art)) {
    const w = z.zahl();
    reife = w < biom.reife[0] ? 1 : w < biom.reife[0] + biom.reife[1] ? 2 : 3;
  }
  return { id: t.naechsteId++, art, reife };
}

function zaehleTiere(t: Tagwerk): number {
  let n = 0;
  for (const spalte of t.gitter) for (const k of spalte) if (ARTEN[k.art].typ === 'tier') n++;
  return n;
}

/** Entfernt Zellen, lässt den Rest jeder Spalte nach unten fallen und füllt oben neu auf. */
function fallenLassen(t: Tagwerk, z: Zufall, weg: Set<number>): Record<number, number> {
  const herkunft: Record<number, number> = {};
  for (let s = 0; s < SPALTEN; s++) t.gitter[s] = t.gitter[s].filter((_, r) => !weg.has(schluessel([s, r])));
  for (let s = 0; s < SPALTEN; s++) {
    const fehlt = ZEILEN - t.gitter[s].length;
    for (let i = 0; i < fehlt; i++) {
      const neu = ziehe(t, z);
      t.gitter[s].unshift(neu);
      herkunft[neu.id] = -1 - i;
    }
  }
  return herkunft;
}

/** Nach jedem Schritt: Tiere hüpfen ein Feld und fressen dort die Reife auf 1, einige Kacheln reifen. */
function nachDemSchritt(t: Tagwerk, z: Zufall): boolean {
  const tiere = alleZellen().filter((zelle) => ARTEN[kachel(t, zelle).art].typ === 'tier');
  for (const zelle of tiere) {
    const ziele = nachbarn(zelle).filter((n) => istRohstoff(kachel(t, n).art));
    if (!ziele.length) continue;
    const ziel = ziele[z.ganz(ziele.length)];
    const tier = kachel(t, zelle);
    const beute = kachel(t, ziel);
    beute.reife = 1;
    t.gitter[ziel[0]][ziel[1]] = tier;
    t.gitter[zelle[0]][zelle[1]] = beute;
  }
  const kandidaten = alleZellen().filter((zelle) => {
    const k = kachel(t, zelle);
    return istRohstoff(k.art) && k.reife < REGELN.maxReife;
  });
  for (let i = 0; i < REGELN.reifenProSchritt && kandidaten.length; i++) {
    const [zelle] = kandidaten.splice(z.ganz(kandidaten.length), 1);
    kachel(t, zelle).reife++;
  }
  return sichereZug(t, z);
}

/** Gibt es irgendwo drei gleiche Rohstoffe in einer Kette? */
export function hatZug(t: Tagwerk): boolean {
  return alleZellen().some((a) => {
    const art = kachel(t, a).art;
    if (!istRohstoff(art)) return false;
    return nachbarn(a).some((b) => kachel(t, b).art === art && nachbarn(b).some((c) => !gleich(c, a) && kachel(t, c).art === art));
  });
}

/** Mischt das Brett, falls keine Kette mehr möglich ist. */
function sichereZug(t: Tagwerk, z: Zufall): boolean {
  let gemischt = false;
  for (let versuch = 0; versuch < 20 && !hatZug(t); versuch++) {
    const alle = t.gitter.flat();
    for (let i = alle.length - 1; i > 0; i--) {
      const j = z.ganz(i + 1);
      [alle[i], alle[j]] = [alle[j], alle[i]];
    }
    for (let s = 0; s < SPALTEN; s++) t.gitter[s] = alle.slice(s * ZEILEN, (s + 1) * ZEILEN);
    gemischt = true;
  }
  return gemischt;
}
