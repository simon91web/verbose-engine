import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, History, Laptop, MapPin, Moon, RefreshCw, Smartphone, Tablet, Undo2, X, Info } from 'lucide-react';
import { WAREN } from '@lichtung/spiel';
import type { Seite, StandInfo } from '../abgleich';
import * as api from '../api';
import { zahl, zeitpunktText } from '../anzeige';
import { geraetSymbolName } from '../geraet';
import { Marke } from '../symbole';
import type { Frage } from '../useAbgleich';
import { Modal } from './Dialoge';

const GERAET_SYMBOL = { smartphone: Smartphone, tablet: Tablet, laptop: Laptop };
const GeraetBild = ({ name }: { name: string }) => {
  const S = GERAET_SYMBOL[geraetSymbolName(name)];
  return <S className="ic" />;
};

// ---------- Welchen Stand behalten? ----------

function StandKarte({ titel, info, gewaehlt, neuer, onWaehle, kartenRef }: {
  titel: string;
  info: StandInfo;
  gewaehlt: boolean;
  neuer: boolean;
  onWaehle: () => void;
  kartenRef?: (el: HTMLButtonElement | null) => void;
}) {
  const taste = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onWaehle();
    }
  };
  return (
    <button ref={kartenRef} type="button" className="stand" role="radio" aria-checked={gewaehlt} tabIndex={gewaehlt ? 0 : -1} onClick={onWaehle} onKeyDown={taste}>
      <span className="kopf-z">
        <span className="bild"><GeraetBild name={info.geraet} /></span>
        <span>
          <b>{titel}</b>
          <small>{info.geraet} · Tag {info.tag} · {zeitpunktText(info.zeit, Date.now())}</small>
        </span>
        <span className="punkt"><Check className="ic" /></span>
      </span>
      <span className="pillen">
        {info.lager.map((l) => (
          <span key={l.ware} className="pille" title={WAREN[l.ware].mehrzahl} aria-label={`${WAREN[l.ware].mehrzahl} ${l.anzahl}`}>
            <Marke art={l.ware} />
            <span className="wert">{zahl(l.anzahl)}</span>
          </span>
        ))}
      </span>
      <span className="chips">
        <span className="chip text"><MapPin className="ic" />{info.flecken === 1 ? '1 Fleck gerodet' : `${zahl(info.flecken)} Flecken gerodet`}</span>
        {neuer && <span className="chip text gut"><Check className="ic" />Neuer</span>}
      </span>
    </button>
  );
}

/** Nur mit einer Wahl zu schließen: kein Escape, kein Klick daneben. Der neuere Stand ist vorgewählt. */
export function StandWahlDialog({ frage, onWaehle }: { frage: Frage; onWaehle: (seite: Seite) => Promise<void> | void }) {
  const [wahl, setWahl] = useState<Seite>(frage.neuer);
  const [sendet, setSendet] = useState(false);
  const karten = useRef<Record<Seite, HTMLButtonElement | null>>({ lokal: null, server: null });
  useEffect(() => karten.current[frage.neuer]?.focus(), [frage.neuer]);

  const pfeil = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const neu: Seite = wahl === 'lokal' ? 'server' : 'lokal';
    setWahl(neu);
    karten.current[neu]?.focus();
  };
  const behalten = async () => {
    setSendet(true);
    await onWaehle(wahl);
  };
  const spalten: [Seite, string, StandInfo][] = [['lokal', 'Auf diesem Gerät', frage.lokal], ['server', 'Auf dem Server', frage.server]];
  return (
    <Modal titel="Welchen Stand behalten?" groesse="breit">
      <div className="unterzeile">Dieses Gerät und der Server haben verschiedene Stände.</div>
      <div className="modal-scroll">
        <div className="staende" role="radiogroup" aria-label="Stand" onKeyDown={pfeil}>
          {spalten.map(([seite, titel, info]) => (
            <StandKarte
              key={seite} titel={titel} info={info} gewaehlt={wahl === seite} neuer={frage.neuer === seite}
              onWaehle={() => setWahl(seite)} kartenRef={(el) => { karten.current[seite] = el; }}
            />
          ))}
        </div>
      </div>
      <button className="knopf haupt gross" onClick={behalten} disabled={sendet}>{sendet ? 'Wird gesichert …' : 'Diesen behalten'}</button>
      <p className="neben">Der andere bleibt als Sicherung erhalten.</p>
    </Modal>
  );
}

// ---------- Sicherungen ----------

function grundSymbol(grund: string) {
  if (grund === 'Nachtsicherung') return Moon;
  if (grund === 'Vor Wiederherstellen') return Undo2;
  if (grund === 'Vor neuem Spiel') return RefreshCw;
  const von = /^Vom (.+) überholt$/.exec(grund)?.[1];
  if (von) return GERAET_SYMBOL[geraetSymbolName(von)];
  return History;
}

type Liste = { art: 'laden' } | { art: 'fehler'; text: string } | { art: 'ok'; liste: api.SicherungInfo[] };

interface SicherungenProps {
  breit: boolean;
  onSchliessen: () => void;
  /** Gibt einen Fehlertext zurück oder null, wenn es geklappt hat (dann schließt die App den Dialog). */
  onWiederherstellen: (id: number) => Promise<string | null>;
  onSitzungVerloren: () => void;
}

/** Liste der Sicherungen: Laptop als Dialog, Handy als Blatt von unten. */
export function SicherungenDialog({ breit, onSchliessen, onWiederherstellen, onSitzungVerloren }: SicherungenProps) {
  const [liste, setListe] = useState<Liste>({ art: 'laden' });
  const [arbeitet, setArbeitet] = useState<number | null>(null);
  const [fehler, setFehler] = useState('');
  const erster = useRef<HTMLButtonElement>(null);
  const schliessen = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let weg = false;
    void api.sicherungen().then((r) => {
      if (weg) return;
      if (r.art === 'ok') setListe({ art: 'ok', liste: r.daten });
      else if (r.art === 'nichtAngemeldet') {
        onSitzungVerloren();
        setListe({ art: 'fehler', text: 'Nicht angemeldet' });
      } else setListe({ art: 'fehler', text: r.art === 'nichtErreichbar' ? 'Keine Verbindung' : r.fehler });
    });
    return () => {
      weg = true;
    };
  }, [onSitzungVerloren]);
  // Fokus: sobald die Liste da ist auf den ersten Eintrag, vorher auf „Schließen“
  useEffect(() => {
    if (liste.art === 'ok' && liste.liste.length) erster.current?.focus();
    else schliessen.current?.focus();
  }, [liste]);

  const wieder = async (id: number) => {
    setArbeitet(id);
    setFehler('');
    const f = await onWiederherstellen(id);
    // Bei Erfolg wird der Dialog von der App geschlossen
    if (f) {
      setFehler(f);
      setArbeitet(null);
    }
  };

  const jetzt = Date.now();
  const inhalt =
    liste.art === 'laden' ? <p className="text-hinweis zentriert">Wird geladen …</p>
    : liste.art === 'fehler' ? <p className="text-hinweis zentriert">{liste.text}</p>
    : liste.liste.length === 0 ? <p className="text-hinweis zentriert">Noch keine Sicherungen</p>
    : (
      <div className="sich-liste">
        {liste.liste.map((s, i) => {
          const Grund = grundSymbol(s.grund);
          return (
            <div className="sich" key={s.id}>
              <div>
                <b>{zeitpunktText(s.zeitpunkt, jetzt)}</b>
                <div className="sub"><GeraetBild name={s.geraet} />{s.geraet}{s.tag !== null ? ` · Tag ${s.tag}` : ''}</div>
                <span className="chip text"><Grund className="ic" />{s.grund}</span>
              </div>
              <button
                ref={i === 0 ? erster : undefined} className="knopf zweit klein" disabled={arbeitet !== null} onClick={() => wieder(s.id)}
                aria-label={`Stand von ${s.tag !== null ? `Tag ${s.tag} ` : ''}(${zeitpunktText(s.zeitpunkt, jetzt)}) wiederherstellen`}
              >
                {arbeitet === s.id ? 'Einen Moment …' : 'Wiederherstellen'}
              </button>
            </div>
          );
        })}
      </div>
    );
  const meldung = <div className="meldung fehler" aria-live="polite">{fehler && <><Info className="ic" /><span>{fehler}</span></>}</div>;

  return breit ? (
    <Modal titel="Sicherungen" groesse="mittel" onEsc={onSchliessen}>
      <div className="unterzeile">Der Server behält die letzten 50 Stände und je Nacht eine Sicherung</div>
      <div className="modal-scroll">{inhalt}</div>
      {meldung}
      <div className="modal-fuss"><button ref={schliessen} className="knopf zweit" onClick={onSchliessen}>Schließen</button></div>
    </Modal>
  ) : (
    <Modal titel="Sicherungen" blatt onEsc={onSchliessen}>
      <div className="sheet-kopf">
        <h2>Sicherungen</h2>
        <button ref={schliessen} className="rund" onClick={onSchliessen} aria-label="Schließen"><X className="ic" /></button>
      </div>
      <p className="neben links">Der Server behält die letzten 50 Stände und je Nacht eine Sicherung.</p>
      <div className="modal-scroll">{inhalt}</div>
      {meldung}
    </Modal>
  );
}
