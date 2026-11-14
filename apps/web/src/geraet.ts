import { useCallback, useState } from 'react';

const SCHLUESSEL = 'lichtung.geraet';
export const NAME_MAX = 20;

/** „Handy“, „Tablet“ oder „Laptop“ – aus dem User-Agent geraten. */
export function geraetRaten(ua: string = navigator.userAgent, beruehrpunkte: number = navigator.maxTouchPoints ?? 0): string {
  // iPadOS meldet sich wie ein Mac, hat aber Touch
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && beruehrpunkte > 1) || (/Android/.test(ua) && !/Mobile/.test(ua))) return 'Tablet';
  if (/iPhone|iPod|Mobile/i.test(ua)) return 'Handy';
  return 'Laptop';
}

export const geraetSymbolName = (name: string): 'smartphone' | 'tablet' | 'laptop' =>
  /^(handy|phone|smartphone)/i.test(name) ? 'smartphone' : /^tablet|ipad/i.test(name) ? 'tablet' : 'laptop';

function lesen(): string {
  try {
    const n = localStorage.getItem(SCHLUESSEL)?.trim();
    if (n) return n.slice(0, NAME_MAX);
  } catch {
    // ohne Speicher gilt der geratene Name
  }
  return geraetRaten();
}

/** Name dieses Geräts; im Menü änderbar, nur auf diesem Gerät gemerkt. */
export function useGeraet(): [string, (name: string) => void] {
  const [name, setName] = useState(lesen);
  const setze = useCallback((neu: string) => {
    const n = neu.trim().slice(0, NAME_MAX);
    if (!n) return;
    setName(n);
    try {
      localStorage.setItem(SCHLUESSEL, n);
    } catch {
      // gilt bis zum Neuladen
    }
  }, []);
  return [name, setze];
}
