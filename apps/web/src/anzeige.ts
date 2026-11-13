import { WAREN, type Ware, type Zutaten } from '@lichtung/spiel';

/** Zahlen im deutschen Format. */
export const zahl = (n: number): string => n.toLocaleString('de-DE');

/** „1 Brett“, „4 Bretter“. */
export const wareText = (ware: Ware, n: number): string => `${zahl(n)} ${n === 1 ? WAREN[ware].name : WAREN[ware].mehrzahl}`;

export const zutatenText = (zutaten: Zutaten): string =>
  (Object.entries(zutaten) as [Ware, number][]).filter(([, n]) => n > 0).map(([w, n]) => wareText(w, n)).join(', ');

/** „a, b und c“. */
export const aufzaehlung = (liste: string[]): string =>
  liste.length > 1 ? `${liste.slice(0, -1).join(', ')} und ${liste[liste.length - 1]}` : (liste[0] ?? '');
