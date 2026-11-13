import { describe, expect, it } from 'vitest';
import {
  FLECKEN, GEBAEUDE, alleZellen, auftragSetzen, bauZuruecknehmen, bauen, baubareGebaeude, besterProviant,
  einbringen, ernten, faehigkeit, faehigkeitPruefen, freieGerodete, kachel, nacht, nachbarn, nachtVorschau,
  neueSiedlung, schluessel, tagwerkBeginnen, istRohstoff,
  type Aufbruch, type FleckId, type Siedlung, type SiedlerId, type Tagwerk, type Zelle, type Ware,
} from '../src';

const DREI: SiedlerId[] = ['ida', 'jonas', 'mara'];
const mitLager = (s: Siedlung, lager: Partial<Record<Ware, number>>): Siedlung => ({ ...s, lager: { ...s.lager, ...lager } });
const erwarte = <T>(e: { ok: true; wert: T } | { ok: false; grund: string }): T => {
  if (!e.ok) throw new Error(e.grund);
  return e.wert;
};
const auf = (s: Siedlung, fleck: FleckId, zustand: 'gerodet' | 'erkundet'): Siedlung => ({
  ...s, flecken: { ...s.flecken, [fleck]: { ...s.flecken[fleck], zustand, stand: zustand === 'gerodet' ? s.flecken[fleck].ziel : 0 } },
});

describe('Neue Siedlung', () => {
  it('startet mit 6 Beerenbrei, Aufträgen und stehender Zimmerei', () => {
    const s = neueSiedlung(7);
    expect(s.tag).toBe(1);
    expect(s.lager.beerenbrei).toBe(6);
    expect(Object.entries(s.lager).filter(([w, n]) => w !== 'beerenbrei' && n > 0)).toEqual([]);
    expect(s.auftraege.lagerfeuer).toEqual({ rezept: 'beerenbrei', menge: 6 });
    expect(s.auftraege.zimmerei).toEqual({ rezept: 'brett', menge: 4 });
    expect(baubareGebaeude(s)).toEqual(['trockengestell']);
    expect(s.unterwegs).toBeNull();
  });
});

describe('Proviant und Tagwerk beginnen', () => {
  it('Vorauswahl: bester zuerst, nie mehr als vorhanden, sonst leerer Magen', () => {
    const l = neueSiedlung(1).lager;
    expect(besterProviant({ ...l, beerenbrei: 6 }, 3)).toEqual(['beerenbrei', 'beerenbrei', 'beerenbrei']);
    expect(besterProviant({ ...l, beerenbrei: 1, roestnuesse: 1, waldeintopf: 1 }, 3)).toEqual(['waldeintopf', 'roestnuesse', 'beerenbrei']);
    expect(besterProviant({ ...l, beerenbrei: 2, waldeintopf: 1 }, 3)).toEqual(['waldeintopf', 'beerenbrei', 'beerenbrei']);
    expect(besterProviant({ ...l, beerenbrei: 2 }, 3)).toEqual(['beerenbrei', 'beerenbrei']);
    expect(besterProviant({ ...l, beerenbrei: 0 }, 3)).toEqual([null]);
  });

  it('zieht Proviant ab und setzt die Schritte aus dem Proviant zusammen', () => {
    const s = mitLager(neueSiedlung(1), { beerenbrei: 2, roestnuesse: 1, waldeintopf: 1 });
    const auswahl: Aufbruch[] = [
      { siedler: 'ida', proviant: 'waldeintopf' },
      { siedler: 'jonas', proviant: 'roestnuesse' },
      { siedler: 'mara', proviant: 'beerenbrei' },
    ];
    const n = erwarte(tagwerkBeginnen(s, 'nordwald', auswahl));
    expect(n.lager).toMatchObject({ beerenbrei: 1, roestnuesse: 0, waldeintopf: 0 });
    expect(s.lager.beerenbrei).toBe(2);
    expect(n.unterwegs!.fleck).toBe('nordwald');
    const t = n.unterwegs!.tagwerk;
    expect(t.schritte).toBe(7 + 6 + 5);
    expect(t.maxSchritte).toBe(18);
    expect(t.trupp).toEqual(DREI);
    expect(t.ziel).toEqual({ stand: 0, gesamt: 40 });
  });

  it('der Trupp darf nicht größer als der Proviant sein', () => {
    const s = mitLager(neueSiedlung(1), { beerenbrei: 2 });
    const r = tagwerkBeginnen(s, 'nordwald', DREI.map((siedler) => ({ siedler, proviant: 'beerenbrei' as const })));
    expect(r.ok).toBe(false);
    const ok = tagwerkBeginnen(s, 'nordwald', DREI.slice(0, 2).map((siedler) => ({ siedler, proviant: 'beerenbrei' as const })));
    expect(ok.ok).toBe(true);
  });

  it('leerer Magen: nur ohne jeden Proviant, nur ein Siedler, 3 Schritte', () => {
    const leer = mitLager(neueSiedlung(1), { beerenbrei: 0 });
    const n = erwarte(tagwerkBeginnen(leer, 'hain', [{ siedler: 'ida', proviant: null }]));
    expect(n.unterwegs!.tagwerk.schritte).toBe(3);
    expect(n.unterwegs!.tagwerk.trupp).toEqual(['ida']);
    expect(tagwerkBeginnen(leer, 'hain', DREI.map((siedler) => ({ siedler, proviant: null })))).toMatchObject({ ok: false });
    expect(tagwerkBeginnen(neueSiedlung(1), 'hain', [{ siedler: 'ida', proviant: null }])).toMatchObject({ ok: false });
  });

  it('nur ein Tagwerk gleichzeitig', () => {
    const s = erwarte(tagwerkBeginnen(neueSiedlung(1), 'nordwald', [{ siedler: 'ida', proviant: 'beerenbrei' }]));
    expect(tagwerkBeginnen(s, 'hain', [{ siedler: 'jonas', proviant: 'beerenbrei' }])).toEqual({
      ok: false,
      grund: 'Erst das Tagwerk im Nordwald beenden',
    });
  });

  it('geht nur auf erkundete und gerodete Flecken', () => {
    const s = neueSiedlung(1);
    const a: Aufbruch[] = [{ siedler: 'ida', proviant: 'beerenbrei' }];
    for (const id of ['lichtung', 'bachufer', 'dickicht'] as FleckId[]) expect(tagwerkBeginnen(s, id, a).ok).toBe(false);
    expect(tagwerkBeginnen(auf(s, 'dickicht', 'gerodet'), 'dickicht', a).ok).toBe(true);
  });

  it('Bretter unterscheiden sich je Fleck und Tag, sind aber reproduzierbar', () => {
    const a: Aufbruch[] = [{ siedler: 'ida', proviant: 'beerenbrei' }];
    const brett = (s: Siedlung, f: FleckId) => erwarte(tagwerkBeginnen(s, f, a)).unterwegs!.tagwerk.gitter;
    const s = neueSiedlung(5);
    expect(brett(s, 'nordwald')).toEqual(brett(neueSiedlung(5), 'nordwald'));
    expect(brett(s, 'nordwald')).not.toEqual(brett(s, 'hain'));
    expect(brett(s, 'nordwald')).not.toEqual(brett({ ...s, tag: 2 }, 'nordwald'));
  });

  it('trägt die Ladung der Siedler ins Tagwerk', () => {
    const s = { ...neueSiedlung(1), ladung: { ida: 9, jonas: 0, mara: 0 } };
    const n = erwarte(tagwerkBeginnen(s, 'nordwald', [{ siedler: 'ida', proviant: 'beerenbrei' }]));
    expect(n.unterwegs!.tagwerk.ladung.ida).toBe(9);
  });
});

describe('Nacht', () => {
  const lagerfeuer = (s: Siedlung, rezept: 'beerenbrei' | 'roestnuesse' | 'waldeintopf', menge: number) =>
    erwarte(auftragSetzen(s, 'lagerfeuer', rezept, menge));

  it('verarbeitet nach Auftrag und lässt den Auftrag stehen', () => {
    const s = mitLager(neueSiedlung(1), { beeren: 18, holz: 12 });
    const r = nacht(s);
    expect(r.siedlung.lager).toMatchObject({ beeren: 0, beerenbrei: 12, holz: 0, brett: 4 });
    expect(r.arbeit.map((a) => [a.gebaeude, a.gemacht])).toEqual([['lagerfeuer', 6], ['zimmerei', 4]]);
    expect(r.siedlung.auftraege).toEqual(s.auftraege);
    expect(s.lager.beeren).toBe(18);
  });

  it('macht bei knappen Zutaten so viel, wie das Lager hergibt, und meldet, was fehlte', () => {
    const s = mitLager(neueSiedlung(1), { beeren: 7, holz: 5 });
    const r = nacht(s);
    expect(r.siedlung.lager).toMatchObject({ beeren: 1, beerenbrei: 8, holz: 2, brett: 1 });
    expect(r.arbeit[0]).toMatchObject({ gewollt: 6, gemacht: 2, verbraucht: { beeren: 6 }, fehlt: { beeren: 11 } });
    expect(r.arbeit[1]).toMatchObject({ gewollt: 4, gemacht: 1, fehlt: { holz: 7 } });
  });

  it('ohne Zutaten passiert nichts, ohne Fehler', () => {
    const r = nacht(neueSiedlung(1));
    expect(r.siedlung.lager).toEqual(neueSiedlung(1).lager);
    expect(r.arbeit.every((a) => a.gemacht === 0)).toBe(true);
  });

  it('deckelt auf die Tagesleistung', () => {
    const s = mitLager(lagerfeuer(neueSiedlung(1), 'beerenbrei', 6), { beeren: 300 });
    expect(nacht(s).siedlung.lager.beerenbrei).toBe(12);
    expect(auftragSetzen(s, 'lagerfeuer', 'beerenbrei', 7).ok).toBe(false);
  });

  it('arbeitet in der Reihenfolge Lagerfeuer, Zimmerei, Trockengestell', () => {
    let s = mitLager(neueSiedlung(1), { holz: 3, brett: 6, kraeuter: 10, beeren: 3 });
    s = auf(s, 'dickicht', 'gerodet');
    s = erwarte(bauen(s, 'trockengestell', 'dickicht'));
    s = erwarte(auftragSetzen(s, 'trockengestell', 'trockenkraeuter', 4));
    s = mitLager(s, { kraeuter: 8 });
    expect(nacht(s).arbeit.map((a) => a.gebaeude)).toEqual(['lagerfeuer', 'zimmerei', 'trockengestell']);
  });

  it('Röstnüsse vom Lagerfeuer erreichen den Eintopf erst in der nächsten Nacht', () => {
    let s = mitLager(neueSiedlung(1), { nuesse: 6, beeren: 4, trockenkraeuter: 2 });
    s = lagerfeuer(s, 'roestnuesse', 2);
    const eins = nacht(s);
    expect(eins.siedlung.lager).toMatchObject({ roestnuesse: 2, waldeintopf: 0 });
    const zwei = nacht(lagerfeuer(eins.siedlung, 'waldeintopf', 2));
    expect(zwei.siedlung.lager).toMatchObject({ waldeintopf: 2, roestnuesse: 0, beeren: 0, trockenkraeuter: 0 });
  });

  it('Eintopf ohne Röstnüsse oder Trockenkräuter fehlt etwas', () => {
    const s = lagerfeuer(mitLager(neueSiedlung(1), { beeren: 4 }), 'waldeintopf', 2);
    const tat = nacht(s).arbeit[0];
    expect(tat.gemacht).toBe(0);
    expect(tat.fehlt).toEqual({ roestnuesse: 2, trockenkraeuter: 2 });
  });

  it('Vorschau: Verbrauch, Ertrag, möglich oder fehlt', () => {
    const s = mitLager(neueSiedlung(1), { beeren: 18 });
    expect(nachtVorschau(s, 'lagerfeuer')).toMatchObject({ geht: true, moeglich: 6, verbraucht: { beeren: 18 }, ertrag: { ware: 'beerenbrei', menge: 6 }, fehlt: {} });
    expect(nachtVorschau(s, 'zimmerei')).toMatchObject({ geht: false, moeglich: 0, fehlt: { holz: 12 } });
    expect(nachtVorschau(s, 'trockengestell')).toBeNull();
  });
});

describe('Auftrag setzen', () => {
  it('prüft Gebäude, Rezept und Menge', () => {
    const s = neueSiedlung(1);
    expect(auftragSetzen(s, 'lagerfeuer', 'brett', 1).ok).toBe(false);
    expect(auftragSetzen(s, 'trockengestell', 'trockenkraeuter', 1).ok).toBe(false);
    expect(auftragSetzen(s, 'zimmerei', 'brett', -1).ok).toBe(false);
    expect(erwarte(auftragSetzen(s, 'zimmerei', 'brett', 2)).auftraege.zimmerei.menge).toBe(2);
    expect(s.auftraege.zimmerei.menge).toBe(4);
  });
});

describe('Bauen', () => {
  const bereit = (): Siedlung => auf(mitLager(neueSiedlung(1), { brett: 6, kraeuter: 10, holz: 3 }), 'nordwald', 'gerodet');

  it('belegt einen gerodeten Fleck und zieht die Kosten ab', () => {
    const s = erwarte(bauen(bereit(), 'trockengestell', 'nordwald'));
    expect(s.flecken.nordwald).toMatchObject({ zustand: 'bebaut', gebaeude: 'trockengestell', gebautAmTag: 1 });
    expect(s.lager).toMatchObject({ brett: 0, kraeuter: 0, holz: 3 });
    expect(baubareGebaeude(s)).toEqual([]);
    expect(freieGerodete(s)).toEqual([]);
  });

  it('nur auf gerodeten Flecken, nur mit genug Lager, jedes Gebäude einmal', () => {
    expect(bauen(mitLager(bereit(), { brett: 5 }), 'trockengestell', 'nordwald').ok).toBe(false);
    expect(bauen(bereit(), 'trockengestell', 'hain').ok).toBe(false);
    expect(bauen(bereit(), 'trockengestell', 'lichtung').ok).toBe(false);
    expect(bauen(bereit(), 'zimmerei', 'nordwald')).toMatchObject({ ok: false });
    expect(bauen(bereit(), 'lagerfeuer', 'nordwald')).toMatchObject({ ok: false });
    const s = erwarte(bauen(bereit(), 'trockengestell', 'nordwald'));
    expect(bauen(auf(mitLager(s, { brett: 6, kraeuter: 10 }), 'hain', 'gerodet'), 'trockengestell', 'hain').ok).toBe(false);
  });

  it('Rückgängig am selben Tag erstattet voll, am Folgetag nicht mehr', () => {
    const vorher = bereit();
    const gebaut = erwarte(bauen(vorher, 'trockengestell', 'nordwald'));
    const zurueck = erwarte(bauZuruecknehmen(gebaut, 'nordwald'));
    expect(zurueck.lager).toEqual(vorher.lager);
    expect(zurueck.flecken.nordwald).toEqual(vorher.flecken.nordwald);
    expect(bauZuruecknehmen({ ...gebaut, tag: 2 }, 'nordwald').ok).toBe(false);
    expect(bauZuruecknehmen(vorher, 'nordwald').ok).toBe(false);
    expect(bauZuruecknehmen(vorher, 'huetten').ok).toBe(false);
    expect(bauZuruecknehmen(vorher, 'holzplatz').ok).toBe(false);
  });

  it('ein nicht mehr stehendes Gebäude arbeitet nicht', () => {
    const gebaut = erwarte(bauen(mitLager(bereit(), { kraeuter: 14 }), 'trockengestell', 'nordwald'));
    const mitAuftrag = erwarte(auftragSetzen(gebaut, 'trockengestell', 'trockenkraeuter', 4));
    expect(nacht(mitLager(mitAuftrag, { kraeuter: 8 })).arbeit.map((a) => a.gebaeude)).toContain('trockengestell');
    const weg = erwarte(bauZuruecknehmen(mitAuftrag, 'nordwald'));
    expect(nacht(weg).arbeit.map((a) => a.gebaeude)).not.toContain('trockengestell');
  });
});

describe('Einbringen', () => {
  const unterwegs = (s = neueSiedlung(3), fleck: FleckId = 'nordwald', trupp: Aufbruch[] = DREI.map((siedler) => ({ siedler, proviant: 'beerenbrei' as const }))) =>
    erwarte(tagwerkBeginnen(s, fleck, trupp));

  it('bringt Ertrag ein, übernimmt Ziel und Ladung, zählt den Tag weiter', () => {
    const s = unterwegs();
    const t: Tagwerk = {
      ...s.unterwegs!.tagwerk,
      ertrag: { holz: 12, beeren: 18, kraeuter: 3, nuesse: 1, hase: 2 },
      ziel: { stand: 17, gesamt: 40 },
      ladung: { ida: 4, jonas: 5, mara: 6 },
    };
    const e = erwarte(einbringen(s, t));
    expect(e.siedlung.unterwegs).toBeNull();
    expect(e.siedlung.tag).toBe(2);
    expect(e.siedlung.flecken.nordwald).toMatchObject({ zustand: 'erkundet', stand: 17 });
    expect(e.siedlung.ladung).toEqual({ ida: 4, jonas: 5, mara: 6 });
    // 3 Brei eingesetzt (6 − 3), Nacht: 18 Beeren → 6 Brei, 12 Holz → 4 Bretter
    expect(e.siedlung.lager).toMatchObject({ beeren: 0, beerenbrei: 3 + 6, holz: 0, brett: 4, kraeuter: 3, nuesse: 1, hase: 2 });
    expect(e.nacht.map((a) => [a.gebaeude, a.gemacht])).toEqual([['lagerfeuer', 6], ['zimmerei', 4]]);
    expect(e.aufgedeckt).toEqual([]);
    expect(e.gerodet).toBe(false);
  });

  it('erfülltes Ziel rodet den Fleck und deckt die Nachbarn auf', () => {
    const s = unterwegs(neueSiedlung(3), 'nordwald');
    const t: Tagwerk = { ...s.unterwegs!.tagwerk, ziel: { stand: 40, gesamt: 40 } };
    const e = erwarte(einbringen(s, t));
    expect(e.gerodet).toBe(true);
    expect(e.siedlung.flecken.nordwald.zustand).toBe('gerodet');
    expect(e.aufgedeckt.sort()).toEqual(['eichenhang', 'kiefernrand', 'moor']);
    expect(e.siedlung.flecken.eichenhang.zustand).toBe('erkundet');
    expect(e.siedlung.flecken.moor.zustand).toBe('gesperrt');
    expect(freieGerodete(e.siedlung)).toEqual(['nordwald']);
    // zweites Einbringen auf dem gerodeten Fleck deckt nichts neu auf
    const noch = unterwegs(e.siedlung, 'nordwald');
    expect(erwarte(einbringen(noch, noch.unterwegs!.tagwerk)).aufgedeckt).toEqual([]);
  });

  it('ist reproduzierbar und ändert die Eingabe nicht', () => {
    const s = unterwegs();
    const kopie = structuredClone(s);
    const t = s.unterwegs!.tagwerk;
    expect(einbringen(s, t)).toEqual(einbringen(structuredClone(s), structuredClone(t)));
    expect(s).toEqual(kopie);
  });

  it('ohne laufendes Tagwerk gibt es nichts einzubringen', () => {
    const s = neueSiedlung(1);
    expect(einbringen(s, unterwegs().unterwegs!.tagwerk).ok).toBe(false);
  });
});

// ---------- Balancing-Probe ----------

function laengsteKette(t: Tagwerk): Zelle[] {
  let beste: Zelle[] = [];
  let knoten = 0;
  const gehe = (pfad: Zelle[], besucht: Set<number>) => {
    if (pfad.length > beste.length) beste = [...pfad];
    if (++knoten > 4000) return;
    const art = kachel(t, pfad[0]).art;
    for (const n of nachbarn(pfad[pfad.length - 1])) {
      if (besucht.has(schluessel(n)) || kachel(t, n).art !== art) continue;
      besucht.add(schluessel(n));
      pfad.push(n);
      gehe(pfad, besucht);
      pfad.pop();
      besucht.delete(schluessel(n));
    }
  };
  for (const z of alleZellen()) {
    if (!istRohstoff(kachel(t, z).art)) continue;
    knoten = 0;
    gehe([z], new Set([schluessel(z)]));
  }
  return beste.length >= 3 ? beste : [];
}

function spieleTagwerk(t: Tagwerk): Tagwerk {
  let aktuell = t;
  for (let i = 0; i < 100 && aktuell.schritte > 0; i++) {
    for (const id of aktuell.trupp) {
      if (faehigkeitPruefen(aktuell, id).ok) aktuell = erwarte(faehigkeit(aktuell, id)).danach;
    }
    const kette = laengsteKette(aktuell);
    if (!kette.length) break;
    aktuell = erwarte(ernten(aktuell, kette)).danach;
  }
  return aktuell;
}

function waehleFleck(s: Siedlung): FleckId | null {
  const frei = FLECKEN.filter((f) => s.flecken[f.id].zustand === 'erkundet').map((f) => f.id);
  return frei[0] ?? freieGerodete(s)[0] ?? null;
}

function bot(tage: number, seed: number) {
  let s = neueSiedlung(seed);
  const tagVon: Record<string, number | null> = { gerodet: null, gebaut: null, eintopf: null };
  const verlauf: string[] = [];
  for (let i = 0; i < tage; i++) {
    // bauen, sobald möglich
    const frei = freieGerodete(s)[0];
    if (frei && baubareGebaeude(s).includes('trockengestell')) {
      const b = bauen(s, 'trockengestell', frei);
      if (b.ok) {
        s = erwarte(auftragSetzen(b.wert, 'trockengestell', 'trockenkraeuter', GEBAEUDE.trockengestell.leistung));
        tagVon.gebaut ??= s.tag;
      }
    }
    // Lagerfeuer: Eintopf, sobald die Zutaten da sind; sonst Röstnüsse, wenn es nur Brei gibt; sonst Brei
    const l = s.lager;
    const eintopfGeht = l.beeren >= 2 && l.roestnuesse >= 1 && l.trockenkraeuter >= 1;
    const rezept = eintopfGeht ? 'waldeintopf' : l.nuesse >= 3 && l.roestnuesse < 2 && l.beerenbrei >= 3 ? 'roestnuesse' : 'beerenbrei';
    s = erwarte(auftragSetzen(s, 'lagerfeuer', rezept, 6));

    const fleck = waehleFleck(s);
    expect(fleck, `Tag ${s.tag}: kein Fleck`).not.toBeNull();
    const aufbruch = besterProviant(s.lager, 3).map((proviant, k) => ({ siedler: DREI[k], proviant }));
    s = erwarte(tagwerkBeginnen(s, fleck!, aufbruch));
    const gespielt = spieleTagwerk(s.unterwegs!.tagwerk);
    const e = erwarte(einbringen(s, gespielt));
    if (e.gerodet) tagVon.gerodet ??= s.tag;
    if (e.nacht.some((a) => a.rezept === 'waldeintopf' && a.gemacht > 0)) tagVon.eintopf ??= s.tag;
    verlauf.push(`Tag ${s.tag} ${fleck} ${e.siedlung.flecken[fleck!].stand}/${e.siedlung.flecken[fleck!].ziel} · ${aufbruch.map((a) => a.proviant ?? 'leer').join(',')}`);
    s = e.siedlung;
  }
  return { s, tagVon, verlauf };
}

describe('Balancing-Probe', () => {
  it.each([20261113, 7, 424242])('der Bot fährt in 30 Tagen nie fest (Seed %i)', (seed) => {
    const { s, tagVon } = bot(30, seed);
    console.log(
      `Balancing Seed ${seed}: erster Fleck gerodet an Tag ${tagVon.gerodet ?? '-'}, Trockengestell gebaut an Tag ${tagVon.gebaut ?? '-'}, ` +
        `erster Waldeintopf in Nacht von Tag ${tagVon.eintopf ?? '-'}; nach 30 Tagen: ` +
        `${FLECKEN.filter((f) => ['gerodet', 'bebaut'].includes(s.flecken[f.id].zustand) && f.ziel > 0).length} Flecken gerodet/bebaut`,
    );
    expect(s.tag).toBe(31);
  });
});
