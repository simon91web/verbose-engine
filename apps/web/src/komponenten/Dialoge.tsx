import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, MapPin, Moon, RotateCcw, Sun, SunMoon, Trophy } from 'lucide-react';
import { ARTEN, ROHSTOFFE, gesamtErtrag, istVorbei, type Tagwerk } from '@lichtung/spiel';
import { Marke } from '../symbole';
import { wenigerBewegung, type Stimmung } from '../umgebung';

/** Dunkler Hintergrund und Pergamentkarte mit Holzschild. */
function Modal({ titel, children, onEsc }: { titel: string; children: ReactNode; onEsc?: () => void }) {
  const [offen, setOffen] = useState(false);
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
    <div className={`ueberlage${offen ? ' offen' : ''}`}>
      <div className="scrim" onClick={onEsc} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={titel}>
        <div className="schild">{titel}</div>
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
  tag: number;
  bester: number;
  kannZurueck: boolean;
  onWeiter: () => void;
  onZurueck: () => void;
  onEinbringen: () => void;
}

export function EndeDialog({ tagwerk, tag, bester, kannZurueck, onWeiter, onZurueck, onEinbringen }: EndeProps) {
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
      <div className="unterzeile">Nordwald · Tag {tag}</div>
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

interface MenueProps {
  stimmung: Stimmung;
  bester: number;
  onStimmung: (s: Stimmung) => void;
  onRegeln: () => void;
  onNeu: () => void;
  onSchliessen: () => void;
}

const STIMMUNGEN: [Stimmung, string, typeof Sun][] = [['tag', 'Tag', Sun], ['abend', 'Abend', Moon], ['geraet', 'Gerät', SunMoon]];

export function Menue({ stimmung, bester, onStimmung, onRegeln, onNeu, onSchliessen }: MenueProps) {
  const ref = useRef<HTMLDivElement>(null);
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
  return (
    <div className="menue karte" ref={ref} role="menu" aria-label="Menü">
      <h4>Stimmung</h4>
      <div className="segment" role="radiogroup" aria-label="Stimmung">
        {STIMMUNGEN.map(([wert, name, Symbol]) => (
          <button key={wert} role="radio" aria-checked={stimmung === wert} className={stimmung === wert ? 'an' : ''} onClick={() => onStimmung(wert)}>
            <Symbol className="ic" />{name}
          </button>
        ))}
      </div>
      <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onRegeln(); }}><BookOpen className="ic" />Spielregeln</button>
      <button className="menue-zeile" role="menuitem" onClick={() => { onSchliessen(); onNeu(); }}><RotateCcw className="ic" />Neu beginnen</button>
      {bester > 0 && <div className="menue-fuss"><Trophy className="ic" />Bester Tag: {bester}</div>}
    </div>
  );
}
