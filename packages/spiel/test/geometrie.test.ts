import { describe, expect, it } from 'vitest';
import { alleZellen, amRand, benachbart, eingeschlossen, gleich, nachbarn, type Zelle } from '../src';

const sortiert = (zellen: Zelle[]) => [...zellen].map(([s, z]) => `${s},${z}`).sort();

describe('Nachbarn auf dem Wabenbrett', () => {
  it('gerade Spalte: oben und unten, links und rechts je die Zeile darüber und gleich', () => {
    expect(sortiert(nachbarn([2, 2]))).toEqual(sortiert([[2, 1], [2, 3], [1, 1], [1, 2], [3, 1], [3, 2]]));
  });

  it('ungerade Spalte (halb tiefer): links und rechts je gleiche Zeile und darunter', () => {
    expect(sortiert(nachbarn([3, 3]))).toEqual(sortiert([[3, 2], [3, 4], [2, 3], [2, 4], [4, 3], [4, 4]]));
  });

  it('Ecken und Rand haben weniger Nachbarn', () => {
    expect(nachbarn([0, 0])).toHaveLength(2);
    expect(nachbarn([3, 3])).toHaveLength(6);
    expect(amRand([0, 4])).toBe(true);
    expect(amRand([3, 3])).toBe(false);
  });

  it('Nachbarschaft gilt in beide Richtungen', () => {
    for (const a of alleZellen()) for (const b of nachbarn(a)) expect(benachbart(b, a)).toBe(true);
  });
});

describe('Ring schließen', () => {
  it('sechs Waben um eine ungerade Spalte umschließen genau diese', () => {
    const ring: Zelle[] = [[3, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 3]];
    expect(eingeschlossen(ring)).toEqual([[3, 3]]);
  });

  it('sechs Waben um eine gerade Spalte umschließen genau diese', () => {
    const ring: Zelle[] = [[2, 1], [3, 1], [3, 2], [2, 3], [1, 2], [1, 1]];
    expect(eingeschlossen(ring)).toEqual([[2, 2]]);
  });

  it('ein Ring am Rand umschließt trotzdem seine Mitte', () => {
    const ring: Zelle[] = [[1, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
    expect(eingeschlossen(ring).some((z) => gleich(z, [1, 1]))).toBe(true);
  });

  it('eine Kette am Rand entlang umschließt nichts', () => {
    expect(eingeschlossen([[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]])).toEqual([]);
  });

  it('ein offener Bogen umschließt nichts', () => {
    expect(eingeschlossen([[3, 2], [4, 3], [4, 4], [3, 4], [2, 4]])).toEqual([]);
  });

  it('ein Ring aus acht Waben umschließt zwei', () => {
    const ring: Zelle[] = [[3, 2], [4, 3], [4, 4], [4, 5], [3, 5], [2, 5], [2, 4], [2, 3]];
    expect(sortiert(eingeschlossen(ring))).toEqual(sortiert([[3, 3], [3, 4]]));
  });
});
