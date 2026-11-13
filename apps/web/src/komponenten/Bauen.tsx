import { Check } from 'lucide-react';
import { GEBAEUDE, WAREN, fleckDaten, gebautAuf, kannBezahlen, type GebaeudeId, type Siedlung, type Ware } from '@lichtung/spiel';
import { zahl } from '../anzeige';
import { GEBAEUDE_SYMBOL, Marke } from '../symbole';

/** Kosten eines Gebäudes; was im Lager fehlt, ist markiert („12/30“). */
export function Kosten({ s, gebaeude }: { s: Siedlung; gebaeude: GebaeudeId }) {
  return (
    <>
      {(Object.entries(GEBAEUDE[gebaeude].kosten) as [Ware, number][]).map(([w, n]) => {
        const fehlt = s.lager[w] < n;
        const text = fehlt ? `${zahl(s.lager[w])} von ${zahl(n)} ${WAREN[w].mehrzahl}` : `${zahl(n)} ${WAREN[w].mehrzahl}`;
        return (
          <span className={`kost${fehlt ? ' fehlt' : ''}`} key={w} title={fehlt ? `${text} vorhanden` : `${text} nötig`} aria-label={fehlt ? `${text} vorhanden` : `${text} nötig`}>
            <Marke art={w} groesse="k" />
            {fehlt ? `${zahl(s.lager[w])}/${zahl(n)}` : zahl(n)}
          </span>
        );
      })}
    </>
  );
}

/** Wer als Nächstes den Hauptknopf bekommt: das erste Gebäude, das sich jetzt bauen lässt. */
export const ersteBaubare = (s: Siedlung, liste: GebaeudeId[]): GebaeudeId | null =>
  liste.find((g) => !gebautAuf(s, g) && kannBezahlen(s.lager, GEBAEUDE[g].kosten)) ?? null;

interface Props {
  s: Siedlung;
  gebaeude: GebaeudeId;
  /** Der Fleck, auf dem gebaut würde; `null`, wenn keiner frei ist. */
  ziel: string | null;
  haupt: boolean;
  onBauen: () => void;
}

/** Zeile „Gebäude – Kosten – Bauen“, wie im Mockup. */
export function BauZeile({ s, gebaeude, ziel, haupt, onBauen }: Props) {
  const G = GEBAEUDE[gebaeude];
  const Symbol = GEBAEUDE_SYMBOL[gebaeude];
  const steht = gebautAuf(s, gebaeude);
  const geht = !!ziel && kannBezahlen(s.lager, G.kosten);
  return (
    <div className="bau">
      <span className="bild"><Symbol className="ic" /></span>
      <div>
        <b>{G.name}</b>
        {!steht && <span className="kosten"><Kosten s={s} gebaeude={gebaeude} /></span>}
        {steht &&<span className="neben links">am {fleckDaten(steht).name}</span>}
      </div>
      {steht ? (
        <span className="chip gut text"><Check className="ic" />Steht</span>
      ) : (
        <button className={`knopf klein ${haupt ? 'haupt' : 'zweit'}`} disabled={!geht} onClick={onBauen} aria-label={`${G.name} bauen`}>Bauen</button>
      )}
    </div>
  );
}
