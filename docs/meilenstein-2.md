# Meilenstein 2 – Kreislauf (Plan)

Plan vom 13.11.2026, freigegeben und umgesetzt. Mockup: [`mockups/kreislauf.html`](mockups/kreislauf.html).

**Beim Bauen festgelegt:** Die Zimmerei steht ab Start auf dem Holzplatz, baubar ist in M2 nur das Trockengestell.
Neues Spiel: 6 Beerenbrei, sonst leeres Lager. Weniger Proviant als Siedler begrenzt den Trupp.

**Ziel:** Aus dem einzelnen Tagwerk wird ein Spiel mit Kreislauf. Auf der Karte wählst du einen Fleck, nimmst
Proviant mit und spielst dein Tagwerk. Der Ertrag kommt ins Lager, über Nacht verarbeiten die Gebäude ihn, und mit
dem Ergebnis baust du – und rodest so weitere Flecken frei.

```
Siedlung (Karte) ──Fleck wählen, Trupp + Proviant──▶ Tagwerk ──Einbringen──▶ Nacht ──▶ Siedlung
      ▲                                                                         │
      └──── Werkstatt: Aufträge für die Nacht · Bauen auf gerodeten Flecken ◀───┘
```

## Umfang

**Drin:**

- Startbildschirm **Siedlung** mit Wabenkarte und Fleck-Detail, wie im Mockup Teil 4 und 5
- **Lager** mit Rohstoffen, Waren und Proviant
- **Werkstatt** mit fünf Rezepten in drei Gebäuden, die über Nacht arbeiten
- **Bauen** auf gerodeten Flecken, mit Rückgängig
- **Flecken-Ziele** bleiben über Tage erhalten. Ist ein Ziel erfüllt, decken sich die Nachbarn auf und der Fleck
  ist bebaubar.
- **Proviant** bestimmt die Schritte
- **Spielstand v2** im Browser, bestehende Spielstände werden übernommen
- Navigation mit Holzleiste und Holzreitern

**Nicht drin**, das kommt in Meilenstein 4: Wetter, Händler und Taler, Chronik und Kapitel, Bachufer und weitere
Biome, neue Siedler, Erfahrung, Stall. Auf der Karte sind diese Flecken zu sehen, aber gesperrt („Noch nicht
erreichbar“). In der Leiste fehlt die Chronik noch.

## Regeln

### Karte

- Die Lichtung liegt in der Mitte, darum zwei Ringe Waben, also 19 Flecken. Jeder Fleck hat Lage (q, r), Name,
  Biom und Ziel und steht als Tabelle in `daten.ts`.
- **Zustände eines Flecks:**
  - **Nebel**
  - **erkundet**: Ziel offen, Tagwerk möglich
  - **gerodet**: Ziel erfüllt, Tagwerk und Bauen möglich
  - **bebaut**: kein Tagwerk mehr
  - **gesperrt**: Biom erst später
- **Start:**
  - Lichtung mit Lagerfeuer, Hütten und Holzplatz sind bebaut.
  - Nordwald und Hain sind erkundet.
  - Bachufer und Felshang sind gesperrt.
  - Der zweite Ring liegt im Nebel.
- **Ziel:** Gestrüpp roden. Im ersten Ring sind es 40, im zweiten 60–80. Ist das Ziel erfüllt, werden alle
  Nachbarn im Nebel sichtbar: Wald-Flecken als erkundet, alle anderen als gesperrt.
- Es gibt nur **ein laufendes Tagwerk**. Mit „‹“ kommst du zur Siedlung, das Tagwerk wartet. Solange es läuft,
  steht an anderen Flecken „Erst das Tagwerk im Nordwald beenden“.

### Proviant und Schritte

- Jeder Siedler im Trupp braucht 1 Proviant. Seine Schritte richten sich nach dem Proviant.
- Vorgewählt ist der beste vorhandene Proviant. Die Auswahl lässt sich im Fleck-Detail ändern.
- **Notfall gegen Festfahren:** Ist kein Proviant da, geht ein Siedler „mit leerem Magen“ los und hat 3 Schritte.
- **Start:** 6 Beerenbrei.

| Proviant | Schritte |
|---|---|
| Beerenbrei | 5 |
| Röstnüsse | 6 |
| Waldeintopf | 7 |

Brot und Eintopf aus dem Konzept bleiben. Röstnüsse sind neu, damit Nüsse einen Zweck haben. Den Waldeintopf
gibt es schon früh, weil er nur Zutaten aus dem Wald braucht.

### Gebäude und Rezepte

Gebäude arbeiten **über Nacht**, also beim Einbringen. Jedes Gebäude hat eine Tagesleistung. In der Werkstatt
legst du je Gebäude fest, welches Rezept es kocht und wie viel, höchstens bis zur Tagesleistung. Ein Auftrag
bleibt stehen, bis du ihn änderst. Du musst also nicht jeden Tag in die Werkstatt. Fehlen Zutaten, macht das
Gebäude so viel, wie das Lager hergibt.

| Gebäude | Baukosten | Rezept | Je Tag |
|---|---|---|---|
| Lagerfeuer | Start | 3 Beeren → 1 Beerenbrei | 6 |
| | | 3 Nüsse → 1 Röstnüsse | |
| | | 2 Beeren, 1 Röstnüsse, 1 Trockenkräuter → 1 Waldeintopf | |
| Zimmerei | 30 Holz | 3 Holz → 1 Brett | 4 |
| Trockengestell | 6 Bretter, 10 Kräuter | 2 Kräuter → 1 Trockenkräuter | 4 |

- Das macht fünf Rezepte, und jeder Wald-Rohstoff wird gebraucht. Daraus ergibt sich ein kleiner Baum:
  Holz → Zimmerei → Bretter → Trockengestell → Eintopf.
- **Gegen das Konzept:** Dort braucht die Zimmerei Holz und Stein. In Meilenstein 2 gibt es aber keinen Stein,
  darum hier nur Holz. Das Trockengestell steht schon im Mockup und kommt jetzt ins Konzept. Die Hütte entfällt
  in Meilenstein 2, weil erst mit der Chronik neue Siedler kommen.
- Gefangene **Hasen** werden im Lager nur gezählt. Einen Zweck bekommen sie erst mit dem Stall.
- **Bauen** belegt einen gerodeten Fleck. Danach steht ein Hinweis mit „Rückgängig“ bereit. Bis zum nächsten
  Einbringen lässt sich der Bau zurücknehmen, auch später noch über das Fleck-Detail. Die Kosten kommen dann
  zurück.

### Einbringen und Nacht

In dieser Reihenfolge, als eine reine Funktion:

1. Der Ertrag kommt ins Lager.
2. Der Proviant ist schon beim Aufbruch abgezogen.
3. Der Stand des Ziels wird für den Fleck übernommen. Ist das Ziel erfüllt, decken sich die Nachbarn auf.
4. Die Gebäude arbeiten ihre Aufträge ab, in der Reihenfolge der Tabelle. So kann Röstnuss vom Lagerfeuer erst in
   der nächsten Nacht in den Eintopf – das ist Absicht und leicht zu erklären.
5. Der Tag zählt eins weiter.

Danach erscheint die Siedlung mit dem Hinweis „Tag 5 · Lagerfeuer: 6 Beerenbrei · Zimmerei: 4 Bretter“ und
„Lager“ als Aktion.

## Technik

### `packages/spiel` – Regeln, mit Tests

| Datei | Inhalt |
|---|---|
| `daten.ts` | ergänzt um `WAREN` und `PROVIANT` (Schritte), `GEBAEUDE` (Kosten, Rezepte, Leistung), `FLECKEN` (Karte) und `START` |
| `karte.ts` *(neu)* | Nachbarn auf der Wabenkarte, Aufdecken, Zustand eines Flecks |
| `siedlung.ts` *(neu)* | `neueSiedlung`, `tagwerkBeginnen(s, fleck, trupp, proviant)`, `einbringen(s, tagwerk)`, `nacht(s)`, `bauen` / `bauZuruecknehmen`, `auftragSetzen` – alle rein und ohne Seiteneffekte, wie `tagwerk.ts` |
| `tagwerk.ts` | `neuesTagwerk` bekommt Schritte und Ziel von außen, statt sie selbst aus dem Trupp zu rechnen. Sonst bleibt alles gleich. |

**Tests:**

- Proviant abziehen
- Notfall mit leerem Magen
- Nacht mit knappen Zutaten
- Reihenfolge der Gebäude
- Aufdecken
- Bauen und Rückgängig
- Einbringen ist reproduzierbar
- **Balancing-Probe:** Ein einfacher Bot zieht immer die längste Kette und spielt so 30 Tage. Der Test prüft, dass
  das Spiel nicht festfährt, und gibt aus, an welchem Tag Zimmerei, Trockengestell und der erste Eintopf möglich
  sind.

### Spielstand v2

```ts
interface Spielstand {
  version: 2;
  seed: number;
  tag: number;
  lager: Record<Ware, number>;          // Rohstoffe, Waren, Proviant, Hasen
  flecken: Record<FleckId, { zustand; ziel: number; gebaeude?: GebaeudeId; gebautAmTag?: number }>;
  auftraege: Record<GebaeudeId, { rezept: RezeptId; menge: number }>;
  unterwegs: { fleck: FleckId; tagwerk: Tagwerk } | null;
  bester: number;
}
```

- **Übernahme aus v1:** Das laufende Tagwerk wird zum Tagwerk im Nordwald. Der Stand des Ziels geht an den
  Nordwald, der Rest ist Startzustand. Gespeichert wird weiter in `localStorage`, auf dem Server ab Meilenstein 3.

### `apps/web` – Oberfläche

- **`App.tsx` (neu):** hält den Spielstand und die Ansicht `siedlung | werkstatt | tagwerk`.
  - Die Ansicht steht im Hash (`#werkstatt`). So funktioniert am Handy die Zurück-Taste.
  - `main.tsx` zeigt `App` statt `TagwerkAnsicht`.
- **`useSpielstand` (neu):** Laden, Speichern, Übernahme aus v1, Rückgängig fürs Bauen.
  - `useSpiel` behält nur, was zum Tagwerk gehört: Verlauf, Animation, Meldungen.
  - `useSpiel` bekommt das Tagwerk und `onEinbringen` von außen.
- **`SiedlungAnsicht`:** Landkarte als SVG und Fleck-Detail. Am Laptop steht es als Karte rechts, am Handy als
  Blatt in drei Höhen, wie im Mockup. Dazu kommen die Trupp- und Proviant-Wahl und der Knopf „Tagwerk beginnen“.
- **`WerkstattAnsicht`:**
  - je Gebäude eine Pergamentkarte mit Rezepten, Auftrag und Vorschau „über Nacht: −18 Beeren, +6 Beerenbrei“
  - darunter, was sich bauen lässt, mit Hinweis auf freie gerodete Flecken
- **`Holzleiste` / `Reiter`:** Siedlung · Werkstatt · Menü
- Die Marken für Waren und Proviant kommen in `symbole.tsx`, als Lucide-Platzhalter wie bisher.

## Mockup – was neu zu zeigen ist

Die Siedlung gibt es schon (Teil 4 und 5). Sie wird an den Umfang hier angepasst. Neu kommt dazu:

1. **Werkstatt**, Tag und Abend, Laptop und 390 px. Zu sehen sind Aufträge, ein Gebäude mit fehlenden Zutaten und
   der Abschnitt „Bauen“.
2. **Fleck-Detail mit Proviant-Wahl** und dem Fall „kein Proviant – mit leerem Magen“
3. **Nach dem Einbringen:** Siedlung mit dem Hinweis zur Nacht. Ein Fleck ist gerodet, und Nachbarn tauchen aus
   dem Nebel auf.
4. **Bauen mit Rückgängig**

## Arbeitspakete nach der Freigabe

1. **Regeln** in `packages/spiel`: Daten, Karte, Siedlung, Tests und Balancing-Probe
2. **Spielstand und Gerüst:** `App`, `useSpielstand`, Übernahme aus v1, Navigation
3. **Siedlung:** Karte, Detail, Trupp und Proviant, Start und Rückkehr ins Tagwerk
4. **Werkstatt:** Aufträge und Bauen
5. **Doku:** Konzept (Zimmerei, Trockengestell, Röstnüsse, leerer Magen), README-Stand und `design.md`, falls die
   Werkstatt neue Bausteine bringt

Paket 1 kommt zuerst. Danach Paket 2, die Pakete 3 und 4 hängen beide davon ab. Sie betreffen getrennte Dateien
und können parallel laufen.

## Zu entscheiden

1. **Gebäude arbeiten über Nacht mit stehenden Aufträgen**, statt sofort zu verarbeiten. Das passt zu „Zeit
   vergeht nur durch Tagwerke“ und zum Konzept („Gebäude arbeiten pro Tag“).
2. **Rezepte und Zahlen wie oben**, vor allem Röstnüsse und Waldeintopf als neuer Proviant.
3. **Notfall „mit leerem Magen“** (1 Siedler, 3 Schritte) gegen Festfahren
4. **Keine Hütte und keine Chronik in Meilenstein 2.** Gesperrte Biome sind zu sehen, aber noch nicht erreichbar.
