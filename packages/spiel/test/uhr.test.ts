import { describe, expect, it } from 'vitest';
import { MINUTE, STUNDE, ZEIT, spielzeit, spieluhr, type Jahreszeit } from '../src';

const TAG = 8 * MINUTE;
const JAHRESZEIT = 8 * TAG;

describe('Spieluhr', () => {
  it('rechnet die Spielzeit aus der Echtzeit seit der Gründung', () => {
    const gruendung = Date.UTC(2026, 10, 3, 20, 0);
    expect(spielzeit(gruendung, gruendung + 90 * MINUTE)).toBe(90 * MINUTE);
    expect(spielzeit(gruendung, gruendung - 5000)).toBe(0);
  });

  it('ein Spieltag dauert 8 Minuten', () => {
    expect(ZEIT.tag).toBe(TAG);
    expect(spieluhr(0).tag).toBe(1);
    expect(spieluhr(TAG - 1).tag).toBe(1);
    expect(spieluhr(TAG).tag).toBe(2);
    expect(spieluhr(STUNDE).tag).toBe(8); // 60 / 8 = 7,5 Tage vorbei
  });

  it('eine Jahreszeit hat 8 Spieltage, ein Jahr dauert 4 h 16 min', () => {
    expect(spieluhr(0)).toMatchObject({ jahr: 1, jahreszeit: 'fruehling', tagDerJahreszeit: 1 });
    expect(spieluhr(JAHRESZEIT - 1)).toMatchObject({ jahreszeit: 'fruehling', tagDerJahreszeit: 8 });
    expect(spieluhr(JAHRESZEIT)).toMatchObject({ jahreszeit: 'sommer', tagDerJahreszeit: 1 });
    expect(spieluhr(2 * JAHRESZEIT).jahreszeit).toBe('herbst');
    expect(spieluhr(3 * JAHRESZEIT).jahreszeit).toBe('winter');
    expect(4 * JAHRESZEIT).toBe(4 * STUNDE + 16 * MINUTE);
    expect(spieluhr(4 * JAHRESZEIT)).toMatchObject({ jahr: 2, jahreszeit: 'fruehling', tagDerJahreszeit: 1, tag: 33 });
  });

  // Konzept › Zeit: hell · Dämmerung · Nacht in Minuten
  const TABELLE: [Jahreszeit, number, number, number][] = [
    ['fruehling', 4, 1, 3],
    ['sommer', 5, 1, 2],
    ['herbst', 4, 1, 3],
    ['winter', 3, 1, 4],
  ];

  it.each(TABELLE)('%s: %i min hell, %i min Dämmerung, %i min Nacht', (jz, hell, daemmerung, nacht) => {
    expect(hell + daemmerung + nacht).toBe(8);
    const beginn = TABELLE.findIndex(([j]) => j === jz) * JAHRESZEIT + 3 * TAG; // vierter Tag der Jahreszeit
    const phase = (min: number): string => spieluhr(beginn + min * MINUTE).phase;
    expect(spieluhr(beginn).jahreszeit).toBe(jz);
    expect(phase(0)).toBe('hell');
    expect(phase(hell - 0.01)).toBe('hell');
    expect(phase(hell)).toBe('daemmerung');
    expect(phase(hell + daemmerung - 0.01)).toBe('daemmerung');
    expect(phase(hell + daemmerung)).toBe('nacht');
    expect(phase(8 - 0.01)).toBe('nacht');
    expect(phase(8)).toBe('hell');
  });

  it('kennt Anteil und Restzeit der laufenden Phase', () => {
    const u = spieluhr(2 * MINUTE); // Frühling: 4 min hell
    expect(u.phase).toBe('hell');
    expect(u.anteilPhase).toBeCloseTo(0.5);
    expect(u.bisWechsel).toBe(2 * MINUTE);
    const n = spieluhr(JAHRESZEIT + 7 * MINUTE); // Sommer: Nacht von 6 bis 8 min
    expect(n.phase).toBe('nacht');
    expect(n.anteilPhase).toBeCloseTo(0.5);
    expect(n.bisWechsel).toBe(MINUTE);
  });
});
