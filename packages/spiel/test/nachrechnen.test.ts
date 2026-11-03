import { describe, expect, it } from 'vitest';
import {
  MINUTE, SEKUNDE, STUNDE, bauen, dorfAusbauen, nachrechnen, neueSiedlung, type Siedlung, type Traegermodus,
} from '../src';
import { ok, pruefeBilanz, pruefeOrdnung } from './siedlungshilfen';

const WOCHE = 7 * 24 * STUNDE;

/** Eine Siedlung mit allem, was das MVP kennt: Kette mit Anbau, zwei Baustellen und der Ausbau zum Dorf. */
function belebt(traeger: Traegermodus, traegerAnzahl = 1): Siedlung {
  let s = neueSiedlung({
    seed: 11, traeger, traegerAnzahl,
    gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 6 }, { art: 'saegebock', flur: 'wald', weg: 6, anbauAn: 1 }],
  });
  s = ok(bauen(s, { art: 'fischer', flur: 'ufer', weg: 8 })).stand;
  s = ok(bauen(s, { art: 'sammler', flur: 'wiese', weg: 7 })).stand;
  return ok(dorfAusbauen(s, { weg: 2 })).stand;
}

describe('nachrechnen', () => {
  it.each(['echt', 'sofort'] as const)('gleicher Stand und gleiche Zeit ergeben immer dasselbe (%s)', (modus) => {
    const s = belebt(modus);
    const a = nachrechnen(s, 3 * 24 * STUNDE);
    expect(nachrechnen(s, 3 * 24 * STUNDE)).toEqual(a);
    expect(nachrechnen(JSON.parse(JSON.stringify(s)), 3 * 24 * STUNDE)).toEqual(a);
    expect(JSON.parse(JSON.stringify(a.stand))).toEqual(a.stand);
  });

  it.each(['echt', 'sofort'] as const)('Zwischenstopps ändern nichts (%s)', (modus) => {
    const s = belebt(modus);
    const ende = 3 * 24 * STUNDE;
    const direkt = nachrechnen(s, ende);
    let schritt = s;
    let erzeugt = 0;
    for (let t = 0; t < ende; ) {
      t = Math.min(ende, t + 7 * MINUTE + 13 * SEKUNDE + (t % 997)); // ungleichmäßige Stopps
      const r = nachrechnen(schritt, t);
      schritt = r.stand;
      erzeugt += r.zusammenfassung.erzeugt.holz;
    }
    expect(schritt).toEqual(direkt.stand);
    expect(erzeugt).toBe(direkt.zusammenfassung.erzeugt.holz);
  });

  it.each([['echt', 1], ['echt', 3], ['sofort', 1]] as const)('nichts geht verloren (%s, %i Träger)', (modus, anzahl) => {
    let s = belebt(modus, anzahl);
    for (let t = STUNDE; t <= WOCHE; t += STUNDE) {
      const { stand, zusammenfassung } = nachrechnen(s, t);
      pruefeBilanz(s, stand, zusammenfassung);
      pruefeOrdnung(stand);
      s = stand;
    }
    expect(s.dorf.stufe).toBe(1);
    expect(s.gebaeude.map((g) => g.art)).toEqual(['holzfaeller', 'saegebock', 'fischer', 'sammler']);
  });

  it('eine Woche Abwesenheit dauert unter einer Sekunde', () => {
    let s = neueSiedlung({
      seed: 3, traegerAnzahl: 3, lager: { holz: 60, bretter: 60, fisch: 30, beeren: 30 },
      gebaeude: [
        { art: 'holzfaeller', flur: 'wald', weg: 5 },
        { art: 'saegebock', flur: 'wald', weg: 5, anbauAn: 1 },
        { art: 'saegebock', flur: 'wald', weg: 5, anbauAn: 1 },
        { art: 'holzfaeller', flur: 'wald', weg: 9 },
        { art: 'saegebock', flur: 'wald', weg: 9, anbauAn: 4 },
        { art: 'fischer', flur: 'ufer', weg: 8 },
        { art: 'fischer', flur: 'ufer', weg: 11 },
        { art: 'sammler', flur: 'wiese', weg: 7 },
        { art: 'sammler', flur: 'wald', weg: 10 },
        { art: 'sammler', flur: 'lichtung', weg: 3 },
      ],
    });
    s = ok(dorfAusbauen(s, { weg: 2 })).stand;
    const beginn = performance.now();
    const { stand, zusammenfassung } = nachrechnen(s, WOCHE);
    const dauer = performance.now() - beginn;
    expect(dauer).toBeLessThan(1000);
    expect(zusammenfassung.ereignisse).toBeGreaterThan(10_000);
    expect(zusammenfassung.ereignisse).toBeLessThan(100_000);
    expect(stand.zeit).toBe(WOCHE);
    pruefeBilanz(s, stand, zusammenfassung);
  });

  it('steht alles still, springt die Rechnung gleich ans Ende', () => {
    const s = neueSiedlung({ seed: 1, lager: {} });
    const { stand, zusammenfassung } = nachrechnen(s, 365 * 24 * STUNDE);
    expect(zusammenfassung.ereignisse).toBe(2); // die erste Mahlzeit findet keinen Fisch und keine Beeren
    expect(stand.zeit).toBe(365 * 24 * STUNDE);
  });

  it('rückwärts oder auf der Stelle ändert sich nichts', () => {
    const s = nachrechnen(belebt('echt'), STUNDE).stand;
    for (const zeit of [STUNDE, STUNDE - 5 * MINUTE]) {
      const r = nachrechnen(s, zeit);
      expect(r.stand).toEqual(s);
      expect(r.zusammenfassung.ereignisse).toBe(0);
    }
  });

  it('fasst zusammen, was während der Abwesenheit passiert ist', () => {
    // Wie im Mockup: Der Fischer wird fertig, das Holz ist voll, die Beeren gehen aus.
    const s = neueSiedlung({ seed: 1, lager: { holz: 60, bretter: 10, fisch: 30, beeren: 30 }, gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 4 }] });
    const { stand, id } = ok(bauen(s, { art: 'fischer', flur: 'ufer', weg: 6 }));
    const { zusammenfassung: z } = nachrechnen(stand, 3 * STUNDE);
    expect(z).toMatchObject({ von: 0, bis: 3 * STUNDE, aufstieg: null, zuzug: 0 });
    expect(z.fertig).toMatchObject([{ id, art: 'fischer' }]);
    expect(z.verbraucht).toMatchObject({ fisch: 45, beeren: 30 });
    expect(z.erzeugt.fisch).toBeGreaterThan(45);
    expect(z.mangel).toEqual([{ ware: 'beeren', seit: 124 * MINUTE }]);
    expect(z.voll.map((v) => v.ware)).toContain('holz');
    expect(z.stillstand).toContainEqual(expect.objectContaining({ art: 'holzfaeller', zustand: 'ruht' }));
    expect(z.lager.vorher.holz).toBe(55); // 5 Holz hat Ole schon im Korb
    expect(z.lager.nachher.holz).toBe(60);
    expect(z.gaenge).toBeGreaterThan(0);
  });
});
