import { useState, type CSSProperties } from 'react';
import type { Aufbruch, FleckId, GebaeudeId, Siedlung } from '@lichtung/spiel';
import { Blatt, type Stufe } from './komponenten/Blatt';
import { FleckDetail } from './komponenten/FleckDetail';
import { Landkarte, type Effekt } from './komponenten/Landkarte';
import { Vorrat } from './komponenten/Rahmen';
import { useHoehe } from './umgebung';

interface Props {
  s: Siedlung;
  breit: boolean;
  gewaehlt: FleckId;
  effekt: Effekt | null;
  onWaehle: (id: FleckId) => void;
  onStart: (auswahl: Aufbruch[]) => void;
  onFortsetzen: () => void;
  onBauen: (gebaeude: GebaeudeId, fleck: FleckId) => void;
  onAbbau: (fleck: FleckId) => void;
  onWerkstatt: () => void;
  onLager: () => void;
}

/** Startbildschirm: Karte mit Fleck-Detail. Laptop: Detail als Karte rechts; Handy: Blatt von unten. */
export function SiedlungAnsicht(p: Props) {
  return p.breit ? <Laptop {...p} /> : <Handy {...p} />;
}

const detail = (p: Props, onWaehle: (id: FleckId) => void) => (
  <FleckDetail s={p.s} fleck={p.gewaehlt} onWaehle={onWaehle} onStart={p.onStart} onFortsetzen={p.onFortsetzen} onBauen={p.onBauen} onAbbau={p.onAbbau} onWerkstatt={p.onWerkstatt} onLager={p.onLager} />
);

function Laptop(p: Props) {
  return (
    <div className="sd-raster">
      <div className="sd-links">
        <Vorrat lager={p.s.lager} umbruch onLager={p.onLager} />
        <div className="karte-platz">
          <Landkarte siedlung={p.s} gewaehlt={p.gewaehlt} breit effekt={p.effekt} onWaehle={p.onWaehle} />
        </div>
      </div>
      <aside className="karte detail" aria-label="Fleck">{detail(p, p.onWaehle)}</aside>
    </div>
  );
}

function Handy(p: Props) {
  const [ref, hoehe] = useHoehe<HTMLDivElement>();
  const [stufe, setStufe] = useState<Stufe>('halb');
  const [ziehHoehe, setZiehHoehe] = useState<number | null>(null);
  const ganz = Math.max(200, (hoehe || 600) - 8);
  const hoehen: Record<Stufe, number> = { klein: 120, halb: Math.min(420, Math.round(ganz * 0.6)), ganz };
  const aktuell = ziehHoehe ?? hoehen[stufe];
  const waehle = (id: FleckId) => {
    if (stufe === 'klein') setStufe('halb');
    p.onWaehle(id);
  };
  return (
    <div className="sd-handy" ref={ref} style={{ '--blatt-h': `${aktuell}px` } as CSSProperties}>
      <Vorrat lager={p.s.lager} onLager={p.onLager} />
      <div className="karte-platz">
        <Landkarte siedlung={p.s} gewaehlt={p.gewaehlt} breit={false} effekt={p.effekt} onWaehle={waehle} />
      </div>
      <Blatt stufe={stufe} hoehen={hoehen} ziehHoehe={ziehHoehe} onZiehe={setZiehHoehe} onStufe={setStufe}>
        {detail(p, waehle)}
      </Blatt>
    </div>
  );
}
