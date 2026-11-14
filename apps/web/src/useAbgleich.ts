import { useEffect, useRef, useState } from 'react';
import * as api from './api';
import { entscheide, standInfo, type Entscheidung, type Seite, type StandInfo } from './abgleich';
import { ausServerDaten, zuDaten, type Spieldaten, type Spielstand } from './spielstand';
import type { Abgleichsfelder } from './useSpielstand';
import type { Hinweis } from './useSpiel';

/**
 * Gleicht den Stand auf diesem Gerät mit dem Server ab. Der Client rechnet das Spiel, der Server speichert nur.
 *
 * Start: GET /api/ich
 *   nicht erreichbar → lokal spielen (Status „Nur auf diesem Gerät“ bzw. „Offline …“)
 *   nicht eingerichtet → Einrichten · nicht angemeldet → Anmelden
 *   angemeldet → GET /api/spielstand und `entscheide` (siehe abgleich.ts)
 * Danach: 2 s nach jeder Änderung speichern, sofort beim Wechsel in den Hintergrund, wiederholen bei „online“ und alle 30 s.
 */

export type Phase = 'pruefen' | 'einrichten' | 'anmelden' | 'spiel';
export type Status = 'lokal' | 'gespeichert' | 'speichert' | 'offline' | 'abgemeldet' | 'fehler';

export interface Frage {
  lokal: StandInfo;
  server: StandInfo;
  /** Vorgewählt: der Stand mit dem späteren Zeitpunkt. */
  neuer: Seite;
}

export type FormErgebnis =
  | { ok: true }
  | { ok: false; fehler: string; feld?: 'code' | 'passwort'; wartenSekunden?: number; offline?: boolean };

export type WiederErgebnis = { ok: true; tag: number; zurueck: number | null } | { ok: false; fehler: string };

const VERZOEGERUNG = 2000;
const WIEDERHOLEN = 30_000;
const NEU_LADEN_ABSTAND = 10_000;
const VERBUNDEN = 'lichtung.verbunden';
export const KEINE_VERBINDUNG = 'Keine Verbindung';

const nieVerbunden = (): boolean => {
  try {
    return localStorage.getItem(VERBUNDEN) !== '1';
  } catch {
    return true;
  }
};
const verbundenMerken = () => {
  try {
    localStorage.setItem(VERBUNDEN, '1');
  } catch {
    // ohne Speicher gilt „nur lokal“
  }
};

interface Eingabe {
  stand: Spielstand;
  aktuell: () => Spielstand;
  merke: (p: Abgleichsfelder) => void;
  uebernehmen: (s: Spieldaten, revision: number, geaendert: number) => void;
  geraet: string;
  melde: (h: Hinweis) => void;
  oeffneSicherungen: () => void;
}

export function useAbgleich(eingabe: Eingabe) {
  const { stand } = eingabe;
  const [phase, setPhaseState] = useState<Phase>('pruefen');
  const [status, setStatusState] = useState<Status>('lokal');
  const [gespeichertUm, setGespeichertUm] = useState<number | null>(null);
  const [frage, setFrageState] = useState<Frage | null>(null);

  // Immer der neueste Stand für Zeitgeber und Ereignisse
  const e = useRef(eingabe);
  e.current = eingabe;
  const phaseRef = useRef<Phase>('pruefen');
  const statusRef = useRef<Status>('lokal');
  const frageRef = useRef<Frage | null>(null);
  const serverRef = useRef<api.ServerStand | null>(null);
  const zugRef = useRef(false);
  const wartend = useRef<(() => void) | null>(null);
  const zuletztGeladen = useRef(0);
  const gestartet = useRef(false);
  const kette = useRef<Promise<unknown>>(Promise.resolve());

  function setPhase(p: Phase) {
    phaseRef.current = p;
    setPhaseState(p);
  }
  function setStatus(s: Status) {
    statusRef.current = s;
    setStatusState(s);
    if (s === 'gespeichert') setGespeichertUm(Date.now());
  }
  function setFrage(f: Frage | null) {
    frageRef.current = f;
    setFrageState(f);
  }

  /** Alles, was den Server berührt, läuft nacheinander. */
  function reihe<T>(f: () => Promise<T>): Promise<T> {
    const n = kette.current.then(f, f);
    kette.current = n.catch(() => undefined);
    return n;
  }

  /** Wechsel der Ansicht und Übernahme eines Serverstands nie mitten in einer Kette. */
  function wennRuhig(f: () => void) {
    if (zugRef.current) wartend.current = f;
    else f();
  }

  function meldeZug(offen: boolean) {
    zugRef.current = offen;
    if (!offen && wartend.current) {
      const f = wartend.current;
      wartend.current = null;
      f();
    }
  }

  function nichtErreichbar() {
    setStatus(nieVerbunden() ? 'lokal' : 'offline');
    if (phaseRef.current === 'pruefen') setPhase('spiel');
  }

  function unterwegsFehler() {
    setStatus('fehler');
    if (phaseRef.current === 'pruefen') setPhase('spiel');
  }

  function zurAnmeldung() {
    setStatus('abgemeldet');
    wennRuhig(() => setPhase('anmelden'));
  }

  // ---------- Speichern ----------

  const eingangVon = (s: Spielstand): api.Eingang => ({ daten: zuDaten(s), geaendert: s.geaendert, geraet: e.current.geraet });

  async function speichernInnen(o: { keepalive?: boolean; basis?: number; tiefe?: number } = {}): Promise<void> {
    if (phaseRef.current !== 'spiel' || frageRef.current) return;
    const s = e.current.aktuell();
    if (!s.ungespeichert && o.basis === undefined) return;
    setStatus('speichert');
    const r = await api.spielstandSpeichern(o.basis ?? s.revision, eingangVon(s), o.keepalive);
    if (r.art === 'ok') {
      const noch = e.current.aktuell().geaendert !== s.geaendert;
      e.current.merke({ revision: r.daten.revision, ungespeichert: noch });
      setStatus('gespeichert');
    } else if (r.art === 'fehler' && r.status === 409) {
      const server = r.daten as unknown as api.ServerStand | undefined;
      const tiefe = o.tiefe ?? 0;
      if (!server || typeof server.revision !== 'number' || tiefe > 2) return unterwegsFehler();
      await anwenden(entscheide(e.current.aktuell(), server), server, tiefe + 1);
    } else if (r.art === 'nichtAngemeldet') zurAnmeldung();
    else if (r.art === 'nichtErreichbar') nichtErreichbar();
    else unterwegsFehler();
  }

  // ---------- Entscheiden und anwenden ----------

  /** „diesem Gerät“, wenn beide Geräte gleich heißen. */
  const hierText = (serverGeraet: string): string => (e.current.geraet === serverGeraet ? 'von diesem Gerät' : `vom ${e.current.geraet}`);

  /** Der Gewinner wird der Stand auf dem Server, der andere liegt unter Sicherungen. */
  async function loese(gewinner: Seite, server: api.ServerStand): Promise<void> {
    const lokal = e.current.aktuell();
    const hier = e.current.geraet;
    const serverGeraet = server.geraet || 'anderen Gerät';
    const spiel = ausServerDaten(server.daten);
    const hinweis = (text: string) =>
      e.current.melde({ text, symbol: 'wolke', dauer: 0, aktion: { text: 'Ansehen', tun: e.current.oeffneSicherungen } });
    const fehlgeschlagen = (r: api.Ergebnis<unknown>) => {
      if (r.art === 'nichtAngemeldet') zurAnmeldung();
      else if (r.art === 'nichtErreichbar') nichtErreichbar();
      else unterwegsFehler();
    };

    if (gewinner === 'lokal' || !spiel) {
      // Der Stand von hier wird zum Stand des Servers; der bisherige Serverstand wird Sicherung
      const hoch = await api.spielstandErzwingen(eingangVon(lokal), `Vom ${hier} überholt`);
      if (hoch.art !== 'ok') return fehlgeschlagen(hoch);
      e.current.merke({ revision: hoch.daten.revision, ungespeichert: e.current.aktuell().geaendert !== lokal.geaendert });
      setStatus('gespeichert');
      hinweis(`Stand ${hierText(serverGeraet)} behalten – der vom ${serverGeraet} liegt unter Sicherungen`);
      return;
    }
    // Der Server hat gewonnen: sein Stand bleibt, der von hier wird nur als Sicherung abgelegt
    const sicher = await api.sicherungAnlegen(eingangVon(lokal), `Vom ${serverGeraet} überholt`);
    if (sicher.art !== 'ok') return fehlgeschlagen(sicher);
    e.current.uebernehmen(spiel, server.revision, server.geaendert ?? Date.now());
    setStatus('gespeichert');
    hinweis(`Stand vom ${serverGeraet} übernommen – der ${hierText(serverGeraet)} liegt unter Sicherungen`);
  }

  async function anwenden(d: Entscheidung, server: api.ServerStand, tiefe = 0): Promise<void> {
    serverRef.current = server;
    setPhase('spiel');
    // Was den Stand hier ersetzt, wartet, bis keine Kette mehr gezogen wird; danach wird neu entschieden
    const aufRuhe = (): boolean => {
      if (!zugRef.current) return false;
      wartend.current = () => void reihe(synchronisiereInnen);
      return true;
    };
    switch (d.art) {
      case 'nichts':
        setStatus('gespeichert');
        break;
      case 'angleichen':
        e.current.merke({ revision: server.revision, ungespeichert: false });
        setStatus('gespeichert');
        break;
      case 'serverUebernehmen': {
        const spiel = ausServerDaten(server.daten);
        if (!spiel || aufRuhe()) break;
        e.current.uebernehmen(spiel, server.revision, server.geaendert ?? Date.now());
        setStatus('gespeichert');
        break;
      }
      case 'lokalGilt':
        e.current.merke({ revision: server.revision });
        setStatus('gespeichert');
        if (e.current.aktuell().ungespeichert) await speichernInnen({ tiefe });
        break;
      case 'hochladen':
        await speichernInnen({ basis: 0, tiefe });
        break;
      case 'fragen': {
        const spiel = ausServerDaten(server.daten);
        if (!spiel || aufRuhe()) break;
        const lokal = e.current.aktuell();
        setStatus('lokal');
        setFrage({
          lokal: standInfo(lokal, e.current.geraet, lokal.geaendert),
          server: standInfo(spiel, server.geraet || 'Server', server.geaendert ?? 0),
          neuer: d.neuer,
        });
        break;
      }
      case 'konflikt':
        if (aufRuhe()) break;
        await loese(d.gewinner, server);
        break;
    }
  }

  async function synchronisiereInnen(): Promise<void> {
    const r = await api.spielstandLaden();
    zuletztGeladen.current = Date.now();
    if (r.art === 'nichtErreichbar') return nichtErreichbar();
    if (r.art === 'nichtAngemeldet') return zurAnmeldung();
    if (r.art !== 'ok') return unterwegsFehler();
    await anwenden(entscheide(e.current.aktuell(), r.daten), r.daten);
  }

  /** Start und jeder neue Versuch nach einer Unterbrechung. */
  async function verbinden(): Promise<void> {
    const r = await api.ich();
    if (r.art !== 'ok') {
      if (r.art === 'nichtErreichbar') nichtErreichbar();
      else unterwegsFehler();
      return;
    }
    verbundenMerken();
    if (!r.daten.eingerichtet) return wennRuhig(() => setPhase('einrichten'));
    if (!r.daten.angemeldet) return zurAnmeldung();
    await synchronisiereInnen();
  }

  /** Nach Anmelden oder Einrichten: abgleichen und ins Spiel, außer die Sitzung fehlt schon wieder. */
  async function danach(): Promise<void> {
    await synchronisiereInnen();
    if (statusRef.current !== 'abgemeldet') setPhase('spiel');
  }

  // ---------- Von der Oberfläche ----------

  async function einrichtenInnen(code: string, passwort: string): Promise<FormErgebnis> {
    const r = await api.einrichten(code, passwort);
    if (r.art === 'ok') {
      verbundenMerken();
      e.current.melde({ text: 'Eingerichtet – du bist angemeldet', symbol: 'haken' });
      await danach();
      return { ok: true };
    }
    if (r.art === 'nichtErreichbar') return { ok: false, fehler: `${KEINE_VERBINDUNG} – bitte später noch einmal`, offline: true };
    if (r.art === 'fehler') {
      if (r.status === 409) {
        setPhase('anmelden');
        return { ok: false, fehler: r.fehler };
      }
      const feld = r.status === 403 ? 'code' : r.status === 400 ? 'passwort' : undefined;
      return { ok: false, fehler: r.fehler, feld, wartenSekunden: r.wartenSekunden };
    }
    return { ok: false, fehler: 'Das hat nicht geklappt' };
  }

  async function anmeldenInnen(passwort: string): Promise<FormErgebnis> {
    const r = await api.anmelden(passwort);
    if (r.art === 'ok') {
      verbundenMerken();
      e.current.melde({ text: 'Willkommen zurück', symbol: 'haken' });
      await danach();
      return { ok: true };
    }
    if (r.art === 'nichtErreichbar') {
      return { ok: false, fehler: `${KEINE_VERBINDUNG} – du spielst mit dem Stand auf diesem Gerät weiter`, offline: true };
    }
    if (r.art === 'fehler') {
      if (r.status === 409) {
        setPhase('einrichten');
        return { ok: false, fehler: r.fehler };
      }
      return { ok: false, fehler: r.fehler, wartenSekunden: r.wartenSekunden };
    }
    return { ok: false, fehler: 'Das hat nicht geklappt' };
  }

  function offlineWeiter() {
    nichtErreichbar();
    setPhase('spiel');
    e.current.melde({ text: 'Du spielst mit dem Stand auf diesem Gerät weiter', symbol: 'wolkeAus' });
  }

  async function abmeldenInnen(): Promise<void> {
    const st = statusRef.current;
    if (e.current.aktuell().ungespeichert && (st === 'gespeichert' || st === 'fehler')) await speichernInnen();
    const r = await api.abmelden();
    if (r.art === 'nichtErreichbar') {
      e.current.melde({ text: `${KEINE_VERBINDUNG} – abmelden geht nur online`, symbol: 'wolkeAus' });
      return;
    }
    setStatus('abgemeldet');
    setPhase('anmelden');
  }

  async function waehleInnen(seite: Seite): Promise<void> {
    const f = frageRef.current;
    const server = serverRef.current;
    if (!f || !server) return;
    setFrage(null);
    setStatus('speichert');
    await loese(seite, server);
  }

  async function wiederherstellenInnen(id: number): Promise<WiederErgebnis> {
    // Eigene Änderungen gehen zuerst hoch, damit sie in „Vor Wiederherstellen“ landen
    if (e.current.aktuell().ungespeichert && statusRef.current === 'gespeichert') await speichernInnen();
    const r = await api.wiederherstellen(id);
    if (r.art === 'nichtErreichbar') return { ok: false, fehler: KEINE_VERBINDUNG };
    if (r.art === 'nichtAngemeldet') {
      zurAnmeldung();
      return { ok: false, fehler: 'Nicht angemeldet' };
    }
    if (r.art !== 'ok') return { ok: false, fehler: r.fehler };
    const spiel = ausServerDaten(r.daten.daten);
    if (!spiel) return { ok: false, fehler: 'Diese Sicherung lässt sich nicht öffnen' };
    e.current.uebernehmen(spiel, r.daten.revision, r.daten.geaendert ?? Date.now());
    setStatus('gespeichert');
    const liste = await api.sicherungen();
    const zurueck = liste.art === 'ok' ? (liste.daten.find((s) => s.grund === 'Vor Wiederherstellen')?.id ?? null) : null;
    return { ok: true, tag: spiel.siedlung.tag, zurueck };
  }

  // Funktionen ändern sich mit jedem Zeichnen, Zeitgeber und Ereignisse nehmen immer die neuesten
  const ops = { reihe, verbinden, speichernInnen, synchronisiereInnen };
  const o = useRef(ops);
  o.current = ops;

  // ---------- Zeitgeber und Ereignisse ----------

  // Start
  useEffect(() => {
    if (gestartet.current) return;
    gestartet.current = true;
    void o.current.reihe(o.current.verbinden);
  }, []);

  // 2 s nach jeder Änderung speichern
  useEffect(() => {
    if (phase !== 'spiel' || frage || !stand.ungespeichert || status !== 'gespeichert') return;
    const t = setTimeout(() => void o.current.reihe(() => o.current.speichernInnen()), VERZOEGERUNG);
    return () => clearTimeout(t);
  }, [phase, frage, stand.ungespeichert, stand.geaendert, status]);

  // Alle 30 s: ungespeicherte Änderungen hochladen oder die Verbindung erneut suchen
  useEffect(() => {
    if (phase !== 'spiel') return;
    const t = setInterval(() => {
      if (frageRef.current) return;
      const st = statusRef.current;
      if (st === 'offline' || st === 'fehler') void o.current.reihe(o.current.verbinden);
      else if (st === 'gespeichert' && e.current.aktuell().ungespeichert) void o.current.reihe(() => o.current.speichernInnen());
    }, WIEDERHOLEN);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    const online = () => {
      if (frageRef.current || phaseRef.current !== 'spiel') return;
      const st = statusRef.current;
      if (st === 'offline' || st === 'fehler' || st === 'lokal') void o.current.reihe(o.current.verbinden);
      else if (st === 'gespeichert' && e.current.aktuell().ungespeichert) void o.current.reihe(() => o.current.speichernInnen());
    };
    const sichtbar = () => {
      if (phaseRef.current !== 'spiel' || frageRef.current) return;
      const st = statusRef.current;
      if (document.visibilityState === 'hidden') {
        // Sofort sichern, solange die Seite noch läuft
        if (st === 'gespeichert' && e.current.aktuell().ungespeichert) {
          void o.current.reihe(() => o.current.speichernInnen({ keepalive: true }));
        }
        return;
      }
      // Wieder da: den Server nach einem neueren Stand fragen (z. B. am anderen Gerät weitergespielt)
      if (st === 'offline' || st === 'fehler' || st === 'lokal') void o.current.reihe(o.current.verbinden);
      else if (st === 'gespeichert' && !e.current.aktuell().ungespeichert && Date.now() - zuletztGeladen.current > NEU_LADEN_ABSTAND) {
        void o.current.reihe(o.current.synchronisiereInnen);
      }
    };
    window.addEventListener('online', online);
    document.addEventListener('visibilitychange', sichtbar);
    return () => {
      window.removeEventListener('online', online);
      document.removeEventListener('visibilitychange', sichtbar);
    };
  }, []);

  // Stabile Griffe für die Oberfläche: gleiche Identität, immer das neueste Ziel
  const g = useRef({ einrichtenInnen, anmeldenInnen, offlineWeiter, abmeldenInnen, waehleInnen, wiederherstellenInnen, meldeZug, zurAnmeldung, setPhase });
  g.current = { einrichtenInnen, anmeldenInnen, offlineWeiter, abmeldenInnen, waehleInnen, wiederherstellenInnen, meldeZug, zurAnmeldung, setPhase };
  const aussen = useRef({
    einrichten: (code: string, passwort: string) => o.current.reihe(() => g.current.einrichtenInnen(code, passwort)),
    anmelden: (passwort: string) => o.current.reihe(() => g.current.anmeldenInnen(passwort)),
    offlineWeiter: () => g.current.offlineWeiter(),
    abmelden: () => o.current.reihe(() => g.current.abmeldenInnen()),
    /** Aus dem Menü: „Anmelden“, wenn die Sitzung fehlt. */
    zurAnmeldungGehen: () => g.current.setPhase('anmelden'),
    waehle: (seite: Seite) => o.current.reihe(() => g.current.waehleInnen(seite)),
    wiederherstellen: (id: number) => o.current.reihe(() => g.current.wiederherstellenInnen(id)),
    /** Die Ansicht meldet, ob gerade eine Kette gezogen wird. */
    meldeZug: (offen: boolean) => g.current.meldeZug(offen),
    /** Aus Dialogen: die Sitzung ist abgelaufen. */
    sitzungVerloren: () => g.current.zurAnmeldung(),
  }).current;

  return { phase, status, gespeichertUm, frage, ...aussen };
}

export type Abgleich = ReturnType<typeof useAbgleich>;
