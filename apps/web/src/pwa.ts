import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const STUNDE = 60 * 60 * 1000;

const MERKER = 'lichtung.neuladen';
/** Wie lange ein Neuladen als „gerade versucht“ gilt: kommt danach wieder die alte Version, hängt es. */
const MERKER_FRIST = 2 * 60 * 1000;
/** Sicherheitsnetz: dauert das Holen der neuen Version länger, wird einfach neu geladen. */
const HOLEN_MAX = 15_000;

export type NeuLadenZustand = 'bereit' | 'laedt' | 'haengt';

/** Vor dem Neuladen gesetzt (sessionStorage überlebt das Neuladen, nicht das Schließen der App). */
const merkerSetzen = () => {
  try {
    sessionStorage.setItem(MERKER, String(Date.now()));
  } catch {
    // ohne Speicher gibt es keine Erkennung von „hängt“
  }
};
const merkerFrisch = (): boolean => {
  try {
    const t = Number(sessionStorage.getItem(MERKER));
    return t > 0 && Date.now() - t < MERKER_FRIST;
  } catch {
    return false;
  }
};
const merkerLoeschen = () => {
  try {
    sessionStorage.removeItem(MERKER);
  } catch {
    // nichts zu löschen
  }
};

/** Wartet, bis ein neuer Service Worker installiert (oder gescheitert) ist. */
const bisInstalliert = (sw: ServiceWorker) =>
  new Promise<void>((fertig) => {
    const pruefen = () => {
      if (sw.state === 'installed' || sw.state === 'activated' || sw.state === 'redundant') fertig();
    };
    sw.addEventListener('statechange', pruefen);
    pruefen();
  });

/**
 * Service Worker des Spiels (nur im Bau, im Dev-Server ist er aus). Eine neue Version wird nie von allein geladen,
 * damit nicht mitten in einer Kette neu gestartet wird: `neu` zeigt den Hinweis, `laden` aktiviert sie.
 */
export function useNeueVersion() {
  const { needRefresh: [neu, setNeu], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registrierung) {
      if (!registrierung) return;
      // Stündlich und beim Zurückkehren nachsehen; sonst merkt es ein geöffnetes Spiel tagelang nicht
      const pruefen = () => void registrierung.update().catch(() => undefined);
      setInterval(pruefen, STUNDE);
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && pruefen());
    },
  });
  // Zustand des „Neu laden“ in der Sperre: kam nach einem Neuladen wieder die alte Version, hängt es
  const [neuLaden, setNeuLaden] = useState<NeuLadenZustand>(() => (merkerFrisch() ? 'haengt' : 'bereit'));

  /** Neue Version holen und aktivieren; ohne Service Worker (Dev) oder wenn nichts Neues da ist: einfach neu laden. */
  const holen = async () => {
    setNeuLaden('laedt');
    merkerSetzen();
    setTimeout(() => location.reload(), HOLEN_MAX);
    try {
      const registrierung = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
      if (!registrierung) return location.reload();
      await registrierung.update();
      if (registrierung.installing) await bisInstalliert(registrierung.installing);
      // Aktiviert den wartenden Worker und lädt danach selbst neu
      if (registrierung.waiting) await updateServiceWorker(true);
      else location.reload();
    } catch {
      location.reload();
    }
  };

  return {
    neu,
    laden: () => void updateServiceWorker(true),
    schliessen: () => setNeu(false),
    neuLaden,
    holen: () => void holen(),
    /** Die Version stimmt wieder: der Merker vom letzten Neuladen ist erledigt. */
    neuGeladen: merkerLoeschen,
  };
}
