import { describe, expect, it } from 'vitest';
import { vorZeit, zeitpunktText } from './anzeige';

describe('vorZeit', () => {
  const jetzt = new Date(2026, 10, 14, 12, 0, 0).getTime();
  it('sagt „eben“, Minuten, Stunden und Tage', () => {
    expect(vorZeit(jetzt - 10_000, jetzt)).toBe('eben');
    expect(vorZeit(jetzt - 3 * 60_000, jetzt)).toBe('vor 3 Min.');
    expect(vorZeit(jetzt - 2 * 3_600_000, jetzt)).toBe('vor 2 Std.');
    expect(vorZeit(jetzt - 26 * 3_600_000, jetzt)).toBe('vor 1 Tag');
    expect(vorZeit(jetzt - 4 * 86_400_000, jetzt)).toBe('vor 4 Tagen');
  });
});

describe('zeitpunktText', () => {
  const jetzt = new Date(2026, 10, 14, 12, 0, 0).getTime(); // Samstag, 14.11.2026
  it('nennt heute, gestern und Wochentag', () => {
    expect(zeitpunktText(new Date(2026, 10, 14, 9, 42).getTime(), jetzt)).toBe('Heute 09:42');
    expect(zeitpunktText(new Date(2026, 10, 13, 18, 35).getTime(), jetzt)).toBe('Gestern 18:35');
    expect(zeitpunktText(new Date(2026, 10, 12, 3, 0).getTime(), jetzt)).toBe('Do 12.11. 03:00');
  });
  it('zeigt bei älteren Einträgen das Datum, über den Jahreswechsel mit Jahr', () => {
    expect(zeitpunktText(new Date(2026, 9, 1, 3, 0).getTime(), jetzt)).toBe('01.10. 03:00');
    expect(zeitpunktText(new Date(2025, 11, 30, 3, 0).getTime(), jetzt)).toBe('30.12.2025 03:00');
  });
});
