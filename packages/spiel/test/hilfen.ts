import { SPALTEN, ZEILEN, neuesTagwerk, type Art, type Tagwerk } from '../src';

const CODES: Record<string, Art> = { h: 'holz', b: 'beeren', k: 'kraeuter', n: 'nuesse', g: 'gestruepp', x: 'hase' };

/**
 * Baut ein Tagwerk aus sieben Zeilen zu je sieben Zeichen (Zeile 0 oben):
 * h Holz · b Beeren · k Kräuter · n Nüsse · g Gestrüpp · x Hase. Reife ist 1, außer `reife` sagt anderes.
 */
export function brett(zeilen: string[], reife: Record<string, number> = {}, seed = 1): Tagwerk {
  const t = neuesTagwerk({ seed });
  let id = 1;
  t.gitter = Array.from({ length: SPALTEN }, (_, s) =>
    Array.from({ length: ZEILEN }, (_, z) => {
      const art = CODES[zeilen[z][s]];
      if (!art) throw new Error(`Unbekanntes Zeichen ${zeilen[z][s]} bei ${s},${z}`);
      return { id: id++, art, reife: art === 'gestruepp' || art === 'hase' ? 0 : (reife[`${s},${z}`] ?? 1) };
    }),
  );
  t.naechsteId = id;
  return t;
}

/** Brett ohne zwei gleiche Nachbarn (Dreifärbung der Waben) – hier gibt es keine einzige Kette. */
export function ohneKetten(): string[] {
  const farben = ['h', 'b', 'n'];
  return Array.from({ length: ZEILEN }, (_, z) =>
    Array.from({ length: SPALTEN }, (_, s) => {
      const q = z - (s - (s & 1)) / 2;
      return farben[(((2 * s + q) % 3) + 3) % 3];
    }).join(''),
  );
}

/** Ersetzt einzelne Zellen eines Layouts: { '3,2': 'k' }. */
export function mit(zeilen: string[], aenderungen: Record<string, string>): string[] {
  const raster = zeilen.map((z) => z.split(''));
  for (const [ort, code] of Object.entries(aenderungen)) {
    const [s, z] = ort.split(',').map(Number);
    raster[z][s] = code;
  }
  return raster.map((z) => z.join(''));
}

export const reifeSumme = (t: Tagwerk): number => t.gitter.flat().reduce((s, k) => s + k.reife, 0);
export const ids = (t: Tagwerk): number[] => t.gitter.flat().map((k) => k.id);
