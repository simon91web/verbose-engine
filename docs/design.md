# Lichtung – Spiel-Look

Lichtung ist ein Spiel, kein Werkzeug. Das Cansol-Designsystem gilt hier **nicht** (Entscheidung Simon, 30.10.2026):
keine Cansol-Tokens, keine Geist-Schrift, keine Navigation nach DESIGN.md. Diese Datei ist die Vorgabe für die
Oberfläche des Spiels.

Mockup: [`mockups/lichtung.html`](mockups/lichtung.html) – Tagwerk, Ertrag, Siedlung; Laptop und 390 px, Tag und Abend.

## Leitbild

**warm · handgemacht · gemütlich.** Wie ein Bilderbuch über ein Dorf im Wald: Pergament, Holz, Moos, Laternenlicht.
Das Brett steht im Mittelpunkt, die Oberfläche rahmt es freundlich ein. Nichts soll nach Büro oder Formular aussehen.

Aus der Arbeit an den Cansol-Apps bleibt nur, was jedes gute Spiel auch braucht:

- Jede Handlung hat eine sichtbare Antwort – sofort, am Ort der Handlung.
- Nichts springt: Rückmeldungen haben einen festen Platz.
- Rückgängig statt Rückfrage (letzte Kette, Bauen).
- Ziele mindestens 44 px, gut lesbar auch draußen, mit Tastatur bedienbar.

## Tag und Abend

Zwei Stimmungen statt Hell und Dunkel. Standard folgt dem System (`prefers-color-scheme`), wählbar unter Menü ›
Einstellungen: „Tag“, „Abend“, „Wie das Gerät“.

| Token | Tag | Abend | Wofür |
|---|---|---|---|
| `--bg-oben` / `--bg-unten` | #EAF2DC / #CFE0AE | #22312F / #141D1C | Hintergrund (Wiese bzw. Wald bei Nacht) |
| `--perg` | #FFF8EA | #2F2823 | Karten, Blätter, Pillen (Pergament bzw. Leder) |
| `--perg-2` | #F4E8D0 | #3B322B | Vertiefte Flächen, Leisten-Spur |
| `--rand` | #E2CFA9 | #4E4033 | Rand von Pergament, Unterkante weißer Knöpfe |
| `--holz` / `--holz-d` | #9A6436 / #6E4422 | #7A5030 / #4A2F1B | Holzrahmen, Holzleiste, Titelschild |
| `--tinte` / `--tinte-2` | #3A2A1C / #7B6550 | #F4E8D2 / #C3B299 | Text / Nebentext |
| `--moos` / `--moos-d` | #4E7F2F / #3A6222 | gleich | Hauptknopf, Fortschritt |
| `--honig` / `--honig-d` | #E8A93A / #B97F1E | #F0B54C / #B9822A | Bereit, Belohnung, Auswahl |
| `--matte` | #2F4A2A | #22331A | Unterlage des Bretts |

## Kacheln

Jede Kachel ist eine **Spielmarke**: Wabe in kräftiger Farbe, dunklere Unterkante (3D), heller Glanz oben, Symbol
in Creme. Reife = goldene Punkte, Reife 3 bekommt zusätzlich einen goldenen Rand. Farbe steht für eine Familie, das
Symbol für den Rohstoff.

| Familie | Farbe | Beispiele |
|---|---|---|
| Baustoff | Rinde #B96B34 | Holz, Lehm |
| Frucht | Beere #C4446E | Beeren, Blüten |
| Pflanze | Blatt #63AE4F | Kräuter, Schilf, Flachs |
| Korn und Samen | Honig #E2AB3C (Symbol dunkel) | Nüsse, Getreide, Kiesel |
| Wasser | Bach #3F8CC0 | Fisch |
| Hindernis | Schiefer #5D6150 | Gestrüpp, Schlamm, Geröll |
| Tier | Creme #F3E6CC (Symbol braun) | Hase, Ente, Schaf |

Dieselbe Marke erscheint überall: auf dem Brett, im Beutel, in Ertrag und Lager.

## Schrift

- **Fraunces** (weich, `SOFT 100`) für Titel, Ortsnamen und große Zahlen (Schritte, Ertrag).
- **Nunito** für alles andere; Zahlen fett 800 mit `tabular-nums`.
- Größen: 13 · 15 · 18 · 22 · 28 px, Kennzahl 30–40 px.

## Formen und Bausteine

- **Pergamentkarte:** `--perg`, Rand 2 px `--rand`, Radius 16, weicher warmer Schatten.
- **Knöpfe zum Drücken:** Radius 14, Unterkante 4 px in dunklerer Farbe; beim Drücken sinkt der Knopf 2 px ein.
  Hauptknopf Moos mit weißer Schrift – einer je Ansicht. Zweitknopf Pergament. Runde Symbolknöpfe 44 px.
- **Schritte-Medaille:** runde Honigmünze mit Holzrand, Zahl in Fraunces.
- **Zielband:** Marke, Ziel, Zahl und eine Leiste in Moos auf vertiefter Spur.
- **Beutel:** Pillen mit Marke und Zahl; eine Zahl, die steigt, stößt kurz an.
- **Porträt mit Ladering:** Kreis um das Gesicht füllt sich; voll = Honig, sanftes Leuchten, Antippen setzt die
  Fähigkeit ein. Noch nicht voll: Antippen nennt in der Blase, was fehlt.
- **Blase:** Rückmeldung über dem Brett an festem Platz („Holz × 5 · +9“, „Ring! +6 · 1 Hase“ in Gold).
- **Holzleiste:** Navigation am Handy unten (Siedlung · Werkstatt · Chronik · Menü), aktives Ziel mit Honigkreis.
  Laptop: dieselben Ziele als Holzreiter oben.
- **Blatt von unten** (Handy) in drei Höhen, wie bisher; Laptop: Pergamentkarte rechts.

## Bewegung

Etwas verspielter als in einer App, aber nie im Weg.

- Kacheln fallen in 280 ms und setzen mit einem kleinen Nachfedern auf.
- Geerntete Kacheln ploppen auf und verschwinden (180 ms); gewählte heben sich 5 px.
- Zähler im Beutel stoßen an, Ertragszahlen zählen hoch.
- Bereite Fähigkeiten leuchten sanft.
- „Weniger Bewegung“ am Gerät: nur Überblenden, kein Federn, kein Leuchten.

## Grafik: jetzt und später

**Jetzt (MVP):** Lucide-Symbole auf Farbmarken, Initialen statt Gesichtern, Farbwaben auf der Karte. Es geht um
Mechanik und Spielspaß.

**Später:** ein gemalter, warmer Stil – leicht cartoonig, weiche Konturen, Licht von oben links. Eigene Grafiken,
keine Übernahme fremder Bilder. Vorbereitet ist das so:

- Jede Kachel, jedes Porträt und jeder Fleck hat **einen Platz** (Marke, Gesicht, Wabe). Die Grafik ersetzt nur den
  Inhalt, Größe und Verhalten bleiben.
- Grafiken kommen aus einer Tabelle (`packages/spiel/grafik.ts`: Art → Bild). Fehlt ein Bild, gilt der Platzhalter.
- Formate: WebP mit 2× Auflösung (Kacheln 128 px, Porträts 160 px, Flecken 256 px), Hintergründe je Tag und Abend.
