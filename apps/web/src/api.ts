/** Kleiner Client für den Lichtung-Server. Unterscheidet „nicht erreichbar“, „nicht angemeldet“ und Fehler mit Text. */

export const ZEITLIMIT = 8000;

export type Ergebnis<T> =
  | { art: 'ok'; daten: T }
  | { art: 'nichtErreichbar' }
  | { art: 'nichtAngemeldet' }
  | { art: 'fehler'; status: number; fehler: string; wartenSekunden?: number; daten?: Record<string, unknown> };

export interface Optionen {
  body?: unknown;
  keepalive?: boolean;
  zeitlimit?: number;
  /** 401 heißt hier „falsch“, nicht „nicht angemeldet“ (Anmelden). */
  ohneSitzung?: boolean;
}

const istObjekt = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export async function anfrage<T>(methode: 'GET' | 'POST' | 'PUT', pfad: string, o: Optionen = {}): Promise<Ergebnis<T>> {
  const abbruch = new AbortController();
  const timer = setTimeout(() => abbruch.abort(), o.zeitlimit ?? ZEITLIMIT);
  try {
    const schreibend = methode !== 'GET';
    const antwort = await fetch(pfad, {
      method: methode,
      credentials: 'same-origin',
      headers: schreibend ? { 'content-type': 'application/json', 'X-Lichtung': '1' } : undefined,
      body: schreibend ? JSON.stringify(o.body ?? {}) : undefined,
      keepalive: o.keepalive,
      signal: abbruch.signal,
    });
    // Kein JSON (z. B. statisches Hosting ohne Server) oder Serverfehler: wie nicht erreichbar behandeln
    if (antwort.status >= 500) return { art: 'nichtErreichbar' };
    let inhalt: unknown;
    try {
      inhalt = await antwort.json();
    } catch {
      return { art: 'nichtErreichbar' };
    }
    if (antwort.ok) return { art: 'ok', daten: inhalt as T };
    if (antwort.status === 401 && !o.ohneSitzung) return { art: 'nichtAngemeldet' };
    const k = istObjekt(inhalt) ? inhalt : {};
    return {
      art: 'fehler',
      status: antwort.status,
      fehler: typeof k.fehler === 'string' ? k.fehler : 'Das hat nicht geklappt',
      wartenSekunden: typeof k.wartenSekunden === 'number' ? k.wartenSekunden : undefined,
      daten: k,
    };
  } catch {
    return { art: 'nichtErreichbar' };
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Routen ----------

export interface Ich {
  eingerichtet: boolean;
  angemeldet: boolean;
}
export interface ServerStand {
  revision: number;
  daten: Record<string, unknown> | null;
  geaendert?: number;
  geraet?: string;
}
export interface SicherungInfo {
  id: number;
  zeitpunkt: number;
  grund: string;
  geraet: string;
  tag: number | null;
}

export const ich = () => anfrage<Ich>('GET', '/api/ich', { zeitlimit: 5000 });
export const einrichten = (code: string, passwort: string) =>
  anfrage<Ich>('POST', '/api/einrichten', { body: { code, passwort }, ohneSitzung: true });
export const anmelden = (passwort: string) => anfrage<{ angemeldet: boolean }>('POST', '/api/anmelden', { body: { passwort }, ohneSitzung: true });
export const abmelden = () => anfrage<{ angemeldet: boolean }>('POST', '/api/abmelden', { ohneSitzung: true });

export const spielstandLaden = () => anfrage<ServerStand>('GET', '/api/spielstand');

export interface Eingang {
  daten: Record<string, unknown>;
  geaendert: number;
  geraet: string;
}
export const spielstandSpeichern = (basis: number, e: Eingang, keepalive = false) =>
  anfrage<{ revision: number }>('PUT', '/api/spielstand', { body: { basis, ...e }, keepalive });
export const spielstandErzwingen = (e: Eingang, grund: string) =>
  anfrage<{ revision: number }>('PUT', '/api/spielstand?erzwingen=1', { body: { ...e, grund } });

/** Legt nur eine Sicherung ab; der Stand auf dem Server bleibt, wie er ist. */
export const sicherungAnlegen = (e: Eingang, grund: string) =>
  anfrage<{ ok: boolean }>('POST', '/api/sicherungen', { body: { ...e, grund } });

export const sicherungen = () => anfrage<SicherungInfo[]>('GET', '/api/sicherungen');
export const wiederherstellen = (id: number) => anfrage<ServerStand>('POST', `/api/sicherungen/${id}/wiederherstellen`);
