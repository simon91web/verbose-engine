import type { Zelle } from '@lichtung/spiel';

/** Darstellung des Wabenbretts: Wabe mit Radius S, flache Oberkante, ungerade Spalten halb tiefer. */
export const S = 50;
export const HH = Math.sqrt(3) * S;
export const BREITE = 11 * S;
export const HOEHE = 7.5 * HH;

export const mitte = (spalte: number, zeile: number): [number, number] => [
  S + spalte * 1.5 * S,
  HH / 2 + zeile * HH + (spalte % 2 ? HH / 2 : 0),
];

export const ecken = (r: number): string =>
  [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = (Math.PI / 3) * i;
      return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
    })
    .join(' ');

export const WABE = ecken(S - 3);

export const punkte = (zellen: readonly Zelle[], hoch = 0): string =>
  zellen
    .map(([s, z]) => {
      const [x, y] = mitte(s, z);
      return `${x.toFixed(1)},${(y - hoch).toFixed(1)}`;
    })
    .join(' ');
