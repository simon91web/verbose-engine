import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { Check, CloudOff, Copy, Eye, EyeOff, Info, Lock } from 'lucide-react';
import type { FormErgebnis } from '../useAbgleich';
import { Wortmarke } from './Teile';

/** Einrichten und Anmelden: eine Pergamentkarte auf dem Hintergrund. Fehler stehen an festem Platz unter dem Feld. */

/** Das Feld „Benutzer“ gibt es nicht; Passwortmanager wollen trotzdem einen Namen. */
const NameFuerManager = () => (
  <input className="versteckt" type="text" name="benutzer" autoComplete="username" defaultValue="lichtung" readOnly tabIndex={-1} aria-hidden="true" />
);

const zeit = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Zählt von `start` Sekunden herunter; 0 = nicht aktiv. */
function useWarten(): [number, (s: number) => void] {
  const [rest, setRest] = useState(0);
  const aktiv = rest > 0;
  useEffect(() => {
    if (!aktiv) return;
    const t = setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [aktiv]);
  return [rest, setRest];
}

function Hilfe({ id, text, art }: { id: string; text?: ReactNode; art?: 'fehler' | 'gut' }) {
  return (
    <div className={`hilfe${art ? ` ${art}` : ''}`} id={id} aria-live="polite">
      {text ? <>{art === 'gut' ? <Check className="ic" /> : art === 'fehler' ? <Info className="ic" /> : null}<span>{text}</span></> : null}
    </div>
  );
}

interface PasswortProps {
  id: string;
  name: string;
  label: string;
  autoComplete: 'new-password' | 'current-password';
  value: string;
  onChange: (v: string) => void;
  hilfe: string;
  ungueltig: boolean;
  feldRef?: RefObject<HTMLInputElement | null>;
  children?: ReactNode;
}

function PasswortFeld({ id, name, label, autoComplete, value, onChange, hilfe, ungueltig, feldRef, children }: PasswortProps) {
  return (
    <div className="feld">
      <label htmlFor={id}>{label}</label>
      <div className="eingabe pw">
        <PasswortEingabe id={id} name={name} autoComplete={autoComplete} feldRef={feldRef} value={value} beschreibung={hilfe} ungueltig={ungueltig} onChange={onChange} />
      </div>
      {children}
    </div>
  );
}

function Schnipsel({ text }: { text: string }) {
  const [kopiert, setKopiert] = useState(false);
  useEffect(() => {
    if (!kopiert) return;
    const t = setTimeout(() => setKopiert(false), 1600);
    return () => clearTimeout(t);
  }, [kopiert]);
  const kopieren = () => {
    navigator.clipboard?.writeText(text).then(() => setKopiert(true), () => undefined);
  };
  return (
    <div className="schnipsel">
      <code>{text}</code>
      <button type="button" className={`kopier${kopiert ? ' ok' : ''}`} onClick={kopieren} aria-label={kopiert ? 'Kopiert' : `${text} kopieren`} title="Kopieren">
        {kopiert ? <Check className="ic" /> : <Copy className="ic" />}
      </button>
    </div>
  );
}

function Kopf({ titel, text }: { titel: string; text: string }) {
  return (
    <div className="kopfblock">
      <Wortmarke />
      <h1>{titel}</h1>
      <p>{text}</p>
    </div>
  );
}

/** Kurz sichtbar, solange der Server antwortet. */
export function Laden() {
  return (
    <div className="auth" role="status" aria-label="Lichtung wird geöffnet">
      <div className="kopfblock"><Wortmarke /></div>
    </div>
  );
}

// ---------- Einrichten ----------

const ziffernFormat = (roh: string): string => {
  const z = roh.replace(/\D/g, '').slice(0, 6);
  return z.length > 3 ? `${z.slice(0, 3)} ${z.slice(3)}` : z;
};

export function Einrichten({ onSenden }: { onSenden: (code: string, passwort: string) => Promise<FormErgebnis> }) {
  const [code, setCode] = useState('');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [fehlerCode, setFehlerCode] = useState('');
  const [fehlerPw1, setFehlerPw1] = useState('');
  const [fehlerPw2, setFehlerPw2] = useState('');
  const [allgemein, setAllgemein] = useState('');
  const [sendet, setSendet] = useState(false);
  const [warten, setWarten] = useWarten();
  const codeRef = useRef<HTMLInputElement>(null);
  const pw1Ref = useRef<HTMLInputElement>(null);
  const pw2Ref = useRef<HTMLInputElement>(null);
  useEffect(() => codeRef.current?.focus(), []);
  useEffect(() => {
    if (warten === 0 && allgemein.startsWith('Zu viele')) setAllgemein('');
  }, [warten, allgemein]);

  const senden = async (e: FormEvent) => {
    e.preventDefault();
    if (sendet || warten > 0) return;
    const ziffern = code.replace(/\D/g, '');
    const fc = ziffern.length < 6 ? 'Bitte die 6 Ziffern eingeben' : '';
    const f1 = pw1.length < 10 ? 'Mindestens 10 Zeichen' : '';
    const f2 = !f1 && pw1 !== pw2 ? 'Passwörter sind verschieden' : '';
    setFehlerCode(fc);
    setFehlerPw1(f1);
    setFehlerPw2(f2);
    setAllgemein('');
    if (fc || f1 || f2) {
      (fc ? codeRef : f1 ? pw1Ref : pw2Ref).current?.focus();
      return;
    }
    setSendet(true);
    const r = await onSenden(ziffern, pw1);
    setSendet(false);
    if (r.ok) return;
    if (r.wartenSekunden) setWarten(r.wartenSekunden);
    if (r.feld === 'code' && !r.wartenSekunden) {
      setFehlerCode(r.fehler);
      codeRef.current?.focus();
    } else if (r.feld === 'passwort') {
      setFehlerPw1(r.fehler);
      pw1Ref.current?.focus();
    } else setAllgemein(r.fehler);
  };

  const n = pw1.length;
  const pw1Text = fehlerPw1 || (n === 0 ? 'Mindestens 10 Zeichen' : n < 10 ? `${n} von 10 Zeichen` : 'Lang genug');
  const gesperrt = warten > 0;
  return (
    <div className="auth">
      <form className="karte auth-karte" onSubmit={senden} noValidate>
        <NameFuerManager />
        <Kopf titel="Willkommen auf deiner Lichtung" text="Ein paar Handgriffe, dann geht es los." />
        <div className="feld">
          <label htmlFor="einr-code">Einrichtungscode</label>
          <div className="eingabe">
            <input
              id="einr-code" ref={codeRef} className="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7}
              placeholder="000 000" value={code} aria-describedby="einr-code-h" aria-invalid={!!fehlerCode}
              onChange={(e) => { setCode(ziffernFormat(e.target.value)); setFehlerCode(''); }}
            />
          </div>
          <Hilfe id="einr-code-h" text={fehlerCode} art="fehler" />
          <div className="code-hinweis"><span>Steht im Protokoll des Servers:</span><Schnipsel text="docker compose logs lichtung" /></div>
        </div>
        <PasswortFeld
          id="einr-pw1" name="pw1" label="Neues Passwort" autoComplete="new-password" value={pw1} feldRef={pw1Ref}
          onChange={(v) => { setPw1(v); setFehlerPw1(''); setFehlerPw2(''); }} hilfe="einr-pw1-h" ungueltig={!!fehlerPw1}
        >
          <Hilfe id="einr-pw1-h" text={pw1Text} art={fehlerPw1 ? 'fehler' : n >= 10 ? 'gut' : undefined} />
        </PasswortFeld>
        <PasswortFeld
          id="einr-pw2" name="pw2" label="Noch einmal" autoComplete="new-password" value={pw2} feldRef={pw2Ref}
          onChange={(v) => { setPw2(v); setFehlerPw2(''); }} hilfe="einr-pw2-h" ungueltig={!!fehlerPw2}
        >
          <Hilfe id="einr-pw2-h" text={fehlerPw2 || allgemein} art={fehlerPw2 || allgemein ? 'fehler' : undefined} />
        </PasswortFeld>
        <button className="knopf haupt gross" type="submit" disabled={sendet || gesperrt}>
          {sendet ? 'Wird eingerichtet …' : gesperrt ? `Lichtung einrichten · ${zeit(warten)}` : 'Lichtung einrichten'}
        </button>
      </form>
    </div>
  );
}

// ---------- Anmelden ----------

export function Anmelden({ onSenden, onOffline }: { onSenden: (passwort: string) => Promise<FormErgebnis>; onOffline: () => void }) {
  const [pw, setPw] = useState('');
  const [fehler, setFehler] = useState<{ text: string; art: 'fehler' | 'offline' } | null>(null);
  const [sendet, setSendet] = useState(false);
  const [warten, setWarten] = useWarten();
  const pwRef = useRef<HTMLInputElement>(null);
  useEffect(() => pwRef.current?.focus(), []);
  useEffect(() => {
    if (warten === 0) setFehler((f) => (f?.text.startsWith('Zu viele') ? null : f));
  }, [warten]);

  const senden = async (e: FormEvent) => {
    e.preventDefault();
    if (sendet || warten > 0) return;
    if (!pw) {
      setFehler({ text: 'Bitte das Passwort eingeben', art: 'fehler' });
      pwRef.current?.focus();
      return;
    }
    setFehler(null);
    setSendet(true);
    const r = await onSenden(pw);
    setSendet(false);
    if (r.ok) return;
    if (r.wartenSekunden) setWarten(r.wartenSekunden);
    setFehler({ text: r.fehler, art: r.offline ? 'offline' : 'fehler' });
    // Das Feld bleibt gefüllt und markiert, damit ein Tippfehler schnell korrigiert ist
    if (!r.offline) pwRef.current?.select();
  };

  const offline = fehler?.art === 'offline';
  const Symbol = offline ? CloudOff : warten > 0 ? Lock : Info;
  return (
    <div className="auth">
      <form className="karte auth-karte" onSubmit={senden} noValidate>
        <NameFuerManager />
        <Kopf titel="Schön, dass du wieder da bist" text="Dein Dorf wartet auf dich." />
        <div className="feld">
          <label htmlFor="anm-pw">Passwort</label>
          <div className="eingabe pw">
            <PasswortEingabe id="anm-pw" name="pw" autoComplete="current-password" beschreibung="anm-m" feldRef={pwRef} value={pw} ungueltig={fehler?.art === 'fehler'} onChange={(v) => { setPw(v); if (fehler?.art === 'fehler' && warten === 0) setFehler(null); }} />
          </div>
          <div className={`meldung${fehler?.art === 'fehler' ? ' fehler' : ''}`} id="anm-m" aria-live="polite">
            {fehler && <><Symbol className="ic" /><span>{fehler.text}</span></>}
          </div>
        </div>
        <button className="knopf haupt gross" type="submit" disabled={sendet || warten > 0}>
          {sendet ? 'Einen Moment …' : warten > 0 ? `Weiterspielen · ${zeit(warten)}` : 'Weiterspielen'}
        </button>
        <div className="zweit-platz">
          {offline && <button type="button" className="knopf zweit gross" onClick={onOffline}>Offline weiterspielen</button>}
        </div>
        <div className="fuss-hinweis">
          <p>Passwort vergessen? Neuen Code am Server erzeugen:</p>
          <Schnipsel text="docker compose exec lichtung npm run passwort" />
        </div>
      </form>
    </div>
  );
}

/** Passwortfeld mit Auge, das in einer `.eingabe.pw` sitzt. */
function PasswortEingabe({ id, name, autoComplete, beschreibung, feldRef, value, ungueltig, onChange }: {
  id: string;
  name: string;
  autoComplete: 'new-password' | 'current-password';
  beschreibung: string;
  feldRef?: RefObject<HTMLInputElement | null>;
  value: string;
  ungueltig: boolean;
  onChange: (v: string) => void;
}) {
  const [zeigen, setZeigen] = useState(false);
  return (
    <>
      <input
        id={id} ref={feldRef} name={name} type={zeigen ? 'text' : 'password'} autoComplete={autoComplete} value={value}
        onChange={(e) => onChange(e.target.value)} aria-describedby={beschreibung} aria-invalid={ungueltig} spellCheck={false} autoCapitalize="off"
      />
      <button type="button" className="auge" onClick={() => setZeigen((z) => !z)} aria-label={zeigen ? 'Passwort verbergen' : 'Passwort zeigen'} aria-pressed={zeigen}>
        {zeigen ? <EyeOff className="ic" /> : <Eye className="ic" />}
      </button>
    </>
  );
}
