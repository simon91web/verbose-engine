// Startet Web (Vite) und Server zusammen; endet, sobald einer von beiden endet oder Strg+C kommt.
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = resolve(fileURLToPath(import.meta.url), '../..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const webArgs = process.argv.slice(2);

const prozesse = [
  spawn(npm, ['run', 'dev', '-w', '@lichtung/web', ...(webArgs.length ? ['--', ...webArgs] : [])], {
    cwd: wurzel,
    stdio: 'inherit',
  }),
  spawn(npm, ['run', 'dev', '-w', '@lichtung/server'], {
    cwd: wurzel,
    stdio: 'inherit',
    // Server ohne gebautes Spiel, Daten im Repo (./daten), immer Port 8080 – ein PORT von außen
    // (z. B. aus einer Vorschau-Umgebung) gilt für Vite, nicht für den Server, auf den der Vite-Proxy zeigt
    env: { ...process.env, PORT: '8080', HOST: '127.0.0.1', LICHTUNG_OHNE_WEB: '1', LICHTUNG_DATEN: resolve(wurzel, 'daten') },
  }),
];

let beendet = false;
function beende(code) {
  if (beendet) return;
  beendet = true;
  for (const p of prozesse) p.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300).unref();
}
for (const p of prozesse) p.on('exit', (code) => beende(code ?? 0));
for (const s of ['SIGINT', 'SIGTERM']) process.on(s, () => beende(0));
