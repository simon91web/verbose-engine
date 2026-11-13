import type { CSSProperties, KeyboardEvent } from 'react';
import { Check, CloudFog, Lock } from 'lucide-react';
import { FLECKEN, type FleckId, type FleckZustand, type Siedlung } from '@lichtung/spiel';
import { ecken } from '../geometrie';
import { BAU_SYMBOL, BIOM_SYMBOL } from '../symbole';

/** Was nach dem Einbringen kurz zu sehen ist: neue Flecken tauchen auf, ein Fleck wandelt sich. */
export interface Effekt {
  neu: FleckId[];
  wandel: FleckId[];
}

export const ZUSTAND_TEXT: Record<FleckZustand, string> = {
  nebel: 'unerkundet',
  gesperrt: 'noch nicht erreichbar',
  erkundet: 'erkundet',
  gerodet: 'gerodet',
  bebaut: 'bebaut',
};

interface Props {
  siedlung: Siedlung;
  gewaehlt: FleckId;
  breit: boolean;
  effekt: Effekt | null;
  onWaehle: (id: FleckId) => void;
}

/** Karte der 19 Flecken als Waben. Antippen oder Enter wählt. */
export function Landkarte({ siedlung, gewaehlt, breit, effekt, onWaehle }: Props) {
  const s = breit ? 58 : 38;
  const h = Math.sqrt(3) * s;
  const gr = breit ? 1.25 : 0.85;
  const poly = ecken(s - 3);
  const hoehe = 5 * h + 12;
  const lauf = siedlung.unterwegs;
  const taste = (e: KeyboardEvent, id: FleckId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onWaehle(id);
    }
  };
  return (
    <svg
      className="landkarte"
      viewBox={`${-4 * s} ${-2.5 * h - 4} ${8 * s} ${hoehe}`}
      width={breit ? undefined : 8 * s}
      height={breit ? undefined : Math.round(hoehe)}
      role="group"
      aria-label="Karte der Flecken"
    >
      {FLECKEN.map((f) => {
        const st = siedlung.flecken[f.id];
        const nebel = st.zustand === 'nebel';
        const x = s * 1.5 * f.q;
        const y = h * (f.r + f.q / 2);
        const Symbol = nebel ? CloudFog : st.zustand === 'gesperrt' ? Lock : st.gebaeude ? BAU_SYMBOL[st.gebaeude] : BIOM_SYMBOL[f.biom];
        const sy = nebel ? -12 * gr : -12 * gr - (breit ? 11 : 8);
        const neuIndex = effekt?.neu.indexOf(f.id) ?? -1;
        const klassen = [
          'fleck', st.zustand, nebel ? '' : `fl-${f.biom}`, f.id === gewaehlt ? 'gewaehlt' : '',
          neuIndex >= 0 ? 'neu' : '', effekt?.wandel.includes(f.id) ? 'wandel' : '',
        ].filter(Boolean).join(' ');
        const laeuftHier = lauf?.fleck === f.id;
        const bx = s * 0.52;
        const by = -s * 0.6;
        return (
          <g
            key={f.id}
            className={klassen}
            style={neuIndex >= 0 ? { '--d': `${neuIndex * 180}ms` } as CSSProperties : undefined}
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
            tabIndex={0}
            role="button"
            aria-label={nebel ? 'Unerkundet' : `${f.name}, ${ZUSTAND_TEXT[st.zustand]}${laeuftHier ? ', Tagwerk läuft' : ''}`}
            aria-pressed={f.id === gewaehlt}
            onClick={() => onWaehle(f.id)}
            onKeyDown={(e) => taste(e, f.id)}
          >
            <g className="fl-in">
              <polygon className="kante" points={poly} transform="translate(0 5)" />
              <polygon className="koerper" points={poly} />
              <ellipse className="glanz" cx="0" cy={(-s * 0.45).toFixed(1)} rx={(s * 0.55).toFixed(1)} ry={(s * 0.2).toFixed(1)} />
              <Symbol className="sym" x={-12 * gr} y={sy} width={24 * gr} height={24 * gr} />
              {!nebel && <text y={breit ? 27 : 16} textAnchor="middle">{f.name}</text>}
              {laeuftHier ? (
                <g className="badge lauf" transform={`translate(${bx.toFixed(1)} ${by.toFixed(1)})`}>
                  <circle r="13" />
                  <text y="5" textAnchor="middle">{lauf.tagwerk.schritte}</text>
                </g>
              ) : st.zustand === 'gerodet' ? (
                <g className="badge fertig" transform={`translate(${bx.toFixed(1)} ${by.toFixed(1)})`}>
                  <circle r="12" />
                  <Check className="chk" x={-6.5} y={-6.5} width={13} height={13} />
                </g>
              ) : null}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
