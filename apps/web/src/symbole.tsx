import { memo } from 'react';
import { Cherry, Leaf, Nut, Rabbit, Shrub, TreePine, type LucideIcon } from 'lucide-react';
import type { Art, Kachel, SiedlerId } from '@lichtung/spiel';
import { WABE, ecken } from './geometrie';

/** Platzhalter bis zur gemalten Grafik (docs/design.md › Grafik): ein Symbol je Art. */
export const SYMBOL: Record<Art, LucideIcon> = {
  holz: TreePine,
  beeren: Cherry,
  kraeuter: Leaf,
  nuesse: Nut,
  gestruepp: Shrub,
  hase: Rabbit,
};

export const SIEDLER_FARBE: Record<SiedlerId, string> = { ida: '#B96B34', jonas: '#C4446E', mara: '#4E9A46' };

const PUNKTE = [[0], [-9, 9], [-18, 0, 18]];

/** Eine Kachel des Bretts als Spielmarke, um (0, 0) zentriert. */
export const KachelBild = memo(function KachelBild({ art, reife }: Pick<Kachel, 'art' | 'reife'>) {
  const Symbol = SYMBOL[art];
  return (
    <g className={`mk t-${art} r${reife}`}>
      <polygon className="kante" points={WABE} transform="translate(0 5)" />
      <polygon className="koerper" points={WABE} />
      <ellipse className="glanz" cx="0" cy="-23" rx="26" ry="9" />
      <Symbol className="sym" x={-20} y={reife ? -27 : -20} width={40} height={40} />
      {reife > 0 && PUNKTE[reife - 1].map((x) => <circle key={x} className="pip" cx={x} cy="27" r="5" />)}
    </g>
  );
});

const MARKE = ecken(23);

/** Kleine Spielmarke für Beutel, Ziel und Ertrag. */
export function Marke({ art, groesse = '' }: { art: Art; groesse?: '' | 'm' | 'g' }) {
  const Symbol = SYMBOL[art];
  return (
    <svg className={`token ${groesse}`} viewBox="-25 -22 50 50" aria-hidden="true">
      <g className={`mk t-${art}`}>
        <polygon className="kante" points={MARKE} transform="translate(0 3)" />
        <polygon className="koerper" points={MARKE} />
        <ellipse className="glanz" cx="0" cy="-10" rx="13" ry="5" />
        <Symbol className="sym" x={-11} y={-11} width={22} height={22} />
      </g>
    </svg>
  );
}
