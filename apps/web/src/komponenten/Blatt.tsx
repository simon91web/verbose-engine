import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

export type Stufe = 'klein' | 'halb' | 'ganz';
const WEITER: Record<Stufe, Stufe> = { klein: 'halb', halb: 'ganz', ganz: 'klein' };
const STUFEN: Stufe[] = ['klein', 'halb', 'ganz'];

interface BlattProps {
  stufe: Stufe;
  hoehen: Record<Stufe, number>;
  /** Höhe während des Ziehens; sonst die der Stufe. */
  ziehHoehe: number | null;
  onZiehe: (h: number | null) => void;
  onStufe: (s: Stufe) => void;
  children: ReactNode;
}

/** Blatt von unten in drei Höhen: Griff antippen wechselt, Ziehen rastet ein. */
export function Blatt({ stufe, hoehen, ziehHoehe, onZiehe, onStufe, children }: BlattProps) {
  const start = useRef<{ y: number; h: number; bewegt: boolean; letzte: number } | null>(null);
  const [ziehend, setZiehend] = useState(false);
  const aktuell = ziehHoehe ?? hoehen[stufe];
  const begrenzen = (h: number) => Math.max(hoehen.klein, Math.min(hoehen.ganz, h));

  const ab = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { y: e.clientY, h: aktuell, bewegt: false, letzte: aktuell };
  };
  const bewegen = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    if (!s) return;
    const dy = e.clientY - s.y;
    if (Math.abs(dy) > 4) {
      s.bewegt = true;
      setZiehend(true);
    }
    if (s.bewegt) {
      s.letzte = begrenzen(s.h - dy);
      onZiehe(s.letzte);
    }
  };
  const auf = () => {
    const s = start.current;
    start.current = null;
    setZiehend(false);
    if (!s) return;
    if (!s.bewegt) return onStufe(WEITER[stufe]);
    onStufe(STUFEN.reduce((a, b) => (Math.abs(hoehen[a] - s.letzte) < Math.abs(hoehen[b] - s.letzte) ? a : b)));
    onZiehe(null);
  };
  const taste = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStufe(WEITER[stufe]);
    }
  };

  return (
    <section className={`blatt${ziehend ? ' ziehen' : ''}`} data-stufe={stufe} style={{ height: aktuell }} aria-label="Fleck">
      <div className="griff" role="button" tabIndex={0} aria-label="Blatt höher oder niedriger" onPointerDown={ab} onPointerMove={bewegen} onPointerUp={auf} onPointerCancel={auf} onKeyDown={taste}>
        <span />
      </div>
      <div className="detail">{children}</div>
    </section>
  );
}
