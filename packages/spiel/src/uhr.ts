import { JAHRESZEITEN, ZEIT, type Jahreszeit, type Tagesphase } from './spieldaten';

/**
 * Spieluhr: Die Spielzeit ist die verstrichene Echtzeit seit der Gründung in Millisekunden.
 * Ein Spieltag dauert 8 Minuten, eine Jahreszeit 8 Spieltage; die Siedlung beginnt am ersten Frühlingsmorgen.
 */

export interface Uhrzeit {
  /** Spieltag seit der Gründung, ab 1. */
  tag: number;
  /** Jahr seit der Gründung, ab 1. */
  jahr: number;
  jahreszeit: Jahreszeit;
  /** Tag innerhalb der Jahreszeit, 1–8. */
  tagDerJahreszeit: number;
  phase: Tagesphase;
  /** Millisekunden seit Tagesbeginn. */
  imTag: number;
  /** Anteil der laufenden Phase, 0–1 – für weiche Übergänge im Licht. */
  anteilPhase: number;
  /** Millisekunden bis zur nächsten Phase. */
  bisWechsel: number;
}

export const spielzeit = (gruendung: number, jetzt: number): number => Math.max(0, jetzt - gruendung);

export function spieluhr(zeit: number): Uhrzeit {
  const t = Math.max(0, zeit);
  const tagIndex = Math.floor(t / ZEIT.tag);
  const jahreszeitIndex = Math.floor(tagIndex / ZEIT.tageJeJahreszeit);
  const jahreszeit = JAHRESZEITEN[jahreszeitIndex % JAHRESZEITEN.length];
  const imTag = t - tagIndex * ZEIT.tag;
  const licht = ZEIT.licht[jahreszeit];

  let beginn = 0;
  let phase: Tagesphase = 'nacht';
  let laenge: number = licht.nacht;
  for (const p of ['hell', 'daemmerung', 'nacht'] as const) {
    if (imTag < beginn + licht[p]) {
      phase = p;
      laenge = licht[p];
      break;
    }
    beginn += licht[p];
  }

  return {
    tag: tagIndex + 1,
    jahr: Math.floor(jahreszeitIndex / JAHRESZEITEN.length) + 1,
    jahreszeit,
    tagDerJahreszeit: (tagIndex % ZEIT.tageJeJahreszeit) + 1,
    phase,
    imTag,
    anteilPhase: (imTag - beginn) / laenge,
    bisWechsel: beginn + laenge - imTag,
  };
}
