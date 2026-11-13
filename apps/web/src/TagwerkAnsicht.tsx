import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Menu, Undo2 } from 'lucide-react';
import { ARTEN, BIOME, ROHSTOFFE, fleckDaten, kannStarten, pfadErweitern, vorschau, type FleckId, type Tagwerk, type Zelle } from '@lichtung/spiel';
import { Brett } from './komponenten/Brett';
import { EndeDialog } from './komponenten/Dialoge';
import { Blase, HeimKnopf, Medaille, Mitglied, Wortmarke, Zielband, useAnstoss } from './komponenten/Teile';
import { Marke } from './symbole';
import { useSpiel, type Hinweis, type Meldung } from './useSpiel';

const anzahl = (n: number, eins: string, viele: string) => `${n} ${n === 1 ? eins : viele}`;

interface Props {
  fleck: FleckId;
  tag: number;
  bester: number;
  tagwerk: Tagwerk;
  breit: boolean;
  menueOffen: boolean;
  /** Ein Dialog der App (Regeln) ist offen. */
  fremderDialog: boolean;
  onTagwerk: (t: Tagwerk) => void;
  onEinbringen: (t: Tagwerk) => void;
  onZurueck: () => void;
  onMenue: () => void;
  setHinweis: (h: Hinweis | null) => void;
}

export function TagwerkAnsicht({ fleck, tag, bester, tagwerk, breit, menueOffen, fremderDialog, onTagwerk, onEinbringen, onZurueck, onMenue, setHinweis }: Props) {
  const spiel = useSpiel(tagwerk, onTagwerk, onEinbringen, setHinweis);
  const ort = fleckDaten(fleck);
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

  const offenerDialog = spiel.endeOffen || fremderDialog;
  const zurueck = spiel.zurueck;
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !fremderDialog) {
        e.preventDefault();
        zurueck();
      }
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [zurueck, fremderDialog]);

  const zurSiedlung = () => {
    spiel.vorziehen();
    onZurueck();
  };

  const titel = (
    <div className="titel">
      <h1>{ort.name}</h1>
      <span className="tagzeile">{BIOME.wald.name} · Tag {tag}</span>
    </div>
  );
  const zurueckKnopf = (
    <button className="rund" onClick={zurSiedlung} aria-label="Zur Siedlung" title="Zur Siedlung – das Tagwerk wartet">
      <ChevronLeft className="ic" />
    </button>
  );
  const knoepfe = (
    <>
      <button className="rund" onClick={spiel.zurueck} disabled={!spiel.kannZurueck} title={spiel.kannZurueck ? 'Letzte Kette zurücknehmen (Strg Z)' : 'Noch keine Kette'} aria-label="Letzte Kette zurücknehmen">
        <Undo2 className="ic" />
      </button>
      <button className="rund js-menue" onClick={onMenue} aria-expanded={menueOffen} aria-label="Menü" title="Menü">
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
              <div className="links">{zurueckKnopf}<Wortmarke /></div>
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
              {zurueckKnopf}
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

      {spiel.endeOffen && (
        <EndeDialog
          tagwerk={t}
          ort={ort.name}
          tag={tag}
          bester={bester}
          kannZurueck={spiel.kannZurueck}
          onWeiter={spiel.schliesseEnde}
          onZurueck={spiel.zurueck}
          onEinbringen={spiel.einbringen}
        />
      )}
    </>
  );
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
