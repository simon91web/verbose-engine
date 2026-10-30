/**
 * Zufallsstrom mit Startwert (mulberry32). Gleicher Zustand ergibt dieselben Zahlen –
 * so ist jeder Zug reproduzierbar und Rückgängig würfelt nicht neu.
 */
export class Zufall {
  constructor(public zustand: number) {
    this.zustand = zustand >>> 0;
  }

  /** Zahl in [0, 1). */
  zahl(): number {
    const a = (this.zustand = (this.zustand + 0x6d2b79f5) >>> 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Ganze Zahl in [0, n). */
  ganz(n: number): number {
    return Math.floor(this.zahl() * n);
  }

  /** Wählt nach Gewichten; Gewichte müssen nicht 1 ergeben. */
  gewichtet<T extends string>(gewichte: Readonly<Record<T, number>>): T {
    const eintraege = Object.entries(gewichte) as [T, number][];
    const summe = eintraege.reduce((s, [, g]) => s + g, 0);
    let rest = this.zahl() * summe;
    for (const [wert, g] of eintraege) {
      rest -= g;
      if (rest < 0) return wert;
    }
    return eintraege[eintraege.length - 1][0];
  }
}

/** Startwert für einen Folgetag – unabhängig vom Spielverlauf, abhängig nur von Startwert und Tag. */
export function folgeSeed(seed: number, tag: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(tag, 0xc2b2ae35)) >>> 0;
}
