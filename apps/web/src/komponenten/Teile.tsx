import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Check, CircleCheck, CloudCheck, CloudOff, Hammer, History, House, Info, Moon, Sparkles, Sprout, Trophy, Undo2, X } from 'lucide-react';
import { ARTEN, SIEDLER, faehigkeitPruefen, type SiedlerId, type Tagwerk } from '@lichtung/spiel';
import { Marke, SIEDLER_FARBE } from '../symbole';
import type { Hinweis, Meldung } from '../useSpiel';

export function Wortmarke({ nurZeichen = false }: { nurZeichen?: boolean }) {
  return (
    <span className="wortmarke" aria-label="Lichtung">
      <span className="zeichen"><Sprout /></span>
      {!nurZeichen && 'Lichtung'}
    </span>
  );
}

export function Medaille({ schritte, gross = false }: { schritte: number; gross?: boolean }) {
  return (
    <div className={`medaille${gross ? ' gross' : ''}${schritte <= 3 ? ' knapp' : ''}`} role="status" aria-label={`${schritte} Schritte übrig`}>
      <b>{schritte}</b>
      <span>Schritte</span>
    </div>
  );
}

/** Gestrüpp-Ziel eines Flecks: Marke, Stand und Leiste. */
export function GestruepZiel({ stand, gesamt, eben = false }: { stand: number; gesamt: number; eben?: boolean }) {
  return (
    <div className={`zielband${eben ? ' eben' : ''}`}>
      <div className="z1">
        <Marke art="gestruepp" />
        <span>Gestrüpp roden</span>
        <span className="wert">{gesamt > 0 && stand >= gesamt ? <><Check className="ic klein" /> {gesamt}</> : `${stand} / ${gesamt}`}</span>
      </div>
      <div className="spur"><i style={{ width: `${gesamt > 0 ? Math.min(100, (stand / gesamt) * 100) : 0}%` }} /></div>
    </div>
  );
}

export function Zielband({ tagwerk, flach = false }: { tagwerk: Tagwerk; flach?: boolean }) {
  const { stand, gesamt } = tagwerk.ziel;
  return (
    <div className={`zielband${flach ? ' flach' : ''}`}>
      <div className="z1">
        <Marke art="gestruepp" />
        <span>Gestrüpp roden</span>
        <span className="wert">{stand >= gesamt ? <><Check className="ic klein" /> {gesamt}</> : `${stand} / ${gesamt}`}</span>
      </div>
      <div className="spur"><i style={{ width: `${(stand / gesamt) * 100}%` }} /></div>
    </div>
  );
}

/** Zahl, die kurz anstößt, wenn sie steigt. */
export function useAnstoss<T extends HTMLElement>(wert: number) {
  const ref = useRef<T>(null);
  const vorher = useRef(wert);
  useEffect(() => {
    const el = ref.current;
    if (el && wert > vorher.current) {
      el.classList.remove('stoss');
      void el.offsetWidth;
      el.classList.add('stoss');
    }
    vorher.current = wert;
  }, [wert]);
  return ref;
}

const SYMBOL_MELDUNG = { haken: Check, zurueck: Undo2, funken: Sparkles, pokal: Trophy };

/** Rückmeldung über dem Brett – fester Platz, damit nichts springt. */
export function Blase({ meldung }: { meldung: Meldung | null }) {
  let symbol: ReactNode = null;
  if (meldung) {
    if (meldung.symbol in SYMBOL_MELDUNG) {
      const S = SYMBOL_MELDUNG[meldung.symbol as keyof typeof SYMBOL_MELDUNG];
      symbol = <S className="ic" />;
    } else symbol = <Marke art={meldung.symbol as keyof typeof ARTEN} groesse="m" />;
  }
  return (
    <div className="blase" aria-live="polite">
      <div className={`blase-inhalt${meldung ? '' : ' leer'}${meldung?.ton ? ` ${meldung.ton}` : ''}`}>
        {symbol}
        <span>{meldung?.text}</span>
      </div>
    </div>
  );
}

const UMFANG = 172.8;

/** Siedler mit Ladering: voll und einsetzbar leuchtet er, Antippen setzt die Fähigkeit ein. */
export function Mitglied({ id, tagwerk, zeilig, onEinsetzen }: { id: SiedlerId; tagwerk: Tagwerk; zeilig?: boolean; onEinsetzen: (id: SiedlerId) => void }) {
  const s = SIEDLER[id];
  const ladung = tagwerk.ladung[id];
  const voll = ladung >= s.voll;
  const pruefung = faehigkeitPruefen(tagwerk, id);
  const titel = pruefung.ok ? `${s.faehigkeit}: ${s.beschreibung} · kostet keinen Schritt` : pruefung.grund;
  return (
    <button
      className={`mitglied${zeilig ? ' zeilig' : ''}${pruefung.ok ? ' bereit' : ''}`}
      style={{ '--p': SIEDLER_FARBE[id] } as CSSProperties}
      title={titel}
      aria-label={`${s.name}, ${s.beruf}. ${titel}`}
      onClick={() => onEinsetzen(id)}
    >
      <span className="portrait">
        <svg className="ladering" viewBox="0 0 60 60" aria-hidden="true">
          <circle className="ring-bg" cx="30" cy="30" r="27.5" />
          <circle className="ring-wert" cx="30" cy="30" r="27.5" strokeDasharray={UMFANG} strokeDashoffset={(UMFANG * (1 - Math.min(1, ladung / s.voll))).toFixed(1)} />
        </svg>
        <span className="gesicht">{s.name[0]}</span>
      </span>
      <span className="name">
        {s.name}
        {zeilig && <span className="beruf"> · {s.beruf}</span>}
      </span>
      <span className="faeh">{voll ? s.faehigkeit : `${ladung}/${s.voll}`}</span>
    </button>
  );
}

export function HeimKnopf({ onClick }: { onClick: () => void }) {
  return (
    <button className="mitglied" onClick={onClick} title="Tagwerk jetzt beenden und den Ertrag einbringen">
      <span className="portrait heim"><span className="gesicht"><House /></span></span>
      <span className="name">Heimkehren</span>
    </button>
  );
}

const SYMBOL_TOAST = { haken: CircleCheck, mond: Moon, hammer: Hammer, zurueck: Undo2, info: Info, wolke: CloudCheck, wolkeAus: CloudOff, verlauf: History, neu: Sparkles };

/** Kurze Nachricht unten in der Mitte; schließt nach 4 s, wenn nichts anderes gilt. Mit `dauer: 0` bleibt sie stehen und hat ein Kreuz. */
export function Toast({ hinweis, onSchliessen }: { hinweis: Hinweis | null; onSchliessen: () => void }) {
  const zuletzt = useRef(hinweis);
  if (hinweis) zuletzt.current = hinweis;
  useEffect(() => {
    if (!hinweis || hinweis.dauer === 0) return;
    const t = setTimeout(onSchliessen, hinweis.dauer ?? 4000);
    return () => clearTimeout(t);
  }, [hinweis, onSchliessen]);
  const h = zuletzt.current;
  const Symbol = SYMBOL_TOAST[h?.symbol ?? 'haken'];
  return (
    <div className={`toast${hinweis ? ' zeigen' : ''}${h?.dauer === 0 ? ' fest' : ''}`} role="status">
      <Symbol className="ic" />
      <span>{h?.text}</span>
      {h?.aktion && <button className="link" onClick={() => { h.aktion?.tun(); if (h.dauer === 0) onSchliessen(); }}>{h.aktion.text}</button>}
      {h?.dauer === 0 && <button className="link zu" onClick={onSchliessen} aria-label="Hinweis schließen" title="Schließen"><X className="ic" /></button>}
    </div>
  );
}

/** Reservierter Platz im Kopf: die Wolke erscheint nur, wenn nicht gespeichert werden kann; Antippen nennt den Grund. */
export function SyncPlatz({ zeigen, text, onKlick }: { zeigen: boolean; text: string; onKlick: () => void }) {
  return (
    <span className="sync-platz">
      {zeigen && (
        <button type="button" className="sync-knopf" onClick={onKlick} title={text} aria-label={text}>
          <CloudOff className="ic" />
        </button>
      )}
    </span>
  );
}
