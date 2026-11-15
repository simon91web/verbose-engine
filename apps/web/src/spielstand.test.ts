import { beforeEach, describe, expect, it } from 'vitest';
import { neueSiedlung } from '@lichtung/spiel';
import { DATENVERSION, ladenGenau, migriere, neuerSpielstand, sperreZuruecksetzen, speichern, zuDaten } from './spielstand';

const SCHLUESSEL = 'lichtung.spielstand';

/** Minimaler localStorage, die Tests laufen ohne Browser. */
function stub() {
  const daten = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => daten.get(k) ?? null,
    setItem: (k: string, v: string) => void daten.set(k, v),
    removeItem: (k: string) => void daten.delete(k),
    clear: () => daten.clear(),
    key: () => null,
    length: 0,
  };
  return daten;
}

describe('Datenversion', () => {
  it('schreibt die eigene Version', () => {
    expect(DATENVERSION).toBe(3);
    expect(zuDaten(neuerSpielstand()).version).toBe(DATENVERSION);
    expect(neuerSpielstand().version).toBe(DATENVERSION);
  });
});

describe('Stand auf diesem Gerät mit neuerer Version', () => {
  let speicher: Map<string, string>;
  const neuerRoh = JSON.stringify({ version: DATENVERSION + 1, siedlung: neueSiedlung(7), bester: 3, neu: 'ja' });

  beforeEach(() => {
    speicher = stub();
    sperreZuruecksetzen();
  });

  it('migriere verwirft ihn weiterhin (unbrauchbar für diese App)', () => {
    expect(migriere({ version: DATENVERSION + 1, siedlung: neueSiedlung(7) })).toBeNull();
  });

  it('laden meldet „zu neu“ statt „leer“', () => {
    speicher.set(SCHLUESSEL, neuerRoh);
    expect(ladenGenau()).toEqual({ art: 'zuNeu' });
    expect(ladenGenau).not.toThrow();
  });

  it('speichern überschreibt ihn nicht', () => {
    speicher.set(SCHLUESSEL, neuerRoh);
    ladenGenau();
    expect(speichern(neuerSpielstand())).toBe(true);
    expect(speicher.get(SCHLUESSEL)).toBe(neuerRoh);
  });

  it('speichern überschreibt ihn auch ohne vorheriges Laden nicht (anderer Tab war schneller)', () => {
    speicher.set(SCHLUESSEL, neuerRoh);
    expect(speichern(neuerSpielstand())).toBe(true);
    expect(speicher.get(SCHLUESSEL)).toBe(neuerRoh);
  });

  it('speichert normal, wenn die Version stimmt', () => {
    const s = neuerSpielstand();
    expect(speichern(s)).toBe(true);
    expect(ladenGenau()).toMatchObject({ art: 'ok' });
    speicher.set(SCHLUESSEL, JSON.stringify({ ...s, bester: 9 }));
    expect(speichern({ ...s, bester: 11 })).toBe(true);
    expect(JSON.parse(speicher.get(SCHLUESSEL)!).bester).toBe(11);
  });

  it('leer und unbrauchbar bleiben „leer“', () => {
    expect(ladenGenau()).toEqual({ art: 'leer' });
    speicher.set(SCHLUESSEL, '{kaputt');
    expect(ladenGenau()).toEqual({ art: 'leer' });
  });
});
