import type { KeyboardEvent, ReactNode } from 'react';
import { Hammer, House, Menu } from 'lucide-react';
import { WAREN, WAREN_LISTE, type Lager } from '@lichtung/spiel';
import { zahl } from '../anzeige';
import { Marke } from '../symbole';
import { Wortmarke, useAnstoss } from './Teile';

export type Bereich = 'siedlung' | 'werkstatt';

const ZIELE = [
  { id: 'siedlung', text: 'Siedlung', Symbol: House },
  { id: 'werkstatt', text: 'Werkstatt', Symbol: Hammer },
  { id: 'menue', text: 'Menü', Symbol: Menu },
] as const;

interface RahmenProps {
  ansicht: Bereich;
  breit: boolean;
  tag: number;
  menueOffen: boolean;
  /** Ein Dialog liegt darüber: der Rahmen ist dann nicht bedienbar. */
  gesperrt: boolean;
  onGehe: (b: Bereich) => void;
  onMenue: () => void;
  children: ReactNode;
}

/** Kopf mit Holzreitern (Laptop) oder Holzleiste unten (Handy) um Siedlung und Werkstatt. */
export function Rahmen({ ansicht, breit, tag, menueOffen, gesperrt, onGehe, onMenue, children }: RahmenProps) {
  const ziel = (id: (typeof ZIELE)[number]['id']) => (id === 'menue' ? onMenue() : onGehe(id));
  const knoepfe = ZIELE.map(({ id, text, Symbol }) => {
    const an = id === ansicht;
    const gemeinsam = {
      'aria-current': an ? ('page' as const) : undefined,
      onClick: () => ziel(id),
      ...(id === 'menue' ? { 'aria-expanded': menueOffen, 'aria-haspopup': 'menu' as const } : {}),
    };
    return breit ? (
      <button key={id} {...gemeinsam} className={`${an ? 'an' : ''}${id === 'menue' ? ' js-menue' : ''}`}><Symbol className="ic" />{text}</button>
    ) : (
      <button key={id} {...gemeinsam} className={`ziel${an ? ' an' : ''}${id === 'menue' ? ' js-menue' : ''}`}><span className="kreis"><Symbol className="ic" /></span>{text}</button>
    );
  });
  const tagAbzeichen = <span className="tag-abzeichen">Tag {tag}</span>;
  return (
    <div className={`spiel ${breit ? 'breit' : 'schmal'}`} inert={gesperrt || undefined}>
      {breit ? (
        <header className="leiste">
          <div className="links"><Wortmarke /></div>
          <nav className="reiter-holz" aria-label="Bereiche">{knoepfe}</nav>
          <div className="rechts">{tagAbzeichen}</div>
        </header>
      ) : (
        <header className="kopf">
          <Wortmarke />
          {tagAbzeichen}
        </header>
      )}
      <main className="ansicht">{children}</main>
      {!breit && <nav className="holzleiste" aria-label="Bereiche">{knoepfe}</nav>}
    </div>
  );
}

function VorratPille({ ware, wert }: { ware: keyof Lager; wert: number }) {
  const ref = useAnstoss<HTMLSpanElement>(wert);
  const name = WAREN[ware].mehrzahl;
  return (
    <span className={`pille${wert === 0 ? ' leer' : ''}`} ref={ref} title={name} aria-label={`${name} ${wert}`}>
      <Marke art={ware} />
      <span className="wert">{zahl(wert)}</span>
    </span>
  );
}

/** Alle Waren in einer Reihe; Antippen öffnet das Lager. */
export function Vorrat({ lager, umbruch = false, onLager }: { lager: Lager; umbruch?: boolean; onLager: () => void }) {
  const taste = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLager();
    }
  };
  return (
    <div className={`vorrat${umbruch ? ' wrap' : ''}`} role="button" tabIndex={0} aria-label="Lager öffnen" title="Lager öffnen" onClick={onLager} onKeyDown={taste}>
      {WAREN_LISTE.map((w) => <VorratPille key={w} ware={w} wert={lager[w]} />)}
    </div>
  );
}
