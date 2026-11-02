import { Zufall } from '@lichtung/spiel';

/**
 * Prototyp der Welt: ein unsichtbares Wabenraster (flache Oberkante, axiale Koordinaten) als Logik,
 * darüber weich gezeichnetes Gelände. Höhe und Farbe werden aus mehreren Proben gemittelt,
 * damit man das Raster nicht sieht.
 */

export type Gelaende = 'lichtung' | 'wiese' | 'wald' | 'fels' | 'ufer' | 'wasser';

export const RADIUS = 7;
export const WASSERSPIEGEL = -0.16;
const W3 = Math.sqrt(3);

export interface Wabe {
  q: number;
  r: number;
  x: number;
  z: number;
  art: Gelaende;
}

export const schluessel = (q: number, r: number) => `${q},${r}`;
export const zuWelt = (q: number, r: number): [number, number] => [1.5 * q, W3 * (r + q / 2)];
export const NACHBARN: [number, number][] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
export const wabenAbstand = (q: number, r: number) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;

export function zuWabe(x: number, z: number): [number, number] {
  const q = (2 / 3) * x;
  const r = (-1 / 3) * x + (W3 / 3) * z;
  // Würfelkoordinaten runden
  let rq = Math.round(q), rr = Math.round(r);
  const rs = Math.round(-q - r);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs + q + r);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return [rq, rr];
}

// ---------- Rauschen ----------
function hash(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const glatt = (t: number) => t * t * (3 - 2 * t);
function rauschen(x: number, z: number, seed: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = glatt(x - ix), fz = glatt(z - iz);
  const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed), c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
export function fbm(x: number, z: number, seed: number): number {
  return (rauschen(x, z, seed) * 4 + rauschen(x * 2.1, z * 2.1, seed + 7) * 2 + rauschen(x * 4.3, z * 4.3, seed + 13)) / 7;
}
const stufe = (a: number, b: number, t: number) => glatt(Math.min(1, Math.max(0, (t - a) / (b - a))));

const FARBE: Record<Gelaende | 'aussen', [number, number, number]> = {
  lichtung: [0.64, 0.72, 0.4],
  wiese: [0.56, 0.67, 0.35],
  wald: [0.36, 0.48, 0.26],
  fels: [0.55, 0.53, 0.48],
  ufer: [0.72, 0.65, 0.45],
  wasser: [0.37, 0.42, 0.31],
  aussen: [0.29, 0.41, 0.23],
};

export interface Welt {
  seed: number;
  waben: Map<string, Wabe>;
  fluss: [number, number][];
  hoehe: (x: number, z: number) => number;
  farbe: (x: number, z: number) => [number, number, number];
  artBei: (x: number, z: number) => Gelaende | 'aussen';
}

/** Abstand eines Punkts zum Fluss (Linienzug). */
function flussAbstand(fluss: [number, number][], x: number, z: number): number {
  let best = Infinity;
  for (let i = 1; i < fluss.length; i++) {
    const [ax, az] = fluss[i - 1], [bx, bz] = fluss[i];
    const vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    best = Math.min(best, Math.hypot(x - ax - t * vx, z - az - t * vz));
  }
  return best;
}

export function erzeugeWelt(seed: number): Welt {
  const zufall = new Zufall(seed);
  // Der Fluss zieht nördlich oder südlich an der Lichtung vorbei
  const seite = zufall.zahl() < 0.5 ? -1 : 1;
  const mitte = seite * (3.9 + zufall.zahl() * 1.1);
  const phase = zufall.zahl() * Math.PI * 2;
  const neigung = (zufall.zahl() - 0.5) * 0.3;
  const fluss: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const x = -24 + (i * 48) / 40;
    fluss.push([x, mitte + Math.sin(x * 0.32 + phase) * 1.4 + x * neigung]);
  }

  const waben = new Map<string, Wabe>();
  for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = -RADIUS; r <= RADIUS; r++) {
      const d = wabenAbstand(q, r);
      if (d > RADIUS) continue;
      const [x, z] = zuWelt(q, r);
      let art: Gelaende;
      if (flussAbstand(fluss, x, z) < 0.95) art = 'wasser';
      else if (d <= 1) art = 'lichtung';
      else if (d >= 3 && fbm(x * 0.22, z * 0.22, seed + 101) > 0.63) art = 'fels';
      else if (d >= 2 && fbm(x * 0.28, z * 0.28, seed + 202) > 0.47) art = 'wald';
      else art = 'wiese';
      waben.set(schluessel(q, r), { q, r, x, z, art });
    }
  }
  for (const w of waben.values()) {
    if (w.art === 'wasser' || w.art === 'fels' || w.art === 'lichtung') continue;
    if (NACHBARN.some(([dq, dr]) => waben.get(schluessel(w.q + dq, w.r + dr))?.art === 'wasser')) w.art = 'ufer';
  }

  const artBei = (x: number, z: number): Gelaende | 'aussen' => {
    const [q, r] = zuWabe(x, z);
    return waben.get(schluessel(q, r))?.art ?? 'aussen';
  };
  const rohHoehe = (x: number, z: number): number => {
    const art = artBei(x, z);
    const welle = (fbm(x * 0.6, z * 0.6, seed + 3) - 0.5) * 0.2;
    switch (art) {
      case 'lichtung': return 0.03 + welle * 0.5;
      case 'wiese': return 0.07 + welle;
      case 'wald': return 0.15 + welle;
      case 'ufer': return 0.02 + welle * 0.5;
      case 'wasser': return 0.0;
      case 'fels': return 0.45 + fbm(x * 1.3, z * 1.3, seed + 9) * 0.55;
      default: return 0.22 + Math.max(0, Math.hypot(x, z) - 11.5) * 0.09 + welle * 1.5;
    }
  };
  const PROBEN: [number, number][] = [[0, 0], [0, 0], ...[0, 1, 2, 3, 4, 5].map((i) => [Math.cos(i * 1.047 + 0.5) * 0.5, Math.sin(i * 1.047 + 0.5) * 0.5] as [number, number])];
  const hoehe = (x: number, z: number): number => {
    let h = 0;
    for (const [dx, dz] of PROBEN) h += rohHoehe(x + dx, z + dz);
    h /= PROBEN.length;
    // Der Fluss wird weich eingegraben – seine Form folgt der Kurve, nicht den Waben
    const d = flussAbstand(fluss, x, z);
    return h + (-0.5 - h) * (1 - stufe(0.35, 1.05, d));
  };
  const farbe = (x: number, z: number): [number, number, number] => {
    const c: [number, number, number] = [0, 0, 0];
    for (const [dx, dz] of PROBEN) {
      const f = FARBE[artBei(x + dx * 0.9, z + dz * 0.9)];
      c[0] += f[0]; c[1] += f[1]; c[2] += f[2];
    }
    const d = flussAbstand(fluss, x, z);
    const ufer = 1 - stufe(0.7, 1.3, d);
    const hell = 0.92 + fbm(x * 1.7, z * 1.7, seed + 17) * 0.16;
    return c.map((v, i) => {
      const basis = v / PROBEN.length;
      return (basis + (FARBE.ufer[i] - basis) * ufer * 0.7) * hell;
    }) as [number, number, number];
  };

  return { seed, waben, fluss, hoehe, farbe, artBei };
}

// ---------- Bauen ----------

export type BauArt = 'huette' | 'muehle' | 'holzfaeller';

export interface Bau {
  id: number;
  art: BauArt;
  q: number;
  r: number;
  drehung: number;
  versatz: [number, number];
  weg: [number, number][];
}

export const BAUARTEN: Record<BauArt, { name: string; max: number }> = {
  huette: { name: 'Hütte', max: 60 },
  muehle: { name: 'Mühle', max: 60 },
  holzfaeller: { name: 'Holzfällerhütte', max: 72 },
};

export interface Eignung {
  prozent: number;
  gruende: string[];
}

/** Wie gut passt ein Gebäude auf diese Wabe? Bauen geht überall an Land, gute Stellen bringen mehr. */
export function eignung(welt: Welt, art: BauArt, q: number, r: number, belegt: Set<string>): Eignung {
  const w = welt.waben.get(schluessel(q, r));
  if (!w) return { prozent: 0, gruende: [] };
  const nachbarn = NACHBARN.map(([dq, dr]) => ({ k: schluessel(q + dq, r + dr), w: welt.waben.get(schluessel(q + dq, r + dr)) }));
  if (art === 'muehle') {
    const amWasser = nachbarn.some((n) => n.w?.art === 'wasser');
    const nahe = !amWasser && [...welt.waben.values()].some((v) => v.art === 'wasser' && wabenAbstand(v.q - q, v.r - r) === 2);
    return amWasser ? { prozent: 60, gruende: ['am Wasser +60 %'] } : nahe ? { prozent: 20, gruende: ['Wasser in der Nähe +20 %'] } : { prozent: 0, gruende: ['kein Wasser in der Nähe'] };
  }
  if (art === 'holzfaeller') {
    const wald = nachbarn.filter((n) => n.w?.art === 'wald' && !belegt.has(n.k)).length;
    return { prozent: wald * 12, gruende: [wald ? `${wald} Waldwaben daneben +${wald * 12} %` : 'kein Wald daneben'] };
  }
  const wiese = w.art === 'wiese' || w.art === 'lichtung' ? 20 : 0;
  const nachbarHaeuser = Math.min(2, nachbarn.filter((n) => belegt.has(n.k)).length);
  const gruende = [];
  if (wiese) gruende.push('auf der Wiese +20 %');
  if (nachbarHaeuser) gruende.push(`${nachbarHaeuser} Nachbarn +${nachbarHaeuser * 20} %`);
  return { prozent: wiese + nachbarHaeuser * 20, gruende: gruende.length ? gruende : ['abseits und uneben'] };
}

export const bebaubar = (welt: Welt, q: number, r: number, belegt: Set<string>) => {
  const w = welt.waben.get(schluessel(q, r));
  return !!w && w.art !== 'wasser' && !belegt.has(schluessel(q, r));
};

/** Geschwungener Weg von einem Gebäude zum nächsten anderen. */
export function wegZu(welt: Welt, von: [number, number], ziele: [number, number][], zufall: Zufall): [number, number][] {
  if (!ziele.length) return [];
  const ziel = ziele.reduce((a, b) => (Math.hypot(b[0] - von[0], b[1] - von[1]) < Math.hypot(a[0] - von[0], a[1] - von[1]) ? b : a));
  const mx = (von[0] + ziel[0]) / 2, mz = (von[1] + ziel[1]) / 2;
  const nx = -(ziel[1] - von[1]), nz = ziel[0] - von[0];
  const bogen = (zufall.zahl() - 0.5) * 0.5;
  const punkte: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    // quadratische Bézierkurve über einen seitlich versetzten Mittelpunkt
    const cx = mx + nx * bogen, cz = mz + nz * bogen;
    const x = (1 - t) * (1 - t) * von[0] + 2 * (1 - t) * t * cx + t * t * ziel[0];
    const z = (1 - t) * (1 - t) * von[1] + 2 * (1 - t) * t * cz + t * t * ziel[1];
    if (welt.hoehe(x, z) > WASSERSPIEGEL) punkte.push([x, z]);
  }
  return punkte;
}
