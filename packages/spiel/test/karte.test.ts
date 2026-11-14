import { describe, expect, it } from 'vitest';
import { FLECKEN, aufdecken, fleckNachbarn, startFlecken } from '../src';

describe('Karte', () => {
  it('hat 19 Flecken, die Lichtung mit sechs Nachbarn und eindeutige Lagen', () => {
    expect(FLECKEN).toHaveLength(19);
    expect(new Set(FLECKEN.map((f) => `${f.q},${f.r}`)).size).toBe(19);
    expect(fleckNachbarn('lichtung').sort()).toEqual(['bachufer', 'hain', 'holzplatz', 'huetten', 'nordwald', 'suedwald']);
  });

  it('Randflecken haben weniger Nachbarn, Nachbarschaft ist gegenseitig', () => {
    expect(fleckNachbarn('kiefernrand').length).toBeLessThan(6);
    for (const f of FLECKEN) for (const n of fleckNachbarn(f.id)) expect(fleckNachbarn(n)).toContain(f.id);
  });

  it('Startzustand: erster Ring erkundet oder gesperrt, zweiter Ring im Nebel', () => {
    const k = startFlecken();
    expect(k.lichtung).toMatchObject({ zustand: 'bebaut', gebaeude: 'lagerfeuer' });
    expect(k.holzplatz).toMatchObject({ zustand: 'bebaut', gebaeude: 'zimmerei' });
    expect(k.huetten).toMatchObject({ zustand: 'bebaut', gebaeude: 'huetten' });
    expect(k.nordwald).toMatchObject({ zustand: 'erkundet', stand: 0, ziel: 40 });
    expect(k.bachufer.zustand).toBe('gesperrt');
    expect(k.felshang.zustand).toBe('gesperrt');
    expect(k.dickicht).toMatchObject({ zustand: 'nebel', ziel: 60 });
  });

  it('Aufdecken: Wald wird erkundet, anderes gesperrt, Bekanntes bleibt, Eingabe bleibt unberührt', () => {
    const k = startFlecken();
    const { flecken, aufgedeckt } = aufdecken(k, 'nordwald');
    expect(aufgedeckt.sort()).toEqual(['eichenhang', 'kiefernrand', 'moor']);
    expect(flecken.eichenhang.zustand).toBe('erkundet');
    expect(flecken.moor.zustand).toBe('gesperrt');
    expect(flecken.hain.zustand).toBe('erkundet');
    expect(k.eichenhang.zustand).toBe('nebel');
    expect(aufdecken(flecken, 'nordwald').aufgedeckt).toEqual([]);
  });
});
