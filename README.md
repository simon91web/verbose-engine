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
| `npm start` | Gebautes Spiel über den Server ausliefern (Port 8080) |

## Auf dem eigenen Server (Docker)

Ein Container, Port 8080. Beim Bauen laufen die Tests mit; schlägt einer fehl, entsteht kein Image.

**Auf dem Server bauen** – geht sofort, braucht nur Git und Docker:

```bash
git clone git@github.com:simon91web/verbose-engine.git lichtung
cd lichtung
docker compose up -d --build
```

Dann `http://<server>:8080` öffnen – am Handy im selben Netz genauso. Aktualisieren:
`git pull && docker compose up -d --build`. Anderer Port: in `compose.yaml` die linke Zahl ändern (`"9000:8080"`).

**Fertiges Image von GitHub** – GitHub Actions baut bei jedem Push auf `main`, bei Tags `v…` oder von Hand
(Actions › Docker-Image › Run workflow) das Image `ghcr.io/simon91web/lichtung` für amd64 und arm64. In
`compose.yaml` dann `build: .` entfernen und `image: ghcr.io/simon91web/lichtung:latest` eintragen. Ist das Repo
privat, ist das Image es auch: auf dem Server einmal `docker login ghcr.io` mit einem GitHub-Token (Recht
`read:packages`).

**Gut zu wissen**

- Der Spielstand liegt noch im Browser des jeweiligen Geräts. Speichern auf dem Server kommt mit Meilenstein 3.
- Im Heimnetz reicht HTTP. Für Zugriff von unterwegs und die App auf dem Startbildschirm (Meilenstein 3) gehört ein
  Reverse-Proxy mit HTTPS davor (Caddy, Traefik oder Nginx Proxy Manager).
- `GET /api/gesund` antwortet mit `{ "ok": true, "version": … }` – der Healthcheck des Containers nutzt das.

## Aufbau

```
packages/spiel   Spielregeln und Spieldaten in reinem TypeScript, mit Tests
apps/web         Oberfläche: React, Vite, Spiel-Look aus docs/design.md
apps/server      Fastify-Server: liefert das Spiel aus, später Konten und Spielstände
docs/            Konzept, Gestaltung, Mockups
Dockerfile, compose.yaml, .github/workflows/docker.yml
```

Die Regeln (`packages/spiel`) kennen keine Oberfläche: Brett erzeugen, Kette prüfen, Ring finden, nachfallen,
reifen, Hasen bewegen. Zufall läuft über einen Startwert, darum ist jeder Zug wiederholbar und Rückgängig würfelt
nicht neu. Balancing steht in `packages/spiel/src/daten.ts`.
