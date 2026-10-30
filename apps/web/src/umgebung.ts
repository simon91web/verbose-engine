import { useEffect, useState } from 'react';

const BREIT = '(min-width: 960px) and (min-height: 620px)';

/** Laptop-Anordnung (drei Spalten) oder Handy-Anordnung (untereinander). */
export function useBreit(): boolean {
  const [breit, setBreit] = useState(() => matchMedia(BREIT).matches);
  useEffect(() => {
    const m = matchMedia(BREIT);
    const pruefen = () => setBreit(m.matches);
    m.addEventListener('change', pruefen);
    return () => m.removeEventListener('change', pruefen);
  }, []);
  return breit;
}

export type Stimmung = 'tag' | 'abend' | 'geraet';
const STIMMUNG = 'lichtung.stimmung';

/** Tag, Abend oder wie das Gerät – gemerkt im Browser. */
export function useStimmung(): [Stimmung, (s: Stimmung) => void] {
  const [wahl, setWahl] = useState<Stimmung>(() => {
    try {
      const s = localStorage.getItem(STIMMUNG);
      return s === 'tag' || s === 'abend' ? s : 'geraet';
    } catch {
      return 'geraet';
    }
  });
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const setzen = () => {
      const abend = wahl === 'abend' || (wahl === 'geraet' && m.matches);
      document.documentElement.dataset.stimmung = abend ? 'abend' : 'tag';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', abend ? '#141D1C' : '#CFE0AE');
    };
    setzen();
    m.addEventListener('change', setzen);
    try {
      localStorage.setItem(STIMMUNG, wahl);
    } catch {
      // ohne Speicher gilt die Wahl bis zum Neuladen
    }
    return () => m.removeEventListener('change', setzen);
  }, [wahl]);
  return [wahl, setWahl];
}

export const wenigerBewegung = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;
