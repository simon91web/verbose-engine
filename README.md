# Lichtung

Ein ruhiges Ketten-Puzzle mit Siedlungsaufbau: Ketten über ein Wabenbrett ziehen, Rohstoffe ernten und aus einer
Lichtung im Wald ein Dorf machen. Konzept in [`docs/konzept.md`](docs/konzept.md), Gestaltung in
[`docs/design.md`](docs/design.md).

## Stand: Meilenstein 1 – das Brett

Ein Tagwerk im Nordwald ist spielbar: Ketten, Ringe, Reife, Gestrüpp, Hasen, drei Siedler mit Fähigkeiten,
Rückgängig, Ertrag und nächster Tag. Der Spielstand bleibt im Browser gespeichert.

## Starten

Node 24 und npm.

```bash
npm install
npm run dev
```

Dann <http://localhost:5173> öffnen.

**Auf dem Handy im selben WLAN:** `npm run handy` und die angezeigte Netzwerk-Adresse (`http://192.168.…:5173`)
im Handy-Browser öffnen.

| Befehl | Was |
|---|---|
| `npm run dev` | Spiel lokal starten |
| `npm run handy` | wie oben, aber im WLAN erreichbar |
| `npm test` | Tests der Spielregeln |
| `npm run typecheck` | Typen prüfen |
| `npm run build` | Fertige Dateien nach `apps/web/dist` |

## Aufbau

```
packages/spiel   Spielregeln und Spieldaten in reinem TypeScript, mit Tests
apps/web         Oberfläche: React, Vite, Spiel-Look aus docs/design.md
docs/            Konzept, Gestaltung, Mockups
```

Die Regeln (`packages/spiel`) kennen keine Oberfläche: Brett erzeugen, Kette prüfen, Ring finden, nachfallen,
reifen, Hasen bewegen. Zufall läuft über einen Startwert, darum ist jeder Zug wiederholbar und Rückgängig würfelt
nicht neu. Balancing steht in `packages/spiel/src/daten.ts`.
