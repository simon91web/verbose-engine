import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ARTEN, SIEDLER, ernten, faehigkeit, istVorbei,
  type Art, type Bericht, type SiedlerId, type Tagwerk, type Zelle, type Zug,
} from '@lichtung/spiel';

export type Ton = '' | 'gold' | 'leise';
export interface Meldung {
  symbol: Art | 'haken' | 'zurueck' | 'funken' | 'pokal';
  text: string;
  ton?: Ton;
}
export interface Hinweis {
  text: string;
  symbol?: 'haken' | 'mond' | 'hammer' | 'zurueck' | 'info';
  /** Wie lange der Hinweis steht (ms); sonst 4 s. */
  dauer?: number;
  aktion?: { text: string; tun: () => void };
}

/** Pause zwischen Ernten/Nachfallen und Hüpfen/Reifen – so sieht man beides nacheinander. */
const NACHLAUF = 260;
const ZURUECK_MAX = 30;

const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

function meldungZu(b: Bericht): Meldung {
  if (b.typ === 'faehigkeit') {
    const s = SIEDLER[b.siedler];
    const text =
      b.siedler === 'ida' ? `${s.faehigkeit}: Holz +${b.wert}`
      : b.siedler === 'jonas' ? `${s.faehigkeit}: ${anzahl(b.wert, 'Kachel reift', 'Kacheln reifen')}`
      : `${s.faehigkeit}: ${anzahl(b.wert, 'Hase', 'Hasen')} gefangen`;
    return { symbol: 'funken', text, ton: 'gold' };
  }
  if (b.zielErreicht) return { symbol: 'pokal', text: 'Fleck gerodet – Ziel erreicht!', ton: 'gold' };
  const teile = [`${ARTEN[b.art].name} +${b.summe}`];
  if (b.ring) teile.push(`Ring +${b.ring}`);
  if (b.gerodet) teile.push(`${b.gerodet} Gestrüpp`);
  if (b.hasen) teile.push(anzahl(b.hasen, 'Hase', 'Hasen'));
  return { symbol: 'haken', text: teile.join(' · '), ton: b.ring || b.hasen ? 'gold' : '' };
}

/** Verlauf, Animationsdaten und Rückmeldungen eines Tagwerks. Das Tagwerk selbst gehört der Siedlung. */
export function useSpiel(
  tagwerk: Tagwerk,
  onTagwerk: (t: Tagwerk) => void,
  onEinbringen: (t: Tagwerk) => void,
  setHinweis: (h: Hinweis | null) => void,
) {
  const [verlauf, setVerlauf] = useState<Tagwerk[]>([]);
  const [geister, setGeister] = useState<Zug['entfernt']>([]);
  const [herkunft, setHerkunft] = useState<Record<number, number>>({});
  const [meldung, setMeldung] = useState<Meldung | null>(null);
  const [endeOffen, setEndeOffen] = useState(() => istVorbei(tagwerk));

  // Aktueller Stand für Handlungen direkt nach einem Zeitgeber, bevor React neu gezeichnet hat
  const aktuell = useRef(tagwerk);
  const nachlauf = useRef<{ timer: number; danach: Tagwerk } | null>(null);
  const geisterTimer = useRef(0);
  const endeTimer = useRef(0);
  const nachOben = useRef(onTagwerk);
  nachOben.current = onTagwerk;

  const setzeTagwerk = useCallback((t: Tagwerk) => {
    aktuell.current = t;
    nachOben.current(t);
  }, []);

  useEffect(() => () => {
    // Wer die Ansicht verlässt, verliert keinen wartenden Zug
    const n = nachlauf.current;
    if (n) {
      clearTimeout(n.timer);
      nachlauf.current = null;
      nachOben.current(n.danach);
    }
    clearTimeout(geisterTimer.current);
    clearTimeout(endeTimer.current);
  }, []);

  const uebernehmen = useCallback((t: Tagwerk) => {
    nachlauf.current = null;
    setzeTagwerk(t);
    if (istVorbei(t)) endeTimer.current = window.setTimeout(() => setEndeOffen(true), 350);
  }, [setzeTagwerk]);

  /** Wartenden Nachlauf sofort anwenden – vor jeder neuen Handlung. */
  const vorziehen = useCallback(() => {
    const n = nachlauf.current;
    if (!n) return;
    clearTimeout(n.timer);
    uebernehmen(n.danach);
  }, [uebernehmen]);

  const anwenden = useCallback((zug: Zug, vorher: Tagwerk) => {
    setVerlauf((v) => [...v.slice(1 - ZURUECK_MAX), vorher]);
    setHerkunft(zug.herkunft);
    setGeister(zug.entfernt);
    clearTimeout(geisterTimer.current);
    geisterTimer.current = window.setTimeout(() => setGeister([]), 260);
    setMeldung(meldungZu(zug.bericht));
    if (zug.bericht.gemischt) setHinweis({ text: 'Keine Kette mehr möglich – neu gemischt', symbol: 'info' });
    if (zug.danach === zug.zwischen) {
      uebernehmen(zug.danach);
      return;
    }
    setzeTagwerk(zug.zwischen);
    nachlauf.current = { timer: window.setTimeout(() => uebernehmen(zug.danach), NACHLAUF), danach: zug.danach };
  }, [setzeTagwerk, uebernehmen, setHinweis]);

  const ernte = useCallback((pfad: Zelle[]) => {
    vorziehen();
    const vorher = aktuell.current;
    const e = ernten(vorher, pfad);
    if (!e.ok) return setMeldung({ symbol: 'haken', text: e.grund, ton: 'leise' });
    anwenden(e.wert, vorher);
  }, [vorziehen, anwenden]);

  const setzeEin = useCallback((id: SiedlerId) => {
    vorziehen();
    const vorher = aktuell.current;
    const e = faehigkeit(vorher, id);
    if (!e.ok) return setMeldung({ symbol: SIEDLER[id].laedt, text: e.grund, ton: 'leise' });
    anwenden(e.wert, vorher);
  }, [vorziehen, anwenden]);

  const zurueck = useCallback(() => {
    if (!verlauf.length) return;
    if (nachlauf.current) clearTimeout(nachlauf.current.timer);
    nachlauf.current = null;
    clearTimeout(endeTimer.current);
    setzeTagwerk(verlauf[verlauf.length - 1]);
    setVerlauf(verlauf.slice(0, -1));
    setHerkunft({});
    setGeister([]);
    setEndeOffen(false);
    setMeldung({ symbol: 'zurueck', text: 'Letzte Kette zurückgenommen' });
  }, [verlauf, setzeTagwerk]);

  const heimkehren = useCallback(() => {
    vorziehen();
    setEndeOffen(true);
  }, [vorziehen]);

  const einbringen = useCallback(() => {
    vorziehen();
    onEinbringen(aktuell.current);
  }, [vorziehen, onEinbringen]);

  return {
    tagwerk, geister, herkunft, meldung, endeOffen,
    kannZurueck: verlauf.length > 0,
    aktuellesTagwerk: () => aktuell.current,
    vorziehen, ernte, setzeEin, zurueck, heimkehren, einbringen,
    setMeldung, schliesseEnde: () => setEndeOffen(false),
  };
}

export type Spiel = ReturnType<typeof useSpiel>;
