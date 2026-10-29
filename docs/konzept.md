# Lichtung – Entwurf

Arbeitstitel. Ein ruhiges Ketten-Puzzle mit Siedlungsaufbau: Du ziehst Ketten über ein Wabenbrett, erntest damit
Rohstoffe und machst aus einer Lichtung im Wald nach und nach ein Dorf am Fluss. Läuft im Browser und als App auf dem
Handy (PWA), gespeichert wird auf deinem eigenen Server (ein Docker-Container).

Mockup: [`mockups/lichtung.html`](mockups/lichtung.html) – Tagwerk, Siedlung und Ertrag, Laptop und 390 px, Dunkel
und Hell. Das Brett im Mockup ist spielbar.

## Abgrenzung

Puzzle Craft 1 und 2 sind das Vorbild für das **Genre**: Ketten ziehen und mit dem Ertrag eine Siedlung aufbauen.
Lichtung baut sie nicht nach – keine Namen, Grafiken, Kacheln, Gebäude, Werkzeuge oder Abläufe von dort. Eigene
Regeln, die das Spiel tragen:

- **Wabenbrett** statt Quadrate – sechs Nachbarn, andere Ketten.
- **Ringe schließen** – was eine Kette umschließt, wird mitgeerntet. Nur so fängt man Tiere.
- **Reife** – Kacheln reifen auf dem Brett nach; warten lohnt, kostet aber Schritte.
- **Flecken-Karte** – eine Wabenkarte rund um die Lichtung; jeder Fleck ist ein eigenes Brett, und wer baut, gibt
  Erntefläche auf.
- **Trupp** – die Siedler, die du mitnimmst, bestimmen Schritte und Fähigkeiten des Tages.
- **Wetter** – jeder Tag hat eines und ändert die Regeln ein wenig.

## Spielschleife

1. **Siedlung:** Fleck auf der Karte wählen, Trupp zusammenstellen, Proviant einpacken.
2. **Tagwerk:** Auf dem Brett des Flecks Ketten ziehen, bis die Schritte aufgebraucht sind (oder früher heimkehren).
3. **Ertrag einbringen:** alles geht ins Lager, ein Tag vergeht, Gebäude produzieren.
4. **Werkstatt:** Rohstoffe zu Waren verarbeiten, bauen, Aufträge des Händlers erfüllen.
5. Die Siedlung wächst: neue Siedler, neue Flecken, neue Kacheln – nächster Tag.

Zeit vergeht **nur durch Tagwerke**. Keine Echtzeit-Timer, keine Energie, auf die man warten muss.

## Das Brett

| Regel | So geht's |
|---|---|
| Größe | 7 × 7 Waben, Spalten mit flacher Oberkante. Kacheln fallen nach unten, neue kommen von oben. |
| Kette | Mindestens 3 gleiche, benachbarte Kacheln verbinden (Finger oder Maus). Zurückziehen nimmt die letzte wieder heraus. Eine Kette kostet 1 Schritt. |
| Ertrag | Summe der Reife der Kacheln in der Kette. |
| Reife | Jede Rohstoffkachel hat Reife 1–3 (Punkte). Nach jedem Schritt reifen drei Kacheln nach. |
| Ring | Umschließt eine Kette Felder vollständig, werden alle eingeschlossenen mitgeerntet – jede Art, doppelter Ertrag. |
| Gestrüpp | Lässt sich nicht verbinden. Eine Kette, die daran vorbeiführt, rodet es. Zählt für das Ziel des Flecks. |
| Tiere | Hüpfen nach jedem Schritt ein Feld weiter und fressen dort die Reife auf 1 herunter. Gefangen werden sie nur im Ring – sie ziehen dann in den Stall. |
| Rückgängig | Die letzte Kette lässt sich zurücknehmen. Nachfallende Kacheln kommen aus einem festen Zufallsstrom, Zurücknehmen würfelt also nicht neu. |

### Flecken und Biome

| Biom | Rohstoffe | Hindernis | Tier |
|---|---|---|---|
| Wald | Holz, Beeren, Kräuter, Nüsse | Gestrüpp – rodet man daneben | Hase |
| Bachufer | Fisch, Lehm, Schilf, Kiesel | Schlamm – wird nach zwei Ketten daneben zu Lehm | Ente |
| Wiese | Getreide, Flachs, Blüten, Kräuter | Maulwurfshügel – wandert | Schaf |
| Felshang | Stein, Erz, Kohle, Kristall | Geröll – braucht zwei Ketten daneben | Ziege |
| Moor (später) | Torf, Pilze, Moos, Bernstein | Nebelloch – verdeckt Nachbarn | Frosch |

Jeder Fleck hat ein **Ziel** (z. B. „Gestrüpp roden 60“). Ist es erfüllt, werden die Nachbarflecken sichtbar und der
Fleck ist bebaubar.

### Wetter

Jeder Tag hat ein Wetter; die Siedlung zeigt das von morgen.

| Wetter | Wirkung |
|---|---|
| Sonne | Fünf statt drei Kacheln reifen je Schritt. |
| Regen | Kräuter, Getreide und Fisch kommen häufiger. |
| Nebel | Die äußeren Waben sind verdeckt, bis eine Kette daneben vorbeiführt. |
| Frost (Winter) | Kacheln frieren ein; eine Kette daneben taut sie auf. |

## Trupp und Siedler

- Jeder Siedler im Trupp bringt **5 Schritte** und braucht **1 Proviant**. Höchstens 4 im Trupp.
- Besserer Proviant bringt mehr: Beerenbrei 5, Brot 6, Eintopf 7 Schritte.
- Jeder Beruf hat eine **Fähigkeit**. Sie lädt sich durch passende Ketten auf und wird einmal eingesetzt, ohne
  Schritt:

| Beruf | Fähigkeit | Lädt durch |
|---|---|---|
| Holzfällerin | Fällen – erntet alles Holz ab Reife 2 | Holz |
| Sammler | Reifen lassen – Beeren und Nüsse +1 Reife | Beeren |
| Fallenstellerin | Falle – fängt alle Tiere auf dem Brett | Kräuter |
| Fischer | Netz – erntet allen Fisch einer Spalte | Fisch |
| Steinmetzin | Spalten – Geröll wird zu Stein | Stein |

Siedler sammeln Erfahrung (Stufe 2: schneller geladen, Stufe 3: +1 Schritt). Neue Siedler ziehen ein, wenn eine Hütte
frei ist und ein Kapitel der Chronik es freigibt.

## Werkstatt, Gebäude, Händler

Gebäude stehen auf gerodeten Flecken – manche nur an einem bestimmten Biom. Ein bebauter Fleck steht nicht mehr für
Tagwerke zur Verfügung: Platz zum Ernten oder Platz zum Bauen.

| Gebäude | Braucht | Macht | Nach Kapitel |
|---|---|---|---|
| Lagerfeuer | – | Beeren → Beerenbrei | Start |
| Hütte | Holz | Platz für 2 Siedler | 1 |
| Zimmerei | Holz, Stein | Holz → Bretter | 1 |
| Mühle | am Bachufer | Getreide → Mehl | 2 |
| Backhaus | Bretter, Lehm | Mehl → Brot | 2 |
| Steinmetz | am Felshang | Stein → Quader | 3 |
| Schmiede | Quader, Erz | Erz + Kohle → Eisen → Hilfsmittel | 3 |
| Stall | Bretter | hält gefangene Tiere: Wolle, Eier, Milch | 3 |
| Weberei | Bretter, Eisen | Flachs, Wolle → Tuch | 4 |
| Brücke | Quader, Eisen | macht Flecken jenseits des Flusses erreichbar | 4 |
| Markt | Quader, Tuch | Händler kommt öfter, mehr Aufträge | 5 |

Gebäude arbeiten **pro Tag** (z. B. Mühle: 4 Mehl je Tag), nicht in Echtzeit.

**Hilfsmittel** aus der Schmiede, einmal je Tagwerk, ohne Schritt: Gießkanne (eine Art +1 Reife), Laterne (Nebel weg),
Sichel (erntet eine Reihe), Lockfutter (alle Tiere in die Mitte).

**Händler:** Alle drei Tage legt ein Boot an, mit drei Aufträgen („8 Bretter, 4 Tuch → 30 Taler und Bauplan“). Taler
kaufen Saatgut, Hilfsmittel und Baupläne. Ein verpasster Auftrag verfällt ohne Strafe.

## Chronik

Statt Stufen für die Größe der Siedlung gibt es Kapitel mit je 3–5 Zielen. Jedes Kapitel schaltet Gebäude, Biome oder
Berufe frei.

1. **Ankunft** – Hütte bauen, drei Tagwerke im Wald, Beerenbrei kochen.
2. **Am Bach** – Bachufer erkunden, Mühle bauen, erstes Brot.
3. **Der Hang** – Felshang roden, Steinmetz, Stall mit zwei Tieren.
4. **Über den Fluss** – Brücke bauen, Wiese mit Schafen, Weberei.
5. **Markttag** – Markt, zehn Siedler, fünf Aufträge erfüllt.
6. **Das Moor** – neues Biom, Nebelregeln, letzte Gebäude.

Das Jahr hat vier Jahreszeiten zu je 12 Tagen. Frühling reift schneller, Sommer bringt öfter Sonne, Herbst mehr Nüsse
und Pilze, Winter Frost – die Zeit für Werkstatt und Bauen.

## Bedienung

Nach DESIGN.md (Cansol-Designsystem). Das Mockup zeigt:

- **Bereiche:** Tagwerk · Siedlung · Werkstatt · Chronik, dazu Einstellungen und Person. Laptop: Seitenleiste
  eingeklappt; Handy: Leiste unten mit „Mehr“.
- **Tagwerk** ist eine Arbeitsseite: Das Brett ist die Arbeitsfläche, das **Werkzeugblatt** rechts zeigt Schritte,
  Ziel, Ertrag und Trupp. Handy: Brett in voller Breite, Blatt von unten in drei Höhen.
- **Siedlung** ist „Karte mit Liste“ (Vorbild Apple Maps): Wabenkarte der Flecken, Auswahl öffnet die Details im
  Werkzeugblatt mit dem einzigen Hauptknopf „Tagwerk beginnen“.
- **Rückmeldung beim Ziehen** an festem Platz unter dem Brett („Holz · 5 Felder · +9“, „Ring · 3 eingeschlossen“),
  damit nichts springt.
- **Suche** (`Strg K`) findet Rohstoffe, Rezepte, Gebäude und Siedler („Wo bekomme ich Lehm?“). **Verlauf** ist das
  Tagebuch der Siedlung, die **Glocke** meldet den Händler und fertige Gebäude.

### Abweichungen und Ableitungen

- **(Abgeleitet) Farben auf dem Brett.** Das Brett ist Inhalt wie eine Karte (DESIGN.md §11): Kacheln nutzen `viz-1`
  bis `viz-5`, jede Farbe steht für eine Familie (orange Baustoff, grün Pflanze, magenta Frucht, gelb Korn und Samen,
  blau Wasser), Symbol und Farbe sagen dasselbe; Ertragsliste und Kartenlegende erklären sie. Rot kommt nicht vor.
- **(Abgeleitet) Bewegung auf dem Brett.** Kacheln fallen in 200 ms ohne Federn nach – Bewegung zeigt, woher etwas
  kommt (§9). Keine Effekte als Schmuck.
- **Frage: kein Cansol-Logo.** Lichtung ist kein Cansol-Programm; statt des Logos steht die Wortmarke „Lichtung“.
- **Frage: Optik.** Der Rahmen folgt dem ruhigen Cansol-Stil, bunt ist nur das Brett. Alternative wäre ein
  verspielterer Spiel-Look – das wäre eine bewusste Abweichung von DESIGN.md.

## Technik

### Aufbau

```
apps/web        Oberfläche: React 19, Vite, TypeScript, Tailwind 4, shadcn/ui, Lucide, Geist – als PWA
apps/server     Server: Node 24, Fastify, SQLite
packages/spiel  Spielregeln und Spieldaten in reinem TypeScript, mit Tests (Vitest)
docs/           Konzept, Mockups
Dockerfile, compose.yaml
```

- **Spielregeln getrennt von der Oberfläche.** `packages/spiel` kennt nur Daten: Brett erzeugen, Kette prüfen, Ring
  finden, nachfallen lassen, reifen, Tiere bewegen, Wetter. Zufall mit Startwert: jeder Zug ist reproduzierbar,
  Rückgängig ist sauber, Tests sind einfach.
- **Spieldaten als Tabellen** (Biome, Kacheln, Rezepte, Gebäude, Kapitel) – Balancing ohne Code.
- **Brett als SVG.** 49 Waben sind für SVG wenig; scharf auf jedem Bildschirm, leicht zu animieren, Tastatur und
  Screenreader möglich.
- **PWA:** auf Android „Zum Startbildschirm hinzufügen“, spielt offline, speichert später auf dem Server.

### Server und Speichern

- Konten mit Name und Passwort (argon2), Sitzung per Cookie. Erster Start legt den Admin an, weitere Konten per
  Einladungslink (z. B. Familie).
- Spielstand als JSON mit Versionsnummer, gespeichert nach jedem Tagwerk und jeder Werkstatt-Aktion.
- Offline: Stand in IndexedDB, beim nächsten Kontakt hochladen. Zwei Geräte mit verschiedenem Stand: der neuere gilt,
  der ältere bleibt als Sicherung erhalten.
- Der Client rechnet das Spiel, der Server speichert nur. Für ein Spiel auf dem eigenen Server reicht das.

| Methode | Pfad | Wofür |
|---|---|---|
| POST | `/api/anmelden`, `/api/abmelden` | Sitzung |
| POST | `/api/einladung`, `/api/registrieren` | weitere Konten |
| GET | `/api/spielstand` | Stand laden |
| PUT | `/api/spielstand` | Stand speichern (mit Version, sonst 409) |
| GET | `/api/gesund` | Healthcheck für Docker |

### Docker

Ein Image, ein Container: Fastify liefert die gebaute Oberfläche und die API auf Port 8080 aus, Daten liegen im
Volume `/data` (SQLite und nächtliche Sicherungen der letzten 7 Tage).

```yaml
services:
  lichtung:
    image: ghcr.io/simon91web/lichtung:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      TZ: Europe/Berlin
      LICHTUNG_URL: https://lichtung.example.de
      LICHTUNG_REGISTRIERUNG: einladung   # offen | einladung | aus
```

- Mehrstufiges Dockerfile (bauen mit `node:24`, laufen mit `node:24-slim`), Healthcheck auf `/api/gesund`.
- GitHub Actions baut das Image für amd64 und arm64 und legt es in die GitHub Container Registry.
- HTTPS über den Reverse-Proxy auf dem Server (Caddy, Traefik oder Nginx Proxy Manager) – eine PWA braucht HTTPS.

## Meilensteine

1. **Brett** – ein Tagwerk im Wald spielbar im Browser: Ketten, Ringe, Reife, Gestrüpp, Hasen, Rückgängig. Regeln
   mit Tests.
2. **Kreislauf** – Flecken-Karte, Lager, Werkstatt mit fünf Rezepten, Speichern im Browser.
3. **Server** – Docker-Image, Konten, Speichern auf dem Server, PWA, `compose.yaml`.
4. **Inhalt** – Siedler und Fähigkeiten, Wetter, Händler, Kapitel 1–3, drei Biome.
5. **Feinschliff** – Jahreszeiten, Kapitel 4–6, Einführung, Klang, gezeichnete Kacheln.

## Offene Fragen

1. Name „Lichtung“ – passt der?
2. Optik: ruhiger Cansol-Rahmen mit buntem Brett (wie im Mockup) oder ein eigener, verspielterer Spiel-Look?
3. Wer spielt: nur du oder mehrere Konten (Familie)?
4. Server: läuft dort schon ein Reverse-Proxy mit HTTPS? amd64 oder arm64?
5. Grafik: Lucide-Symbole auf Farbwaben für den Anfang – später gezeichnete Kacheln?
