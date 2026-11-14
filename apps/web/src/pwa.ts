import { useRegisterSW } from 'virtual:pwa-register/react';

const STUNDE = 60 * 60 * 1000;

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
  return {
    neu,
    laden: () => void updateServiceWorker(true),
    schliessen: () => setNeu(false),
  };
}
