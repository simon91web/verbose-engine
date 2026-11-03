import { describe, expect, it } from 'vitest';
import {
  BAUARTEN, DORFSTUFEN, MINUTE, SEKUNDE, SPIELDATEN, STUNDE, ZEIT, abbrechen, bauen, baustellenlage, bedarf, dorfAusbauen,
  ertragJeStunde, findeBaustelle, findeGebaeude, frei, gaenge, kannAusbauen, nachrechnen, neueSiedlung, traegerSchalten,
  versorgt, vorgemerkt, vormerkungen, vorziehen, type Gruendung,
} from '../src';
import { MIT_WERKSTATT, bis, hinwege, ok } from './siedlungshilfen';

const TAG = ZEIT.tag;
const SATT = { fisch: 60, beeren: 60 };
const HOLZ_UND_SAEGE: Gruendung['gebaeude'] = [
  { art: 'holzfaeller', flur: 'wald', weg: 2 },
  { art: 'saegebock', flur: 'wald', weg: 2, anbauAn: 1 },
];
/** Erzeugt alles, was Weiler und Dorf brauchen. */
const VERSORGER: Gruendung['gebaeude'] = [
  { art: 'fischer', flur: 'ufer', weg: 4 },
  { art: 'sammler', flur: 'wiese', weg: 4 },
  { art: 'holzfaeller', flur: 'wald', weg: 4 },
];

describe('Spieldaten', () => {
  it('enthalten die Platzhalter aus dem Issue', () => {
    expect(BAUARTEN.holzfaeller.jeStunde).toBe(20);
    expect(BAUARTEN.saegebock).toMatchObject({ anbauAn: 'holzfaeller', erzeugt: 'bretter', zutaten: { holz: 2 } });
    expect(DORFSTUFEN.map((s) => s.name)).toEqual(['Weiler', 'Dorf', 'Marktflecken']);
    expect(DORFSTUFEN[0].wuensche).toEqual({ fisch: 15, beeren: 15 });
    expect(DORFSTUFEN[1].kosten).toEqual({ holz: 20, bretter: 30 });
    expect(SPIELDATEN.lager.fach).toBe(60);
    expect(SPIELDATEN.traeger).toMatchObject({ anzahl: 1, korb: 5 });
  });

  it('passen zusammen', () => {
    for (const art of Object.values(SPIELDATEN.bauarten)) {
      expect(art.jeStunde).toBeGreaterThan(0);
      expect(art.fach).toBeGreaterThan(0);
      if (art.anbauAn) expect(Object.keys(art.zutaten ?? {})).toEqual([SPIELDATEN.bauarten[art.anbauAn].erzeugt]);
      for (const n of Object.values(art.zutaten ?? {})) expect(n).toBeLessThanOrEqual(art.eingang ?? 0);
    }
    const stufen = SPIELDATEN.dorf.stufen;
    expect(stufen[0].kosten).toEqual({});
    for (let i = 1; i < stufen.length; i++) expect(stufen[i].plaetze).toBeGreaterThan(stufen[i - 1].plaetze);
    expect(SPIELDATEN.dorf.startBewohner).toBe(stufen[0].plaetze);
  });

  it('der Bedarf ist die Summe der Wünsche bis zur Stufe', () => {
    expect(bedarf(0, SPIELDATEN)).toEqual({ fisch: 15, beeren: 15 });
    expect(bedarf(1, SPIELDATEN)).toEqual({ holz: 10, fisch: 15, beeren: 15 });
    expect(bedarf(2, SPIELDATEN)).toEqual({ holz: 10, bretter: 6, fisch: 15, beeren: 15 });
  });
});

describe('Produktion', () => {
  it.each([['lichtung', 20], ['wald', 30], ['ufer', 22]] as const)('Holzfäller auf %s: %i Holz je Stunde', (flur, n) => {
    const s = neueSiedlung({ seed: 1, traeger: 'sofort', lager: {}, gebaeude: [{ art: 'holzfaeller', flur, weg: 3 }] });
    const { stand, zusammenfassung } = nachrechnen(s, STUNDE);
    expect(zusammenfassung.erzeugt.holz).toBe(n);
    expect(stand.lager.bestand.holz).toBe(n);
    expect(ertragJeStunde(stand.gebaeude[0], SPIELDATEN)).toBeCloseTo(n);
  });

  it('der Fischer geht nur am Ufer', () => {
    const s = neueSiedlung({ seed: 1 });
    expect(bauen(s, { art: 'fischer', flur: 'wiese', weg: 3 })).toEqual({ ok: false, grund: 'Fischer geht nur auf: Ufer' });
    expect(bauen(s, { art: 'fischer', flur: 'ufer', weg: 3 }).ok).toBe(true);
    expect(bauen(s, { art: 'muehle', flur: 'ufer', weg: 3 }).ok).toBe(false);
  });
});

describe('Lager und Fächer', () => {
  const vollesLager = (): ReturnType<typeof neueSiedlung> =>
    neueSiedlung({ seed: 1, lager: { holz: 60 }, gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 3 }] });

  it('ist das Lager voll, füllt sich das Fach und das Gebäude ruht – nichts geht verloren', () => {
    const { stand, zusammenfassung } = nachrechnen(vollesLager(), STUNDE);
    const g = stand.gebaeude[0];
    expect(g).toMatchObject({ fach: 10, zustand: 'ruht', seit: 20 * MINUTE });
    expect(stand.lager.bestand.holz).toBe(60);
    expect(gaenge(stand)).toEqual([]);
    expect(zusammenfassung.erzeugt.holz).toBe(10);
    expect(zusammenfassung.voll).toEqual([{ ware: 'holz', seit: 0 }]);
    expect(zusammenfassung.stillstand).toEqual([{ id: g.id, art: 'holzfaeller', zustand: 'ruht', seit: 20 * MINUTE }]);
  });

  it('wird Platz frei, holt der Träger das Fach ab und das Gebäude arbeitet weiter', () => {
    const s = bis(vollesLager(), STUNDE);
    const { stand } = ok(bauen(s, { art: 'holzfaeller', flur: 'lichtung', weg: 2 })); // braucht 10 Holz aus dem Lager
    const { hin, stand: spaeter } = hinwege(stand, STUNDE + 5 * MINUTE);
    expect(hin.map((g) => [g.nach, g.ware, g.menge])).toEqual([[2, 'holz', 5], [2, 'holz', 5], [1, null, 0], [1, null, 0]]);
    expect(findeGebaeude(spaeter, 1)!.zustand).toBe('arbeitet');
  });

  it('der Sägebock bekommt sein Holz ohne Träger direkt vom Holzfäller', () => {
    const s = neueSiedlung({ seed: 1, traegerAnzahl: 0, lager: SATT, gebaeude: HOLZ_UND_SAEGE });
    const { stand, zusammenfassung } = nachrechnen(s, 2 * STUNDE);
    expect(stand.traeger).toEqual([]);
    // Bis beide Fächer und das Zutatenfach voll sind: 10 Bretter aus 20 Holz, dazu 10 + 10 Holz in den Fächern.
    expect(zusammenfassung.erzeugt).toMatchObject({ holz: 40, bretter: 10 });
    expect(zusammenfassung.verarbeitet.holz).toBe(20);
    expect(stand.gebaeude.map((g) => [g.art, g.fach, g.eingang, g.zustand])).toEqual([
      ['holzfaeller', 10, {}, 'ruht'],
      ['saegebock', 10, { holz: 10 }, 'ruht'],
    ]);
  });

  it('ein Anbau braucht einen fertigen Hauptbau; jedes Gebäude hat zwei Anbauplätze', () => {
    const s = neueSiedlung({ seed: 1, lager: { holz: 60 }, gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 6 }] });
    expect(bauen(s, { art: 'saegebock', flur: 'wald', weg: 6 }).ok).toBe(false);
    expect(bauen(s, { art: 'fischer', flur: 'ufer', weg: 6, anbauAn: 1 })).toEqual({ ok: false, grund: 'Fischer ist kein Anbau' });
    const erster = ok(bauen(s, { art: 'saegebock', flur: 'lichtung', weg: 99, anbauAn: 1 }));
    expect(findeBaustelle(erster.stand, erster.id)).toMatchObject({ flur: 'wald', weg: 6, anbauAn: 1 });
    const zweiter = ok(bauen(erster.stand, { art: 'saegebock', flur: 'wald', weg: 6, anbauAn: 1 }));
    expect(bauen(zweiter.stand, { art: 'saegebock', flur: 'wald', weg: 6, anbauAn: 1 }))
      .toEqual({ ok: false, grund: 'Alle 2 Anbauplätze am Holzfäller sind belegt' });
  });

  it('eine Werkstatt wartet auf Zutaten; der Träger bringt sie aus dem Lager', () => {
    const s = neueSiedlung(
      { seed: 1, lager: SATT, gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 2 }, { art: 'saegewerk', flur: 'lichtung', weg: 4 }] },
      MIT_WERKSTATT,
    );
    expect(bis(s, 5 * MINUTE, MIT_WERKSTATT).gebaeude[1]).toMatchObject({ zustand: 'wartet', seit: 0 });
    const { hin, stand } = hinwege(s, 20 * MINUTE, MIT_WERKSTATT);
    expect(hin.slice(0, 2).map((g) => [g.nach, g.ware, g.menge])).toEqual([[1, null, 0], [2, 'holz', 5]]);
    expect(stand.gebaeude[1].zustand).toBe('arbeitet');
    expect(nachrechnen(s, 20 * MINUTE, MIT_WERKSTATT).zusammenfassung.erzeugt.bretter).toBeGreaterThan(0);
  });
});

describe('Dorf', () => {
  it('fehlt eine Ware, hält nur das Wachstum an – niemand hungert, niemand zieht aus', () => {
    const s = neueSiedlung({ seed: 1, lager: { fisch: 2, beeren: 30 } });
    const { stand, zusammenfassung } = nachrechnen(s, STUNDE);
    expect(zusammenfassung.verbraucht).toMatchObject({ fisch: 2, beeren: 15 });
    expect(zusammenfassung.mangel).toEqual([{ ware: 'fisch', seit: 12 * MINUTE }]);
    expect(stand.dorf.bewohner).toBe(4);
    expect(versorgt(stand)).toBe(false);
    expect(kannAusbauen(stand)).toEqual({ ok: false, grund: 'Erst wenn der Bedarf gedeckt ist' });
    expect(bis(stand, 7 * 24 * STUNDE).dorf.bewohner).toBe(4);
  });

  it('kommt die Ware wieder, wird gleich gegessen und der Mangel endet', () => {
    let s = neueSiedlung({ seed: 1, traeger: 'sofort', lager: { beeren: 30, holz: 8, bretter: 6 } });
    s = bis(s, 10 * MINUTE);
    expect(s.dorf.verbrauch.fisch?.mangelSeit).toBe(4 * MINUTE);
    s = ok(bauen(s, { art: 'fischer', flur: 'ufer', weg: 5 })).stand;
    const { stand, zusammenfassung } = nachrechnen(s, 15 * MINUTE);
    const erster = 11 * MINUTE + STUNDE / 32; // fertig nach 1 min Restarbeit, dann 32 Fisch je Stunde
    expect(zusammenfassung.fertig).toEqual([{ id: 1, art: 'fischer', zeit: 11 * MINUTE }]);
    expect(zusammenfassung.verbraucht.fisch).toBe(1);
    expect(stand.dorf.verbrauch.fisch).toEqual({ mangelSeit: null, naechste: erster + 4 * MINUTE });
    expect(versorgt(stand)).toBe(true);
  });

  it('Zuzug alle 2–3 Spieltage, solange Platz frei und der Bedarf gedeckt ist', () => {
    let s = neueSiedlung({ seed: 5, traeger: 'sofort', dorf: { stufe: 1, bewohner: 4 }, lager: { holz: 30, fisch: 30, beeren: 30 }, gebaeude: VERSORGER });
    expect(bis(s, 2 * TAG - 1).dorf.bewohner).toBe(4);
    let letzter = 0;
    for (let bewohner = 5; bewohner <= 8; bewohner++) {
      const um = s.dorf.zuzugUm!;
      expect(um - letzter).toBeGreaterThanOrEqual(2 * TAG);
      expect(um - letzter).toBeLessThanOrEqual(3 * TAG);
      expect(bis(s, um - 1).dorf.bewohner).toBe(bewohner - 1);
      s = bis(s, um);
      expect(s.dorf.bewohner).toBe(bewohner);
      letzter = um;
    }
    expect(s.dorf.zuzugUm).toBeNull();
    expect(bis(s, 40 * TAG).dorf.bewohner).toBe(8);
  });

  it('der Zuzug folgt dem Startwert', () => {
    const zuzug = (seed: number): number | null => neueSiedlung({ seed, dorf: { stufe: 1, bewohner: 4 } }).dorf.zuzugUm;
    expect(zuzug(5)).toBe(zuzug(5));
    expect(new Set([1, 2, 3, 4, 5].map(zuzug)).size).toBeGreaterThan(1);
  });

  it('bei Mangel hält der Zuzug an und läuft danach mit der Restzeit weiter', () => {
    let s = neueSiedlung({ seed: 5, traegerAnzahl: 0, dorf: { stufe: 1, bewohner: 4 }, lager: {}, gebaeude: VERSORGER });
    const geplant = s.dorf.zuzugUm!;
    s = bis(s, 10 * TAG);
    expect(s.dorf).toMatchObject({ bewohner: 4, zuzugUm: null, zuzugRest: geplant - 4 * MINUTE });
    s = traegerSchalten(s, 'sofort'); // die vollen Fächer landen im Lager
    expect(versorgt(s)).toBe(true);
    expect(s.dorf.zuzugUm).toBe(10 * TAG + geplant - 4 * MINUTE);
    expect(bis(s, s.dorf.zuzugUm!).dorf.bewohner).toBe(5);
  });
});

describe('Ausbau des Dorfs', () => {
  const weiler = (o: Partial<Gruendung> = {}): ReturnType<typeof neueSiedlung> =>
    neueSiedlung({ seed: 1, traeger: 'sofort', lager: { holz: 20, bretter: 30, fisch: 30, beeren: 30 }, gebaeude: VERSORGER, ...o });

  it('geht nur, wenn das Dorf voll und versorgt ist', () => {
    expect(kannAusbauen(weiler())).toMatchObject({ ok: true, wert: { name: 'Dorf' } });
    expect(kannAusbauen(weiler({ dorf: { bewohner: 3 } }))).toEqual({ ok: false, grund: 'Erst wenn alle Plätze belegt sind (3 von 4)' });
    expect(kannAusbauen(bis(neueSiedlung({ seed: 1, lager: {} }), STUNDE))).toEqual({ ok: false, grund: 'Erst wenn der Bedarf gedeckt ist' });
    expect(kannAusbauen(neueSiedlung({ seed: 1, dorf: { stufe: 2, bewohner: 14 } }))).toEqual({ ok: false, grund: 'Marktflecken ist die höchste Stufe' });
  });

  it('ist eine Baustelle; danach gibt es mehr Plätze, neuen Bedarf und Zuzug', () => {
    const { stand, id } = ok(dorfAusbauen(weiler(), { weg: 2 }));
    expect(findeBaustelle(stand, id)).toMatchObject({ art: 'dorf', kosten: { holz: 20, bretter: 30 } });
    expect(stand.dorf.ausbau).toBe(id);
    expect(dorfAusbauen(stand, { weg: 2 })).toEqual({ ok: false, grund: 'Der Ausbau läuft schon' });

    const { stand: danach, zusammenfassung } = nachrechnen(stand, 10 * MINUTE);
    expect(zusammenfassung.fertig).toEqual([{ id, art: 'dorf', zeit: 4 * MINUTE }]);
    expect(zusammenfassung.aufstieg).toBe(1);
    expect(zusammenfassung.verbaut).toMatchObject({ holz: 20, bretter: 30 });
    expect(danach.dorf).toMatchObject({ stufe: 1, bewohner: 4, ausbau: null });
    expect(danach.dorf.verbrauch.holz).toBeDefined();
    expect(danach.dorf.zuzugUm).not.toBeNull();
  });

  it('lässt sich abbrechen und neu abstecken', () => {
    const { stand, id } = ok(dorfAusbauen(weiler(), { weg: 2 }));
    const ab = ok(abbrechen(stand, id));
    expect(ab.dorf.ausbau).toBeNull();
    expect(ab.lager.bestand).toMatchObject({ holz: 20, bretter: 30 });
    expect(dorfAusbauen(ab, { weg: 2 }).ok).toBe(true);
  });
});

describe('Baustellen', () => {
  const lager = { holz: 20, bretter: 10, ...SATT };

  it('Material wird beim Platzieren vorgemerkt und anderswo nicht verbraucht', () => {
    const s = neueSiedlung({ seed: 1, traegerAnzahl: 0, dorf: { stufe: 1, bewohner: 8 }, lager: { holz: 8, bretter: 6, ...SATT } });
    const { stand, id } = ok(bauen(s, { art: 'fischer', flur: 'ufer', weg: 5 }));
    expect(vorgemerkt(stand)).toMatchObject({ holz: 8, bretter: 6 });
    expect(frei(stand, 'holz')).toBe(0);
    expect(baustellenlage(stand, findeBaustelle(stand, id)!)).toMatchObject({ vorgemerkt: { holz: 8, bretter: 6 }, fehlt: {}, stufe: 0 });
    const { stand: spaeter, zusammenfassung } = nachrechnen(stand, STUNDE);
    expect(spaeter.lager.bestand.holz).toBe(8);
    expect(zusammenfassung.verbraucht.holz).toBe(0);
    expect(zusammenfassung.mangel).toEqual([{ ware: 'holz', seit: 6 * MINUTE }]);
  });

  it('platzieren geht auch ohne genug Material – die Baustelle wartet', () => {
    const s = neueSiedlung({ seed: 1, lager: { holz: 3, ...SATT }, gebaeude: HOLZ_UND_SAEGE });
    const { stand, id } = ok(bauen(s, { art: 'sammler', flur: 'lichtung', weg: 3 }));
    expect(baustellenlage(stand, findeBaustelle(stand, id)!)).toMatchObject({ unterwegs: { holz: 3 }, fehlt: { holz: 3, bretter: 2 }, restarbeit: false });
    const spaeter = bis(stand, 2 * STUNDE);
    expect(findeBaustelle(spaeter, id)).toBeUndefined();
    expect(findeGebaeude(spaeter, id)).toMatchObject({ art: 'sammler', flur: 'lichtung', weg: 3 });
  });

  it('der Träger liefert in Körben zu 5; jeder Gang ist ein Datensatz', () => {
    const { stand, id } = ok(bauen(neueSiedlung({ seed: 1, lager }), { art: 'fischer', flur: 'ufer', weg: 8 }));
    const dauer = 8 * SPIELDATEN.traeger.jeWabe;
    expect(gaenge(stand)).toEqual([{ traeger: 1, ware: 'holz', menge: 5, von: 'lager', nach: id, abgang: 0, ankunft: dauer }]);
    const lieferungen = hinwege(stand, 30 * MINUTE).hin.filter((g) => g.ware !== null);
    expect(lieferungen.map((g) => [g.ware, g.menge, g.abgang])).toEqual([
      ['holz', 5, 0], ['holz', 3, 2 * dauer], ['bretter', 5, 4 * dauer], ['bretter', 1, 6 * dauer],
    ]);
    expect(lieferungen.every((g) => g.nach === id && g.ankunft - g.abgang === dauer)).toBe(true);
  });

  it('die Baustelle wächst in vier Stufen nach geliefertem Anteil, dann kommt die Restarbeit', () => {
    const { stand, id } = ok(bauen(neueSiedlung({ seed: 1, lager }), { art: 'fischer', flur: 'ufer', weg: 8 }));
    const lage = (sek: number) => baustellenlage(bis(stand, sek * SEKUNDE), findeBaustelle(bis(stand, sek * SEKUNDE), id)!);
    // Ankünfte nach 40, 120, 200 und 280 s: 5, 8, 13 und 14 von 14 Stück
    expect([0, 40, 120, 200].map((t) => lage(t).stufenname)).toEqual(['Pflöcke', 'Fundament', 'Gerüst', 'Dach']);
    expect(lage(279)).toMatchObject({ stufe: 3, restarbeit: false });
    expect(lage(280)).toMatchObject({ stufe: 3, anteil: 1, restarbeit: true });
    expect(findeBaustelle(bis(stand, 340 * SEKUNDE - 1), id)).toBeDefined();
    expect(findeGebaeude(bis(stand, 340 * SEKUNDE), id)).toMatchObject({ art: 'fischer', flur: 'ufer', weg: 8 });
  });

  it('Abbrechen gibt alles Gelieferte zurück – auch den Korb, der gerade unterwegs ist', () => {
    const { stand, id } = ok(bauen(neueSiedlung({ seed: 1, lager }), { art: 'fischer', flur: 'ufer', weg: 8 }));
    const unterwegs = bis(stand, 170 * SEKUNDE);
    expect(findeBaustelle(unterwegs, id)!.geliefert).toEqual({ holz: 8 });
    expect(gaenge(unterwegs)).toMatchObject([{ ware: 'bretter', menge: 5, nach: id }]);

    const ab = ok(abbrechen(unterwegs, id));
    expect(vorgemerkt(ab)).toMatchObject({ holz: 0, bretter: 0 });
    expect(frei(ab, 'bretter')).toBe(5);
    expect(abbrechen(ab, id).ok).toBe(false);
    expect(gaenge(bis(ab, 201 * SEKUNDE))).toMatchObject([{ ware: 'bretter', menge: 5, von: id, nach: 'lager' }]);

    const spaeter = bis(ab, 10 * MINUTE);
    expect(spaeter.lager.bestand).toMatchObject({ holz: 20, bretter: 10 });
    expect(spaeter.baustellen).toEqual([]);
    expect(spaeter.gebaeude).toEqual([]);
  });

  it('mit „sofort“ ist das Gelieferte beim Abbrechen gleich wieder im Lager', () => {
    const { stand, id } = ok(bauen(neueSiedlung({ seed: 1, traeger: 'sofort', lager }), { art: 'fischer', flur: 'ufer', weg: 8 }));
    expect(findeBaustelle(stand, id)!.geliefert).toEqual({ holz: 8, bretter: 6 });
    const ab = ok(abbrechen(stand, id));
    expect(ab.lager.bestand).toMatchObject({ holz: 20, bretter: 10 });
    expect(ab.baustellen).toEqual([]);
  });

  it('eine Baustelle lässt sich vorziehen – sie bekommt Material und Träger zuerst', () => {
    const a = ok(bauen(neueSiedlung({ seed: 1, lager: { holz: 10, ...SATT } }), { art: 'fischer', flur: 'ufer', weg: 8 }));
    const b = ok(bauen(a.stand, { art: 'sammler', flur: 'lichtung', weg: 3 }));
    // 5 Holz sind schon unterwegs zum Fischer; vom Rest bekommt er zuerst, was er braucht.
    expect(vormerkungen(b.stand).get(a.id)).toEqual({ holz: 3 });
    expect(vormerkungen(b.stand).get(b.id)).toEqual({ holz: 2 });

    const v = ok(vorziehen(b.stand, b.id));
    expect(vormerkungen(v).get(b.id)).toEqual({ holz: 5 });
    expect(vormerkungen(v).get(a.id)).toEqual({});
    const { hin } = hinwege(v, 3 * MINUTE);
    expect(hin.map((g) => [g.nach, g.menge])).toEqual([[a.id, 5], [b.id, 5]]);
    expect(vorziehen(v, 99).ok).toBe(false);
    expect(ok(vorziehen(v, null)).vorrang).toBeNull();
  });
});

describe('Träger', () => {
  it('feste Reihenfolge: Baustellen → Zutaten für Werkstätten → volle Fächer', () => {
    const s = neueSiedlung(
      { seed: 1, lager: SATT, gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 2 }, { art: 'saegewerk', flur: 'lichtung', weg: 4 }] },
      MIT_WERKSTATT,
    );
    // Alles zugleich fällig machen: Holz im Lager, ein halbvolles Fach am Holzfäller.
    const fertig = structuredClone(s);
    fertig.lager.bestand.holz = 10;
    fertig.gebaeude[0].fach = 5;
    const { stand, id } = ok(bauen(fertig, { art: 'huette', flur: 'lichtung', weg: 3 }, MIT_WERKSTATT));
    const { hin } = hinwege(stand, 2 * MINUTE, MIT_WERKSTATT);
    expect(hin.slice(0, 3).map((g) => [g.nach, g.ware])).toEqual([[id, 'holz'], [2, 'holz'], [1, null]]);
  });

  it('mehrere Träger teilen sich die Arbeit', () => {
    const s = neueSiedlung({ seed: 1, traegerAnzahl: 3, lager: { holz: 20, bretter: 10, ...SATT } });
    const { stand } = ok(bauen(s, { art: 'fischer', flur: 'ufer', weg: 8 }));
    expect(stand.traeger.map((t) => t.name)).toEqual(['Ole', 'Wina', 'Bo']);
    expect(gaenge(stand).map((g) => [g.traeger, g.ware, g.menge])).toEqual([[1, 'holz', 5], [2, 'holz', 3], [3, 'bretter', 5]]);
  });

  it('„sofort“: Ware landet gleich im Lager, Baustellen haben ihr Material sofort, niemand geht', () => {
    const s = neueSiedlung({ seed: 1, traeger: 'sofort', lager: { holz: 20, bretter: 10, ...SATT }, gebaeude: [{ art: 'holzfaeller', flur: 'wald', weg: 6 }] });
    const { stand, id } = ok(bauen(s, { art: 'fischer', flur: 'ufer', weg: 8 }));
    expect(findeBaustelle(stand, id)).toMatchObject({ geliefert: { holz: 8, bretter: 6 }, fertigUm: MINUTE });
    expect(stand.lager.bestand).toMatchObject({ holz: 12, bretter: 4 });
    const { stand: spaeter, zusammenfassung } = nachrechnen(stand, STUNDE);
    expect(zusammenfassung.gaenge).toBe(0);
    expect(gaenge(spaeter)).toEqual([]);
    expect(spaeter.lager.bestand.holz).toBe(12 + 30);
    expect(findeGebaeude(spaeter, 1)!.fach).toBe(0);
  });

  it('Umschalten: der laufende Gang endet normal, danach trägt niemand mehr', () => {
    const { stand, id } = ok(bauen(neueSiedlung({ seed: 1, lager: { holz: 20, bretter: 10, ...SATT } }), { art: 'fischer', flur: 'ufer', weg: 8 }));
    const um = traegerSchalten(stand, 'sofort');
    expect(findeBaustelle(um, id)!.geliefert).toEqual({ holz: 3, bretter: 6 });
    expect(gaenge(um)).toMatchObject([{ ware: 'holz', menge: 5 }]);
    const { stand: spaeter, zusammenfassung } = nachrechnen(um, 5 * MINUTE);
    expect(zusammenfassung.fertig).toEqual([{ id, art: 'fischer', zeit: 8 * SPIELDATEN.traeger.jeWabe + MINUTE }]);
    expect(zusammenfassung.gaenge).toBe(1);
    expect(gaenge(spaeter)).toEqual([]);
  });
});
