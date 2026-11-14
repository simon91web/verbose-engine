import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, CloudFog, Hammer, House, Info, Lock, MapPin, Warehouse } from 'lucide-react';
import {
  ARTEN, BIOME, GEBAEUDE, PROVIANT, PROVIANT_BESTE, REGELN, REZEPTE, SIEDLER, WAREN,
  baubareGebaeude, besterProviant, fleckDaten, fleckNachbarn, proviantVorrat, schritteFuer,
  type Aufbruch, type Art, type FleckBiom, type FleckId, type GebaeudeId, type Lager, type Proviant, type SiedlerId, type Siedlung,
} from '@lichtung/spiel';
import { zahl } from '../anzeige';
import { BIOM_SYMBOL, GEBAEUDE_SYMBOL, Marke, SIEDLER_FARBE } from '../symbole';
import { BauZeile, ersteBaubare } from './Bauen';
import { Medaille, GestruepZiel } from './Teile';

const SIEDLER_IDS = Object.keys(SIEDLER) as SiedlerId[];
const BIOM_NAME: Record<FleckBiom, string> = { siedlung: 'Siedlung', wald: 'Wald', bach: 'Bachufer', wiese: 'Wiese', fels: 'Felshang' };

// ---------- Trupp und Proviant ----------

interface Ordnung {
  /** Kein Proviant im Lager: höchstens ein Siedler geht mit leerem Magen. */
  leer: boolean;
  max: number;
  auswahl: Aufbruch[];
}

/** Macht aus Wünschen eine gültige Auswahl: nie mehr Proviant, als das Lager hat; Lücken füllt der beste Proviant. */
function ordne(lager: Lager, wunsch: SiedlerId[], prov: Partial<Record<SiedlerId, Proviant>>): Ordnung {
  const vorrat = proviantVorrat(lager);
  const leer = vorrat === 0;
  const max = leer ? 1 : Math.min(SIEDLER_IDS.length, vorrat);
  const ids = SIEDLER_IDS.filter((id) => wunsch.includes(id)).slice(0, max);
  if (leer) return { leer, max, auswahl: ids.map((siedler) => ({ siedler, proviant: null })) };
  const rest = { ...lager };
  const zugeteilt: Partial<Record<SiedlerId, Proviant>> = {};
  for (const id of ids) {
    const p = prov[id];
    if (p && rest[p] > 0) {
      zugeteilt[id] = p;
      rest[p]--;
    }
  }
  for (const id of ids) {
    if (zugeteilt[id]) continue;
    const p = besterProviant(rest, 1)[0];
    if (p) {
      zugeteilt[id] = p;
      rest[p]--;
    }
  }
  return { leer, max, auswahl: ids.flatMap((siedler) => (zugeteilt[siedler] ? [{ siedler, proviant: zugeteilt[siedler]! }] : [])) };
}

function useTruppWahl(lager: Lager) {
  const [wunsch, setWunsch] = useState<SiedlerId[]>(SIEDLER_IDS);
  const [prov, setProv] = useState<Partial<Record<SiedlerId, Proviant>>>({});
  const ordnung = useMemo(() => ordne(lager, wunsch, prov), [lager, wunsch, prov]);
  const { auswahl, max } = ordnung;
  const ids = auswahl.map((a) => a.siedler);
  const aktuelleWahl = () => Object.fromEntries(auswahl.map((a) => [a.siedler, a.proviant])) as Partial<Record<SiedlerId, Proviant>>;
  const belegt = (p: Proviant, ohne?: SiedlerId) => auswahl.filter((a) => a.proviant === p && a.siedler !== ohne).length;

  const umschalten = (id: SiedlerId) => {
    setProv(aktuelleWahl());
    if (ids.includes(id)) setWunsch(ids.filter((x) => x !== id));
    else if (max === 1) setWunsch([id]);
    else if (ids.length < max) setWunsch([...ids, id]);
  };
  const waehle = (id: SiedlerId, p: Proviant) => {
    if (belegt(p, id) >= lager[p]) return;
    setProv({ ...aktuelleWahl(), [id]: p });
  };
  return { ...ordnung, ids, belegt, umschalten, waehle };
}

type TruppWahl = ReturnType<typeof useTruppWahl>;

function summeText(w: TruppWahl): string {
  if (!w.auswahl.length) return 'Mindestens ein Siedler';
  const schritte = schritteFuer(w.auswahl);
  if (w.leer) return `${schritte} Schritte · leerer Magen`;
  const teile = PROVIANT_BESTE.map((p) => [p, w.auswahl.filter((a) => a.proviant === p).length] as const)
    .filter(([, n]) => n > 0)
    .map(([p, n]) => `${n} ${WAREN[p].mehrzahl}`);
  return `${schritte} Schritte · ${teile.join(', ')}`;
}

function TruppBlock({ lager, w }: { lager: Lager; w: TruppWahl }) {
  return (
    <div className="abschnitt">
      <h4>Wer kommt mit?</h4>
      {w.leer && <div className="hinweis"><Info className="ic" /><span>Kein Proviant – einer geht mit leerem Magen ({REGELN.leererMagenSchritte} Schritte)</span></div>}
      {SIEDLER_IDS.map((id) => {
        const s = SIEDLER[id];
        const a = w.auswahl.find((x) => x.siedler === id);
        const an = !!a;
        const voll = !an && w.max > 1 && w.ids.length >= w.max;
        const schritte = a ? (a.proviant ? PROVIANT[a.proviant].schritte : REGELN.leererMagenSchritte) : 0;
        const sub = an ? `${schritte} Schritte` : voll ? 'kein Proviant mehr' : 'bleibt zu Hause';
        return (
          <div className={`pz${an ? '' : ' aus'}`} key={id} style={{ '--p': SIEDLER_FARBE[id] } as CSSProperties}>
            <button className="wahl" aria-pressed={an} disabled={voll} title={s.beruf} onClick={() => w.umschalten(id)}>
              <span className="portrait">
                <span className="gesicht">{s.name[0]}</span>
                {an && <span className="abzeichen"><Check className="ic" /></span>}
              </span>
              <span><b>{s.name}</b><small>{sub}</small></span>
            </button>
            <div className="prov" role="radiogroup" aria-label={`Proviant für ${s.name}`}>
              {w.leer
                ? an && <span className="chip text">leerer Magen</span>
                : PROVIANT_BESTE.map((p) => {
                    const mein = an && a.proviant === p;
                    const aus = !an || (!mein && w.belegt(p, id) >= lager[p]);
                    return (
                      <button
                        key={p}
                        className="pv"
                        role="radio"
                        aria-checked={mein}
                        disabled={aus}
                        title={`${WAREN[p].name} · ${PROVIANT[p].schritte} Schritte`}
                        aria-label={`${s.name}: ${WAREN[p].name}, ${PROVIANT[p].schritte} Schritte, ${lager[p]} im Lager`}
                        onClick={() => w.waehle(id, p)}
                      >
                        <Marke art={p} groesse="k" />
                        <span className="anz">{zahl(lager[p])}</span>
                      </button>
                    );
                  })}
            </div>
          </div>
        );
      })}
      {!w.leer && (
        <>
          <div className="chips legende">
            {PROVIANT_BESTE.map((p) => <span className="chip" key={p}><Marke art={p} groesse="k" />{WAREN[p].name} {PROVIANT[p].schritte}</span>)}
          </div>
          <p className="text-hinweis">Schritte je Proviant · Zahl am Knopf: im Lager</p>
        </>
      )}
    </div>
  );
}

// ---------- Teile des Details ----------

const Chip = ({ symbol, text, gut = false }: { symbol: ReactNode; text: string; gut?: boolean }) => (
  <span className={`chip text${gut ? ' gut' : ''}`}>{symbol}{text}</span>
);

function Waechst({ gerodet }: { gerodet: boolean }) {
  return (
    <div className="abschnitt">
      <h4>Wächst hier</h4>
      <div className="marken-raster">
        {(Object.keys(BIOME.wald.gewichte) as Art[]).filter((a) => !(gerodet && a === 'gestruepp')).map((a) => (
          <span className="mr" key={a}><Marke art={a} />{ARTEN[a].mehrzahl}</span>
        ))}
      </div>
    </div>
  );
}

function Siedlerliste() {
  return (
    <div className="liste">
      {SIEDLER_IDS.map((id) => (
        <div className="zeile" key={id} style={{ '--p': SIEDLER_FARBE[id] } as CSSProperties}>
          <span className="portrait klein"><span className="gesicht">{SIEDLER[id].name[0]}</span></span>
          <span>{SIEDLER[id].name} <span className="beruf">· {SIEDLER[id].beruf}</span></span>
        </div>
      ))}
    </div>
  );
}

function AuftragZeile({ s, gebaeude }: { s: Siedlung; gebaeude: GebaeudeId }) {
  const a = s.auftraege[gebaeude];
  const r = REZEPTE[a.rezept];
  return (
    <div className="zeile">
      <Marke art={r.aus} groesse="m" />
      <span>{a.menge ? r.name : 'Kein Auftrag'}</span>
      <span className="wert">{a.menge} je Nacht</span>
    </div>
  );
}

// ---------- Detail ----------

interface Props {
  s: Siedlung;
  fleck: FleckId;
  onWaehle: (id: FleckId) => void;
  onStart: (auswahl: Aufbruch[]) => void;
  onFortsetzen: () => void;
  onBauen: (gebaeude: GebaeudeId, fleck: FleckId) => void;
  onAbbau: (fleck: FleckId) => void;
  onWerkstatt: () => void;
  onLager: () => void;
}

/** Fleck-Detail: Kopf, Rumpf (scrollt) und Fuß mit dem Hauptknopf. Je Zustand anders, wie im Mockup. */
export function FleckDetail({ s, fleck: id, onWaehle, onStart, onFortsetzen, onBauen, onAbbau, onWerkstatt, onLager }: Props) {
  const daten = fleckDaten(id);
  const st = s.flecken[id];
  const lauf = s.unterwegs;
  const laufName = lauf ? fleckDaten(lauf.fleck).name : '';
  const wahl = useTruppWahl(s.lager);

  const fremd = <div className="hinweis"><Info className="ic" /><span>Erst das Tagwerk im {laufName} beenden</span></div>;
  const zumLauf = lauf && (
    <button className="knopf zweit" onClick={() => onWaehle(lauf.fleck)}><MapPin className="ic" />Zum {laufName}</button>
  );
  const start = (haupt: boolean) => (
    <>
      <div className="summe"><span>{summeText(wahl)}</span></div>
      <button className={`knopf ${haupt ? 'haupt' : 'zweit'}`} disabled={!wahl.auswahl.length} onClick={() => onStart(wahl.auswahl)}>Tagwerk beginnen</button>
    </>
  );

  let titel = daten.name;
  const chips: ReactNode[] = [];
  let rumpf: ReactNode = null;
  let fuss: ReactNode = null;

  if (st.zustand === 'erkundet') {
    const BiomSymbol = BIOM_SYMBOL[daten.biom];
    chips.push(<Chip key="b" symbol={<BiomSymbol className="ic" />} text={BIOM_NAME[daten.biom]} />);
    const nebel = fleckNachbarn(id).filter((n) => s.flecken[n].zustand === 'nebel').length;
    if (nebel) chips.push(<Chip key="n" symbol={<MapPin className="ic" />} text={`Deckt ${nebel} ${nebel === 1 ? 'Fleck' : 'Flecken'} auf`} />);
    const ziel = <div className="abschnitt"><h4>Rodung</h4><GestruepZiel stand={st.stand} gesamt={st.ziel} eben /></div>;
    if (lauf?.fleck === id) {
      const namen = lauf.tagwerk.trupp.map((t) => SIEDLER[t].name).join(', ');
      rumpf = (
        <>
          <div className="abschnitt">
            <h4>Tagwerk</h4>
            <div className="lauf">
              <Medaille schritte={lauf.tagwerk.schritte} />
              <div><b>Läuft</b><p>{namen} {lauf.tagwerk.trupp.length === 1 ? 'ist' : 'sind'} unterwegs</p></div>
            </div>
          </div>
          {ziel}
          <Waechst gerodet={false} />
        </>
      );
      fuss = <button className="knopf haupt" onClick={onFortsetzen}>Tagwerk fortsetzen</button>;
    } else if (lauf) {
      rumpf = <><div className="abschnitt">{fremd}</div>{ziel}<Waechst gerodet={false} /></>;
      fuss = zumLauf;
    } else {
      rumpf = <>{ziel}<TruppBlock lager={s.lager} w={wahl} /><Waechst gerodet={false} /></>;
      fuss = start(true);
    }
  } else if (st.zustand === 'gerodet') {
    chips.push(<Chip key="g" symbol={<Check className="ic" />} text="Gerodet" gut />);
    const frei = baubareGebaeude(s);
    const haupt = ersteBaubare(s, frei);
    const bauen = (
      <div className="abschnitt">
        <h4>Bauen</h4>
        {frei.length
          ? <div className="liste bauliste">{frei.map((g) => <BauZeile key={g} s={s} gebaeude={g} ziel={id} haupt={g === haupt} onBauen={() => onBauen(g, id)} />)}</div>
          : <p className="text-hinweis">Nichts mehr zu bauen.</p>}
      </div>
    );
    if (lauf) {
      rumpf = <><div className="abschnitt">{fremd}</div>{bauen}</>;
      fuss = zumLauf;
    } else {
      rumpf = <>{bauen}<TruppBlock lager={s.lager} w={wahl} /></>;
      fuss = start(false);
    }
  } else if (st.zustand === 'bebaut') {
    const g = st.gebaeude;
    const werkstatt = <button className="knopf zweit" onClick={onWerkstatt}><Hammer className="ic" />Werkstatt öffnen</button>;
    if (!g || g === 'huetten') {
      chips.push(<Chip key="h" symbol={<House className="ic" />} text="2 Hütten" />);
      rumpf = <div className="abschnitt"><h4>Bewohner</h4><Siedlerliste /></div>;
    } else {
      const Symbol = GEBAEUDE_SYMBOL[g];
      if (id === 'holzplatz') chips.push(<Chip key="l" symbol={<Warehouse className="ic" />} text="Lager" />);
      chips.push(<Chip key="g" symbol={<Symbol className="ic" />} text={GEBAEUDE[g].name} />);
      rumpf = (
        <>
          {g === 'lagerfeuer' && <div className="abschnitt"><h4>Am Feuer</h4><Siedlerliste /></div>}
          <div className="abschnitt"><h4>Auftrag für die Nacht</h4><AuftragZeile s={s} gebaeude={g} /></div>
          {g === 'zimmerei' && <button className="textknopf" onClick={onLager}>Lager ansehen</button>}
        </>
      );
      const zuruecknehmen = GEBAEUDE[g].baubar && st.gebautAmTag === s.tag;
      fuss = (
        <>
          {werkstatt}
          {zuruecknehmen && <button className="textknopf" onClick={() => onAbbau(id)}>Bau zurücknehmen (bis zum Einbringen)</button>}
        </>
      );
    }
  } else if (st.zustand === 'gesperrt') {
    chips.push(<Chip key="s" symbol={<Lock className="ic" />} text="Noch nicht erreichbar" />);
    rumpf = <p className="text-hinweis">Hier geht es noch nicht weiter.</p>;
  } else {
    titel = 'Unerkundet';
    const treiber = fleckNachbarn(id)
      .filter((n) => s.flecken[n].zustand === 'erkundet')
      .sort((a, b) => s.flecken[b].stand / s.flecken[b].ziel - s.flecken[a].stand / s.flecken[a].ziel)[0];
    if (treiber) {
      const t = s.flecken[treiber];
      chips.push(<Chip key="u" symbol={<CloudFog className="ic" />} text="Unerkundet" />);
      rumpf = (
        <div className="abschnitt">
          <h4>Wird sichtbar durch {fleckDaten(treiber).name}</h4>
          <GestruepZiel stand={t.stand} gesamt={t.ziel} eben />
        </div>
      );
      fuss = <button className="knopf zweit" onClick={() => onWaehle(treiber)}><MapPin className="ic" />Zum {fleckDaten(treiber).name}</button>;
    } else {
      chips.push(<Chip key="s" symbol={<Lock className="ic" />} text="Noch nicht erreichbar" />);
      rumpf = <p className="text-hinweis">Hier geht es noch nicht weiter.</p>;
    }
  }

  return (
    <>
      <div className="detail-kopf">
        <h3>{titel}</h3>
        {chips.length > 0 && <div className="chips">{chips}</div>}
      </div>
      <div className="detail-rumpf">{rumpf}</div>
      {fuss && <div className="detail-fuss">{fuss}</div>}
    </>
  );
}
