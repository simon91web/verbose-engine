// Erzeugt die PNG-Symbole der App aus public/favicon.svg (Sprössling auf Moos).
// Einmalig ausführen und die PNGs einchecken; `sharp` ist keine Abhängigkeit des Projekts:
//   mkdir /tmp/sharp && cd /tmp/sharp && npm init -y && npm i sharp
//   cp apps/web/scripts/symbole.mjs /tmp/sharp/ && node /tmp/sharp/symbole.mjs <Ordner mit favicon.svg> <Ausgabeordner>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const [quelle = 'apps/web/public', ziel = quelle] = process.argv.slice(2);
const svg = readFileSync(join(quelle, 'favicon.svg'), 'utf8');
// Die Striche des Sprösslings aus dem Favicon (Gitter 24 × 24, Linienstärke 2,2)
const striche = /<g[^>]*>([\s\S]*)<\/g>/.exec(svg)?.[1];
if (!striche) throw new Error('Keine Striche in favicon.svg gefunden');

const MOOS = '#4E7F2F';
const CREME = '#FFF8EA';

/** Quadrat der Kantenlänge 512: Moos-Fläche mit dem Sprössling in der Mitte; `anteil` = Größe des Symbols. */
function symbol({ anteil, radius }) {
  const s = (512 * anteil) / 24;
  const x = 256 - 12 * s;
  const y = 256 - 11.5 * s; // der Sprössling sitzt im Gitter etwas höher als die Mitte
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${radius}" fill="${MOOS}"/>
  <g fill="none" stroke="${CREME}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(4)})">${striche}</g>
</svg>`;
}

const ausgaben = [
  // „any“: abgerundete Fläche, das Betriebssystem legt nichts darüber
  { datei: 'icon-192.png', groesse: 192, svg: symbol({ anteil: 0.64, radius: 112 }) },
  { datei: 'icon-512.png', groesse: 512, svg: symbol({ anteil: 0.64, radius: 112 }) },
  // „maskable“: randlos, das Symbol bleibt in der sicheren Mitte (Kreis mit 80 % Durchmesser)
  { datei: 'icon-maskable-512.png', groesse: 512, svg: symbol({ anteil: 0.52, radius: 0 }) },
  // iOS rundet selbst ab und füllt Transparenz schwarz: randlos und deckend
  { datei: 'apple-touch-icon.png', groesse: 180, svg: symbol({ anteil: 0.6, radius: 0 }) },
];

for (const a of ausgaben) {
  await sharp(Buffer.from(a.svg)).resize(a.groesse, a.groesse).png({ compressionLevel: 9 }).toFile(join(ziel, a.datei));
  console.log('geschrieben', join(ziel, a.datei));
}
