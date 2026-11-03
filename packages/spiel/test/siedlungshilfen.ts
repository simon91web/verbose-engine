import { expect } from 'vitest';
import {
  BAUARTEN, MINUTE, SEKUNDE, SPIELDATEN, WAREN, bauart, gaenge, inventur, nachrechnen, stueck,
  type Ergebnis, type Gang, type Siedlung, type Spieldaten, type Zusammenfassung,
} from '../src';

export function ok<T>(e: Ergebnis<T>): T {
  if (!e.ok) throw new Error(e.grund);
  return e.wert;
}

export const bis = (s: Siedlung, zeit: number, d: Spieldaten = SPIELDATEN): Siedlung => nachrechnen(s, zeit, d).stand;

/** Spieldaten mit einer freistehenden Werkstatt (braucht Träger für die Zutaten) und einer billigen Hütte. */
export const MIT_WERKSTATT: Spieldaten = {
  ...SPIELDATEN,
  bauarten: {
    ...BAUARTEN,
    saegewerk: { name: 'Sägewerk', erzeugt: 'bretter', jeStunde: 12, zutaten: { holz: 2 }, kosten: { holz: 10 }, fach: 10, eingang: 10, bonus: {}, restarbeit: MINUTE },
    huette: { name: 'Hütte', erzeugt: 'beeren', jeStunde: 1, kosten: { holz: 5 }, fach: 10, bonus: {}, restarbeit: MINUTE },
  },
};

/**
 * Verfolgt alle Gänge bis `ende` und gibt die Hinwege in der Reihenfolge ihres Abgangs zurück.
 * Schaut mindestens jede Sekunde nach; jeder Gang dauert wenigstens so lange.
 */
export function hinwege(s: Siedlung, ende: number, d: Spieldaten = SPIELDATEN): { hin: Gang[]; stand: Siedlung } {
  const hin: Gang[] = [];
  const gesehen = new Set<string>();
  const merken = (): void => {
    for (const g of gaenge(s)) {
      const k = `${g.traeger}-${g.abgang}-${g.von}`;
      if (g.von === 'lager' && !gesehen.has(k)) {
        gesehen.add(k);
        hin.push(g);
      }
    }
  };
  merken();
  while (s.zeit < ende) {
    s = bis(s, Math.min(ende, s.zeit + SEKUNDE, ...gaenge(s).map((g) => g.ankunft)), d);
    merken();
  }
  return { hin, stand: s };
}

/** Nichts geht verloren: Was fehlt, ist erzeugt, gegessen, verarbeitet oder verbaut. */
export function pruefeBilanz(vorher: Siedlung, nachher: Siedlung, z: Zusammenfassung, d: Spieldaten = SPIELDATEN): void {
  const a = inventur(vorher, d);
  const b = inventur(nachher, d);
  for (const w of WAREN) {
    expect(b[w], `Bilanz ${w}`).toBe(a[w] + z.erzeugt[w] - z.verbraucht[w] - z.verarbeitet[w] - z.verbaut[w]);
  }
}

/** Kein Fach läuft über, nichts wird negativ, kein Korb ist zu schwer. */
export function pruefeOrdnung(s: Siedlung, d: Spieldaten = SPIELDATEN): void {
  for (const w of WAREN) {
    expect(s.lager.bestand[w]).toBeGreaterThanOrEqual(0);
    expect(s.lager.bestand[w]).toBeLessThanOrEqual(d.lager.fach);
  }
  for (const g of s.gebaeude) {
    const art = bauart(d, g.art);
    expect(g.fach).toBeGreaterThanOrEqual(0);
    expect(g.fach).toBeLessThanOrEqual(art.fach);
    for (const w of WAREN) {
      expect(stueck(g.eingang, w)).toBeGreaterThanOrEqual(0);
      expect(stueck(g.eingang, w)).toBeLessThanOrEqual(art.eingang ?? 0);
    }
  }
  for (const b of s.baustellen) {
    for (const w of WAREN) {
      expect(stueck(b.geliefert, w)).toBeGreaterThanOrEqual(0);
      if (!b.abgebrochen) expect(stueck(b.geliefert, w)).toBeLessThanOrEqual(stueck(b.kosten, w));
    }
  }
  for (const g of gaenge(s)) {
    expect(g.menge).toBeGreaterThanOrEqual(0);
    expect(g.menge).toBeLessThanOrEqual(d.traeger.korb);
    expect(g.ankunft).toBeGreaterThan(g.abgang);
  }
}
