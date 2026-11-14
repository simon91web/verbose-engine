import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { BookOpen, Check, ChevronRight, CloudCheck, CloudOff, HardDrive, History, Laptop, LogIn, LogOut, MapPin, Moon, Pencil, RefreshCw, RotateCcw, Smartphone, Sun, SunMoon, Tablet, Trophy, Lock } from 'lucide-react';
import { ARTEN, ROHSTOFFE, WAREN, WAREN_LISTE, gesamtErtrag, istVorbei, type Lager, type Tagwerk } from '@lichtung/spiel';
import { zahl, vorZeit } from '../anzeige';
import { NAME_MAX, geraetSymbolName } from '../geraet';
import type { Status } from '../useAbgleich';
import { Marke } from '../symbole';
import { wenigerBewegung, type Stimmung } from '../umgebung';

interface ModalProps {
  titel: string;
  children: ReactNode;
  /** Escape und Klick daneben; fehlt es, schließt der Dialog nur über seine Knöpfe. */
  onEsc?: () => void;
  groesse?: 'mittel' | 'breit';
  /** Blatt von unten (Handy) statt Karte mit Holzschild; der Inhalt bringt seine Kopfzeile mit. */
  blatt?: boolean;
}

/** Dunkler Hintergrund und Pergamentkarte mit Holzschild. */
export function Modal({ titel, children, onEsc, groesse, blatt = false }: ModalProps) {
  const [offen, setOffen] = useState(false);
  // Beim Schließen kehrt der Fokus dorthin zurück, wo der Dialog aufging
  useEffect(() => {
    const vorher = document.activeElement as HTMLElement | null;
    return () => vorher?.focus?.({ preventScroll: true });
  }, []);
  useEffect(() => {
    const r = requestAnimationFrame(() => setOffen(true));
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && onEsc?.();
    window.addEventListener('keydown', taste);
    return () => {
      cancelAnimationFrame(r);
      window.removeEventListener('keydown', taste);
    };
  }, [onEsc]);
  return (
    <div className={`ueberlage${offen ? ' offen' : ''}${groesse ? ` ${groesse}` : ''}${blatt ? ' blatt-unten' : ''}`}>
      <div className="scrim" onClick={onEsc} />
      <div className={`modal${blatt ? ' sheet' : ''}`} role="dialog" aria-modal="true" aria-label={titel}>
        {blatt ? <div className="halter" /> : <div className="schild">{titel}</div>}
        {children}
      </div>
    </div>
  );
}

function Hochzaehlen({ wert, plus }: { wert: number; plus?: boolean }) {
  const [n, setN] = useState(wenigerBewegung() ? wert : 0);
  useEffect(() => {
    if (wenigerBewegung()) return setN(wert);
    const t0 = performance.now();
    let r = 0;
    const schritt = (jetzt: number) => {
      const p = Math.min(1, (jetzt - t0) / 700);
      setN(Math.round(wert * (1 - Math.pow(1 - p, 3))));
      if (p < 1) r = requestAnimationFrame(schritt);
    };
    r = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(r);
  }, [wert]);
  return <>{plus ? `+${n}` : n}</>;
}

interface EndeProps {
  tagwerk: Tagwerk;
  /** Name des Flecks, an dem das Tagwerk lief. */
  ort: string;
  tag: number;
  bester: number;
  kannZurueck: boolean;
  onWeiter: () => void;
  onZurueck: () => void;
  onEinbringen: () => void;
}

export function EndeDialog({ tagwerk, ort, tag, bester, kannZurueck, onWeiter, onZurueck, onEinbringen }: EndeProps) {
  const fertig = istVorbei(tagwerk);
  const gesamt = gesamtErtrag(tagwerk);
  const [bringt, setBringt] = useState(false);
  const haupt = useRef<HTMLButtonElement>(null);
  useEffect(() => haupt.current?.focus(), []);
  const einbringen = () => {
    setBringt(true);
    setTimeout(onEinbringen, 600);
  };
  return (
    <Modal titel="Tagwerk beendet" onEsc={fertig ? undefined : onWeiter}>
      <div className="unterzeile">{ort} · Tag {tag}</div>
      <div className="ertrag-raster">
        {[...ROHSTOFFE, 'hase' as const].map((art) => (
          <div className="er" key={art}>
            <Marke art={art} groesse="g" />
            <b><Hochzaehlen wert={tagwerk.ertrag[art]} plus={art !== 'hase'} /></b>
            <span>{ARTEN[art].mehrzahl}</span>
          </div>
        ))}
      </div>
      <div className="liste vertieft">
        <div className="zeile"><Marke art="gestruepp" groesse="m" /><span>Gestrüpp gerodet</span><span className="wert">{tagwerk.gerodetHeute}</span></div>
        <div className="zeile"><MapPin className="ic" /><span>Ziel des Flecks</span><span className="wert">{tagwerk.ziel.stand} / {tagwerk.ziel.gesamt}</span></div>
        <div className="zeile">
          <Trophy className="ic" />
          <span>Ertrag gesamt</span>
          <span className="wert">{gesamt > bester && bester > 0 ? <span className="chip gold">Neuer Bestwert</span> : null} {gesamt}</span>
        </div>
      </div>
      <div className="modal-fuss">
        <button className="knopf zweit" disabled={fertig && !kannZurueck} title={fertig && !kannZurueck ? 'Noch keine Kette' : undefined} onClick={fertig ? onZurueck : onWeiter}>
          {fertig ? 'Letzte Kette zurück' : 'Weiterspielen'}
        </button>
        <button ref={haupt} className="knopf haupt breit-fest" disabled={bringt} onClick={einbringen}>
          {bringt ? 'Wird eingebracht …' : 'Ertrag einbringen'}
        </button>
      </div>
    </Modal>
  );
}

export function RegelnDialog({ onSchliessen }: { onSchliessen: () => void }) {
  const knopf = useRef<HTMLButtonElement>(null);
  useEffect(() => knopf.current?.focus(), []);
  return (
    <Modal titel="So geht's" onEsc={onSchliessen}>
      <ul className="regeln">
        <li><Marke art="holz" /><span>Ziehe über <b>mindestens drei gleiche</b> Nachbarn. Zurückziehen nimmt die letzte wieder heraus.</span></li>
        <li><Marke art="nuesse" /><span>Der Ertrag ist die Summe der <b>goldenen Punkte</b>. Nach jedem Schritt reifen drei Kacheln.</span></li>
        <li><Marke art="kraeuter" /><span>Schließt deine Kette einen <b>Ring</b>, erntest du alles darin doppelt.</span></li>
        <li><Marke art="hase" /><span><b>Hasen</b> hüpfen und fressen Reife. Fangen kannst du sie nur im Ring.</span></li>
        <li><Marke art="gestruepp" /><span><b>Gestrüpp</b> neben einer Kette wird gerodet – das ist das Ziel des Flecks.</span></li>
        <li><Marke art="beeren" /><span>Volle <b>Porträts</b> leuchten: antippen setzt die Fähigkeit ein, ohne Schritt.</span></li>
      </ul>
      <p className="tasten">Tastatur: Pfeile · Leertaste wählt · Enter erntet · Strg Z nimmt zurück</p>
      <div className="modal-fuss">
        <button ref={knopf} className="knopf haupt" onClick={onSchliessen}>Los geht's</button>
      </div>
    </Modal>
  );
}

const GRUPPEN: [string, 'rohstoff' | 'ware' | 'proviant'][] = [['Rohstoffe', 'rohstoff'], ['Waren', 'ware'], ['Proviant', 'proviant']];

/** Alles im Lager, nach Rohstoffen, Waren und Proviant geordnet. */
export function LagerDialog({ lager, tag, onSchliessen }: { lager: Lager; tag: number; onSchliessen: () => void }) {
  const knopf = useRef<HTMLButtonElement>(null);
  useEffect(() => knopf.current?.focus(), []);
  return (
    <Modal titel="Lager" onEsc={onSchliessen}>
      <div className="unterzeile">Tag {tag}</div>
      <div className="modal-scroll">
        {GRUPPEN.map(([name, gruppe]) => (
          <section key={gruppe}>
            <h4 className="gr">{name}</h4>
            <div className="liste vertieft lg">
              {WAREN_LISTE.filter((w) => WAREN[w].gruppe === gruppe).map((w) => (
                <div className="zeile" key={w}><Marke art={w} groesse="m" /><span>{WAREN[w].mehrzahl}</span><span className="wert">{zahl(lager[w])}</span></div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="modal-fuss">
        <button ref={knopf} className="knopf zweit" onClick={onSchliessen}>Schließen</button>
      </div>
    </Modal>
  );
}

interface MenueProps {
  stimmung: Stimmung;
  bester: number;
  status: Status;
  gespeichertUm: number | null;
  geraet: string;
  onStimmung: (s: Stimmung) => void;
  onRegeln: () => void;
  onSicherungen: () => void;
  onGeraet: (name: string) => void;
  onAbmelden: () => void;
  onAnmelden: () => void;
  onNeu: () => void;
  onSchliessen: () => void;
}

const STIMMUNGEN: [Stimmung, string, typeof Sun][] = [['tag', 'Tag', Sun], ['abend', 'Abend', Moon], ['geraet', 'Gerät', SunMoon]];

/** Text zum Speicherstatus; derselbe in der festen Zeile im Menü und im Hinweis der Wolke im Kopf. */
export function statusText(status: Status, um: number | null, jetzt: number): string {
  switch (status) {
    case 'gespeichert': return um === null ? 'Gespeichert' : `Gespeichert · ${vorZeit(um, jetzt)}`;
    case 'speichert': return 'Speichert …';
    case 'offline': return 'Offline – wird später hochgeladen';
    case 'abgemeldet': return 'Nicht angemeldet';
    case 'fehler': return 'Nicht gespeichert – neuer Versuch folgt';
    case 'lokal': return 'Nur auf diesem Gerät';
  }
}

const STATUS_SYMBOL = { gespeichert: CloudCheck, speichert: RefreshCw, offline: CloudOff, abgemeldet: Lock, fehler: CloudOff, lokal: HardDrive };
const GERAET_SYMBOL = { smartphone: Smartphone, tablet: Tablet, laptop: Laptop };

/** Alle 20 s neu, damit „vor 3 Min.“ stimmt, solange das Menü offen ist. */
function useJetzt(): number {
  const [jetzt, setJetzt] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setJetzt(Date.now()), 20_000);
    return () => clearInterval(t);
  }, []);
  return jetzt;
}

export function Menue({ stimmung, bester, status, gespeichertUm, geraet, onStimmung, onRegeln, onSicherungen, onGeraet, onAbmelden, onAnmelden, onNeu, onSchliessen }: MenueProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [umbenennen, setUmbenennen] = useState(false);
  const jetzt = useJetzt();
  const eingabe = useRef<HTMLInputElement>(null);
  const umbenennenKnopf = useRef<HTMLButtonElement>(null);
  const nachUmbenennen = useRef(false);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const weg = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node) && !(e.target as Element).closest('.js-menue')) onSchliessen();
    };
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && onSchliessen();
    window.addEventListener('pointerdown', weg);
    window.addEventListener('keydown', taste);
    return () => {
      window.removeEventListener('pointerdown', weg);
      window.removeEventListener('keydown', taste);
    };
  }, [onSchliessen]);
  useEffect(() => {
    if (umbenennen) {
      eingabe.current?.focus();
      eingabe.current?.select();
    } else if (nachUmbenennen.current) {
      nachUmbenennen.current = false;
      umbenennenKnopf.current?.focus();
    }
  }, [umbenennen]);

  const speichern = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = eingabe.current?.value.trim();
    if (n) onGeraet(n);
    nachUmbenennen.current = true;
    setUmbenennen(false);
  };
  const StatusSymbol = STATUS_SYMBOL[status];
  const GeraetSymbol = GERAET_SYMBOL[geraetSymbolName(geraet)];
  const imKonto = status === 'gespeichert' || status === 'speichert' || status === 'fehler';
  return (
    <div className="menue karte" ref={ref} role="menu" aria-label="Menü">
      <div className={`status ${status}`} role="status">
        <StatusSymbol className={`ic${status === 'speichert' ? ' dreht' : ''}`} />
        <span>{statusText(status, gespeichertUm, jetzt)}</span>
      </div>
      <h4>Stimmung</h4>
      <div className="segment" role="radiogroup" aria-label="Stimmung">
        {STIMMUNGEN.map(([wert, name, Symbol]) => (
          <button key={wert} role="radio" aria-checked={stimmung === wert} className={stimmung === wert ? 'an' : ''} onClick={() => onStimmung(wert)}>
            <Symbol className="ic" />{name}
          </button>
        ))}
      </div>
      <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onRegeln(); }}><BookOpen className="ic" />Spielregeln</button>
      {status !== 'lokal' && (
        <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onSicherungen(); }}>
          <History className="ic" />Sicherungen<span className="ende"><ChevronRight className="ic" /></span>
        </button>
      )}
      {umbenennen ? (
        <form className="umb" onSubmit={speichern} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); nachUmbenennen.current = true; setUmbenennen(false); } }}>
          <GeraetSymbol className="ic" />
          <input ref={eingabe} name="geraet" defaultValue={geraet} maxLength={NAME_MAX} aria-label="Name dieses Geräts" autoComplete="off" />
          <button className="rund" type="submit" aria-label="Name übernehmen"><Check className="ic" /></button>
        </form>
      ) : (
        <button ref={umbenennenKnopf} className="menue-zeile" role="menuitem" aria-label={`Dieses Gerät: ${geraet}, Namen ändern`} onClick={() => setUmbenennen(true)}>
          <GeraetSymbol className="ic" /><span>Dieses Gerät: <b>{geraet}</b></span><span className="ende"><Pencil className="ic" /></span>
        </button>
      )}
      {(imKonto || status === 'abgemeldet') && <div className="menue-trenn" />}
      {imKonto && <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onAbmelden(); }}><LogOut className="ic" />Abmelden</button>}
      {status === 'abgemeldet' && <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onAnmelden(); }}><LogIn className="ic" />Anmelden</button>}
      <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onNeu(); }}><RotateCcw className="ic" />Neues Spiel</button>
      {bester > 0 && <div className="menue-fuss"><Trophy className="ic" />Bester Tag: {zahl(bester)}</div>}
    </div>
  );
}
