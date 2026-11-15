# Meilenstein 4 – Inhalt (Plan)

Teil 4a freigegeben am 15.11.2026 mit den Mockups `docs/mockups/bachufer.html` und `docs/mockups/bachufer-2.html`. Ablauf wie immer: Plan → Mockup (Laptop und 390 px, Tag und Abend)
→ OK → bauen.

Meilenstein 4 ist der größte bisher, darum in zwei Teilen. Jeder Teil kommt einzeln heraus und ist für sich
spielbar.

- **4a – Bachufer und Wetter** *(dieser Plan, ausführlich)*: Es gibt ein zweites Biom mit eigenem Hindernis und
  eigenem Tier. Dazu kommen ein vierter Siedler, die Hütte und Wetter, das jeden Tag ein wenig anders macht.
- **4b – Chronik, Händler und Felshang** *(nur umrissen, eigener Plan danach)*: Kapitel geben dem Spiel eine
  Richtung, der Händler gibt überzähligen Waren einen Zweck, und mit dem Felshang kommt das dritte Biom.

## 4a – Bachufer und Wetter

**Ziel:** Die Karte ist nicht mehr nur Wald. Bach-Flecken spielen sich anders als Wald, weil ihr Hindernis Geduld
braucht. Mit dem Fischer kommt ein vierter Siedler, und das Wetter macht jeden Tag ein wenig anders.

### Bachufer

| | Bachufer |
|---|---|
| **Rohstoffe** | Fisch (Bach-Blau), Lehm (Rinde), Schilf (Blatt), Kiesel (Honig) – Farben nach `design.md` |
| **Hindernis** | **Schlamm**: Er lässt sich nicht verbinden. Jede Kette, die daran vorbeiführt, trocknet ihn ein Stück. Nach zwei Ketten wird er zu **Lehm mit Reife 1**, also zu einer normalen Kachel. Ein halb getrockneter Schlamm sieht man an einem Riss. |
| **Tier** | **Ente**: Sie hüpft wie der Hase und frisst Reife. Fangen kann man sie nur im Ring (oder mit Oles Netz). Gefangene Enten kommen ins Lager und haben in 4a noch keinen Zweck – sie warten auf den Stall in 4b. |
| **Ziel** | „Schlamm trocknen 50“. Es zählt, wie viele Schlammkacheln zu Lehm geworden sind. |

- **Freischalten:**
  - Bach-Flecken werden aufgedeckt wie Wald, statt gesperrt zu bleiben.
  - In einem bestehenden Spielstand wird jeder gesperrte Bach-Fleck erkundet, wenn er einen erkundeten, gerodeten
    oder bebauten Nachbarn hat.
  - Der Fleck Bachufer neben der Lichtung ist danach sofort spielbar.
  - Felshang und Wiese bleiben gesperrt. Das Moor ist in den Daten ein Bach-Fleck und wird wie die anderen aufgedeckt.
- **Der Schlamm unterscheidet sich vom Gestrüpp bewusst:** Gestrüpp ist mit einer Kette daneben weg. Schlamm braucht
  zwei Ketten, wird dafür aber zu Ertrag. Das belohnt Ketten, die immer wieder durch dieselbe Ecke führen.

### Fischer und Hütte

- **Fischer Ole:** Fähigkeit „Netz“ leert eine ganze Spalte. Sie lädt sich durch Fisch-Ketten auf.
  - Jede Kachel der Spalte wird geerntet, Fisch zählt doppelt. Schlamm darin trocknet ein Stück, eine Ente darin ist
    gefangen. Danach füllt sich die Spalte neu.
  - Damit hat die Wahl Gewicht: Die Spalte mit dem meisten Fisch ist nicht immer die beste. Eine andere bringt
    vielleicht Lehm aus halb getrocknetem Schlamm oder fängt die Ente, die gerade Reife frisst.
  - Die Spalte wird gewählt, nachdem man den Fischer angetippt hat. Jede Spalte zeigt dabei Fisch, Schlamm und Ente,
    die Blase nennt den genauen Ertrag.
  - Das ist neu, denn bisher wirken alle Fähigkeiten ohne Ziel.
- **Hütten:**
  - Die drei Siedler aus dem Start wohnen auf dem Fleck „Hütten“, der damit voll ist.
  - Neu baubar ist die **Hütte**: 20 Holz, 12 Schilf, 8 Lehm, Platz für 2. Sie belegt einen gerodeten Fleck,
    egal welches Biom.
  - Sobald eine freie Hütte steht, zieht Ole ein. Weil die Hütte Schilf und Lehm braucht, kommt er von selbst nach
    den ersten Bach-Tagwerken und hilft beim Roden. Dazu kommt ein Hinweis „Ole der
    Fischer ist eingezogen“.
- **Trupp:** Bis zu 4 Siedler. Der vierte braucht wie alle anderen 1 Proviant.

### Werkstatt

| Gebäude | Baukosten | Rezept | Je Tag | Ort |
|---|---|---|---|---|
| Räucherei | 6 Bretter, 10 Lehm, 8 Kiesel | 2 Fisch → 1 Räucherfisch | 4 | nur auf einem gerodeten Bach-Fleck |
| Hütte | 20 Holz, 12 Schilf, 8 Lehm | – (Platz für 2 Siedler) | – | jeder gerodete Fleck |

- **Neuer Proviant: Räucherfisch, 6 Schritte.** Damit lautet die Leiter Beerenbrei 5, Röstnüsse und
  Räucherfisch 6, Waldeintopf 7.
- **Alle vier Bach-Rohstoffe werden gebraucht:**
  - Fisch: als Proviant
  - Lehm und Kiesel: für die Räucherei
  - Schilf und Lehm: für die Hütte
- **Mehr Hütten** lassen sich bauen, bleiben in 4a aber leer. Neue Siedler gibt es erst mit der Chronik in 4b.

### Wetter

Jeder Tag hat ein Wetter, das sich aus Startwert und Tag ergibt. Gespeichert werden muss es deshalb nicht.

| Wetter | Anteil | Wirkung |
|---|---|---|
| Klar | 40 % | keine |
| Sonne | 25 % | 5 statt 3 Kacheln reifen je Schritt |
| Regen | 25 % | Kräuter, Fisch und Schilf kommen häufiger (Gewicht × 1,5) |
| Nebel | 10 % | Die äußeren Waben sind verdeckt, bis eine Kette daneben vorbeiführt. Verdeckte Kacheln kann man nicht anfangen und nicht verbinden. Es ist der ganze Rand (24 von 49 Waben), wie im Mockup; ist das zu viel, nur obere und untere Reihe. |

- **Anzeige:**
  - In der Siedlung steht ein Chip „Heute Regen · morgen Sonne“, das Konzept wollte das Wetter von morgen zeigen.
  - Im Tagwerk sitzt ein Wetter-Symbol neben dem Tag, Antippen erklärt die Wirkung.
- **Frost kommt erst mit den Jahreszeiten in Meilenstein 5.**

### Technik

- **`tagwerk.ts` wird allgemeiner.** Bisher sind dort Hase, Gestrüpp, Wald-Ertrag und Idas Fähigkeit fest
  eingebaut. Neu:
  - **Ertrag** je Rohstoff des Bioms
  - **Hindernisse** mit eigener Regel: Gestrüpp ist mit einer Kette weg, Schlamm braucht zwei und wird dann zu Lehm
  - **Tiere** allgemein
  - **Fähigkeiten** als Tabelle, dazu eine mit Ziel (die Spalte beim Netz)
  - Die Wald-Tests müssen unverändert grün bleiben. Daran misst sich das Umbauen.
- **Daten:** Bach-Biom, Fischer, Räucherei, Hütte, Räucherfisch und `WETTER` stehen in `daten.ts`.
- **Siedlung:** Neu ist `bewohner` (wer wohnt hier, welche Hütte). Der Trupp wird daraus gewählt statt aus einer
  festen Liste.
- **Spielstand-Übernahme:** In `packages/spiel` kommt eine `migriereSiedlung` dazu. Sie ergänzt `bewohner`, deckt
  Bach-Flecken auf und rechnet ein laufendes Tagwerk um.
- **Wichtig, neu durch den Server: Datenversion.**
  - **Das Problem:** Das Handy kann noch die alte App haben, wenn der Server schon den neuen Stand hat. Die alte App
    hält den neuen Stand für unbrauchbar und überschreibt ihn heute mit ihrem eigenen.
  - **Darum:**
    - Der Spielstand bekommt eine Datenversion.
    - Eine App, die einen *neueren* Stand sieht, lädt nichts mehr hoch.
    - Stattdessen zeigt sie „Neue Version nötig – bitte neu laden“, mit Knopf.
  - **Teil 1 von 4a:** Das kommt ganz an den Anfang. Es muss auf allen Geräten sein, bevor der erste neue Stand
    entsteht.
- **Balancing-Probe:** Der Bot spielt auch Bach-Flecken und Wetter und zeigt an, wann Ole einzieht.

### Mockup – was neu zu zeigen ist

1. **Tagwerk am Bachufer:** Brett mit Bach-Kacheln, Schlamm ganz und halb getrocknet, eine Ente, Ziel „Schlamm
   trocknen“. Dazu Oles Netz mit Spaltenwahl.
2. **Nebel auf dem Brett:** verdeckte Randwaben, die beim Vorbeiziehen aufgehen
3. **Wetter:** Chip in der Siedlung und im Fleck-Detail, Symbol im Tagwerk mit Erklärung
4. **Hütte bauen und Ole zieht ein:** Hinweis, danach Ole im Trupp-Wahl-Bereich
5. **Werkstatt mit Räucherei,** auch der Fall „steht nur am Bachufer“
6. **Neue Version nötig:** Ein Gerät mit alter App sieht einen neueren Spielstand. Es sperrt das Hochladen und bietet
   „Neu laden“ an.
7. **Erster Start nach dem Update:** Hinweis „Das Bachufer ist zugänglich“, neu aufgedeckte Bach-Flecken auf der Karte
8. **Ende eines Bach-Tagwerks:** Abrechnung mit Bach-Waren, Enten und getrocknetem Schlamm, dazu der Fall „Fleck
   gerodet“
9. **Hütte auf der Karte:** Fleck mit Hütte, Bewohner und freier Platz, auch eine leere zweite Hütte

Die Punkte 6 bis 9 stehen in einem eigenen Ergänzungs-Mockup `docs/mockups/bachufer-2.html`.

### Arbeitspakete

1. **Datenversion und Schutz vor alten Geräten.** Klein, kommt zuerst und wird einzeln ausgeliefert.
2. **`tagwerk.ts` allgemein machen,** ohne neuen Inhalt. Die Wald-Tests bleiben grün.
3. **Bachufer:** Daten, Schlamm, Ente, Aufdecken und Migration, mit Tests
4. **Fischer, Netz mit Ziel, Hütte, Bewohner und Räucherei,** mit Tests
5. **Wetter,** mit Tests und Balancing-Probe
6. **Oberfläche:** Bach-Marken, Schlamm-Zustände, Nebel, Spaltenwahl, Wetteranzeige, Hütte und Einzug
7. **Doku**

Die Pakete 2 bis 5 hängen nacheinander am Regelpaket. Paket 6 baut auf allen auf.

## 4b – Chronik, Händler und Felshang (Umriss)

- **Chronik:** Kapitel 1 bis 3 mit je 3 bis 5 Zielen. Sie schalten Gebäude, Biome und Siedler frei.
  - Kapitel 1 „Ankunft“ gilt für bestehende Spielstände rückwirkend als erfüllt, sobald seine Ziele es sind.
- **Händler:** Alle drei Tage legt ein Boot an, mit drei Aufträgen gegen Taler und Baupläne. Das ist der Ausweg für
  das überlaufende Lager.
- **Felshang:** Stein, Erz, Kohle, Kristall; als Hindernis Geröll, als Tier die Ziege. Dazu Steinmetzin und
  Steinmetz.
- **Erfahrung der Siedler** (Stufe 2 und 3) und der **Stall** für gefangene Tiere

**Widerspruch im Konzept, für 4b zu klären:** Kapitel 2 „Am Bach“ verlangt Mühle und erstes Brot. Die Mühle mahlt
aber Getreide, und Getreide wächst nur auf der Wiese, die erst in Kapitel 4 kommt. Möglichkeiten:
- Die Mühle mahlt zuerst Nüsse zu Mehl, Getreide kommt später dazu.
- Die Mühle rutscht nach Kapitel 4.

## Zu entscheiden (4a)

1. **Erst 4a, dann 4b**, jeweils mit eigenem Plan, Mockup und eigener Auslieferung
2. **Schlamm:** zwei Ketten daneben, danach Lehm mit Reife 1. Das Ziel zählt getrocknete Schlammkacheln.
3. **Ole und die Hütte:** Ole zieht ein, sobald eine freie Hütte steht. Die
   Hütte kostet 20 Holz, 12 Schilf und 8 Lehm.
4. **Netz mit Spaltenwahl:** die erste Fähigkeit mit Ziel. Es leert die ganze Spalte (Fisch doppelt, Schlamm trocknet,
   Ente gefangen), damit die Wahl eine echte Abwägung ist.
5. **Räucherei und Räucherfisch** (Proviant 6) als einziges neues Rezept in 4a
6. **Wetter:** Klar, Sonne, Regen und Nebel mit den Anteilen oben. Frost kommt erst in Meilenstein 5.
7. **Datenversion zuerst** und einzeln ausliefern, bevor sich der Spielstand ändert
8. **Enten warten auf den Stall:** Gefangene Enten liegen im Lager, ein Zweck kommt erst in 4b.
