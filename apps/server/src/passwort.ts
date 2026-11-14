import { join } from 'node:path';
import type { Datenbank } from './datenbank.ts';
import { datenVerzeichnis, oeffneDatenbank, transaktion } from './datenbank.ts';
import { neuerEinrichtungscode, zeigeCode } from './konto.ts';

/**
 * `npm run passwort`: Passwort und alle Sitzungen löschen, neuen Einrichtungscode erzeugen.
 * Konto und Spielstand bleiben. Im Container: docker compose exec lichtung npm run passwort
 */

export function passwortZuruecksetzen(db: Datenbank): string {
  transaktion(db, () => {
    db.prepare('UPDATE konto SET hash = NULL').run();
    db.prepare('DELETE FROM sitzung').run();
  });
  return neuerEinrichtungscode(db);
}

if (import.meta.main) {
  const db = oeffneDatenbank(join(datenVerzeichnis(), 'lichtung.db'));
  const code = passwortZuruecksetzen(db);
  db.close();
  console.log('Passwort und Anmeldungen sind gelöscht. Der Spielstand bleibt.');
  console.log(`Einrichtungscode: ${zeigeCode(code)} – im Browser eingeben`);
}
