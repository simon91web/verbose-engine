# Lichtung – Entwurf

Arbeitstitel. Ein ruhiges Ketten-Puzzle mit Siedlungsaufbau: Du ziehst Ketten über ein Wabenbrett, erntest damit
Rohstoffe und machst aus einer Lichtung im Wald nach und nach ein Dorf am Fluss. Läuft im Browser und als App auf dem
Handy (PWA), gespeichert wird auf deinem eigenen Server (ein Docker-Container).

Mockup: [`mockups/lichtung.html`](mockups/lichtung.html) – Tagwerk, Siedlung und Ertrag, Laptop und 390 px, Tag und
Abend. Das Brett im Mockup ist spielbar. Gestaltung: [`design.md`](design.md).

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

## Lehren aus der Entwicklung von Puzzle Craft

Quelle: Rückblick der Entwickler, [„The Evolution of Puzzle Craft“](https://www.gamedeveloper.com/design/the-evolution-of-i-puzzle-craft-i-)
(Game Developer, 2012). Übernommen werden Erfahrungen, keine Inhalte. Noch nicht umgesetzt, außer wo „✓“ steht.

**Spielaufbau**

| Erfahrung dort | Für Lichtung |
|---|---|
| Der Kreislauf trägt alles: Gebäude wollen → Rätsel lösen → bauen → zufrieden sein → nächstes Gebäude wollen. | Jedes Gebäude muss begehrenswert sein. Die Bauen-Karte zeigt, was es am Brett verändert, nicht nur, was es kostet. |
| Drei Hebel: einmalige Hilfen für mehr Kontrolle, Arbeiter verschieben Verhältnisse, Gebäude ändern dauerhaft die Regeln. | Hilfsmittel einmalig, Siedler mit Fähigkeiten ✓ und Stufen, **Gebäude ändern Regeln am Brett** (z. B. Trockengestell: Kräuter reifen schneller; Stall: Ringe fangen auch Tiere am Rand). Eine Tabelle aller veränderbaren Regelwerte dient als Ideenquelle für Gebäude. |
| Zwei Bretter fühlen sich verschieden an, weil sie verschieden begrenzt sind: ruhig und an Zeit gebunden gegenüber herausfordernd und an Vorräte gebunden. | Biome brauchen ein eigenes Gefühl, nicht nur andere Kacheln: Wald ruhig mit festen Schritten; Felshang als Wagnis – je tiefer, desto wertvoller, begrenzt nur durch Proviant; Bachufer mit Strömung, die Kacheln seitlich schiebt. |
| Testspieler wollten sofort wirkende Hilfen und selbst entscheiden. | Fähigkeiten setzt man ein, wann man will ✓. Trupp selbst wählen ✓. |
| Ein abstrakter Bevölkerungswert verwirrte. Erfahrung für geschicktes Spiel – lange Ketten, Werkzeuge – machte Können wichtig. | Freischalten über verständliche Chronik-Ziele. Dazu **Ansehen** der Siedlung für lange Ketten und Ringe. |
| Hindernisse wurden vereinheitlicht: dieselben Regeln für alle Kacheln. | Neue Kachelarten folgen den bestehenden Regeln (Kette, Ring, Reife) statt Sonderregeln. |

**Geld und Zeit**

| Erfahrung dort | Für Lichtung |
|---|---|
| Wartezeiten und Energie machten das Spiel frustrierend und flogen raus. Belohnungen über Zeit blieben, weil sie Freude machen. | Keine Wartezeiten ✓. Gebäude erzeugen je Tag etwas – das ist die gute Art. |
| Steigende Preise und eine Münze, die man ständig ausgibt, machten das Spiel spannender und die Münze wertvoll. | Proviant kostet jedes Tagwerk; jeder weitere Siedler desselben Berufs kostet mehr; Taler haben immer eine Verwendung. |

**Oberfläche und Einführung**

| Erfahrung dort | Für Lichtung |
|---|---|
| Kacheln, die im Hintergrund verschwanden, und schöne, aber unklare Flächen verwirrten. | Jede Kachel bleibt eine einzelne Marke mit Kontrast zur Matte ✓. Bei der gemalten Grafik geht Lesbarkeit vor Schönheit – an echten Spielern testen. |
| Spieler wollten selbst bestimmen, wo gebaut wird; frei gesetzte Plätze statt starrem Raster. Das größte Bauwerk wirkte erst, als es über den Bildrand ragte. | Bauen auf den Flecken der Karte ✓. Das letzte große Bauwerk der Chronik darf über die Karte hinausragen. |
| Jede Art von Ausbau mit einem Tipp erreichbar; eine obere Leiste mit dem Wichtigsten; Vorräte packen als kleines Fenster statt eigener Seite. | Vorrat oben ✓, Trupp und Proviant in der Karte des Flecks ✓. Bauen, Siedler und Hilfsmittel je ein eigener Knopf statt Reiter. |
| Seiten mit Statistiken und Zusammenhängen verstand niemand. Die Information an Ort und Stelle zu zeigen, wirkte. | Keine Übersichtsseite der Regeln. Wirkungen dort, wo sie gelten: am Gebäude, an der Kachel, am Porträt. |
| Große Textfenster werden weggeklickt. Kleine Häppchen mit Bild, gesprochen von Dorfbewohnern, und ein hüpfender Zeigepfeil wirken. | Das „So geht's“-Fenster aus Meilenstein 1 wird ersetzt: Siedler sagen kurze Sätze in der Blase, ein Pfeil zeigt auf das Nächste. |
| Der Durchbruch: mit dem Minimum beginnen und neue Mechaniken durch Gebäude freischalten – die Spieler ändern selbst die Regeln. | Kapitel 1 beginnt nur mit Ketten und Gestrüpp. Reife, Ringe, Hasen und Fähigkeiten kommen nacheinander, jeweils mit einem Gebäude oder einem neuen Siedler. |
| Einige Zusammenhänge bleiben bewusst unerklärt – Entdecken macht Freude. | Kombinationen (z. B. Ring und Fähigkeit) werden nicht erklärt. |
| Ladebild und Hauptmenü wurden zu einem schönen Startbild. | Das Startbild ist zugleich die Siedlungswahl mit Code-Eingabe. |

**Arbeitsweise**

| Erfahrung dort | Für Lichtung |
|---|---|
| Erst ein Prototyp mit Kritzelgrafik, dann in kleinen Schritten erweitern. | So läuft es ✓: Meilenstein 1 mit Platzhaltern, jede neue Regel einzeln dazu und spielen. |
| Werte in Datendateien, ein eigener Editor: Balancing ohne neuen Build, Design getrennt von Programmierung. | `daten.ts` ✓. Dazu ein Balancing-Blatt im Spiel (nur mit `?werkstatt` in der Adresse): Werte live ändern, als JSON sichern, Startwert anzeigen und Tage nachspielen. |

## Bedienung

Eigener Spiel-Look, kein Cansol-Designsystem – Vorgaben in [`design.md`](design.md). Das Mockup zeigt:

- **Siedlung** ist der Startbildschirm: Wabenkarte der Flecken, oben der Vorrat. Antippen öffnet die Karte des Flecks
  (Laptop rechts, Handy als Blatt von unten) mit dem einen großen Knopf „Tagwerk beginnen“.
- **Tagwerk** ist bildschirmfüllend: Schritte-Medaille, Zielband, Brett, Beutel und Trupp. Kein Menü im Weg; „‹“
  führt zur Siedlung zurück, das Tagwerk wartet.
- **Navigation:** Siedlung · Werkstatt · Chronik · Menü – am Handy als Holzleiste unten, am Laptop als Holzreiter oben.
- **Rückmeldung beim Ziehen** in der Blase über dem Brett („Holz × 5 · +9“, „Ring! +6 · 1 Hase“ in Gold).
- **Fähigkeiten** über die Porträts: Ladering füllt sich, voll leuchtet er, Antippen setzt die Fähigkeit ein.

## Technik

### Aufbau

```
apps/web        Oberfläche: React 19, Vite, TypeScript, Spiel-Tokens aus docs/design.md – als PWA
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

### Siedlungen und Codes statt Konten

Kein Login, keine E-Mail, kein Passwort. Wer spielt, gründet eine **Siedlung** und bekommt dafür einen Code.

- **Neue Siedlung:** Startbild › „Neue Siedlung gründen“ › Namen der Siedlung eingeben (z. B. „Moosbach“). Der Server
  vergibt einen **Siedlungs-Code** aus vier Wörtern, z. B. `moos-biber-laterne-kiesel`, und zeigt ihn groß auf einem
  Kärtchen mit „Kopieren“ und „Ich habe ihn notiert“.
- **Weiterspielen:** Das Gerät merkt sich den Code, danach geht es direkt in die Siedlung. Auf einem neuen Gerät:
  „Mit Code weiterspielen“. Groß-/Kleinschreibung und Trennzeichen sind egal (`Moos Biber Laterne Kiesel` passt auch).
- **Mehrere Siedlungen auf einem Gerät** (Familien-Tablet): Das Startbild zeigt alle Siedlungen, die das Gerät kennt.
- **Code weg = Siedlung weg.** Solange ein Gerät die Siedlung noch kennt, zeigt Menü › „Code anzeigen“ ihn wieder an.
- **Löschen nach einem Jahr:** Jeder Zugriff merkt sich das Datum. Einmal am Tag löscht der Server Siedlungen, die
  365 Tage niemand geöffnet hat (`LICHTUNG_AUFBEWAHRUNG_TAGE`). Menü › „Siedlung löschen“ geht jederzeit – mit
  Rückfrage, weil endgültig.
- **Sicher genug für einen Heimserver:** rund 1.000 Wörter je Stelle, vier Wörter ≈ 40 Bit. Der Server speichert nur
  einen Hash des Codes (SHA-256 mit Geheimnis aus `LICHTUNG_GEHEIMNIS`) und lässt je Adresse höchstens 10 falsche
  Codes pro Minute zu – Raten ist aussichtslos. Wer den Code kennt, kann die Siedlung spielen, wie mit einem Schlüssel.
- **Keine persönlichen Daten:** gespeichert werden nur Siedlungsname, Spielstand und Datum des letzten Zugriffs.
- Spielstand als JSON mit Versionsnummer, gespeichert nach jedem Tagwerk und jeder Werkstatt-Aktion.
- Offline: Stand in IndexedDB, beim nächsten Kontakt hochladen. Zwei Geräte mit verschiedenem Stand: der neuere gilt,
  der ältere bleibt als Sicherung erhalten.
- Der Client rechnet das Spiel, der Server speichert nur. Für ein Spiel auf dem eigenen Server reicht das.

| Methode | Pfad | Wofür |
|---|---|---|
| POST | `/api/siedlungen` | neue Siedlung: `{ name }` → `{ code }` |
| GET | `/api/spielstand` | Stand laden – Code im Kopf `Authorization: Code moos-biber-…` |
| PUT | `/api/spielstand` | Stand speichern (mit Version, sonst 409) |
| DELETE | `/api/siedlung` | Siedlung endgültig löschen |
| GET | `/api/gesund` | Healthcheck für Docker |

Tabelle `siedlungen`: `id`, `code_hash` (eindeutig), `name`, `stand` (JSON), `version`, `angelegt`, `zuletzt`.

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
      LICHTUNG_GEHEIMNIS: "langer-zufaelliger-text"   # für die Hashes der Codes
      LICHTUNG_AUFBEWAHRUNG_TAGE: 365
```

- Mehrstufiges Dockerfile auf `node:24-slim`: Tests und Build im ersten Schritt, im Image nur Server und gebautes
  Spiel. Healthcheck auf `/api/gesund`. Der Server läuft als TypeScript direkt in Node 24, ohne eigenen Build.
- GitHub Actions baut das Image für amd64 und arm64 und legt es in die GitHub Container Registry.
- HTTPS über den Reverse-Proxy auf dem Server (Caddy, Traefik oder Nginx Proxy Manager) – eine PWA braucht HTTPS.

## Meilensteine

1. **Brett** (fertig) – ein Tagwerk im Wald spielbar im Browser: Ketten, Ringe, Reife, Gestrüpp, Hasen, Rückgängig,
   dazu schon die drei Wald-Siedler mit Fähigkeiten. Regeln mit Tests.
2. **Kreislauf** – Flecken-Karte, Lager, Werkstatt mit fünf Rezepten, Speichern im Browser.
3. **Server** – Docker-Image und `compose.yaml` (vorgezogen, fertig), Siedlungs-Codes, Speichern auf dem Server,
   Löschen nach einem Jahr, PWA.
4. **Inhalt** – Siedler und Fähigkeiten, Wetter, Händler, Kapitel 1–3 mit schrittweise freigeschalteten Regeln
   (siehe Lehren), drei Biome mit eigenem Gefühl.
5. **Feinschliff** – Jahreszeiten, Kapitel 4–6, Einführung durch Siedler und Zeigepfeil, Klang.
6. **Grafik** – gemalter, warmer Stil für Kacheln, Porträts, Karte und Hintergründe (siehe `design.md` › Grafik).

## Offene Fragen

1. Name „Lichtung“ – passt der?
2. Server: läuft dort schon ein Reverse-Proxy mit HTTPS? amd64 oder arm64?
