import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Undo2 } from 'lucide-react';
import { ARTEN, ROHSTOFFE, kannStarten, pfadErweitern, vorschau, type Zelle } from '@lichtung/spiel';
import { Brett } from './komponenten/Brett';
import { EndeDialog, Menue, RegelnDialog } from './komponenten/Dialoge';
import { Blase, HeimKnopf, Medaille, Mitglied, Toast, Wortmarke, Zielband } from './komponenten/Teile';
import { Marke } from './symbole';
import { useBreit, useStimmung } from './umgebung';
import { useSpiel, type Meldung } from './useSpiel';

const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

export function TagwerkAnsicht() {
  const spiel = useSpiel();
  const breit = useBreit();
  const [stimmung, setStimmung] = useStimmung();
  const [menueOffen, setMenueOffen] = useState(false);
  const [regelnOffen, setRegelnOffen] = useState(spiel.ersterStart);
  const [pfad, setPfad] = useState<Zelle[]>([]);
  const pfadRef = useRef<Zelle[]>([]);
  const t = spiel.tagwerk;

  const setzePfad = (p: Zelle[]) => {
    pfadRef.current = p;
    setPfad(p);
  };

  const vs = useMemo(() => vorschau(t, pfad), [t, pfad]);

  // Während des Ziehens zeigt die Blase die Vorschau, sonst die letzte Meldung
  const blase: Meldung | null = useMemo(() => {
    if (!vs) return spiel.meldung;
    let text = `${ARTEN[vs.art].name} × ${vs.laenge}${vs.gueltig ? ` · +${vs.summe}` : ''}`;
    if (vs.innen.length) {
      const teile = [vs.ring.ertrag ? `+${vs.ring.ertrag}` : '', vs.ring.hasen ? anzahl(vs.ring.hasen, 'Hase', 'Hasen') : '', vs.ring.gestruepp ? `${vs.ring.gestruepp} Gestrüpp` : ''];
      text += ` · Ring! ${teile.filter(Boolean).join(' · ')}`;
    }
    return { symbol: vs.art, text, ton: vs.innen.length ? 'gold' : vs.gueltig ? '' : 'leise' };
  }, [vs, spiel.meldung]);

  const onStart = (zelle: Zelle) => {
    spiel.vorziehen();
    setzePfad(kannStarten(spiel.aktuellesTagwerk(), zelle) ? [zelle] : []);
  };
  const onWeiter = (zelle: Zelle) => {
    if (!pfadRef.current.length) return onStart(zelle);
    setzePfad(pfadErweitern(spiel.aktuellesTagwerk(), pfadRef.current, zelle));
  };
  const onLoslassen = () => {
    const p = pfadRef.current;
    setzePfad([]);
    if (p.length >= 3) spiel.ernte(p);
    else if (p.length) spiel.setMeldung({ symbol: spiel.aktuellesTagwerk().gitter[p[0][0]][p[0][1]].art, text: 'Mindestens 3 gleiche Kacheln', ton: 'leise' });
  };
  const onAbbruch = () => setzePfad([]);

  const offenerDialog = spiel.endeOffen || regelnOffen;
  const zurueck = spiel.zurueck;
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !regelnOffen) {
        e.preventDefault();
        zurueck();
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [zurueck, regelnOffen]);

  const schliesseMenue = useCallback(() => setMenueOffen(false), []);
  const { setHinweis } = spiel;
  const schliesseHinweis = useCallback(() => setHinweis(null), [setHinweis]);

  const titel = (
    <div className="titel">
      <h1>Nordwald</h1>
      <span className="tagzeile">Wald · Tag {spiel.stand.tag}</span>
    </div>
  );
  const knoepfe = (
    <>
      <button className="rund" onClick={spiel.zurueck} disabled={!spiel.kannZurueck} title={spiel.kannZurueck ? 'Letzte Kette zurücknehmen (Strg Z)' : 'Noch keine Kette'} aria-label="Letzte Kette zurücknehmen">
        <Undo2 className="ic" />
      </button>
      <button className="rund js-menue" onClick={() => setMenueOffen((o) => !o)} aria-expanded={menueOffen} aria-label="Menü" title="Menü">
        <Menu className="ic" />
      </button>
    </>
  );
  const brett = (
    <div className="brett-platz">
      <Brett tagwerk={t} pfad={pfad} innen={vs?.innen ?? []} geister={spiel.geister} herkunft={spiel.herkunft} onStart={onStart} onWeiter={onWeiter} onLoslassen={onLoslassen} onAbbruch={onAbbruch} />
    </div>
  );

  return (
    <>
      <div className={`tagwerk ${breit ? 'breit' : 'schmal'}`} inert={offenerDialog || undefined}>
        {breit ? (
          <>
            <header className="leiste">
              <div className="links"><Wortmarke /></div>
              {titel}
              <div className="rechts">{knoepfe}</div>
            </header>
            <div className="tw-raster">
              <aside className="spalte">
                <div className="karte">
                  <Medaille schritte={t.schritte} gross />
                  <Zielband tagwerk={t} flach />
                </div>
                <div className="karte">
                  <h3>Beutel</h3>
                  <div className="liste">
                    {[...ROHSTOFFE, 'hase' as const].map((art) => (
                      <Zeile key={art} art={art} wert={t.ertrag[art]} />
                    ))}
                  </div>
                </div>
              </aside>
              <main className="mitte">
                <Blase meldung={blase} />
                {brett}
              </main>
              <aside className="spalte">
                <div className="karte">
                  <h3>Trupp</h3>
                  <div className="liste">
                    {t.trupp.map((id) => <Mitglied key={id} id={id} tagwerk={t} zeilig onEinsetzen={spiel.setzeEin} />)}
                  </div>
                </div>
                <button className="knopf zweit unten" onClick={spiel.heimkehren}>Heimkehren</button>
              </aside>
            </div>
          </>
        ) : (
          <>
            <header className="kopf">
              <Wortmarke nurZeichen />
              {titel}
              {knoepfe}
            </header>
            <div className="hud">
              <Medaille schritte={t.schritte} />
              <Zielband tagwerk={t} />
            </div>
            <Blase meldung={blase} />
            {brett}
            <div className="beutel">
              {[...ROHSTOFFE, 'hase' as const].map((art) => (
                <Pille key={art} art={art} wert={t.ertrag[art]} />
              ))}
            </div>
            <div className="trupp-reihe">
              {t.trupp.map((id) => <Mitglied key={id} id={id} tagwerk={t} onEinsetzen={spiel.setzeEin} />)}
              <HeimKnopf onClick={spiel.heimkehren} />
            </div>
          </>
        )}
      </div>

      {menueOffen && (
        <Menue stimmung={stimmung} bester={spiel.stand.bester} onStimmung={setStimmung} onRegeln={() => setRegelnOffen(true)} onNeu={spiel.neuBeginnen} onSchliessen={schliesseMenue} />
      )}
      <Toast hinweis={spiel.hinweis} onSchliessen={schliesseHinweis} />
      {spiel.endeOffen && (
        <EndeDialog
          tagwerk={t}
          tag={spiel.stand.tag}
          bester={spiel.stand.bester}
          kannZurueck={spiel.kannZurueck}
          onWeiter={spiel.schliesseEnde}
          onZurueck={spiel.zurueck}
          onEinbringen={spiel.einbringen}
        />
      )}
      {regelnOffen && <RegelnDialog onSchliessen={() => setRegelnOffen(false)} />}
    </>
  );
}

/** Beutel-Eintrag, der kurz anstößt, wenn sein Wert steigt. */
function useAnstoss<T extends HTMLElement>(wert: number) {
  const ref = useRef<T>(null);
  const vorher = useRef(wert);
  useEffect(() => {
    const el = ref.current;
    if (el && wert > vorher.current) {
      el.classList.remove('stoss');
      void el.offsetWidth;
      el.classList.add('stoss');
    }
    vorher.current = wert;
  }, [wert]);
  return ref;
}

function Pille({ art, wert }: { art: keyof typeof ARTEN; wert: number }) {
  const ref = useAnstoss<HTMLSpanElement>(wert);
  return (
    <span className="pille" ref={ref} title={ARTEN[art].mehrzahl}>
      <Marke art={art} />
      <span className="wert">{wert}</span>
    </span>
  );
}

function Zeile({ art, wert }: { art: keyof typeof ARTEN; wert: number }) {
  const ref = useAnstoss<HTMLSpanElement>(wert);
  return (
    <div className="zeile">
      <Marke art={art} groesse="m" />
      <span>{ARTEN[art].mehrzahl}</span>
      <span className="wert" ref={ref}>{wert}</span>
    </div>
  );
}
