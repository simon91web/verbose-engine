import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { LogController } from 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import type { Datenbank } from './datenbank.ts';
import { datenVerzeichnis, oeffneDatenbank } from './datenbank.ts';
import {
  beendeSitzung,
  einrichtungscodeBeimStart,
  istEingerichtet,
  legeSitzungAn,
  meldeAn,
  pruefeSitzung,
  richteEin,
  SITZUNG_SEKUNDEN,
  Sperre,
  zeigeCode,
} from './konto.ts';
import {
  erzwinge,
  ladeStand,
  legeSicherungAb,
  listeSicherungen,
  pruefeEingang,
  speichere,
  starteNachtsicherung,
  stelleWiederHer,
} from './spielstand.ts';

/**
 * Liefert das gebaute Spiel aus (apps/web/dist), verwaltet das eine Konto und speichert den Spielstand.
 * `baueApp` startet nichts; Tests nutzen sie mit app.inject() und einer Datenbank im Speicher.
 */

const COOKIE = 'lichtung_sitzung';

export interface AppOptionen {
  datenbank: Datenbank;
  /** Ordner mit dem gebauten Spiel; nur ausgeliefert, wenn er existiert. */
  web?: string;
  version?: string;
  logger?: boolean | { level: string };
}

export async function baueApp({ datenbank: db, web, version = 'dev', logger = false }: AppOptionen) {
  // Keine Zeile je Anfrage – sonst füllt allein der Healthcheck das Protokoll
  const app = Fastify({
    logger,
    logController: new LogController({ disableRequestLogging: true }),
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
  });
  await app.register(fastifyCookie);

  // Leerer Body bei application/json (abmelden, wiederherstellen) ist erlaubt
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_anfrage, body, fertig) => {
    try {
      fertig(null, body === '' ? {} : JSON.parse(body as string));
    } catch {
      fertig(Object.assign(new Error('Ungültige Anfrage'), { statusCode: 400 }));
    }
  });

  app.setErrorHandler((fehler: Error & { statusCode?: number }, anfrage, antwort) => {
    const status = fehler.statusCode ?? 500;
    if (status >= 500) {
      anfrage.log.error(fehler);
      return antwort.code(500).send({ fehler: 'Das hat nicht geklappt' });
    }
    return antwort.code(status).send({ fehler: status === 413 ? 'Spielstand ist zu groß' : 'Ungültige Anfrage' });
  });

  // Schutz vor fremden Seiten: schreibende Anfragen nur mit JSON und eigenem Header
  app.addHook('onRequest', async (anfrage, antwort) => {
    if ((anfrage.method === 'POST' || anfrage.method === 'PUT') && anfrage.url.startsWith('/api/')) {
      const typ = anfrage.headers['content-type'] ?? '';
      if (!typ.startsWith('application/json') || anfrage.headers['x-lichtung'] !== '1') {
        return antwort.code(403).send({ fehler: 'Anfrage nicht erlaubt' });
      }
    }
  });

  const anmeldeSperre = new Sperre();
  const einrichtSperre = new Sperre();

  function setzeCookie(anfrage: FastifyRequest, antwort: FastifyReply, token: string): void {
    antwort.setCookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SITZUNG_SEKUNDEN,
      secure: anfrage.protocol === 'https',
    });
  }

  /** Konto der Sitzung (und Cookie verlängern), sonst null. */
  function sitzung(anfrage: FastifyRequest, antwort: FastifyReply): number | null {
    const token = anfrage.cookies[COOKIE];
    const info = pruefeSitzung(db, token);
    if (!info || !token) return null;
    if (info.verlaengern) setzeCookie(anfrage, antwort, token);
    return info.konto;
  }

  function braucheKonto(anfrage: FastifyRequest, antwort: FastifyReply): number | null {
    const konto = sitzung(anfrage, antwort);
    if (konto === null) antwort.code(401).send({ fehler: 'Nicht angemeldet' });
    return konto;
  }

  app.get('/api/gesund', async (_anfrage, antwort) => {
    try {
      db.prepare('SELECT 1').get();
      return { ok: true, version, datenbank: true };
    } catch {
      return antwort.code(503).send({ ok: false, version, datenbank: false });
    }
  });

  app.get('/api/ich', async (anfrage, antwort) => ({
    eingerichtet: istEingerichtet(db),
    angemeldet: sitzung(anfrage, antwort) !== null,
  }));

  app.post('/api/einrichten', async (anfrage, antwort) => {
    const wartenSekunden = einrichtSperre.wartenSekunden(anfrage.ip);
    if (wartenSekunden > 0) {
      return antwort.code(429).send({ fehler: 'Zu viele Versuche – in einer Minute wieder', wartenSekunden });
    }
    const { code, passwort } = (anfrage.body ?? {}) as { code?: string; passwort?: string };
    const ergebnis = await richteEin(db, code as string, passwort as string);
    if (!ergebnis.ok) {
      if (ergebnis.status === 403) einrichtSperre.fehlversuch(anfrage.ip);
      return antwort.code(ergebnis.status).send({ fehler: ergebnis.fehler });
    }
    einrichtSperre.erfolg(anfrage.ip);
    setzeCookie(anfrage, antwort, legeSitzungAn(db, ergebnis.konto));
    return { eingerichtet: true, angemeldet: true };
  });

  app.post('/api/anmelden', async (anfrage, antwort) => {
    const wartenSekunden = anmeldeSperre.wartenSekunden(anfrage.ip);
    if (wartenSekunden > 0) {
      return antwort.code(429).send({ fehler: 'Zu viele Versuche – in einer Minute wieder', wartenSekunden });
    }
    const { passwort } = (anfrage.body ?? {}) as { passwort?: string };
    const ergebnis = await meldeAn(db, passwort as string);
    if (!ergebnis.ok) {
      if (ergebnis.status === 401) anmeldeSperre.fehlversuch(anfrage.ip);
      return antwort.code(ergebnis.status).send({ fehler: ergebnis.fehler });
    }
    anmeldeSperre.erfolg(anfrage.ip);
    setzeCookie(anfrage, antwort, legeSitzungAn(db, ergebnis.konto));
    return { angemeldet: true };
  });

  app.post('/api/abmelden', async (anfrage, antwort) => {
    beendeSitzung(db, anfrage.cookies[COOKIE]);
    antwort.clearCookie(COOKIE, { path: '/' });
    return { angemeldet: false };
  });

  app.get('/api/spielstand', async (anfrage, antwort) => {
    const konto = braucheKonto(anfrage, antwort);
    if (konto === null) return;
    return ladeStand(db, konto);
  });

  app.put('/api/spielstand', async (anfrage, antwort) => {
    const konto = braucheKonto(anfrage, antwort);
    if (konto === null) return;
    const b = (anfrage.body ?? {}) as Record<string, unknown>;
    const problem = pruefeEingang(b.daten, b.geaendert, b.geraet);
    if (problem) return antwort.code(400).send({ fehler: problem });
    const eingang = {
      daten: b.daten as Record<string, unknown>,
      geaendert: b.geaendert as number,
      geraet: String(b.geraet ?? '').slice(0, 60),
    };

    if ((anfrage.query as Record<string, unknown>).erzwingen === '1') {
      const grund = typeof b.grund === 'string' && b.grund.trim() ? b.grund.trim().slice(0, 80) : 'Überholt';
      return erzwinge(db, konto, eingang, grund);
    }
    if (typeof b.basis !== 'number' || !Number.isInteger(b.basis) || b.basis < 0) {
      return antwort.code(400).send({ fehler: 'Spielstand ungültig' });
    }
    const ergebnis = speichere(db, konto, b.basis, eingang);
    if (!ergebnis.ok) return antwort.code(409).send({ fehler: 'Stand ist veraltet', ...ergebnis.stand });
    return { revision: ergebnis.revision };
  });

  app.get('/api/sicherungen', async (anfrage, antwort) => {
    const konto = braucheKonto(anfrage, antwort);
    if (konto === null) return;
    return listeSicherungen(db, konto);
  });

  // Nur eine Sicherung ablegen, ohne den aktuellen Stand zu ändern – z. B. der unterlegene Stand nach einem
  // Konflikt, den der Server gewonnen hat, oder der alte Stand vor „Neues Spiel“
  app.post('/api/sicherungen', async (anfrage, antwort) => {
    const konto = braucheKonto(anfrage, antwort);
    if (konto === null) return;
    const b = (anfrage.body ?? {}) as Record<string, unknown>;
    const problem = pruefeEingang(b.daten, b.geaendert, b.geraet);
    if (problem) return antwort.code(400).send({ fehler: problem });
    const grund = typeof b.grund === 'string' && b.grund.trim() ? b.grund.trim().slice(0, 80) : 'Gesichert';
    legeSicherungAb(db, konto, {
      zeitpunkt: b.geaendert as number,
      grund,
      geraet: String(b.geraet ?? '').slice(0, 60),
      daten: JSON.stringify(b.daten),
    });
    return { ok: true };
  });

  app.post('/api/sicherungen/:id/wiederherstellen', async (anfrage, antwort) => {
    const konto = braucheKonto(anfrage, antwort);
    if (konto === null) return;
    const id = Number((anfrage.params as { id: string }).id);
    const stand = Number.isInteger(id) ? stelleWiederHer(db, konto, id) : null;
    if (!stand) return antwort.code(404).send({ fehler: 'Sicherung nicht gefunden' });
    return stand;
  });

  if (web && existsSync(`${web}/index.html`)) {
    await app.register(fastifyStatic, {
      root: web,
      cacheControl: false,
      // Dateien mit Hash im Namen ändern sich nie; index.html immer frisch holen
      setHeaders(res, pfad) {
        res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(pfad) ? 'public, max-age=31536000, immutable' : 'no-cache');
      },
    });
  }

  // Unbekannte Seiten zeigen das Spiel, unbekannte API-Pfade bleiben 404
  app.setNotFoundHandler((anfrage, antwort) => {
    if (anfrage.method === 'GET' && !anfrage.url.startsWith('/api/') && antwort.sendFile) {
      return antwort.sendFile('index.html');
    }
    return antwort.code(404).send({ fehler: 'Nicht gefunden' });
  });

  return app;
}

if (import.meta.main) {
  const PORT = Number(process.env.PORT ?? 8080);
  const HOST = process.env.HOST ?? '0.0.0.0';
  const WEB = process.env.LICHTUNG_WEB ?? fileURLToPath(new URL('../../web/dist', import.meta.url));

  // Ohne gebautes Spiel ist das ein Fehler – außer in der Entwicklung (Vite liefert das Spiel)
  if (process.env.LICHTUNG_OHNE_WEB !== '1' && !existsSync(`${WEB}/index.html`)) {
    console.error(`Spiel nicht gefunden in ${WEB}. Erst bauen: npm run build`);
    process.exit(1);
  }

  const verzeichnis = datenVerzeichnis();
  const db = oeffneDatenbank(join(verzeichnis, 'lichtung.db'));
  const app = await baueApp({
    datenbank: db,
    web: WEB,
    version: process.env.LICHTUNG_VERSION ?? 'dev',
    logger: { level: process.env.LOG_LEVEL ?? 'info' },
  });

  const code = einrichtungscodeBeimStart(db);
  if (code) app.log.warn(`Einrichtungscode: ${zeigeCode(code)} – im Browser eingeben`);
  const stoppeNachtsicherung = starteNachtsicherung(db, join(verzeichnis, 'sicherungen'), (t) => app.log.info(t));

  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
    process.on(signal, () => {
      stoppeNachtsicherung();
      app.close().then(
        () => {
          db.close();
          process.exit(0);
        },
        () => process.exit(1),
      );
    });
  }

  await app.listen({ port: PORT, host: HOST });
}
