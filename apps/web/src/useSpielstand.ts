import { useCallback, useEffect, useRef, useState } from 'react';
import { laden, neuerSpielstand, speichern, type Spielstand } from './spielstand';

/** Laden, Speichern und Ändern des Spielstands. `aktuell` liefert immer den neuesten Stand, auch aus Zeitgebern. */
export function useSpielstand() {
  const [ersterStart] = useState(() => laden() === null);
  const [stand, setStand] = useState<Spielstand>(() => laden() ?? neuerSpielstand());
  const [speicherFehler, setSpeicherFehler] = useState(false);
  const neuester = useRef(stand);

  const setze = useCallback((s: Spielstand) => {
    neuester.current = s;
    setStand(s);
  }, []);
  const aendere = useCallback((f: (s: Spielstand) => Spielstand) => setze(f(neuester.current)), [setze]);
  const aktuell = useCallback(() => neuester.current, []);

  useEffect(() => {
    setSpeicherFehler(!speichern(stand));
  }, [stand]);

  return { stand, ersterStart, speicherFehler, setze, aendere, aktuell };
}
