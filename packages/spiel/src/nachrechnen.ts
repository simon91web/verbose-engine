import { SPIELDATEN, WAREN, type Spieldaten, type Ware } from './spieldaten';
import type { Siedlung, Zustand } from './siedlung';
import { ausfuehren, ausgleich, leeresProtokoll, naechstesEreignis, type Protokoll } from './regeln';

/** Was in der Zwischenzeit passiert ist – für „Während du weg warst“. */
export interface Zusammenfassung extends Protokoll {
  von: number;
  bis: number;
  lager: { vorher: Record<Ware, number>; nachher: Record<Ware, number> };
  /** Neue Stufe des Dorfs, falls es aufgestiegen ist. */
  aufstieg: number | null;
  /** Am Ende volle Fächer im Lager, mit Beginn. */
  voll: { ware: Ware; seit: number }[];
  /** Am Ende fehlende Waren, mit Beginn. */
  mangel: { ware: Ware; seit: number }[];
  /** Am Ende ruhende oder wartende Gebäude. */
  stillstand: { id: number; art: string; zustand: Exclude<Zustand, 'arbeitet'>; seit: number }[];
}

/** Sicherung gegen Endlosschleifen: So viele Ereignisse im selben Augenblick gibt es nur bei einem Fehler. */
const HOECHSTENS_ZUGLEICH = 100_000;

/**
 * Rechnet die Siedlung bis zur Spielzeit `bis` weiter. Springt von Ereignis zu Ereignis – Ankunft eines Trägers,
 * Stück fertig, Baustelle fertig, Mahlzeit, Zuzug –, dazwischen ändert sich nichts. Steht alles still, ist die
 * Rechnung sofort fertig. Gleicher Stand und gleiches `bis` ergeben immer dasselbe, auch über Zwischenstopps hinweg.
 */
export function nachrechnen(alt: Siedlung, bis: number, d: Spieldaten = SPIELDATEN): { stand: Siedlung; zusammenfassung: Zusammenfassung } {
  const s = structuredClone(alt);
  const p = leeresProtokoll();
  const von = s.zeit;
  const vorher = { ...s.lager.bestand };
  const stufe = s.dorf.stufe;

  if (bis > s.zeit) {
    ausgleich(s, d, p);
    let zugleich = 0;
    for (;;) {
      const e = naechstesEreignis(s);
      if (!e || e.zeit > bis) break;
      zugleich = e.zeit === s.zeit ? zugleich + 1 : 0;
      if (zugleich > HOECHSTENS_ZUGLEICH) throw new Error('Nachrechnen kommt nicht vom Fleck');
      s.zeit = e.zeit;
      ausfuehren(s, e, d, p);
      ausgleich(s, d, p);
    }
    s.zeit = bis;
  }

  return {
    stand: s,
    zusammenfassung: {
      ...p,
      von,
      bis: s.zeit,
      lager: { vorher, nachher: { ...s.lager.bestand } },
      aufstieg: s.dorf.stufe !== stufe ? s.dorf.stufe : null,
      voll: WAREN.flatMap((ware) => (s.lager.vollSeit[ware] === null ? [] : [{ ware, seit: s.lager.vollSeit[ware]! }])),
      mangel: WAREN.flatMap((ware) => {
        const seit = s.dorf.verbrauch[ware]?.mangelSeit;
        return seit == null ? [] : [{ ware, seit }];
      }),
      stillstand: s.gebaeude.flatMap((g) => (g.zustand === 'arbeitet' ? [] : [{ id: g.id, art: g.art, zustand: g.zustand, seit: g.seit }])),
    },
  };
}
