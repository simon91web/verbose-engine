import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { Check, CircleCheck, House, Sparkles, Sprout, Trophy, Undo2 } from 'lucide-react';
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

/** Kurze Nachricht unten in der Mitte; schließt nach 4 s. */
export function Toast({ hinweis, onSchliessen }: { hinweis: Hinweis | null; onSchliessen: () => void }) {
  const zuletzt = useRef(hinweis);
  if (hinweis) zuletzt.current = hinweis;
  useEffect(() => {
    if (!hinweis) return;
    const t = setTimeout(onSchliessen, 4000);
    return () => clearTimeout(t);
  }, [hinweis, onSchliessen]);
  const h = zuletzt.current;
  return (
    <div className={`toast${hinweis ? ' zeigen' : ''}`} role="status">
      <CircleCheck className="ic" />
      <span>{h?.text}</span>
      {h?.aktion && <button className="link" onClick={h.aktion.tun}>{h.aktion.text}</button>}
    </div>
  );
}
