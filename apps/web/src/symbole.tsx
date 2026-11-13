import { memo } from 'react';
import { Cherry, Fish, Flame, Hammer, House, Leaf, Mountain, Nut, Rabbit, Shrub, Sun, TreeDeciduous, TreePine, Warehouse, Wheat, createLucideIcon, type LucideIcon } from 'lucide-react';
import type { Art, Bebauung, FleckBiom, GebaeudeId, Kachel, SiedlerId, Ware } from '@lichtung/spiel';
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

/** Eigene Striche im Stil von Lucide, bis die gemalte Grafik kommt (wie im Mockup). */
const Planken = createLucideIcon('planken', [
  ['rect', { width: '18', height: '4', x: '3', y: '3', rx: '1', key: 'a' }],
  ['rect', { width: '18', height: '4', x: '3', y: '10', rx: '1', key: 'b' }],
  ['rect', { width: '18', height: '4', x: '3', y: '17', rx: '1', key: 'c' }],
]);
const Schale = createLucideIcon('schale', [
  ['path', { d: 'M3 12h18a9 9 0 0 1-18 0Z', key: 'a' }],
  ['path', { d: 'M8 8c0-1.5 1.2-2 1.2-3.5', key: 'b' }],
  ['path', { d: 'M13 8c0-1.5 1.2-2 1.2-3.5', key: 'c' }],
]);
const Topf = createLucideIcon('topf', [
  ['path', { d: 'M4 11h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-6Z', key: 'a' }],
  ['path', { d: 'M2 11h20', key: 'b' }],
  ['path', { d: 'M9 3v4', key: 'c' }],
  ['path', { d: 'M15 3v4', key: 'd' }],
]);

/** Alles, was eine Marke bekommen kann: Rohstoffe, Hindernis, Tier, Waren und Proviant. */
export type MarkeArt = Art | Ware;

export const WAREN_SYMBOL: Record<Exclude<Ware, Art>, LucideIcon> = {
  brett: Planken,
  trockenkraeuter: Leaf,
  beerenbrei: Schale,
  roestnuesse: Nut,
  waldeintopf: Topf,
};

const symbolFuer = (art: MarkeArt): LucideIcon => (art in SYMBOL ? SYMBOL[art as Art] : WAREN_SYMBOL[art as Exclude<Ware, Art>]);

/** Symbole der Karte: Biom eines Flecks und was darauf steht. */
export const BIOM_SYMBOL: Record<FleckBiom, LucideIcon> = { siedlung: House, wald: TreeDeciduous, bach: Fish, wiese: Wheat, fels: Mountain };
export const BAU_SYMBOL: Record<Bebauung, LucideIcon> = { lagerfeuer: Flame, zimmerei: Warehouse, trockengestell: Sun, huetten: House };
export const GEBAEUDE_SYMBOL: Record<GebaeudeId, LucideIcon> = { lagerfeuer: Flame, zimmerei: Hammer, trockengestell: Sun };

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
export function Marke({ art, groesse = '' }: { art: MarkeArt; groesse?: '' | 'k' | 'm' | 'g' }) {
  const Symbol = symbolFuer(art);
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
