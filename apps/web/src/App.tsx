import { useCallback, useEffect, useState } from 'react';
import {
  GEBAEUDE, REZEPTE, bauZuruecknehmen, bauen as bauenRegel, einbringen as einbringenRegel, fleckDaten, freieGerodete,
  gesamtErtrag, tagwerkBeginnen, auftragSetzen,
  type Aufbruch, type Arbeit, type FleckId, type GebaeudeId, type RezeptId, type Tagwerk,
} from '@lichtung/spiel';
import { SiedlungAnsicht } from './SiedlungAnsicht';
import { TagwerkAnsicht } from './TagwerkAnsicht';
import { WerkstattAnsicht } from './WerkstattAnsicht';
import { wareText } from './anzeige';
import { LagerDialog, Menue, RegelnDialog } from './komponenten/Dialoge';
import type { Effekt } from './komponenten/Landkarte';
import { Rahmen, type Bereich } from './komponenten/Rahmen';
import { Toast } from './komponenten/Teile';
import { neuerSpielstand } from './spielstand';
import { useBreit, useStimmung } from './umgebung';
import type { Hinweis } from './useSpiel';
import { useSpielstand } from './useSpielstand';

type Ansicht = Bereich | 'tagwerk';
const ANSICHTEN: Ansicht[] = ['siedlung', 'werkstatt', 'tagwerk'];
const STARTFLECK: FleckId = 'nordwald';

const ausHash = (): Ansicht | null => {
  const h = location.hash.slice(1) as Ansicht;
  return ANSICHTEN.includes(h) ? h : null;
};

/** Die Ansicht steht im Hash, damit die Zurück-Taste am Handy zwischen den Ansichten geht. */
function useAnsicht(tagwerkLaeuft: boolean) {
  const [roh, setRoh] = useState<Ansicht>(() => ausHash() ?? (tagwerkLaeuft ? 'tagwerk' : 'siedlung'));
  const ansicht: Ansicht = roh === 'tagwerk' && !tagwerkLaeuft ? 'siedlung' : roh;

  useEffect(() => {
    const geaendert = () => setRoh(ausHash() ?? 'siedlung');
    window.addEventListener('hashchange', geaendert);
    return () => window.removeEventListener('hashchange', geaendert);
  }, []);
  // Hash und Ansicht bleiben gleich, auch wenn ein Tagwerk fehlt oder beim ersten Aufruf noch kein Hash da ist
  useEffect(() => {
    if (ausHash() !== ansicht) history.replaceState(null, '', `#${ansicht}`);
    if (ansicht !== roh) setRoh(ansicht);
  }, [ansicht, roh]);

  const gehe = useCallback((a: Ansicht) => {
    if (ausHash() !== a) history.pushState(null, '', `#${a}`);
    setRoh(a);
  }, []);
  const ersetze = useCallback((a: Ansicht) => {
    history.replaceState(null, '', `#${a}`);
    setRoh(a);
  }, []);
  return { ansicht, gehe, ersetze };
}

const nachtText = (arbeit: Arbeit[]): string[] =>
  arbeit.filter((a) => a.gemacht > 0).map((a) => `${GEBAEUDE[a.gebaeude].name}: ${wareText(REZEPTE[a.rezept].aus, a.gemacht)}`);

export function App() {
  const { stand, ersterStart, speicherFehler, setze, aendere, aktuell } = useSpielstand();
  const s = stand.siedlung;
  const breit = useBreit();
  const [stimmung, setStimmung] = useStimmung();
  const { ansicht, gehe, ersetze } = useAnsicht(!!s.unterwegs);
  const [gewaehlt, setGewaehlt] = useState<FleckId>(() => s.unterwegs?.fleck ?? STARTFLECK);
  const [menueOffen, setMenueOffen] = useState(false);
  const [regelnOffen, setRegelnOffen] = useState(ersterStart);
  const [lagerOffen, setLagerOffen] = useState(false);
  const [hinweis, setHinweis] = useState<Hinweis | null>(null);
  const [effekt, setEffekt] = useState<Effekt | null>(null);

  const schliesseMenue = useCallback(() => setMenueOffen(false), []);
  const schliesseHinweis = useCallback(() => setHinweis(null), []);
  const fehler = useCallback((text: string) => setHinweis({ text, symbol: 'info' }), []);

  useEffect(() => {
    if (speicherFehler) setHinweis({ text: 'Nicht gespeichert – der Browser erlaubt keinen Speicher', symbol: 'info' });
  }, [speicherFehler]);

  // Aufgedeckte Flecken blenden kurz ein, danach ist die Karte wieder ruhig
  useEffect(() => {
    if (!effekt) return;
    const t = setTimeout(() => setEffekt(null), 2800);
    return () => clearTimeout(t);
  }, [effekt]);

  // ---------- Siedlung ----------

  const tagwerkStarten = (auswahl: Aufbruch[]) => {
    const st = aktuell();
    const r = tagwerkBeginnen(st.siedlung, gewaehlt, auswahl);
    if (!r.ok) return fehler(r.grund);
    setze({ ...st, siedlung: r.wert });
    gehe('tagwerk');
  };

  const bauen = (gebaeude: GebaeudeId, fleck: FleckId, vonWerkstatt = false) => {
    const st = aktuell();
    const r = bauenRegel(st.siedlung, gebaeude, fleck);
    if (!r.ok) return fehler(r.grund);
    setze({ ...st, siedlung: r.wert });
    setEffekt({ neu: [], wandel: [fleck] });
    const name = GEBAEUDE[gebaeude].name;
    const zurueck = () => {
      const z = bauZuruecknehmen(aktuell().siedlung, fleck);
      if (!z.ok) return fehler(z.grund);
      aendere((x) => ({ ...x, siedlung: z.wert }));
      setEffekt({ neu: [], wandel: [fleck] });
      setHinweis({ text: `${name} nicht gebaut`, symbol: 'zurueck' });
    };
    setHinweis({
      text: `${name} gebaut${vonWerkstatt ? ` · ${fleckDaten(fleck).name}` : ''}`,
      symbol: 'hammer',
      dauer: 8000,
      aktion: { text: 'Rückgängig', tun: zurueck },
    });
  };

  const bauAbbauen = (fleck: FleckId) => {
    const st = aktuell();
    const g = st.siedlung.flecken[fleck].gebaeude;
    const r = bauZuruecknehmen(st.siedlung, fleck);
    if (!r.ok) return fehler(r.grund);
    setze({ ...st, siedlung: r.wert });
    setEffekt({ neu: [], wandel: [fleck] });
    if (g && g !== 'huetten') setHinweis({ text: `${GEBAEUDE[g].name} zurückgenommen · Kosten zurück im Lager`, symbol: 'zurueck' });
  };

  // ---------- Werkstatt ----------

  const auftrag = (gebaeude: GebaeudeId, rezept: RezeptId, menge: number) => {
    const r = auftragSetzen(aktuell().siedlung, gebaeude, rezept, menge);
    if (!r.ok) return fehler(r.grund);
    aendere((x) => ({ ...x, siedlung: r.wert }));
  };

  const ausWerkstattBauen = (gebaeude: GebaeudeId) => {
    const frei = freieGerodete(aktuell().siedlung)[0];
    if (!frei) return fehler('Kein gerodeter Fleck frei');
    bauen(gebaeude, frei, true);
  };

  // ---------- Tagwerk ----------

  const tagwerkAendern = useCallback((t: Tagwerk) => {
    aendere((x) => (x.siedlung.unterwegs ? { ...x, siedlung: { ...x.siedlung, unterwegs: { ...x.siedlung.unterwegs, tagwerk: t } } } : x));
  }, [aendere]);

  const einbringen = useCallback((t: Tagwerk) => {
    const st = aktuell();
    const r = einbringenRegel(st.siedlung, t);
    if (!r.ok) {
      fehler(r.grund);
      return;
    }
    const { siedlung, fleck, gerodet, aufgedeckt, nacht } = r.wert;
    setze({ ...st, siedlung, bester: Math.max(st.bester, gesamtErtrag(t)) });
    setGewaehlt(fleck);
    setEffekt({ neu: aufgedeckt, wandel: gerodet ? [fleck] : [] });
    ersetze('siedlung');

    const teile = [`Tag ${siedlung.tag}`];
    if (gerodet) {
      const n = aufgedeckt.length;
      teile.push(`${fleckDaten(fleck).name} gerodet${n ? ` – ${n} ${n === 1 ? 'neuer Fleck' : 'neue Flecken'}` : ''}`);
    }
    const arbeit = nachtText(nacht);
    if (arbeit.length) teile.push(...arbeit);
    else if (!gerodet) teile.push('Nichts verarbeitet');
    setHinweis({ text: teile.join(' · '), symbol: 'mond', dauer: 12000, aktion: { text: 'Lager', tun: () => setLagerOffen(true) } });
  }, [aktuell, setze, ersetze, fehler]);

  const neuBeginnen = () => {
    const alt = aktuell();
    setze(neuerSpielstand());
    setGewaehlt(STARTFLECK);
    setEffekt(null);
    ersetze('siedlung');
    setHinweis({
      text: 'Neues Spiel – Tag 1',
      symbol: 'haken',
      aktion: {
        text: 'Rückgängig',
        tun: () => {
          setze(alt);
          setGewaehlt(alt.siedlung.unterwegs?.fleck ?? STARTFLECK);
          setHinweis(null);
        },
      },
    });
  };

  const dialogOffen = lagerOffen || regelnOffen;
  const imTagwerk = ansicht === 'tagwerk' && s.unterwegs;

  return (
    <div className="app" data-ansicht={ansicht} data-schmal={breit ? undefined : ''}>
      {imTagwerk ? (
        <TagwerkAnsicht
          key={`${s.unterwegs!.fleck}-${s.tag}`}
          fleck={s.unterwegs!.fleck}
          tag={s.tag}
          bester={stand.bester}
          tagwerk={s.unterwegs!.tagwerk}
          breit={breit}
          menueOffen={menueOffen}
          fremderDialog={regelnOffen}
          onTagwerk={tagwerkAendern}
          onEinbringen={einbringen}
          onZurueck={() => gehe('siedlung')}
          onMenue={() => setMenueOffen((o) => !o)}
          setHinweis={setHinweis}
        />
      ) : (
        <Rahmen
          ansicht={ansicht === 'werkstatt' ? 'werkstatt' : 'siedlung'}
          breit={breit}
          tag={s.tag}
          menueOffen={menueOffen}
          gesperrt={dialogOffen}
          onGehe={gehe}
          onMenue={() => setMenueOffen((o) => !o)}
        >
          {ansicht === 'werkstatt' ? (
            <WerkstattAnsicht s={s} onAuftrag={auftrag} onBauen={ausWerkstattBauen} onLager={() => setLagerOffen(true)} />
          ) : (
            <SiedlungAnsicht
              s={s}
              breit={breit}
              gewaehlt={gewaehlt}
              effekt={effekt}
              onWaehle={setGewaehlt}
              onStart={tagwerkStarten}
              onFortsetzen={() => gehe('tagwerk')}
              onBauen={(g, f) => bauen(g, f)}
              onAbbau={bauAbbauen}
              onWerkstatt={() => gehe('werkstatt')}
              onLager={() => setLagerOffen(true)}
            />
          )}
        </Rahmen>
      )}

      {menueOffen && (
        <Menue stimmung={stimmung} bester={stand.bester} onStimmung={setStimmung} onRegeln={() => setRegelnOffen(true)} onNeu={neuBeginnen} onSchliessen={schliesseMenue} />
      )}
      <Toast hinweis={hinweis} onSchliessen={schliesseHinweis} />
      {lagerOffen && <LagerDialog lager={s.lager} tag={s.tag} onSchliessen={() => setLagerOffen(false)} />}
      {regelnOffen && <RegelnDialog onSchliessen={() => setRegelnOffen(false)} />}
    </div>
  );
}
