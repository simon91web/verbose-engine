import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fastify, { LogController } from 'fastify';
import fastifyStatic from '@fastify/static';

/**
 * Liefert das gebaute Spiel aus (apps/web/dist) und beantwortet /api/gesund für den Docker-Healthcheck.
 * Ab Meilenstein 3 kommen hier Konten und Spielstände dazu.
 */

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';
const VERSION = process.env.LICHTUNG_VERSION ?? 'dev';
const WEB = process.env.LICHTUNG_WEB ?? fileURLToPath(new URL('../../web/dist', import.meta.url));

if (!existsSync(`${WEB}/index.html`)) {
  console.error(`Spiel nicht gefunden in ${WEB}. Erst bauen: npm run build`);
  process.exit(1);
}

// Keine Zeile je Anfrage – sonst füllt allein der Healthcheck das Protokoll
const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  logController: new LogController({ disableRequestLogging: true }),
});

app.get('/api/gesund', async () => ({ ok: true, version: VERSION }));

await app.register(fastifyStatic, {
  root: WEB,
  cacheControl: false,
  // Dateien mit Hash im Namen ändern sich nie; index.html immer frisch holen
  setHeaders(res, pfad) {
    res.setHeader('Cache-Control', /[\\/]assets[\\/]/.test(pfad) ? 'public, max-age=31536000, immutable' : 'no-cache');
  },
});

// Unbekannte Seiten zeigen das Spiel, unbekannte API-Pfade bleiben 404
app.setNotFoundHandler((anfrage, antwort) => {
  if (anfrage.method === 'GET' && !anfrage.url.startsWith('/api/')) return antwort.sendFile('index.html');
  return antwort.code(404).send({ fehler: 'Nicht gefunden' });
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    app.close().then(() => process.exit(0), () => process.exit(1));
  });
}

await app.listen({ port: PORT, host: HOST });
