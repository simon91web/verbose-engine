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

/** „eben“, „vor 3 Min.“, „vor 2 Std.“, „vor 4 Tagen“. */
export function vorZeit(ms: number, jetzt: number): string {
  const s = Math.max(0, Math.round((jetzt - ms) / 1000));
  if (s < 60) return 'eben';
  const min = Math.floor(s / 60);
  if (min < 60) return `vor ${min} Min.`;
  const std = Math.floor(min / 60);
  if (std < 24) return `vor ${std} Std.`;
  const tage = Math.floor(std / 24);
  return tage === 1 ? 'vor 1 Tag' : `vor ${tage} Tagen`;
}

const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const zwei = (n: number) => String(n).padStart(2, '0');
const tagesbeginn = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** „Heute 09:42“, „Gestern 18:35“, „Do 12.11. 03:00“, bei älteren mit Jahr. */
export function zeitpunktText(ms: number, jetzt: number): string {
  const d = new Date(ms);
  const uhr = `${zwei(d.getHours())}:${zwei(d.getMinutes())}`;
  const tage = Math.round((tagesbeginn(new Date(jetzt)) - tagesbeginn(d)) / 86_400_000);
  if (tage === 0) return `Heute ${uhr}`;
  if (tage === 1) return `Gestern ${uhr}`;
  const datum = `${zwei(d.getDate())}.${zwei(d.getMonth() + 1)}.`;
  if (tage > 0 && tage < 7) return `${WOCHENTAG[d.getDay()]} ${datum} ${uhr}`;
  return `${datum}${d.getFullYear() === new Date(jetzt).getFullYear() ? '' : d.getFullYear()} ${uhr}`;
}
