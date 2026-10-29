/**
 * Wabenbrett mit flacher Oberkante: Spalten nebeneinander, ungerade Spalten halb tiefer
 * („odd-q“). Kacheln fallen innerhalb ihrer Spalte nach unten.
 */
export const SPALTEN = 7;
export const ZEILEN = 7;

/** [Spalte, Zeile]; Zeile 0 ist oben. */
export type Zelle = readonly [spalte: number, zeile: number];

const RICHTUNGEN_GERADE: readonly Zelle[] = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
const RICHTUNGEN_UNGERADE: readonly Zelle[] = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]];

export const imBrett = ([s, z]: Zelle): boolean => s >= 0 && s < SPALTEN && z >= 0 && z < ZEILEN;

export function nachbarn([s, z]: Zelle): Zelle[] {
  const richtungen = s % 2 ? RICHTUNGEN_UNGERADE : RICHTUNGEN_GERADE;
  return richtungen.map(([ds, dz]) => [s + ds, z + dz] as const).filter(imBrett);
}

export const gleich = (a: Zelle, b: Zelle): boolean => a[0] === b[0] && a[1] === b[1];

export const benachbart = (a: Zelle, b: Zelle): boolean => nachbarn(a).some((n) => gleich(n, b));

/** Zellen am Rand haben weniger als sechs Nachbarn – von dort aus ist nichts eingeschlossen. */
export const amRand = ([s, z]: Zelle): boolean => s === 0 || z === 0 || s === SPALTEN - 1 || z === ZEILEN - 1;

export const schluessel = ([s, z]: Zelle): number => s * 16 + z;

export function alleZellen(): Zelle[] {
  const zellen: Zelle[] = [];
  for (let s = 0; s < SPALTEN; s++) for (let z = 0; z < ZEILEN; z++) zellen.push([s, z]);
  return zellen;
}

/**
 * Zellen, die eine Kette vollständig umschließt: alles, was vom Rand aus nicht erreichbar ist,
 * ohne die Kette zu kreuzen. Auf Waben gibt es keine Lücken über Ecken.
 */
export function eingeschlossen(kette: readonly Zelle[]): Zelle[] {
  const sperre = new Set(kette.map(schluessel));
  const erreicht = new Set<number>();
  const offen: Zelle[] = [];
  for (const zelle of alleZellen()) {
    if (amRand(zelle) && !sperre.has(schluessel(zelle))) {
      erreicht.add(schluessel(zelle));
      offen.push(zelle);
    }
  }
  while (offen.length) {
    for (const n of nachbarn(offen.pop()!)) {
      const k = schluessel(n);
      if (!sperre.has(k) && !erreicht.has(k)) {
        erreicht.add(k);
        offen.push(n);
      }
    }
  }
  return alleZellen().filter((z) => !sperre.has(schluessel(z)) && !erreicht.has(schluessel(z)));
}
