# Meilenstein 3 – Server (Plan)

Plan vom 14.11.2026, freigegeben und umgesetzt. Mockup [`mockups/server.html`](mockups/server.html).

**Mit dem Mockup festgelegt:** „Welchen Stand behalten?“ schließt nur mit einer Wahl (der neuere ist vorgewählt).
Nach „Offline weiterspielen“ kommt beim nächsten Kontakt mit Anmeldung derselbe Dialog, falls sich die Stände
unterscheiden. Die Formulare haben ein unsichtbares Feld `username` = „lichtung“ für Passwortmanager.

**Beim Bauen dazugekommen:** `POST /api/sicherungen` legt nur eine Sicherung ab – für den unterlegenen Stand, wenn
der Server einen Konflikt gewinnt, und für den alten Stand vor „Neues Spiel“.

**Ziel:** Ein Spielstand für alle deine Geräte. Am Laptop spielst du weiter, wo du am Handy aufgehört hast.
Lichtung lässt sich als App auf den Startbildschirm legen und läuft auch ohne Netz. Sobald wieder Verbindung da ist,
wird gespeichert.

**Rahmen (deine Antworten):**
- **Nur ein Konto.** Es gibt keine Einladungen und keine Kontoverwaltung.
- **Ein Reverse-Proxy mit HTTPS läuft schon.** Lichtung hängt sich nur dahinter.
- **Die Architektur ist egal.** Das Image wird weiter für amd64 und arm64 gebaut.

## Umfang

**Drin:**
- **Konto einrichten und anmelden:** ein Passwort, Sitzung per Cookie, Abmelden im Menü
- **Spielstand auf dem Server:**
  - Speichern läuft automatisch.
  - Ohne Netz wird weitergespielt und später hochgeladen.
  - Bei zwei verschiedenen Ständen gilt der neuere, der ältere bleibt als Sicherung.
- **Sicherungen:**
  - Nachts sichert der Server die Datenbank und behält die letzten 7 Tage.
  - Im Menü lassen sich alte Stände wiederherstellen.
- **PWA:** Manifest, Symbole, Service Worker. Das Spiel geht offline, und es gibt einen Hinweis „Neue Version“.
- **Docker:** Volume für die Daten, Passwort-Werkzeug im Container, README-Anleitung für den Proxy

**Nicht drin:**
- Einladungen und mehrere Konten. Die Datenbank ist so angelegt, dass sie sich später nachrüsten lassen.
- Inhalt aus Meilenstein 4

## Entscheidungen

### Einrichten und Anmelden

Lichtung hängt an einer öffentlichen Domain. Würde ein leeres Formular „Passwort festlegen“ beim ersten Aufruf
reichen, könnte sich jeder das Konto nehmen, der zuerst kommt. Darum braucht das Einrichten einen
**Einrichtungscode**:

1. Beim ersten Start legt der Server einen sechsstelligen Code fest und schreibt ihn ins Protokoll:
   `docker compose logs lichtung` → „Einrichtungscode: 482 913“.
2. Im Browser fragt Lichtung nach dem Code und einem neuen Passwort (mindestens 10 Zeichen). Danach ist der Code
   verbraucht.
3. **Passwort vergessen:** `docker compose exec lichtung npm run passwort` macht einen neuen Code. Das alte Passwort
   und alle Sitzungen verfallen.

Einen Benutzernamen gibt es nicht, es gibt nur ein Konto. Der Spielstand hängt trotzdem an einer Konto-ID.

- **Sitzung:**
  - Cookie `httpOnly`, `Secure` hinter dem Proxy, `SameSite=Lax`
  - Gültig 1 Jahr, verlängert sich bei jedem Besuch. Das ist wichtig für die App am Handy.
- **Anmelden:**
  - Höchstens 5 Versuche je Minute und Adresse
  - Danach eine ruhige Meldung: „Zu viele Versuche – in einer Minute wieder“
- **Schutz vor fremden Seiten:**
  - Schreibende Anfragen verlangen JSON.
  - Sie verlangen außerdem einen eigenen Header `X-Lichtung: 1`.

### Ohne Pakete mit nativem Code

Das Image wird für zwei Architekturen gebaut. Native Pakete wie argon2 oder better-sqlite3 müssten dafür unter
Emulation kompiliert werden. Das ist langsam und bricht gern. Node 24 bringt alles selbst mit:

- **Passwort:** `crypto.scrypt` mit Salz statt argon2. Das weicht vom Konzept ab, ist aber für ein einzelnes Konto
  völlig ausreichend.
- **Datenbank:** `node:sqlite` (eingebaut) statt eines Pakets
- **Neue Pakete:**
  - Server: nur `@fastify/cookie`
  - Web: `vite-plugin-pwa` als Entwicklungspaket

### Speichern und Abgleich

Wie im Konzept rechnet der Client das Spiel, und der Server speichert nur.

- **Offline-Speicher bleibt `localStorage`:** Ein Spielstand ist klein, wenige KB. Das Konzept nannte IndexedDB, das
  bringt hier aber nichts.
- **Jeder Stand bekommt dazu:**
  - `revision`: der Zähler des Servers
  - `geaendert`: Zeitpunkt der letzten Änderung
  - `geraet`: ein Name wie „Handy“ oder „Laptop“, aus dem User-Agent geraten und im Menü änderbar
- **Wann gespeichert wird:**
  - 2 s nach jeder Änderung, auch mitten im Tagwerk
  - sofort, wenn die Seite in den Hintergrund geht
  - Das Konzept sah nur „nach jedem Tagwerk“ vor. So geht aber auch ein halbes Tagwerk nicht verloren.
- **`PUT /api/spielstand` mit `basis` = der Revision, auf der der Stand aufbaut:**
  - Passt die Revision, speichert der Server und antwortet mit der neuen Revision.
  - Passt sie nicht, antwortet er mit **409** und schickt den Stand des Servers mit. Dann gilt der Stand mit dem
    späteren `geaendert`. Der andere wird als Sicherung auf dem Server abgelegt.
  - Der Hinweis lautet dann: „Stand vom Laptop übernommen – der vom Handy liegt unter Sicherungen“.
- **Erstes Anmelden auf einem Gerät, das schon einen Stand hat:**
  - Ist der Server leer, wird der Stand still hochgeladen.
  - Haben beide einen Stand, fragt Lichtung einmal: „Auf diesem Gerät: Tag 12 · Auf dem Server: Tag 9 – welchen
    behalten?“ Der andere wird zur Sicherung.
- **Status im Menü** (fester Platz, nichts springt):
  - „Gespeichert · eben“
  - „Offline – wird später hochgeladen“
  - „Nicht angemeldet“
- **Ohne Server, also bei `npm run dev` ohne Backend:** Antwortet `/api` nicht, spielt Lichtung wie bisher nur
  lokal.

### Anmeldung Pflicht?

Ist der Server erreichbar und niemand angemeldet, zeigt Lichtung die Anmeldung. Ohne Netz spielt man mit dem letzten
Stand auf dem Gerät weiter. Eine Möglichkeit „ohne Konto spielen“ gibt es nicht. Bei einem Konto für eine Person
würde sie nur verwirren.

### PWA

- **`vite-plugin-pwa`:** Workbox lädt die gebauten Dateien vorab. `/api` geht nie in den Cache.
- **Updates nur mit Zustimmung:** Erst ein Hinweis „Neue Version da“ mit „Neu laden“, damit nicht mitten in einer
  Kette neu geladen wird.
- **Manifest:**
  - Name „Lichtung“, Hintergrund und Theme in den Tag-Farben, `display: standalone`, Hochformat
  - Symbole 192 px, 512 px und als `maskable`, vorerst aus `favicon.svg`. Die gemalte Grafik kommt in Meilenstein 6.

### Docker und Daten

- **Volume `/data`:**
  - SQLite liegt in `/data/lichtung.db`.
  - Sicherungen liegen in `/data/sicherungen/` (nachts per `VACUUM INTO`, die letzten 7).
  - In `compose.yaml` ist es ein **benanntes Volume**. Ein Ordner wie `./data` gehört sonst root, und der Container
    läuft als `node`. Für wen lieber einen Ordner will, erklärt das README die Zeile mit `chown`.
- **Hinter dem Proxy:**
  - Fastify mit `trustProxy`, damit `Secure` und die IP für die Sperre stimmen
  - Eine Proxy-Konfiguration ist nicht nötig: Port 8080 weiterleiten, fertig.
  - Das README zeigt je ein Beispiel für Caddy und Nginx Proxy Manager.
- **Healthcheck:** `/api/gesund` meldet zusätzlich, ob die Datenbank erreichbar ist.

### API

| Methode | Pfad | Wofür |
|---|---|---|
| GET | `/api/ich` | angemeldet? eingerichtet? |
| POST | `/api/einrichten` | Code und neues Passwort |
| POST | `/api/anmelden`, `/api/abmelden` | Sitzung |
| GET | `/api/spielstand` | Stand mit Revision |
| PUT | `/api/spielstand` | Stand mit `basis`; 409 mit Serverstand, wenn veraltet |
| GET | `/api/sicherungen` | Liste: Zeitpunkt, Gerät, Tag |
| POST | `/api/sicherungen/:id/wiederherstellen` | Sicherung wird aktueller Stand, der bisherige wird selbst zur Sicherung |
| GET | `/api/gesund` | Healthcheck |

Einladung und Registrieren aus dem Konzept entfallen.

## Technik

### `apps/server`

| Datei | Inhalt |
|---|---|
| `server.ts` | Aufbau: Datenbank öffnen, Routen anmelden, statische Dateien wie bisher |
| `datenbank.ts` *(neu)* | `node:sqlite`, Tabellen `konto`, `sitzung`, `spielstand`, `sicherung`, `einrichtung`; einfache Migration über `PRAGMA user_version` |
| `konto.ts` *(neu)* | Einrichten, Anmelden, scrypt, Sitzungen, Sperre bei zu vielen Versuchen |
| `spielstand.ts` *(neu)* | Laden, Speichern mit Revision und 409, Sicherungen, nächtliche Sicherung |
| `passwort.ts` *(neu)* | Werkzeug für `npm run passwort`: neuer Code, alte Sitzungen weg |
| `test/*.test.ts` *(neu)* | Vitest mit `app.inject()` und Datenbank im Speicher |

**Tests:**
- Einrichten nur mit Code, Code nur einmal
- falsches Passwort, Sperre
- Cookie nötig für den Spielstand
- Revision und 409
- Sicherung beim Konflikt
- Wiederherstellen
- Rotation der nächtlichen Sicherung

`npm test` lässt dann auch die Server-Tests laufen. Im Docker-Bau gilt weiter: ohne grüne Tests kein Image.

Den Spielstand prüft der Server nur grob: JSON, höchstens 1 MB, `version` vorhanden. Er rechnet nicht nach.

### `apps/web`

- **`api.ts` (neu):** kleiner Client für die Routen, mit Zeitlimit; „nicht erreichbar“ und „nicht angemeldet“
  sauber getrennt
- **`useAbgleich.ts` (neu):**
  - Speichern mit Verzögerung und beim Wechsel in den Hintergrund
  - Wiederholen, sobald das Gerät wieder online ist
  - Konflikt nach der Regel oben
  - Der Status für das Menü kommt von hier.
  - `useSpielstand` bleibt die Quelle der Wahrheit im Gerät.
- **`spielstand.ts`:** Version 3 mit `revision`, `geaendert` und `geraet`. Ein v2-Stand wird übernommen.
- **Neue Ansichten und Dialoge:**
  - Einrichten (Code und Passwort zweimal)
  - Anmelden (Passwort)
  - „Welchen Stand behalten?“
  - Sicherungen im Menü
  - Hinweis „Neue Version“
  - Speicherstatus im Menü
- **PWA:** `vite.config.ts` mit `vite-plugin-pwa`, Manifest und Symbole in `public/`. Im Dev-Server leitet ein
  Proxy `/api` auf `localhost:8080` weiter. `npm run dev` startet Web und Server zusammen.

## Mockup – was neu zu zeigen ist

Nur wenige, kleine Ansichten, im Spiel-Look:

1. **Einrichten:** Pergamentkarte auf dem Hintergrund, Wortmarke, Feld für den Code und zwei Passwortfelder.
   Daneben ein kurzer Satz, wo der Code steht.
2. **Anmelden:** ein Passwortfeld und der Hauptknopf „Weiterspielen“. Dazu zwei Fehlerfälle: falsches Passwort und
   zu viele Versuche.
3. **„Welchen Stand behalten?“:** zwei Karten nebeneinander bzw. am Handy untereinander, jeweils mit Gerät, Tag,
   Zeitpunkt und Lager in Kurzform
4. **Menü mit Speicherstatus und Sicherungen:** Liste mit „Wiederherstellen“ und Rückgängig. Dazu der Hinweis nach
   einem Konflikt.
5. **Hinweis „Neue Version“** und der Offline-Zustand

## Arbeitspakete nach der Freigabe

1. **Server:** Datenbank, Konto, Spielstand und Sicherungen, Passwort-Werkzeug, Tests
2. **Docker:** Volume, `compose.yaml`, Healthcheck, README mit Einrichten, Proxy-Beispielen und Passwort vergessen
3. **Abgleich im Web:** `api.ts`, `useAbgleich`, Spielstand v3, Dev-Proxy
4. **Oberfläche:** Einrichten, Anmelden, Konflikt-Dialog, Menü mit Status und Sicherungen
5. **PWA:** Plugin, Manifest, Symbole, Hinweis „Neue Version“
6. **Doku:** Konzept (scrypt, node:sqlite, nur ein Konto, `localStorage`), README-Stand

**Reihenfolge:**
- Paket 1 kommt zuerst.
- Paket 2 kann parallel zu Paket 3 laufen.
- Paket 4 braucht Paket 3.
- Paket 5 ist unabhängig.

**Prüfen am Ende:** Das Image lokal bauen und hinter einem Test-Proxy einrichten. Dann am Laptop und im
Handy-Format spielen, einmal offline gehen und den Konflikt absichtlich herbeiführen.

## Zu entscheiden

1. **Einrichtungscode aus dem Container-Protokoll** statt Passwort in `compose.yaml` oder freiem Formular
2. **Keine nativen Pakete:** scrypt und `node:sqlite` statt argon2 und better-sqlite3
3. **Abgleich:** Der neuere Stand gilt automatisch, der andere wird Sicherung. Gefragt wird nur beim ersten
   Anmelden mit zwei Ständen.
4. **Anmeldung ist Pflicht**, sobald der Server erreichbar ist. Offline geht es ohne.
5. **Benanntes Docker-Volume** statt Ordner `./data`
