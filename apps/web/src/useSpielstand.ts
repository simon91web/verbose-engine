import { useCallback, useEffect, useRef, useState } from 'react';
import { DATENVERSION, ladenGenau, neuerSpielstand, speichern, type Spieldaten, type Spielstand } from './spielstand';

export type Abgleichsfelder = Partial<Pick<Spielstand, 'revision' | 'ungespeichert'>>;

/**
 * Laden, Speichern und Ändern des Spielstands auf diesem Gerät. `aktuell` liefert immer den neuesten Stand, auch aus Zeitgebern.
 * Jede Spieländerung (`setze`, `aendere`) merkt sich den Zeitpunkt und dass der Server sie noch nicht kennt.
 * Was vom Server kommt, geht über `uebernehmen`; `epoche` zählt diese Wechsel, damit Ansichten mit eigenem Verlauf neu anfangen.
 */
export function useSpielstand() {
  // Ein Stand von einer neueren App wird weder verworfen noch überschrieben: die App sperrt sich (`lokalZuNeu`)
  const [start] = useState(ladenGenau);
  const ersterStart = start.art === 'leer';
  const lokalZuNeu = start.art === 'zuNeu';
  const [stand, setStand] = useState<Spielstand>(() => (start.art === 'ok' ? start.stand : neuerSpielstand()));
  const [speicherFehler, setSpeicherFehler] = useState(false);
  const [epoche, setEpoche] = useState(0);
  const neuester = useRef(stand);
  const epocheRef = useRef(0);

  const ablegen = useCallback((s: Spielstand) => {
    neuester.current = s;
    setStand(s);
  }, []);

  const setze = useCallback((s: Spielstand) => {
    const alt = neuester.current;
    // Revision gehört dem Abgleich, nicht dem Spiel; die Zeit steigt immer, auch bei zwei Änderungen in derselben Millisekunde
    ablegen({ ...s, revision: alt.revision, geaendert: Math.max(Date.now(), alt.geaendert + 1), ungespeichert: true });
  }, [ablegen]);
  const aendere = useCallback((f: (s: Spielstand) => Spielstand) => setze(f(neuester.current)), [setze]);
  const aktuell = useCallback(() => neuester.current, []);

  /** Nur Abgleichsfelder ändern (Revision nach dem Speichern); zählt nicht als Spieländerung. */
  const merke = useCallback((patch: Abgleichsfelder) => {
    ablegen({ ...neuester.current, ...patch });
  }, [ablegen]);

  /** Spiel vom Server übernehmen: nichts ist ungespeichert, ein laufender Verlauf wird verworfen. */
  const uebernehmen = useCallback((spiel: Spieldaten, revision: number, geaendert: number) => {
    ablegen({ version: DATENVERSION, siedlung: spiel.siedlung, bester: spiel.bester, revision, geaendert, ungespeichert: false });
    epocheRef.current += 1;
    setEpoche(epocheRef.current);
  }, [ablegen]);

  useEffect(() => {
    setSpeicherFehler(!speichern(stand));
  }, [stand]);

  const epocheAktuell = useCallback(() => epocheRef.current, []);

  return { stand, ersterStart, lokalZuNeu, speicherFehler, epoche, epocheAktuell, setze, aendere, aktuell, merke, uebernehmen };
}
