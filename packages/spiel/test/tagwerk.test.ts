import { describe, expect, it } from 'vitest';
import {
  ARTEN, SIEDLER, SPALTEN, ZEILEN, ernten, faehigkeit, folgeSeed, folgeTagwerk, hatZug, istRohstoff, kachel,
  nachbarn, neuesTagwerk, pfadErweitern, vorschau, type Tagwerk, type Zelle,
} from '../src';
import { brett, ids, mit, ohneKetten, reifeSumme } from './hilfen';

const RING: Zelle[] = [[3, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 3]];

function gueltigesBrett(t: Tagwerk) {
  expect(t.gitter).toHaveLength(SPALTEN);
  for (const spalte of t.gitter) expect(spalte).toHaveLength(ZEILEN);
  expect(new Set(ids(t)).size).toBe(SPALTEN * ZEILEN);
  for (const k of t.gitter.flat()) {
    if (istRohstoff(k.art)) expect(k.reife).toBeGreaterThanOrEqual(1);
    if (istRohstoff(k.art)) expect(k.reife).toBeLessThanOrEqual(3);
    else expect(k.reife).toBe(0);
  }
}

describe('Neues Tagwerk', () => {
  it('ist bei gleichem Startwert gleich und sonst verschieden', () => {
    expect(neuesTagwerk({ seed: 42 })).toEqual(neuesTagwerk({ seed: 42 }));
    expect(neuesTagwerk({ seed: 42 }).gitter).not.toEqual(neuesTagwerk({ seed: 43 }).gitter);
  });

  it('hat 7 × 7 Kacheln, höchstens zwei Hasen, 15 Schritte und mindestens eine Kette', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const t = neuesTagwerk({ seed });
      gueltigesBrett(t);
      expect(t.gitter.flat().filter((k) => k.art === 'hase').length).toBeLessThanOrEqual(2);
      expect(t.schritte).toBe(15);
      expect(hatZug(t)).toBe(true);
    }
  });

  it('Folgetag behält Trupp, Ladung und Ziel, beginnt mit leerem Ertrag', () => {
    const t = { ...neuesTagwerk({ seed: 3, ladung: { ida: 7 } }), ziel: { stand: 44, gesamt: 60 } };
    t.ertrag = { ...t.ertrag, holz: 12 };
    const morgen = folgeTagwerk(t, folgeSeed(3, 15));
    expect(morgen.ladung.ida).toBe(7);
    expect(morgen.ziel).toEqual({ stand: 44, gesamt: 60 });
    expect(morgen.ertrag.holz).toBe(0);
    expect(folgeSeed(3, 15)).not.toBe(folgeSeed(3, 16));
  });
});

describe('Kette ziehen', () => {
  const t = brett(mit(ohneKetten(), { '0,4': 'k', '0,5': 'k', '0,6': 'k', '1,5': 'g', '3,3': 'k' }));

  it('beginnt nur auf Rohstoffen', () => {
    expect(pfadErweitern(t, [], [0, 4])).toEqual([[0, 4]]);
    expect(pfadErweitern(t, [], [1, 5])).toEqual([]);
  });

  it('hängt nur gleiche Nachbarn an und zieht auf die vorletzte zurück', () => {
    let p = pfadErweitern(t, [], [0, 4]);
    p = pfadErweitern(t, p, [0, 5]);
    expect(p).toEqual([[0, 4], [0, 5]]);
    expect(pfadErweitern(t, p, [3, 3])).toEqual(p); // nicht benachbart
    expect(pfadErweitern(t, p, [1, 5])).toEqual(p); // Gestrüpp
    expect(pfadErweitern(t, p, [0, 4])).toEqual([[0, 4]]); // zurückziehen
    p = pfadErweitern(t, p, [0, 6]);
    expect(p).toHaveLength(3);
    expect(pfadErweitern(t, p, [0, 5])).toEqual([[0, 4], [0, 5]]);
  });

  it('Vorschau nennt Art, Länge und Ertrag', () => {
    const v = vorschau(t, [[0, 4], [0, 5]]);
    expect(v).toMatchObject({ art: 'kraeuter', laenge: 2, gueltig: false, summe: 2 });
    expect(vorschau(t, [[0, 4], [0, 5], [0, 6]])?.gueltig).toBe(true);
  });
});

describe('Ernten', () => {
  const layout = mit(ohneKetten(), { '0,4': 'k', '0,5': 'k', '0,6': 'k', '1,5': 'g', '1,6': 'h' });

  it('Ertrag ist die Summe der Reife, ein Schritt wird verbraucht', () => {
    const t = brett(layout, { '0,4': 1, '0,5': 2, '0,6': 3 });
    const zug = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    expect(zug.ok).toBe(true);
    if (!zug.ok) return;
    expect(zug.wert.bericht).toMatchObject({ typ: 'kette', art: 'kraeuter', summe: 6, ring: 0 });
    expect(zug.wert.danach.ertrag.kraeuter).toBe(6);
    expect(zug.wert.danach.schritte).toBe(t.schritte - 1);
    gueltigesBrett(zug.wert.zwischen);
    gueltigesBrett(zug.wert.danach);
  });

  it('rodet Gestrüpp neben der Kette und zählt es fürs Ziel', () => {
    const t = brett(layout);
    const zug = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.bericht).toMatchObject({ gerodet: 1 });
    expect(zug.wert.danach.ziel.stand).toBe(t.ziel.stand + 1);
    expect(zug.wert.danach.gerodetHeute).toBe(1);
    expect(zug.wert.entfernt.map((e) => e.kachel.art).sort()).toEqual(['gestruepp', 'kraeuter', 'kraeuter', 'kraeuter']);
  });

  it('meldet, wenn das Ziel erreicht ist, und zählt nicht darüber hinaus', () => {
    const t = { ...brett(layout), ziel: { stand: 60, gesamt: 60 } };
    const fast = { ...brett(layout), ziel: { stand: 59, gesamt: 60 } };
    const a = ernten(fast, [[0, 4], [0, 5], [0, 6]]);
    const b = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    if (!a.ok || !b.ok) throw new Error('Zug abgelehnt');
    expect(a.wert.bericht).toMatchObject({ zielErreicht: true });
    expect(b.wert.bericht).toMatchObject({ zielErreicht: false });
    expect(b.wert.danach.ziel.stand).toBe(60);
  });

  it('neue Kacheln fallen von oben herein, je entfernter Kachel eine', () => {
    const zug = ernten(brett(layout), [[0, 4], [0, 5], [0, 6]]);
    if (!zug.ok) throw new Error(zug.grund);
    const neu = Object.entries(zug.wert.herkunft);
    expect(neu).toHaveLength(zug.wert.entfernt.length);
    for (const [, zeile] of neu) expect(zeile).toBeLessThan(0);
  });

  it('lehnt zu kurze, ungültige und Ketten nach dem letzten Schritt ab', () => {
    const t = brett(layout);
    expect(ernten(t, [[0, 4], [0, 5]])).toEqual({ ok: false, grund: 'Mindestens 3 gleiche Kacheln' });
    expect(ernten(t, [[0, 4], [0, 6], [0, 5]])).toMatchObject({ ok: false });
    expect(ernten({ ...t, schritte: 0 }, [[0, 4], [0, 5], [0, 6]])).toEqual({ ok: false, grund: 'Keine Schritte mehr' });
  });

  it('ändert den alten Stand nicht und würfelt bei Wiederholung gleich (Rückgängig)', () => {
    const t = brett(layout);
    const kopie = structuredClone(t);
    const a = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    const b = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    expect(t).toEqual(kopie);
    expect(a).toEqual(b);
  });

  it('lädt passende Siedler auf', () => {
    const t = brett(mit(layout, { '6,0': 'h', '6,1': 'h', '6,2': 'h' }));
    const zug = ernten(t, [[6, 0], [6, 1], [6, 2]]);
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.danach.ladung.ida).toBe(3);
    expect(zug.wert.danach.ladung.mara).toBe(0);
  });
});

describe('Ring schließen', () => {
  const ringLayout = (mitte: string) =>
    mit(ohneKetten(), Object.fromEntries([...RING.map(([s, z]) => [`${s},${z}`, 'k']), ['3,3', mitte]]));

  it('fängt einen eingeschlossenen Hasen', () => {
    const zug = ernten(brett(ringLayout('x')), RING);
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.bericht).toMatchObject({ hasen: 1, ring: 0, summe: 6 });
    expect(zug.wert.danach.ertrag.hase).toBe(1);
  });

  it('erntet eingeschlossene Rohstoffe doppelt', () => {
    const t = brett(ringLayout('n'), { '3,3': 3 });
    expect(vorschau(t, RING)?.ring).toEqual({ ertrag: 6, hasen: 0, gestruepp: 0 });
    const zug = ernten(t, RING);
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.bericht).toMatchObject({ ring: 6 });
    expect(zug.wert.danach.ertrag.nuesse).toBe(6);
  });

  it('rodet eingeschlossenes Gestrüpp', () => {
    const zug = ernten(brett(ringLayout('g')), RING);
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.bericht).toMatchObject({ gerodet: 1 });
  });
});

describe('Nach dem Schritt', () => {
  it('ein Hase hüpft auf einen Nachbarn und frisst dort die Reife', () => {
    const layout = mit(ohneKetten(), { '0,4': 'k', '0,5': 'k', '0,6': 'k', '4,3': 'x' });
    const t = brett(layout, Object.fromEntries(nachbarn([4, 3]).map(([s, z]) => [`${s},${z}`, 3])));
    const zug = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    if (!zug.ok) throw new Error(zug.grund);
    const { zwischen, danach } = zug.wert;
    expect(kachel(zwischen, [4, 3]).art).toBe('hase');
    if (zug.wert.bericht.gemischt) return; // Brett wurde gemischt – Positionen nicht vergleichbar
    const neu = nachbarn([4, 3]).find((n) => kachel(danach, n).art === 'hase');
    expect(neu).toBeDefined();
    const beute = kachel(danach, [4, 3]);
    expect(istRohstoff(beute.art)).toBe(true);
    expect(beute.reife).toBeLessThanOrEqual(2); // auf 1 gefressen, höchstens einmal nachgereift
  });

  it('drei Kacheln reifen nach', () => {
    const t = brett(mit(ohneKetten(), { '0,4': 'k', '0,5': 'k', '0,6': 'k' }));
    const zug = ernten(t, [[0, 4], [0, 5], [0, 6]]);
    if (!zug.ok) throw new Error(zug.grund);
    expect(reifeSumme(zug.wert.danach) - reifeSumme(zug.wert.zwischen)).toBe(3);
  });

  it('mischt, wenn keine Kette mehr möglich ist', () => {
    expect(hatZug(brett(ohneKetten()))).toBe(false);
    for (let seed = 1; seed <= 30; seed++) {
      const zug = ernten(brett(mit(ohneKetten(), { '0,4': 'k', '0,5': 'k', '0,6': 'k' }), {}, seed), [[0, 4], [0, 5], [0, 6]]);
      if (!zug.ok) throw new Error(zug.grund);
      expect(hatZug(zug.wert.danach)).toBe(true);
    }
  });
});

describe('Fähigkeiten', () => {
  const layout = mit(ohneKetten(), { '3,3': 'x' });

  it('brauchen volle Ladung und kosten keinen Schritt', () => {
    const t = brett(layout);
    const a = faehigkeit(t, 'jonas');
    expect(a).toEqual({ ok: false, grund: `Jonas lädt durch Beeren – noch ${SIEDLER.jonas.voll}` });
    const zug = faehigkeit({ ...t, ladung: { ...t.ladung, jonas: SIEDLER.jonas.voll } }, 'jonas');
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.danach.schritte).toBe(t.schritte);
    expect(zug.wert.danach.ladung.jonas).toBe(0);
  });

  it('Reifen: Beeren und Nüsse +1, höchstens 3', () => {
    const t = brett(layout, { '1,1': 3 });
    const zug = faehigkeit({ ...t, ladung: { ...t.ladung, jonas: 99 } }, 'jonas');
    if (!zug.ok) throw new Error(zug.grund);
    for (const k of zug.wert.danach.gitter.flat()) {
      const vorher = t.gitter.flat().find((v) => v.id === k.id)!;
      if (k.art === 'beeren' || k.art === 'nuesse') expect(k.reife).toBe(Math.min(3, vorher.reife + 1));
      else expect(k.reife).toBe(vorher.reife);
    }
  });

  it('Fällen: erntet alles Holz ab Reife 2, sonst abgelehnt', () => {
    const t = { ...brett(layout), ladung: { ida: 15, jonas: 0, mara: 0 } };
    expect(faehigkeit(t, 'ida')).toEqual({ ok: false, grund: 'Kein Holz ab Reife 2' });
    const holz = t.gitter.flat().filter((k) => k.art === 'holz').slice(0, 3);
    holz.forEach((k) => (k.reife = 2));
    const zug = faehigkeit(t, 'ida');
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.danach.ertrag.holz).toBe(6);
    expect(zug.wert.entfernt).toHaveLength(3);
    gueltigesBrett(zug.wert.danach);
  });

  it('Falle: fängt alle Hasen, ohne Hasen abgelehnt', () => {
    const t = { ...brett(layout), ladung: { ida: 0, jonas: 0, mara: 12 } };
    const zug = faehigkeit(t, 'mara');
    if (!zug.ok) throw new Error(zug.grund);
    expect(zug.wert.danach.ertrag.hase).toBe(1);
    const hase = kachel(t, [3, 3]);
    expect(ARTEN[hase.art].typ).toBe('tier');
    expect(zug.wert.danach.gitter.flat().some((k) => k.id === hase.id)).toBe(false);
    const ohne = { ...brett(ohneKetten()), ladung: { ida: 0, jonas: 0, mara: 12 } };
    expect(faehigkeit(ohne, 'mara')).toEqual({ ok: false, grund: 'Kein Hase auf dem Brett' });
  });
});
