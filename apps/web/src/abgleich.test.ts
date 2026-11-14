import { describe, expect, it } from 'vitest';
import { neueSiedlung } from '@lichtung/spiel';
import { entscheide } from './abgleich';
import type { ServerStand } from './api';
import { migriere, zuDaten, type Spielstand } from './spielstand';

const spiel = (seed: number, tag = 1) => {
  const siedlung = { ...neueSiedlung(seed), tag };
  return { siedlung, bester: 0 };
};
const lokal = (seed: number, o: Partial<Spielstand> = {}): Spielstand => ({
  version: 3, ...spiel(seed), revision: 0, geaendert: 1000, ungespeichert: false, ...o,
});
const server = (seed: number, revision: number, geaendert: number, tag = 1): ServerStand => ({
  revision, daten: zuDaten(spiel(seed, tag)), geaendert, geraet: 'Laptop',
});
const leer: ServerStand = { revision: 0, daten: null };

describe('entscheide', () => {
  it('Server leer: hochladen, außer es wurde noch nichts gespielt', () => {
    expect(entscheide(lokal(1), leer)).toEqual({ art: 'hochladen' });
    expect(entscheide(lokal(1, { geaendert: 0 }), leer)).toEqual({ art: 'nichts' });
  });

  it('gleiche Stände: nur angleichen', () => {
    expect(entscheide(lokal(1), server(1, 4, 5000))).toEqual({ art: 'angleichen' });
  });

  it('nichts gespielt, Server hat einen Stand: Serverstand übernehmen', () => {
    expect(entscheide(lokal(1, { geaendert: 0 }), server(2, 3, 5000))).toEqual({ art: 'serverUebernehmen' });
  });

  it('nie abgeglichen und verschieden: fragen, der neuere ist vorgewählt', () => {
    expect(entscheide(lokal(1, { geaendert: 9000 }), server(2, 3, 5000))).toEqual({ art: 'fragen', neuer: 'lokal' });
    expect(entscheide(lokal(1, { geaendert: 4000 }), server(2, 3, 5000))).toEqual({ art: 'fragen', neuer: 'server' });
  });

  it('gleiche Revision: der Stand hier gilt', () => {
    expect(entscheide(lokal(1, { revision: 3, ungespeichert: true }), server(2, 3, 5000))).toEqual({ art: 'lokalGilt' });
  });

  it('Server neuer, hier nichts Ungespeichertes: Serverstand übernehmen', () => {
    expect(entscheide(lokal(1, { revision: 2 }), server(2, 5, 5000))).toEqual({ art: 'serverUebernehmen' });
  });

  it('Server neuer und hier ungespeichert: der spätere Zeitpunkt gewinnt', () => {
    const a = lokal(1, { revision: 2, ungespeichert: true, geaendert: 9000 });
    expect(entscheide(a, server(2, 5, 5000))).toEqual({ art: 'konflikt', gewinner: 'lokal' });
    const b = lokal(1, { revision: 2, ungespeichert: true, geaendert: 4000 });
    expect(entscheide(b, server(2, 5, 5000))).toEqual({ art: 'konflikt', gewinner: 'server' });
  });

  it('unbrauchbarer Serverstand: der von hier gilt', () => {
    expect(entscheide(lokal(1), { revision: 2, daten: { version: 9 }, geaendert: 1 })).toEqual({ art: 'konflikt', gewinner: 'lokal' });
  });
});

describe('migriere', () => {
  const siedlung = neueSiedlung(7);

  it('übernimmt Version 2 als noch nie abgeglichenen, ungespeicherten Stand', () => {
    const s = migriere({ version: 2, siedlung, bester: 12 }, 4242);
    expect(s).toMatchObject({ version: 3, bester: 12, revision: 0, geaendert: 4242, ungespeichert: true });
    expect(s?.siedlung.seed).toBe(7);
  });

  it('übernimmt Version 1 über Version 2', () => {
    const start = neueSiedlung(3);
    const tagwerk = { gitter: [[{}]], ziel: { stand: 2, gesamt: 10 }, ladung: {} };
    const s = migriere({ version: 1, seed: 3, tag: 4, tagwerk, bester: 5 }, 1);
    expect(s?.version).toBe(3);
    expect(s?.siedlung.tag).toBe(4);
    expect(s?.siedlung.seed).toBe(start.seed);
  });

  it('behält Version 3 und ergänzt fehlende Felder', () => {
    const s = migriere({ version: 3, siedlung, bester: 1, revision: 5, geaendert: 99, ungespeichert: true });
    expect(s).toMatchObject({ revision: 5, geaendert: 99, ungespeichert: true });
    expect(migriere({ version: 3, siedlung })).toMatchObject({ bester: 0, revision: 0, geaendert: 0, ungespeichert: false });
  });

  it('lehnt Unbrauchbares ab', () => {
    expect(migriere(null)).toBeNull();
    expect(migriere({ version: 3, siedlung: {} })).toBeNull();
    expect(migriere({ version: 4 })).toBeNull();
  });
});
