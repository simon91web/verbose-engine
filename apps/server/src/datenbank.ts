import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

/**
 * Datenbank: eine SQLite-Datei (node:sqlite, kein natives Paket). Ein Konto gibt es nur eines, die Spalte `konto`
 * steht aber überall, damit sich weitere später nachrüsten lassen.
 */

export type Datenbank = DatabaseSync;

/** Ordner für Datenbank und Sicherungen: LICHTUNG_DATEN, sonst ./daten im Repo (im Container ist es /data). */
export function datenVerzeichnis(): string {
  return process.env.LICHTUNG_DATEN ?? fileURLToPath(new URL('../../../daten', import.meta.url));
}

// Jeder Eintrag hebt user_version um eins; nur anhängen, nie ändern
const MIGRATIONEN: string[] = [
  `
  CREATE TABLE konto (
    id INTEGER PRIMARY KEY,
    hash TEXT,
    angelegt INTEGER NOT NULL
  );
  CREATE TABLE sitzung (
    token_hash TEXT PRIMARY KEY,
    konto INTEGER NOT NULL REFERENCES konto(id) ON DELETE CASCADE,
    angelegt INTEGER NOT NULL,
    zuletzt INTEGER NOT NULL
  );
  CREATE TABLE einrichtung (
    code_hash TEXT PRIMARY KEY,
    angelegt INTEGER NOT NULL
  );
  CREATE TABLE spielstand (
    konto INTEGER PRIMARY KEY REFERENCES konto(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL,
    daten TEXT NOT NULL,
    geaendert INTEGER NOT NULL,
    geraet TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE sicherung (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    konto INTEGER NOT NULL REFERENCES konto(id) ON DELETE CASCADE,
    zeitpunkt INTEGER NOT NULL,
    grund TEXT NOT NULL,
    geraet TEXT NOT NULL DEFAULT '',
    tag INTEGER,
    daten TEXT NOT NULL
  );
  CREATE INDEX sicherung_konto ON sicherung(konto, id);
  `,
];

/** Öffnet die Datenbank (`:memory:` für Tests) und bringt sie auf den neuesten Stand. */
export function oeffneDatenbank(pfad: string): Datenbank {
  if (pfad !== ':memory:') mkdirSync(dirname(pfad), { recursive: true });
  const db = new DatabaseSync(pfad);
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');
  if (pfad !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  migriere(db);
  return db;
}

function migriere(db: Datenbank): void {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  for (let v = row.user_version; v < MIGRATIONEN.length; v++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONEN[v]!);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec('COMMIT');
    } catch (fehler) {
      db.exec('ROLLBACK');
      throw fehler;
    }
  }
}

/** Führt `f` in einer Transaktion aus. */
export function transaktion<T>(db: Datenbank, f: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const ergebnis = f();
    db.exec('COMMIT');
    return ergebnis;
  } catch (fehler) {
    db.exec('ROLLBACK');
    throw fehler;
  }
}
