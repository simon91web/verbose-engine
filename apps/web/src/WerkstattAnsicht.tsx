import { ArrowRight, Check, Info, MapPin, Minus, Moon, Plus } from 'lucide-react';
import {
  GEBAEUDE, GEBAEUDE_REIHE, REZEPTE, WAREN, fleckDaten, freieGerodete, gebaeudeStehtSchon, gebautAuf, nachtVorschau,
  type GebaeudeId, type RezeptId, type Siedlung, type Ware,
} from '@lichtung/spiel';
import { aufzaehlung, wareText, zutatenText } from './anzeige';
import { BauZeile, ersteBaubare } from './komponenten/Bauen';
import { Vorrat } from './komponenten/Rahmen';
import { GEBAEUDE_SYMBOL, Marke } from './symbole';

interface Props {
  s: Siedlung;
  onAuftrag: (gebaeude: GebaeudeId, rezept: RezeptId, menge: number) => void;
  onBauen: (gebaeude: GebaeudeId) => void;
  onLager: () => void;
}

const formelText = (rezept: RezeptId): string => {
  const r = REZEPTE[rezept];
  return `${zutatenText(r.ein)} ergeben 1 ${WAREN[r.aus].name}`;
};

/** „3 Beeren + 1 Nuss → 1 Beerenbrei“ mit Marken. */
function Formel({ rezept }: { rezept: RezeptId }) {
  const r = REZEPTE[rezept];
  const zutaten = Object.entries(r.ein) as [Ware, number][];
  return (
    <span className="formel">
      {zutaten.map(([w, n], i) => (
        <span className="fi-gruppe" key={w}>
          {i > 0 && <span className="pf">+</span>}
          <span className="fi">{n}<Marke art={w} groesse="k" /></span>
        </span>
      ))}
      <ArrowRight className="ic" />
      <span className="fi">1<Marke art={r.aus} groesse="k" /></span>
    </span>
  );
}

function GebaeudeKarte({ s, gebaeude, onAuftrag }: { s: Siedlung; gebaeude: GebaeudeId; onAuftrag: Props['onAuftrag'] }) {
  const G = GEBAEUDE[gebaeude];
  const a = s.auftraege[gebaeude];
  const v = nachtVorschau(s, gebaeude)!;
  const Symbol = GEBAEUDE_SYMBOL[gebaeude];
  const ort = fleckDaten(gebautAuf(s, gebaeude)!).name;

  const teile = v.moeglich > 0
    ? [...(Object.entries(v.verbraucht) as [Ware, number][]).map(([w, n]) => `−${wareText(w, n)}`), `+${wareText(v.ertrag.ware, v.moeglich)}`]
    : [];
  let hinweis = '';
  if (v.gewollt > 0 && v.moeglich < v.gewollt) {
    const luecken = (Object.entries(v.fehlt) as [Ware, number][]).filter(([, n]) => n > 0);
    const einzahl = luecken.length === 1 && luecken[0][1] === 1;
    hinweis = `${v.moeglich > 0 ? `Nur ${v.moeglich} möglich` : 'Heute nichts möglich'} – es ${einzahl ? 'fehlt' : 'fehlen'} ${aufzaehlung(luecken.map(([w, n]) => wareText(w, n)))}`;
  }

  return (
    <section className="karte" aria-label={G.name}>
      <div className="gb-kopf">
        <span className="bild"><Symbol className="ic" /></span>
        <div><h3>{G.name}</h3><span className="ort">am {ort}</span></div>
        <span className="chip text">{G.leistung} je Tag</span>
      </div>
      <div className="rezepte" role="radiogroup" aria-label={`Rezept ${G.name}`}>
        {G.rezepte.map((rid) => (
          <button key={rid} className="rez" role="radio" aria-checked={a.rezept === rid} aria-label={`${REZEPTE[rid].name}: ${formelText(rid)}`} onClick={() => onAuftrag(gebaeude, rid, a.menge)}>
            <span className="punkt"><Check className="ic" /></span>
            <span className="rez-t"><b>{REZEPTE[rid].name}</b><Formel rezept={rid} /></span>
          </button>
        ))}
      </div>
      <div className="menge">
        <button className="rund" aria-label="Eine weniger" disabled={a.menge <= 0} onClick={() => onAuftrag(gebaeude, a.rezept, a.menge - 1)}><Minus className="ic" /></button>
        <div className="zahl" role="status" aria-label={`Menge ${a.menge} von ${G.leistung}`}><b>{a.menge}</b><span>von {G.leistung}</span></div>
        <button className="rund" aria-label="Eine mehr" disabled={a.menge >= G.leistung} onClick={() => onAuftrag(gebaeude, a.rezept, a.menge + 1)}><Plus className="ic" /></button>
      </div>
      <p className="neben">Bleibt stehen, bis du ihn änderst</p>
      <div className="vorschau"><Moon className="ic" /><span>Über Nacht: {teile.length ? teile.join(' · ') : 'nichts'}</span></div>
      <div className="hinweis-platz" aria-live="polite">
        {hinweis && <div className="hinweis"><Info className="ic" /><span>{hinweis}</span></div>}
      </div>
    </section>
  );
}

/** Aufträge für die Nacht je Gebäude und darunter, was sich bauen lässt. */
export function WerkstattAnsicht({ s, onAuftrag, onBauen, onLager }: Props) {
  const frei = freieGerodete(s);
  const steht = GEBAEUDE_REIHE.filter((g) => gebaeudeStehtSchon(s, g));
  const baubar = GEBAEUDE_REIHE.filter((g) => GEBAEUDE[g].baubar);
  const ersteFrei = frei[0] ?? null;
  const haupt = ersteFrei ? ersteBaubare(s, baubar) : null;
  const hinweis = frei.length ? `Braucht einen gerodeten Fleck – frei: ${frei.map((f) => fleckDaten(f).name).join(', ')}` : 'Kein gerodeter Fleck frei';
  return (
    <div className="werk">
      <Vorrat lager={s.lager} umbruch onLager={onLager} />
      <div className="werk-scroll">
        <div className="kopfzeile"><h2>Werkstatt</h2><p className="neben">Aufträge für die Nacht</p></div>
        <div className="werk-raster">
          {steht.map((g) => <GebaeudeKarte key={g} s={s} gebaeude={g} onAuftrag={onAuftrag} />)}
        </div>
        <div className="kopfzeile">
          <h2>Bauen</h2>
          <p className="neben" aria-live="polite"><MapPin className="ic klein" />{hinweis}</p>
        </div>
        <div className="bau-liste">
          {baubar.map((g) => <BauZeile key={g} s={s} gebaeude={g} ziel={ersteFrei} haupt={g === haupt} onBauen={() => onBauen(g)} />)}
        </div>
      </div>
    </div>
  );
}
