import { memo, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { SPALTEN, ZEILEN, gleich, type Kachel, type Tagwerk, type Zelle, type Zug } from '@lichtung/spiel';
import { BREITE, HOEHE, S, WABE, mitte, punkte } from '../geometrie';
import { KachelBild } from '../symbole';

interface Props {
  tagwerk: Tagwerk;
  pfad: readonly Zelle[];
  innen: readonly Zelle[];
  geister: Zug['entfernt'];
  herkunft: Record<number, number>;
  onStart: (zelle: Zelle) => void;
  onWeiter: (zelle: Zelle) => void;
  onLoslassen: () => void;
  onAbbruch: () => void;
}

const RAND = 26;
/** Gewählte Waben heben sich so weit – die Kettenlinie folgt. */
const HUB = 5;

/**
 * Das Wabenbrett. Ziehen mit Finger oder Maus; Tastatur: Pfeile bewegen den Rahmen,
 * Leertaste wählt, Enter erntet, Esc bricht ab.
 */
export function Brett(p: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const zieht = useRef(false);
  const letzterPunkt = useRef<[number, number] | null>(null);
  const [cursor, setCursor] = useState<Zelle>([3, 3]);
  const [tastatur, setTastatur] = useState(false);
  const clip = `clip${useId().replace(/:/g, '')}`;
  const imPfad = new Set(p.pfad.map(([s, z]) => s * 16 + z));

  const svgPunkt = (e: PointerEvent): [number, number] | null => {
    const m = svg.current?.getScreenCTM();
    if (!m) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return [pt.x, pt.y];
  };
  const zelleBei = ([x, y]: [number, number]): Zelle | null => {
    let beste: Zelle | null = null;
    let abstand = Infinity;
    for (let s = 0; s < SPALTEN; s++) {
      for (let z = 0; z < ZEILEN; z++) {
        const [mx, my] = mitte(s, z);
        const d = Math.hypot(x - mx, y - my);
        if (d < abstand) [abstand, beste] = [d, [s, z]];
      }
    }
    return abstand <= S * 0.8 ? beste : null;
  };

  const runter = (e: PointerEvent<SVGSVGElement>) => {
    const pt = svgPunkt(e);
    const zelle = pt && zelleBei(pt);
    if (!zelle) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    zieht.current = true;
    letzterPunkt.current = pt;
    setTastatur(false);
    p.onStart(zelle);
  };
  // Schnelles Wischen überspringt Waben – darum den Weg seit dem letzten Ereignis abtasten
  const bewegen = (e: PointerEvent<SVGSVGElement>) => {
    if (!zieht.current) return;
    const pt = svgPunkt(e);
    const von = letzterPunkt.current;
    if (!pt || !von) return;
    const schritte = Math.max(1, Math.ceil(Math.hypot(pt[0] - von[0], pt[1] - von[1]) / (S / 3)));
    let vorige: Zelle | null = null;
    for (let i = 1; i <= schritte; i++) {
      const zelle = zelleBei([von[0] + ((pt[0] - von[0]) * i) / schritte, von[1] + ((pt[1] - von[1]) * i) / schritte]);
      if (zelle && (!vorige || !gleich(zelle, vorige))) p.onWeiter(zelle);
      vorige = zelle ?? vorige;
    }
    letzterPunkt.current = pt;
  };
  const hoch = () => {
    if (!zieht.current) return;
    zieht.current = false;
    p.onLoslassen();
  };
  const abbrechen = () => {
    if (!zieht.current) return;
    zieht.current = false;
    p.onAbbruch();
  };

  const taste = (e: KeyboardEvent<SVGSVGElement>) => {
    const [s, z] = cursor;
    const ziel: Record<string, Zelle> = {
      ArrowUp: [s, Math.max(0, z - 1)],
      ArrowDown: [s, Math.min(ZEILEN - 1, z + 1)],
      ArrowLeft: [Math.max(0, s - 1), z],
      ArrowRight: [Math.min(SPALTEN - 1, s + 1), z],
    };
    if (ziel[e.key]) setCursor(ziel[e.key]);
    else if (e.key === ' ') (p.pfad.length ? p.onWeiter : p.onStart)(cursor);
    else if (e.key === 'Enter') p.onLoslassen();
    else if (e.key === 'Escape') p.onAbbruch();
    else return;
    e.preventDefault();
    setTastatur(true);
  };

  const [cx, cy] = mitte(...cursor);

  return (
    <svg
      ref={svg}
      className="brett"
      viewBox={`${-RAND} ${-RAND} ${BREITE + 2 * RAND} ${(HOEHE + 2 * RAND).toFixed(1)}`}
      role="application"
      aria-label="Brett, 7 mal 7 Waben. Ziehen oder Pfeiltasten, Leertaste wählt, Enter erntet, Esc bricht ab."
      tabIndex={0}
      onPointerDown={runter}
      onPointerMove={bewegen}
      onPointerUp={hoch}
      onPointerCancel={abbrechen}
      onKeyDown={taste}
      onBlur={() => setTastatur(false)}
    >
      <defs>
        <clipPath id={clip}>
          <rect x="-13" y="-13" width={BREITE + 26} height={(HOEHE + 26).toFixed(1)} rx="24" />
        </clipPath>
      </defs>
      <rect className="matte" x="-18" y="-18" width={BREITE + 36} height={(HOEHE + 36).toFixed(1)} rx="30" />
      <g clipPath={`url(#${clip})`}>
        {p.tagwerk.gitter.flatMap((spalte, s) =>
          spalte.map((k, z) => (
            <KachelG key={k.id} kachel={k} s={s} z={z} start={p.herkunft[k.id]} gewaehlt={imPfad.has(s * 16 + z)} />
          )),
        )}
        {p.geister.map(({ kachel, zelle: [s, z] }) => {
          const [x, y] = mitte(s, z);
          return (
            <g key={`weg${kachel.id}`} className="kachel weg" style={{ transform: `translate(${x}px, ${y}px)` }}>
              <g className="innen"><KachelBild art={kachel.art} reife={kachel.reife} /></g>
            </g>
          );
        })}
      </g>
      <g className="ring">
        {p.innen.map(([s, z]) => {
          const [x, y] = mitte(s, z);
          return <polygon key={`${s},${z}`} points={WABE} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} />;
        })}
      </g>
      <polyline className="pfad-s" points={punkte(p.pfad, HUB)} />
      <polyline className="pfad" points={punkte(p.pfad, HUB)} />
      {tastatur && <polygon className="cursor" points={WABE} transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)})`} />}
    </svg>
  );
}

interface KachelProps {
  kachel: Kachel;
  s: number;
  z: number;
  /** Zeile über dem Brett, aus der eine neue Kachel hereinfällt. */
  start?: number;
  gewaehlt: boolean;
}

const KachelG = memo(function KachelG({ kachel, s, z, start, gewaehlt }: KachelProps) {
  const ref = useRef<SVGGElement>(null);
  const [x, y] = mitte(s, z);
  const ziel = `translate(${x}px, ${y}px)`;

  // Nur beim Erscheinen: von oben hereinfallen lassen
  useLayoutEffect(() => {
    const el = ref.current;
    if (start === undefined || !el) return;
    const [sx, sy] = mitte(s, start);
    el.style.transition = 'none';
    el.style.transform = `translate(${sx}px, ${sy}px)`;
    el.getBoundingClientRect();
    el.style.transition = '';
    el.style.transform = ziel;
  }, []);

  return (
    <g ref={ref} className={gewaehlt ? 'kachel gewaehlt' : 'kachel'} style={{ transform: ziel }}>
      <g className="innen"><KachelBild art={kachel.art} reife={kachel.reife} /></g>
    </g>
  );
});
