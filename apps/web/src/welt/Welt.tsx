import { useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { NeutralToneMapping } from 'three';
import { Html, MapControls } from '@react-three/drei';
import { Axe, CircleCheck, Hammer, House, Moon, Sprout, Sun, SunMoon, Wheat, X, type LucideIcon } from 'lucide-react';
import { Zufall } from '@lichtung/spiel';
import { useStimmung, type Stimmung } from '../umgebung';
import { BAUARTEN, bebaubar, eignung, erzeugeWelt, schluessel, wegZu, zuWelt, type Bau, type BauArt, type Welt as WeltDaten } from './gelaende';
import { Auswahlrand, Baeume, Felsen, Gebaeude, Gelaende, Lagerfeuer, Licht, Overlay, Weg } from './Szene';

const SEED = 20261102;
const SYMBOL: Record<BauArt, LucideIcon> = { huette: House, muehle: Wheat, holzfaeller: Axe };

function useAbend(wahl: Stimmung): boolean {
  const [dunkel, setDunkel] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const f = () => setDunkel(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return wahl === 'abend' || (wahl === 'geraet' && dunkel);
}

/** Im Hochformat zeigt die Kamera aus größerer Entfernung, damit die Lichtung in die Breite passt. */
function KameraAnpassen() {
  const { camera, size } = useThree();
  const hoch = size.width < size.height;
  useEffect(() => {
    const abstand = hoch ? 1.4 : 1;
    camera.position.set(0, 12.5 * abstand, 13.5 * abstand);
    camera.lookAt(0, 0, 0);
  }, [camera, hoch]);
  return null;
}

function startBauten(welt: WeltDaten): Bau[] {
  const z = new Zufall(SEED + 1);
  const plaetze: [number, number][] = [[1, -1], [-1, 0]];
  return plaetze.map(([q, r], i) => ({
    id: i + 1, art: 'huette', q, r,
    drehung: (z.zahl() - 0.5) * 0.7,
    versatz: [(z.zahl() - 0.5) * 0.25, (z.zahl() - 0.5) * 0.25],
    weg: wegZu(welt, zuWelt(q, r), [[0, 0]], z),
  }));
}

/**
 * Prototyp der 3D-Welt: Gelände auf unsichtbarem Wabenraster, Bauen mit Eignungs-Overlay,
 * Wege, Tag und Abend. Alles Platzhalter – es geht um Gefühl, Lesbarkeit und Leistung am Handy.
 */
export function Welt() {
  const welt = useMemo(() => erzeugeWelt(SEED), []);
  const [bauten, setBauten] = useState<Bau[]>(() => startBauten(welt));
  const [modus, setModus] = useState<BauArt | null>(null);
  const [auswahl, setAuswahl] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [stimmung, setStimmung] = useStimmung();
  const abend = useAbend(stimmung);

  const belegt = useMemo(() => new Set(['0,0', ...bauten.map((b) => schluessel(b.q, b.r))]), [bauten]);
  const werte = useMemo(() => {
    const m = new Map<string, number>();
    if (!modus) return m;
    for (const w of welt.waben.values()) {
      if (bebaubar(welt, w.q, w.r, belegt)) m.set(schluessel(w.q, w.r), eignung(welt, modus, w.q, w.r, belegt).prozent / BAUARTEN[modus].max);
    }
    return m;
  }, [welt, modus, belegt]);

  useEffect(() => {
    if (!hinweis) return;
    const t = setTimeout(() => setHinweis(null), 4000);
    return () => clearTimeout(t);
  }, [hinweis]);
  useEffect(() => {
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && (setModus(null), setAuswahl(null));
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, []);

  const bauen = useCallback((k: string) => {
    if (!modus) return;
    const [q, r] = k.split(',').map(Number);
    if (!bebaubar(welt, q, r, belegt)) return;
    const z = new Zufall(SEED + bauten.length * 31);
    const e = eignung(welt, modus, q, r, belegt);
    const wald = welt.waben.get(k)?.art === 'wald';
    const ziele = [[0, 0] as [number, number], ...bauten.map((b) => zuWelt(b.q, b.r))];
    setBauten([...bauten, {
      id: Date.now(), art: modus, q, r,
      drehung: (z.zahl() - 0.5) * 0.7,
      versatz: [(z.zahl() - 0.5) * 0.25, (z.zahl() - 0.5) * 0.25],
      weg: wegZu(welt, zuWelt(q, r), ziele, z),
    }]);
    setAuswahl(null);
    setHinweis(`${BAUARTEN[modus].name} gebaut · +${e.prozent} % Ertrag${wald ? ' · eine Waldwabe gerodet' : ''}`);
  }, [modus, welt, belegt, bauten]);

  const zeigen = useCallback((k: string | null) => {
    if (modus && (k === null || werte.has(k))) setAuswahl(k);
  }, [modus, werte]);
  const tippen = useCallback((k: string) => {
    if (!modus || !werte.has(k)) return;
    if (k === auswahl) bauen(k);
    else setAuswahl(k);
  }, [modus, werte, auswahl, bauen]);

  const gewaehlt = modus && auswahl ? (() => {
    const [q, r] = auswahl.split(',').map(Number);
    return { q, r, e: eignung(welt, modus, q, r, belegt) };
  })() : null;

  return (
    <div className="welt">
      <Canvas shadows="percentage" dpr={[1, 1.75]} camera={{ position: [0, 12.5, 13.5], fov: 40, near: 0.5, far: 80 }} gl={{ toneMapping: NeutralToneMapping }}>
        <Licht abend={abend} />
        <Gelaende welt={welt} onZeigen={zeigen} onTippen={tippen} />
        <Baeume welt={welt} belegt={belegt} />
        <Felsen welt={welt} />
        <Lagerfeuer welt={welt} abend={abend} />
        {bauten.map((b) => (
          <group key={b.id}>
            <Gebaeude welt={welt} art={b.art} q={b.q} r={b.r} drehung={b.drehung} versatz={b.versatz} abend={abend} />
            <Weg welt={welt} punkte={b.weg} />
          </group>
        ))}
        {modus && <Overlay welt={welt} werte={werte} />}
        {modus && gewaehlt && auswahl && (
          <>
            <Auswahlrand welt={welt} k={auswahl} />
            <Gebaeude welt={welt} art={modus} q={gewaehlt.q} r={gewaehlt.r} drehung={0} versatz={[0, 0]} abend={abend} geist />
            <Html position={[zuWelt(gewaehlt.q, gewaehlt.r)[0], welt.hoehe(...zuWelt(gewaehlt.q, gewaehlt.r)) + 1.1, zuWelt(gewaehlt.q, gewaehlt.r)[1]]} wrapperClass="etikett-huelle" zIndexRange={[20, 10]}>
              <div className="etikett">
                <b>+{gewaehlt.e.prozent} %</b>
                <span>{gewaehlt.e.gruende.join(' · ')}</span>
                <button className="knopf haupt" onClick={() => bauen(auswahl)}><Hammer className="ic" />Hier bauen</button>
              </div>
            </Html>
          </>
        )}
        <MapControls makeDefault enableDamping maxPolarAngle={1.12} minDistance={6} maxDistance={30} target={[0, 0, 0]} />
        <KameraAnpassen />
      </Canvas>

      <header className="welt-kopf">
        <span className="wortmarke"><span className="zeichen"><Sprout /></span>Lichtung</span>
        <span className="chip">Prototyp · Platzhalter</span>
        <div className="segment" role="radiogroup" aria-label="Stimmung">
          {([['tag', 'Tag', Sun], ['abend', 'Abend', Moon], ['geraet', 'Gerät', SunMoon]] as const).map(([wert, name, S]) => (
            <button key={wert} role="radio" aria-checked={stimmung === wert} className={stimmung === wert ? 'an' : ''} title={name} onClick={() => setStimmung(wert)}>
              <S className="ic" /><span className="name">{name}</span>
            </button>
          ))}
        </div>
      </header>

      <nav className="bauleiste karte" aria-label="Bauen">
        {(Object.keys(BAUARTEN) as BauArt[]).map((art) => {
          const S = SYMBOL[art];
          return (
            <button key={art} className={`bau-knopf${modus === art ? ' an' : ''}`} aria-pressed={modus === art} onClick={() => { setModus(modus === art ? null : art); setAuswahl(null); }}>
              <S className="ic" /><span>{BAUARTEN[art].name}</span>
            </button>
          );
        })}
        <button className="rund" disabled={!modus} title="Baumodus beenden (Esc)" aria-label="Baumodus beenden" onClick={() => { setModus(null); setAuswahl(null); }}>
          <X className="ic" />
        </button>
      </nav>

      <div className={`toast${hinweis ? ' zeigen' : ''}`} role="status"><CircleCheck className="ic" /><span>{hinweis}</span></div>
    </div>
  );
}
