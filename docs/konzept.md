# Lichtung – Entwurf

Arbeitstitel. Ein Ketten-Puzzle mit Siedlungsaufbau: Aus einer Lichtung im Wald wird nach und nach ein Dorf am Fluss.
Die Siedlung lebt in einer stilisierten 3D-Welt und wächst in beschleunigter Echtzeit; auf einem Wabenbrett zieht man
Ketten und holt sich gezielt, was gerade fehlt. Läuft im Browser und als App auf dem Handy (PWA), gespeichert wird auf
deinem eigenen Server (ein Docker-Container).

- Mockup Spiel-Look: [`mockups/lichtung.html`](mockups/lichtung.html) – Tagwerk, Ertrag, Siedlung; Laptop und 390 px,
  Tag und Abend. Das Brett im Mockup ist spielbar.
- Mockup MVP: [`mockups/fluren.html`](mockups/fluren.html) – Fluren, Dorf, Baustelle, Lager, Rückkehr, Tagwerk.
- Mockup Codes: [`mockups/siedlung-code.html`](mockups/siedlung-code.html).
- Prototyp der Welt: `apps/web/welt.html` (3D, Platzhalter).
- Gestaltung: [`design.md`](design.md).

## Abgrenzung

Puzzle Craft 1 und 2 sind das Vorbild für das **Genre**: Ketten ziehen und mit dem Ertrag eine Siedlung aufbauen.
Lichtung baut sie nicht nach – keine Namen, Grafiken, Kacheln, Gebäude, Werkzeuge oder Abläufe von dort. Von Northgard,
Siedler, Frostpunk, Don't Starve und Dredge übernehmen wir einzelne Spielideen (Fluren mit Bauplätzen, Warenketten,
Träger und Baustellen, Ereignisse mit Entscheidungen, Tag und Nacht), aber keine Namen, Grafiken oder Inhalte. Eigene
Regeln, die das Spiel tragen:

- **Wabenbrett** statt Quadrate – sechs Nachbarn, andere Ketten.
- **Ringe schließen** – was eine Kette umschließt, wird mitgeerntet. Nur so fängt man Tiere.
- **Reife** – Kacheln reifen auf dem Brett nach; warten lohnt, kostet aber Schritte.
- **Brett und Welt hängen zusammen** – jedes Tagwerk spielt in einer Flur, ihre Gebäude liegen als Kacheln auf dem
  Brett.
- **Aussichten und Wurf** – vor jedem Vorhaben sieht man die Chancen und beeinflusst sie mit Trupp, Proviant und Kiepe.
- **Licht statt Kampf** – die Nacht ist bedrohlich, aber man wehrt sich mit Feuer, nicht mit Waffen.

## Grundsätze (Stand 02.11.2026)

Ergebnis der Gespräche im November. Ersetzt die frühere Fassung mit Flecken-Karte, Chronik und „Zeit vergeht nur durch
Tagwerke“.

- **Drei Ebenen:** Tagwerk (Puzzle, Minuten) → Siedlung (ein Durchgang, etwa eine Woche) → Aufbruch (Neubeginn an
  einem neuen Ort).
- **Das Puzzle bleibt das Herz.** Gebäude produzieren gleichmäßig; das Tagwerk bringt gezielt, was gerade fehlt, und
  wächst mit der Siedlung.
- **Haushalten statt endlos spielen.** Proviant, Kiepe und Bauplätze sind knapp; man entscheidet, wofür man sie
  einsetzt.
- **Abwesenheit wird nie bestraft.** Die Zeit läuft weiter und das Lager füllt sich, aber nichts geht kaputt, und kein
  Ereignis verfällt mit bösen Folgen.
- **Nichts verfällt.** Waren im Lager halten ewig; unerfüllte Wünsche halten nur das Wachstum an.
- **Warm und gemütlich.** Dilemmas ja, Elend nein. Keine Monster, keine Angriffe auf die Siedlung.
- **Welt in 3D, stilisiert** – weder fotorealistisch noch Comic. Anregungen: Northgard, Dredge, Don't Starve,
  Dungeon of the Endless, Turmoil, Minecraft. Zunächst Platzhalter-Modelle und -Farben.
- **Spieler:** Einzelspieler, mehrere Spieler parallel mit Name und Code. Keine Welten; jede Siedlung behält den
  Regelstand, mit dem sie gegründet wurde.

## Zeit

Das Spiel läuft in **beschleunigter Echtzeit**, damit sich die Siedlung bewegt: Siedler gehen morgens zur Arbeit und
abends heim, die Fenster leuchten, nachts sind nur noch Träger mit Fackeln unterwegs.

- **Ein Spieltag dauert 8 Minuten.** Wie viel davon hell ist, hängt von der Jahreszeit ab und ändert sich von Tag zu
  Tag ein wenig:

| Jahreszeit | hell | Dämmerung | Nacht |
|---|---|---|---|
| Sommer | 5 min | 1 min | 2 min |
| Frühling, Herbst | 4 min | 1 min | 3 min |
| Winter | 3 min | 1 min | 4 min |

- **Eine Jahreszeit hat 8 Spieltage (64 Minuten), ein Jahr dauert 4 h 16 min.** Das Jahr geht absichtlich nicht glatt
  in 24 Stunden auf: Wer immer um 20 Uhr spielt, erlebt trotzdem fast jeden Tag eine andere Jahreszeit.
- **Jahreszeiten:** Frühling reift schneller, Sommer bringt öfter Sonne, Herbst mehr Nüsse und Pilze, Winter Frost und
  lange Nächte.
- **Die Produktion rechnet mit dem Durchschnitt.** Die Nacht bringt Stimmung, Risiko und Gelegenheiten, hält die
  Gebäude und Träger aber nicht an. So bleibt das Nachrechnen einfach.
- **Abwesenheit:** Die Zeit läuft weiter. Gebäude produzieren, bis ihr Fach voll ist, Träger tragen, Baustellen
  wachsen, Boote kommen an, die Siedler essen, und die Feuer werden aus dem Lager versorgt. Ereignisse kommen nur,
  während man spielt.
- **Wetter** hält ein bis drei Spieltage und wird einen Tag vorher angekündigt (Vorschlag). Wirkung auf dem Brett:
  siehe Tagwerk › Wetter.

## Die Siedlung: Fluren

Die Karte einer Siedlung ist in **Fluren** aufgeteilt: etwa Radius 14, rund 600 Waben, 12–16 Fluren zu je 30–50 Waben.
Jede Flur hat eine Art und einen Bonus.

| Flur | Bonus | Besonderheit |
|---|---|---|
| Lichtung (Start) | Dorf, Lager | 4 Bauplätze statt 3 |
| Wald | Holzfäller, Köhler | Bäume weichen nur, wo gebaut wird |
| Ufer | Fischer, Mühle, Steg | Wassergebäude nur auf Uferwaben |
| Wiese | Felder, Sammler | – |
| Fels | Steinbruch, Erzgrube | Felsgebäude nur auf Felswaben |
| Selten: Quelle, alter Hain, Moor … | eigene Boni | – |

- **Nebel → Erkunden → Abstecken.** Zu Beginn ist nur die Lichtung sichtbar. Ein Kundschafter aus dem Trupp erkundet
  eine Nachbarflur (ein Vorhaben, ein bis drei Spieltage unterwegs) und bringt Erkenntnis mit. Abstecken kostet
  Proviant, jede weitere Flur mehr; danach gehört sie zur Siedlung. Fluren jenseits des Flusses brauchen erst eine
  Brücke.
- **Bauplätze:** 3 je Flur. **Erschließen** (z. B. Brunnen oder Wegstein) gibt einen vierten, mehr nicht. Die Grenze
  kommt aus der Regel, nicht aus dem Platz – die Fluren bleiben zum größten Teil Natur.
- **Innerhalb der Flur ist Bauen frei** auf einem unsichtbaren Wabenraster, der Ort ist fast egal. Ausnahmen: Ufer- und
  Felsgebäude, und Anbauten brauchen freie Nachbarwaben. Gebäude stehen leicht verdreht, Wege laufen als Kurven.
- **Größe:** Gebäude belegen eine Wabe, das Lager drei. Das Dorf liegt in der Mitte der Lichtung, wächst mit seinen
  Stufen und belegt keinen Bauplatz.
- **Gebaut wird auf einer Baustelle:** Man platziert, die Träger bringen das Material, das Haus wächst (siehe Lager,
  Träger und Baustellen).
- **Baumodus:** Die Fluren leuchten von blass bis golden, je nachdem, wie gut sie zum gewählten Gebäude passen; die
  Prozentzahl steht auf der Flur. Innerhalb der Flur zeigen feine Umrisse die freien Waben, Sonderwaben sind
  hervorgehoben.
- **Umbauen kostet:** Abreißen gibt die Hälfte zurück, Versetzen kostet etwa ein Viertel.

## Gebäude, Anbauten und Warenketten

- **Erzeuger** (Holzfäller, Fischer, Feld, Steinbruch, Erzgrube) liefern Rohstoffe in Echtzeit, **Verarbeiter** machen
  daraus Waren.
- **Anbauten:** Jedes Gebäude hat 2 Anbauplätze auf Nachbarwaben; sie zählen nicht zur Grenze der Flur. Ein Anbau macht
  **mehr** (Verstärkung) oder **etwas anderes** (neues Erzeugnis).
- **Die erste Verarbeitungsstufe ist ein Anbau, höhere Stufen sind eigene Gebäude** und belegen einen Bauplatz. Das
  zwingt zu Entscheidungen.

| Kette | So läuft sie | Wofür |
|---|---|---|
| Holz → Bretter | Holzfäller mit Anbau Sägebock | Bauen ab der zweiten Stufe |
| Holz → Holzkohle | Holzfäller mit Anbau Köhlermeiler | Brennstoff für lange Nächte, Schmiede |
| Korn → Mehl → Brot | Feld; Mühle am Ufer mit Anbau Backofen | Wünsche, besserer Proviant |
| Fisch → Räucherfisch | Fischer mit Anbau Räucherkate | haltbarer Proviant für Vorhaben und Aufbruch |
| Flachs → Leinen | Feld mit Anbau Webstuhl | Wünsche |
| Erz + Holzkohle → Eisen → Werkzeug | Erzgrube am Fels; Schmiede | Axt und Sichel für die Kiepe |

- **Händler:** Alle paar Spieltage legt ein Boot an, mit drei Aufträgen („8 Bretter, 4 Leinen → 30 Taler und
  Bauplan“). Man sieht es schon auf dem Fluss kommen. Taler kaufen Ausrüstung, Saatgut und Baupläne und haben immer
  eine Verwendung. Ein verpasster Auftrag verfällt ohne Strafe.

## Lager, Träger und Baustellen

Entscheidung 02.11.2026: **Waren werden wirklich getragen**, aber nicht gnadenlos. Die Rechnung spielt nicht jeden
Schritt nach, sondern jeden Gang – mit Abgang und Ankunft (siehe Technik › Nachrechnen).

### Lager

- **Ein Lagerhaus am Dorf** mit einem Fach je Ware (Vorschlag): anfangs 60, ausgebaut 120 und 200. Spezialspeicher
  sind **Anbauten am Lager** ohne eigenen Bauplatz, z. B. Kornspeicher (Nahrung) und Holzplatz (Baustoffe).
- **Die Größe des Lagers bestimmt den Rhythmus:** Anfangs ist ein Fach nach 2–4 Stunden voll, ausgebaut hält es eine
  Nacht.
- **Jedes Gebäude hat ein kleines Fach** für das, was es macht, Werkstätten eines für ihre Zutaten. Ist das Fach voll
  und kommt kein Träger, ruht das Gebäude; fehlt eine Zutat, wartet es. Nichts geht verloren.
- **Die Waren stehen als Stapel vor dem Lager** und wachsen mit dem Bestand.
- **Jede Ware liegt an einem Ort:** im Fach eines Gebäudes, auf einem Träger, im Lager, auf einer Baustelle oder am
  Steg.

### Träger

- **Wenige Träger, große Last** (Vorschlag): Träger sind Siedler aus dem Dorf, die am Lagerhaus arbeiten – anfangs
  einer, mit jedem Ausbau einer mehr, höchstens drei. Jeder trägt einen Korb mit 5 Stück, die Forschung „Schubkarre“
  verdoppelt das. Bei so wenigen hat jeder einen Namen („Ida trägt Bretter zur Baustelle“).
- **Ziel fürs Balancing:** Ein Träger reicht für die Lichtung und eine Nachbarflur. Ab der dritten oder vierten Flur
  oder bei zwei Baustellen zugleich stockt es spürbar – dann entscheidet man: Lager ausbauen, Weg ausbauen oder
  Anbauten statt eigener Gebäude. Der Engpass löst eine Entscheidung aus, er ist kein Dauerzustand.
- **Ein Gang** hat Ware, Menge, Start, Ziel, Abgang und Ankunft. Die Dauer folgt aus der Länge des Wegs und dessen
  Ausbau.
- **Feste Reihenfolge:** zuerst Baustellen (in der Reihenfolge des Platzierens; eine lässt sich mit einem Tipp
  vorziehen), dann Zutaten für Werkstätten, dann volle Fächer abholen.
- **Die Entfernung zählt, aber grob:** Eine ferne Flur heißt längere Gänge. Dagegen helfen mehr Träger, ein
  ausgebauter Weg in der Flur (Pfad → Weg → Straße) und **Anbauten: Sie brauchen keinen Transport**, die Ware geht
  direkt hinüber (Mehl in den Backofen). Das macht Anbauten noch wertvoller.
- **Nicht gnadenlos:** Kein Stau, Wege haben keine Kapazität. Kein Gang geht verloren. Jedes wartende Gebäude sagt,
  worauf es wartet („wartet auf Träger“, „wartet auf Korn“). Nachts tragen die Träger mit Fackeln weiter.
- **Den Ertrag eines Tagwerks bringt der Trupp selbst mit**, er fliegt wie bisher sichtbar ins Lager. Liegt in der
  Flur eine Baustelle, geht passendes Material direkt dorthin.

### Baustellen

- **Erst platzieren, dann bauen.** Nach „Hier bauen“ stehen sofort Pflöcke und Band, der erste Träger läuft gleich
  los.
- **Material wird beim Platzieren vorgemerkt** („Bretter 42 · 8 verplant“), damit es nicht anderswo verbraucht wird.
  Fehlt etwas, darf man trotzdem platzieren; die Baustelle zeigt, worauf sie wartet.
- **Sichtbare Stufen:** Pflöcke → Fundament → Gerüst → Dach, je ein Viertel des Materials. Gebaut wird, während das
  Material kommt; nach der letzten Ladung bleibt nur eine kurze Restarbeit.
- **Dauer:** kleines Gebäude (Fischer, Sammler) etwa ein halber Spieltag, Werkstatt einer, Großes (Ausbau von Dorf
  oder Lager, Brücke) zwei bis drei. Den
  größten Teil macht das Tragen aus – nahe Baustellen sind schneller fertig.
- **Keine Wartezeit im schlechten Sinn:** Man sieht, was passiert, und kann es beschleunigen (näher bauen, mehr
  Träger, Tagwerk in der Flur). Keine Uhr, die man abwartet oder freikauft.
- **Rückgängig statt Rückfrage:** Abbrechen geht jederzeit, die gelieferte Ware wird zurückgetragen.

## Das Dorf: Stufen und Beschlüsse

- **Ein Dorf, das als Ganzes wächst** (Entscheidung 02.11.2026): Gewohnt wird nicht in einzelnen Hütten auf
  Bauplätzen, sondern im Dorf auf der Lichtung. Es wächst in Stufen – Weiler → Dorf → Marktflecken → Stadt –, und jede
  Stufe sieht anders aus: mehr Häuser, dann Stein, ein Markt, eine Mauer. Wohnen kostet so keine Bauplätze in den
  Fluren, und man sieht den Fortschritt auf einen Blick. Die Stufen des Dorfs sind die Bevölkerungsstufen.
- **Zuzug:** Alle paar Spieltage zieht ein Siedler ein, wenn im Dorf Platz frei ist und der Bedarf gedeckt ist.
- **Ausbau:** Ist das Dorf voll und der Bedarf gedeckt, kann man es ausbauen – eine Baustelle am Dorf. Die neue Stufe
  bringt Platz und zwei bis vier neue Wünsche.
- **Klein bleiben** (Vorschlag): anfangs 4 Siedler, am Ende einer Siedlung 15–20.
- **Wünsche** verlangen Waren aus den Ketten (z. B. Fisch und Beeren, später Brot und Leinen) und ersetzen die Kapitel
  der früheren Chronik.
- **Laufender Verbrauch** (Entscheidung 02.11.2026): Wünsche sind kein einmaliges Abliefern, die Siedler verbrauchen
  die Waren je Spieltag – direkt aus dem Lager, ins Dorf wird nichts getragen. Die Wünsche bleiben als Bedarf, jede
  Stufe bringt neue dazu.
- **Mangel hält nur das Wachstum an.** Niemand hungert, niemand zieht aus, die Stufe bleibt. Die Lager-Ansicht zeigt,
  wie lange eine Ware noch reicht.
- **Mit dem Minimum beginnen:** Die erste Stufe kennt nur Ketten und Gestrüpp. Reife, Ringe, Tiere und Fähigkeiten
  kommen in den ersten Stufen nacheinander dazu.
- **Beschlüsse:** Jeder Aufstieg bietet außerdem **zwei Regeln zur Wahl**, die für diese Siedlung bleiben (z. B. „Ringe
  fangen auch Tiere am Rand“ oder „Gestrüpp gibt beim Roden Holz“). So ist jeder Aufstieg eine Entscheidung.

## Tagwerk: das Puzzle

**Rolle:** ein gezielter Schub. Die Gebäude liefern gleichmäßig, aber selten genau das, was gerade fehlt; mit dem
Tagwerk holt man sich den Engpass. Rhythmus eines Besuchs: Lager voll → zurückkommen → nachsehen und Baustellen setzen →
ein, zwei Tagwerke für das Fehlende → weglegen (5–10 Minuten).

- **Ein Tagwerk spielt in einer Flur.** Die Kameraeinstellung fährt hinein, das Brett legt sich über die Welt. Die
  Kachelmischung folgt der Art der Flur.
- **Die Gebäude der Flur liegen als feste Kacheln auf dem Brett** (bei höchstens 4 Gebäuden bleibt es spielbar). Sie
  nehmen Platz weg, **verstärken** aber Ketten, die sie berühren – eine Holzkette am Holzfäller zählt doppelt. So wird
  das Brett mit der Siedlung stärker statt wertlos.
- **Faustregel für den Ausgleich:** Ein Tagwerk von etwa 3 Minuten bringt ungefähr so viel wie eine Stunde Produktion
  dieser Flur. Die Forschung macht Kacheln zusätzlich wertvoller.
- **Nur aus dem Puzzle:** Fund-Kacheln (z. B. eine alte Karte → Erkenntnis) und seltene Funde in der Nacht.
- **Das Brett läuft nicht gegen die Uhr.** Die Lage wird beim Losziehen festgelegt, die Welt läuft dahinter weiter.
  Der Ertrag fliegt sichtbar ins Lager.

### Das Brett

| Regel | So geht's |
|---|---|
| Größe | 7 × 7 Waben, Spalten mit flacher Oberkante. Kacheln fallen nach unten, neue kommen von oben. |
| Kette | Mindestens 3 gleiche, benachbarte Kacheln verbinden (Finger oder Maus). Zurückziehen nimmt die letzte wieder heraus. Eine Kette kostet 1 Schritt. |
| Ertrag | Summe der Reife der Kacheln in der Kette. |
| Reife | Jede Rohstoffkachel hat Reife 1–3 (Punkte). Nach jedem Schritt reifen drei Kacheln nach. |
| Ring | Umschließt eine Kette Felder vollständig, werden alle eingeschlossenen mitgeerntet – jede Art, doppelter Ertrag. |
| Gestrüpp | Lässt sich nicht verbinden. Eine Kette, die daran vorbeiführt, rodet es. |
| Tiere | Hüpfen nach jedem Schritt ein Feld weiter und fressen dort die Reife auf 1 herunter. Gefangen werden sie nur im Ring – sie ziehen dann in den Stall. |
| Rückgängig | Die letzte Kette lässt sich zurücknehmen. Nachfallende Kacheln kommen aus einem festen Zufallsstrom, Zurücknehmen würfelt also nicht neu. |

### Fluren auf dem Brett

| Flur | Rohstoffe | Hindernis | Tier |
|---|---|---|---|
| Wald | Holz, Beeren, Kräuter, Nüsse | Gestrüpp – rodet man daneben | Hase |
| Ufer | Fisch, Lehm, Schilf, Kiesel | Schlamm – wird nach zwei Ketten daneben zu Lehm | Ente |
| Wiese | Getreide, Flachs, Blüten, Kräuter | Maulwurfshügel – wandert | Schaf |
| Fels | Stein, Erz, Kohle, Kristall | Geröll – braucht zwei Ketten daneben | Ziege |
| Moor (später) | Torf, Pilze, Moos, Bernstein | Nebelloch – verdeckt Nachbarn | Frosch |

Wie viele Hindernisse anfangs liegen, legt der Wurf fest (siehe Vorhaben). Eine Flur, die nachts dunkel blieb, bringt
am nächsten Morgen mehr davon mit.

### Wetter

Das Wetter gilt für das ganze Tagwerk und steht vorher in den Aussichten.

| Wetter | Wirkung |
|---|---|
| Sonne | Fünf statt drei Kacheln reifen je Schritt. |
| Regen | Kräuter, Getreide und Fisch kommen häufiger. |
| Nebel | Die äußeren Waben sind verdeckt, bis eine Kette daneben vorbeiführt. |
| Frost (Winter) | Kacheln frieren ein; eine Kette daneben taut sie auf. |

Nachts sind ohne Laterne mehr Waben verdeckt, und die Aussichten sind schlechter.

## Vorhaben: Vorbereiten → Losziehen → Verlauf

Tagwerk, Erkunden und später Handelsfahrten folgen demselben Ablauf: **Vorbereitung** (Entscheidung) → **Wurf**
(Spannung) → **Spiel** (Können holt das Beste aus der Lage).

- **Vorbereiten** in einem kleinen Fenster: die Aussichten als Balken in vier Stufen – Missgeschick, mühsam,
  ordentlich, Glücksfall – und darunter die Faktoren mit + und −. Wer Trupp, Proviant oder Kiepe ändert, sieht den
  Balken sofort wandern.
- **Höchstens fünf Faktoren:** Flur (Fels riskanter als Wiese) · Jahreszeit, Wetter und Tageszeit · Trupp · Proviant ·
  Kiepe.
- **Losziehen würfelt.** Das Ergebnis erscheint als ein Satz („Ordentlich – Nebel am Morgen, 4 Felder verschlammt, eine
  alte Reuse gefunden“) und legt fest:
  - wie viel vom Brett anfangs belegt ist – etwa 20 % beim Missgeschick bis 2 % beim Glücksfall, mit den Hindernissen
    der Flur, Frost und Nebel,
  - ein paar Schritte mehr oder weniger,
  - Funde (z. B. eine Reuse, die jede Fischkette verstärkt).
- **Fair bleiben:** Auch das schlimmste Ergebnis bringt etwas, es macht das Brett nur schwerer. Nach einem Missgeschick
  verschieben sich die nächsten Aussichten etwas nach oben. Das Ergebnis steht beim Losziehen fest (Startwert) – neu
  laden würfelt nicht neu. „Wie letztes Mal“ füllt das Fenster mit einem Tipp.
- **Notgang:** Ohne Proviant geht immer ein Tagwerk, aber nur mit einem Siedler, wenigen Schritten und schlechten
  Aussichten.
- **Erkunden:** Ein Kundschafter ist ein bis drei Spieltage unterwegs. Im guten Fall deckt er die Flur auf und bringt
  Erkenntnis oder einen Fund mit; im schlechten kommt er mit leeren Händen oder leicht verletzt zurück und fällt ein
  paar Spieltage aus.

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

Siedler sammeln Erfahrung (Stufe 2: schneller geladen, Stufe 3: +1 Schritt).

## Kiepe: Ausrüstung für einmal

- Ausrüstung wird in der **Kiepe** mitgenommen: 3 Plätze zu Beginn, weitere über die Forschung. Mehrere gleiche
  Gegenstände sind erlaubt.
- Jeder Gegenstand wirkt **einmal**, ohne Schritt, dann ist er weg. Herkunft: Warenketten, Händler, Funde.
- Die Fähigkeiten der Siedler laden sich im Spiel auf und belohnen Können; die Kiepe packt man vorher und muss mit ihr
  haushalten.
- Die Aussichten zeigen, welche Risiken die Kiepe abdeckt („Schlamm wahrscheinlich – Stiefel dabei“).

| Gegenstand | Wirkung | Kommt aus |
|---|---|---|
| Axt | rodet Gestrüpp und Geröll in zwei Ringen um eine Wabe | Schmiede |
| Sichel | erntet eine ganze Linie entlang einer Wabenachse | Schmiede |
| Stiefel | aller Schlamm auf dem Brett wird zu Lehm | Händler |
| Laterne | hebt Nebel und Dunkelheit auf dem ganzen Brett auf | Wachs vom Imker |
| Saatbeutel | alle Kacheln in einem Umkreis +1 Reife | Gärten im Dorf |
| Lockfutter | alle Tiere springen in die Mitte | Korn |
| Wegzehrung | +4 Schritte | Backofen |

## Nacht: Licht statt Kampf

- **Keine Monster, keine Angriffe auf die Siedlung.** Nachts kriechen Nebel und Kälte vom Waldrand in die Fluren.
- **Wehren mit Licht:** Feuerstellen und Fackeln an den Grenzen der Fluren brennen nachts Holz oder Holzkohle. Lange
  Winternächte brauchen viel davon – im Sommer legt man Vorrat an, der Winter wird zur gemütlichen Zeit am Feuer.
- **Bleibt eine Flur dunkel,** verwildert sie über Nacht ein wenig: Auf ihrem Brett liegen am nächsten Morgen mehr
  Gestrüpp und Frost. Nichts wird zerstört, niemand stirbt.
- **Wildtiere** (Wölfe, Wildschweine) kommen als Ereignisse; dagegen helfen Zäune, Hunde und Licht.
- **Die Nacht ist auch eine Chance:** Leuchtpilze, Glühwürmchen und seltene Funde gibt es nur im Dunkeln – mit einer
  Laterne in der Kiepe. Wer nachts loszieht, wagt mehr und kann mehr finden.
- **In der Abwesenheit** werden die Feuer aus dem Lager versorgt; das kostet Brennstoff, sonst nichts.
- **In der Welt** drängen Lichtkreise um Feuer und Fackeln den Nebel zurück.
- Echte Kämpfe höchstens später als eigene Ebene (z. B. Ausflüge in Ruinen); die Siedlung wird nie angegriffen.

## Ereignisse

- Etwa alle 2–3 Spieltage (20–30 Minuten), **nur während man spielt**; höchstens eines wartet.
- Eine Karte mit der Lage und 2–3 Wegen. Jeder Weg zeigt Kosten und Chance, dann wird gewürfelt.
- **Konkrete Folgen** statt einer abstrakten Stimmungsanzeige (siehe Lehren). Tiefe entsteht durch
  **Folge-Ereignisse**: Eine aufgenommene Familie bringt Tage später vielleicht eine Schmiedin hervor.
- Die Jahreszeit prägt, was passiert: Hochwasser im Frühling, Wölfe im Winter.
- Ton: Dilemmas ja, Elend nein.

Beispiele:

- **Wölfe am Waldrand:** jagen (Trupp einen Tag weg; 60 % Felle, 15 % Verletzung) · Zaun bauen (8 Holz, sicher) ·
  abwarten (der Holzfäller arbeitet 3 Spieltage nur halb).
- **Hochwasser droht:** Damm bauen (10 Holz, 4 Stein) · Mühle räumen (2 Spieltage Stillstand) · hoffen (50 % passiert
  nichts; sonst 4 Spieltage Stillstand, danach liefert das Ufer mehr Lehm).

## Forschung

- **Erkenntnis** gibt es für neu entdeckte Fluren, erfüllte Wünsche und Aufstiege, Fund-Kacheln auf dem Brett und
  später stetig aus einer Schreibstube.
- Der **Forschungsbaum** schaltet Anbauten, Gebäude, Lagerplatz, Erschließen, Kiepenplätze und Transport (Schubkarre,
  Bootsbau) frei und macht Kacheln wertvoller.
- **Die Forschung zieht beim Aufbruch mit.** Sie ist das Wissen, mit dem jede neue Siedlung schneller startet – die
  Ebene über allen Siedlungen.

## Aufbruch und alte Siedlungen

- **Aufbruch:** Jeder Ort hat einen Auftrag (Vollendung). Danach wird ein Wagen gebaut (Teile aus den Warenketten), ab
  dann wählt man den Zeitpunkt frei. Mit zieht: ausgewählte Siedler, eine Wagenladung und die Forschung. An Gabelungen
  des Flusses wählt man den nächsten Ort.
- **Alte Siedlungen** bleiben auf der Flusskarte, haben keine Bedürfnisse mehr und liefern in Echtzeit per Boot oder
  Karren. In ihrer Verwaltung gibt es drei Hebel: **Schwerpunkt** (welche Ware), **Handelsweg** (zur aktiven Siedlung
  oder gegen Taler zum Händler), **Vogt** (mehr Ladung oder schnellerer Takt). Aktiv gebaut wird immer nur an einem
  Ort.
- **Ende:** Die Hafenstadt an der Mündung nach sechs bis acht Siedlungen, danach freies Weiterspielen.

### Routen zwischen den Siedlungen

Entscheidung 02.11.2026: **Fahrzeit statt Simulation.** Unterwegs wird nichts gerechnet; Abfahrt und Dauer stehen
fest, die Position auf der Karte ergibt sich daraus.

- **Boote und Karren pendeln** hin und zurück. Der Takt folgt aus Hinweg, Laden und Rückweg; ein zweites Fahrzeug auf
  derselben Route verdoppelt ihn.

| | Wasser: Boot | Land: Karren |
|---|---|---|
| Ladung | 30 | 12 |
| Hinweg zum Nachbarort | 1 Spieltag (flussab) | 2 Spieltage |
| Rückweg | 2 Spieltage (gegen die Strömung) | 2 Spieltage |
| Braucht | Steg an beiden Orten, Forschung Bootsbau | einen Weg, von Anfang an |
| Jahreszeit | Winter: Eisgang, halbes Tempo | Frühling: Schlamm, halbes Tempo |

- Weiter entfernte Orte brauchen entsprechend länger. Die alten Siedlungen liegen flussauf, ihre Boote fahren also
  mit der Strömung zur aktiven Siedlung.
- **Rückfracht ist freiwillig.** Wer flussauf Werkzeug oder Leinen mitschickt, hebt die Ladung der alten Siedlung –
  ein Hebel, kein Muss.
- **Künstliche Position:** der Anteil der verstrichenen Fahrzeit auf der Routenkurve. Auf der Flusskarte sieht man
  Boote und Karren unterwegs; in der 3D-Welt taucht das Boot am Kartenrand auf und legt am Steg an, dort übernehmen
  die Träger.
- **Nichts geht verloren:** Ist das Lager voll, wartet die Ladung am Steg; ist auch der Steg voll, behält die alte
  Siedlung ihre Ware.

## Lehren aus der Entwicklung von Puzzle Craft

Quelle: Rückblick der Entwickler, [„The Evolution of Puzzle Craft“](https://www.gamedeveloper.com/design/the-evolution-of-i-puzzle-craft-i-)
(Game Developer, 2012). Übernommen werden Erfahrungen, keine Inhalte. Noch nicht umgesetzt, außer wo „✓“ steht. Die
Spalte „Für Lichtung“ entstand vor der neuen Richtung: Kapitel und Chronik-Ziele heißen jetzt Stufen des Dorfs und
Wünsche, Flecken heißen Fluren, die Hilfsmittel stecken in der Kiepe.

**Spielaufbau**

| Erfahrung dort | Für Lichtung |
|---|---|
| Der Kreislauf trägt alles: Gebäude wollen → Rätsel lösen → bauen → zufrieden sein → nächstes Gebäude wollen. | Jedes Gebäude muss begehrenswert sein. Die Bauen-Karte zeigt, was es am Brett verändert, nicht nur, was es kostet. |
| Drei Hebel: einmalige Hilfen für mehr Kontrolle, Arbeiter verschieben Verhältnisse, Gebäude ändern dauerhaft die Regeln. | Kiepe mit Gegenständen für einmal, Siedler mit Fähigkeiten ✓ und Stufen, **Gebäude ändern Regeln am Brett** (z. B. Trockengestell: Kräuter reifen schneller; Stall: Ringe fangen auch Tiere am Rand). Eine Tabelle aller veränderbaren Regelwerte dient als Ideenquelle für Gebäude und Beschlüsse. |
| Zwei Bretter fühlen sich verschieden an, weil sie verschieden begrenzt sind: ruhig und an Zeit gebunden gegenüber herausfordernd und an Vorräte gebunden. | Fluren brauchen ein eigenes Gefühl, nicht nur andere Kacheln: Wald ruhig mit festen Schritten; Fels als Wagnis – je tiefer, desto wertvoller, begrenzt nur durch Proviant; Ufer mit Strömung, die Kacheln seitlich schiebt. |
| Testspieler wollten sofort wirkende Hilfen und selbst entscheiden. | Fähigkeiten setzt man ein, wann man will ✓. Trupp selbst wählen ✓. |
| Ein abstrakter Bevölkerungswert verwirrte. Erfahrung für geschicktes Spiel – lange Ketten, Werkzeuge – machte Können wichtig. | Freischalten über verständliche Wünsche der Stufen. Dazu **Ansehen** der Siedlung für lange Ketten und Ringe. |
| Hindernisse wurden vereinheitlicht: dieselben Regeln für alle Kacheln. | Neue Kachelarten folgen den bestehenden Regeln (Kette, Ring, Reife) statt Sonderregeln. |

**Geld und Zeit**

| Erfahrung dort | Für Lichtung |
|---|---|
| Wartezeiten und Energie machten das Spiel frustrierend und flogen raus. Belohnungen über Zeit blieben, weil sie Freude machen. | Keine Energie: Ein Tagwerk geht immer (Notgang). Gebäude produzieren in Echtzeit – das ist die gute Art. Baustellen brauchen Zeit, aber man sieht die Träger laufen und kann es beschleunigen; keine Uhr zum Abwarten oder Freikaufen. |
| Steigende Preise und eine Münze, die man ständig ausgibt, machten das Spiel spannender und die Münze wertvoll. | Proviant kostet jedes Tagwerk; jede weitere Flur und jeder weitere Siedler desselben Berufs kostet mehr; Taler haben immer eine Verwendung. |

**Oberfläche und Einführung**

| Erfahrung dort | Für Lichtung |
|---|---|
| Kacheln, die im Hintergrund verschwanden, und schöne, aber unklare Flächen verwirrten. | Jede Kachel bleibt eine einzelne Marke mit Kontrast zur Matte ✓. Bei der gemalten Grafik geht Lesbarkeit vor Schönheit – an echten Spielern testen. |
| Spieler wollten selbst bestimmen, wo gebaut wird; frei gesetzte Plätze statt starrem Raster. Das größte Bauwerk wirkte erst, als es über den Bildrand ragte. | Freies Bauen innerhalb der Fluren ✓ (Prototyp). Das letzte große Bauwerk einer Siedlung darf über die Karte hinausragen. |
| Jede Art von Ausbau mit einem Tipp erreichbar; eine obere Leiste mit dem Wichtigsten; Vorräte packen als kleines Fenster statt eigener Seite. | Vorrat oben ✓. Vorbereiten mit Trupp, Proviant und Kiepe als kleines Fenster. Bauen, Siedler und Forschung je ein eigener Knopf statt Reiter. |
| Seiten mit Statistiken und Zusammenhängen verstand niemand. Die Information an Ort und Stelle zu zeigen, wirkte. | Keine Übersichtsseite der Regeln. Wirkungen dort, wo sie gelten: am Gebäude, an der Kachel, am Porträt, in den Aussichten. |
| Große Textfenster werden weggeklickt. Kleine Häppchen mit Bild, gesprochen von Dorfbewohnern, und ein hüpfender Zeigepfeil wirken. | Das „So geht's“-Fenster aus Meilenstein 1 wird ersetzt: Siedler sagen kurze Sätze in der Blase, ein Pfeil zeigt auf das Nächste. |
| Der Durchbruch: mit dem Minimum beginnen und neue Mechaniken durch Gebäude freischalten – die Spieler ändern selbst die Regeln. | Die erste Stufe beginnt nur mit Ketten und Gestrüpp. Reife, Ringe, Tiere und Fähigkeiten kommen nacheinander, jeweils mit einem Gebäude oder einem neuen Siedler. |
| Einige Zusammenhänge bleiben bewusst unerklärt – Entdecken macht Freude. | Kombinationen (z. B. Ring und Fähigkeit) werden nicht erklärt. |
| Ladebild und Hauptmenü wurden zu einem schönen Startbild. | Das Startbild ist zugleich die Siedlungswahl mit Code-Eingabe. |

**Arbeitsweise**

| Erfahrung dort | Für Lichtung |
|---|---|
| Erst ein Prototyp mit Kritzelgrafik, dann in kleinen Schritten erweitern. | So läuft es ✓: Meilenstein 1 und die 3D-Welt mit Platzhaltern, jede neue Regel einzeln dazu und spielen. |
| Werte in Datendateien, ein eigener Editor: Balancing ohne neuen Build, Design getrennt von Programmierung. | `daten.ts` ✓. Dazu ein Balancing-Blatt im Spiel (nur mit `?werkstatt` in der Adresse): Werte live ändern, als JSON sichern, Startwert anzeigen und Tage nachspielen. |

## Bedienung

Eigener Spiel-Look, kein Cansol-Designsystem – Vorgaben in [`design.md`](design.md). Die Navigation wird mit dem
nächsten Mockup neu gefasst: Die Chronik entfällt, Lager und Forschung kommen dazu.

- **Siedlung** ist der Startbildschirm: die 3D-Welt, oben der Vorrat. Antippen einer Flur öffnet ihre Karte (Laptop
  rechts, Handy als Blatt von unten) mit dem einen großen Knopf „Tagwerk vorbereiten“.
- **Vorbereiten** ist ein kleines Fenster: Aussichten, Trupp, Proviant, Kiepe und „Losziehen“.
- **Tagwerk** ist bildschirmfüllend: Schritte-Medaille, Brett, Beutel und Trupp über der Flur. „‹“ führt zur Siedlung
  zurück, das Tagwerk wartet.
- **Rückmeldung beim Ziehen** in der Blase über dem Brett („Holz × 5 · +9“, „Ring! +6 · 1 Hase“ in Gold).
- **Fähigkeiten** über die Porträts: Ladering füllt sich, voll leuchtet er, Antippen setzt die Fähigkeit ein.
- **Ereignisse** als Karte über der Welt mit 2–3 Wegen.
- **Lager** als schlanke Ansicht: je Ware Füllstand, Trend („+12 je Tag“) und Prognose („voll in 1 h 40 min“, „reicht
  noch 2 h“). Antippen einer Ware führt in die Welt; Erzeuger, Verbraucher und ihre Wege leuchten auf.
- **In der Welt** zeigt ein kleines Zeichen über einem Gebäude, dass es ruht (Fach voll) oder wartet (Zutat fehlt).
- **„Während du weg warst“:** Beim Öffnen fasst eine kleine Karte zusammen, was passiert ist („+120 Holz · Holz seit
  2 h voll · 2 Boote angekommen · Fischer fertig“).

## Technik

### Aufbau

```
apps/web        Oberfläche: React 19, Vite, TypeScript, three.js mit React Three Fiber, Spiel-Tokens aus
                docs/design.md – als PWA
apps/server     Server: Node 24, Fastify, SQLite
packages/spiel  Spielregeln und Spieldaten in reinem TypeScript, mit Tests (Vitest)
docs/           Konzept, Mockups
Dockerfile, compose.yaml
```

- **Spielregeln getrennt von der Oberfläche.** `packages/spiel` kennt nur Daten: Brett erzeugen, Kette prüfen, Ring
  finden, nachfallen lassen, reifen, Tiere bewegen, Wetter, Spieluhr, Produktion, Lager, Gänge, Baustellen, Routen,
  Wurf. Zufall mit Startwert: jeder Zug ist reproduzierbar, Rückgängig ist sauber, Tests sind einfach.
- **Spieluhr:** Spielzeit = verstrichene Echtzeit seit der Gründung × Faktor. Wetter, Würfe und Ereignisse folgen aus
  Startwert und Tageszahl. Beim Öffnen rechnet der Server die Abwesenheit nach.
- **Nachrechnen – ein Prinzip für alles:**
  - Jeder Transport ist ein Datensatz: Ware, Menge, Start, Ziel, Abgang, Ankunft – für Träger, Karren, Boote und den
    Händler. Der Spielstand speichert die offenen Gänge, keine Positionen.
  - `nachrechnen(stand, bis)` springt von Ereignis zu Ereignis (Ankunft, Fach voll, Baustelle fertig, Abfahrt) und
    rechnet dazwischen die gleichmäßigen Werte: Produktion, Verbrauch, Brennstoff. Es liefert den neuen Stand und die
    Zusammenfassung „Während du weg warst“.
  - Die Position ist reine Darstellung: Anteil der Fahrzeit auf der Wegkurve, in three.js bei jedem Bild neu.
  - Aufwand, grob geschätzt: drei Träger machen rund 200 Gänge je Stunde, eine Woche Abwesenheit ergibt unter
    100.000 Ereignisse – in JavaScript deutlich unter einer Sekunde. Steht alles still (Lager voll, keine Baustelle),
    springt die Rechnung gleich zum nächsten geplanten Ereignis.
  - Der Server rechnet verbindlich, der Browser rechnet nur voraus und wird beim nächsten Abgleich korrigiert.
- **Spieldaten als Tabellen** (Fluren, Kacheln, Ketten, Gebäude, Stufen, Ereignisse) – Balancing ohne Code.
- **Welt in 3D** mit three.js und React Three Fiber, Platzhalter-Modelle. **Das Brett bleibt SVG** und liegt beim
  Tagwerk über der Welt: 49 Waben sind für SVG wenig, scharf auf jedem Bildschirm, leicht zu animieren, Tastatur und
  Screenreader möglich.
- **PWA:** auf Android „Zum Startbildschirm hinzufügen“, spielt offline, speichert später auf dem Server.

### Siedlungen und Codes statt Konten

Kein Login, keine E-Mail, kein Passwort. Wer spielt, gründet eine **Siedlung** und bekommt dafür einen Code. Mit dem
Aufbruch hat ein Spieler künftig mehrere Siedlungen; der Code gehört dann zum Spieler (Name statt Siedlungsname). Das
wird beim Bau der Codes angepasst.

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
- Spielstand als JSON mit Versionsnummer, gespeichert nach jedem Tagwerk und jeder Aktion in der Siedlung.
- Offline: Stand in IndexedDB, beim nächsten Kontakt hochladen. Zwei Geräte mit verschiedenem Stand: der neuere gilt,
  der ältere bleibt als Sicherung erhalten.
- Die Regeln aus `packages/spiel` laufen im Browser und auf dem Server; der Server rechnet beim Öffnen die Abwesenheit
  nach und speichert. Für ein Spiel auf dem eigenen Server reicht das.

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

## MVP: die Kernschleife prüfen

Entscheidung 02.11.2026. Das Konzept ist größer als das, was wir sicher wissen. Das MVP beantwortet deshalb nur eine
Frage: **Macht es Spaß, in kurzen Besuchen eine kleine Siedlung wachsen zu sehen und mit dem Puzzle gezielt zu holen,
was gerade fehlt?** Macht diese Schleife keinen Spaß, retten sie Wurf, Nacht und Forschung nicht. Macht sie Spaß,
kommen die anderen Teile einzeln dazu, und jeder muss zeigen, dass er das Spiel besser macht.

**Drin:**

- **Karte mit fünf Fluren:** Lichtung, Wald, Ufer und Wiese zum Abstecken (kostet Proviant), eine im Nebel als
  Ausblick. Je Flur drei Bauplätze und ein Bonus nach Art der Flur.
- **Drei Gebäude und eine Kette:** Holzfäller mit Anbau Sägebock (Holz → Bretter), Fischer, Sammlerhütte.
- **Lager** mit Fächern und Stapeln, **Baustellen**.
- **Das Dorf** mit drei Stufen und laufendem Verbrauch (Fisch und Beeren; Bretter für den Ausbau).
- **Tagwerk** in einer Flur mit Gebäude-Kacheln – das Brett aus Meilenstein 1 gibt es schon.
- **Vorbereiten nur mit Trupp und Proviant:** Mehr Siedler bringen mehr Schritte, essen aber auch mehr.
- **Spieluhr** mit Tag und Nacht, vorerst nur als Licht.
- **Nachrechnen und Speichern** im Browser.
- **Werkstatt** (`?werkstatt`) mit Zeitraffer und allen Werten zum Live-Ändern, damit wir für die Balance nicht eine
  Woche warten müssen.

**Bewusst später:** Wurf mit Aussichten und Kiepe; Nacht mit Fackeln, Jahreszeiten und Wetter; Ereignisse und
Beschlüsse; Forschung; Erkunden mit Kundschafter; Händler; Aufbruch und Routen; Server und Codes.

**Im MVP entscheiden:**

- **Träger echt oder nur zur Anschauung:** ein Schalter in der Werkstatt. Bei „sofort“ landet jede Ware gleich im
  Lager, und Baustellen bekommen ihr Material sofort; bei „echt“ tragen ein bis drei Träger. Weil jeder Gang ohnehin
  als Datensatz läuft, kostet der Schalter wenig. Jede Variante ein paar Tage spielen, dann entscheiden.
- **Wohnen als wachsendes Dorf:** gleich so bauen. Trägt es nicht, merken wir es früh.

**Woran wir Spaß erkennen:** eine Woche spielen, zwei, drei kurze Besuche am Tag – der Rhythmus, für den das Spiel
gedacht ist. Dabei auf vier Dinge achten:

1. Will ich zurückkommen, oder fühlt es sich wie Pflicht an?
2. Gibt es bei jedem Besuch eine Entscheidung (was bauen, welche Flur, wie viel Proviant)?
3. Spiele ich das Tagwerk gern? Lasse ich es weg, ist der Schub zu schwach; muss ich es spielen, ist er zu stark.
4. Macht das wachsende Dorf stolz? Machen die Träger die Welt lebendiger oder nur langsamer?

**Reihenfolge,** jeder Schritt für sich spielbar:

1. Rechenkern in `packages/spiel`: Spieluhr, Lager, Produktion, Verbrauch, Dorf, Nachrechnen – mit Tests und
   Zeitraffer.
2. Welt: Fluren mit Bauplätzen und Abstecken, Baustellen, Stapel, das Dorf auf der Lichtung.
3. Tagwerk in der Flur mit Gebäude-Kacheln und Proviant.
4. Träger mit Schalter.
5. Eine Woche spielen, dann entscheiden, was als Nächstes dazukommt.

Mockup: [`mockups/fluren.html`](mockups/fluren.html) – Fluren, Bauen und Baustelle, das Dorf in seinen Stufen,
Lager, „Während du weg warst“, Vorbereiten und Tagwerk; Laptop und 390 px, Tag und Abend. Wartet auf Freigabe.

## Meilensteine

1. **Brett** (fertig) – ein Tagwerk im Wald spielbar im Browser: Ketten, Ringe, Reife, Gestrüpp, Hasen, Rückgängig,
   dazu schon die drei Wald-Siedler mit Fähigkeiten. Regeln mit Tests.
2. **Docker** (fertig) – Image, `compose.yaml`, Healthcheck, Build für amd64 und arm64.
3. **Welt-Prototyp** (fertig) – stilisierte 3D-Welt mit Gelände, Fluss, Wald und Fels, Tag und Abend, Bauen mit
   Overlay, Wege als Kurven.
4. **MVP: die Kernschleife** – Fluren mit Abstecken und Bauplatz-Grenze, drei Gebäude und eine Kette, Lager,
   Baustellen, Dorf mit drei Stufen und laufendem Verbrauch, Tagwerk in der Flur, Träger mit Schalter, Werkstatt
   mit Zeitraffer (siehe MVP). Danach eine Woche spielen und entscheiden.
5. **Vorhaben** – Vorbereiten mit Aussichten, Wurf und Kiepe; Erkunden mit Kundschafter; Notgang; Wetter,
   Jahreszeiten, Nacht mit Feuer und Fackeln.
6. **Die Siedlung wächst** – das Dorf bis zur Stadt, Beschlüsse, weitere Ketten und Anbauten, Lagerausbau,
   Ereignisse, Händler.
7. **Server** – Codes für Spieler, Spielstand auf dem Server, Nachrechnen der Abwesenheit, Löschen nach einem Jahr, PWA.
8. **Forschung und Aufbruch** – Forschungsbaum, Wagen, Flusskarte, alte Siedlungen mit Verwaltung, Routen mit Booten
   und Karren, Hafenstadt.
9. **Grafik und Feinschliff** – eigene Modelle und gemalter Stil (siehe `design.md` › Grafik), Einführung durch Siedler
   und Zeigepfeil, Klang.

## Offene Fragen

1. Name „Lichtung“ – passt der?
2. Server: läuft dort schon ein Reverse-Proxy mit HTTPS? amd64 oder arm64?
3. Gabelungen am Fluss – ja oder nein?
4. Namen der Dorfstufen – Vorschlag: Weiler, Dorf, Marktflecken, Stadt.
5. Länge eines Durchgangs – passt etwa eine Woche?
6. Als Vorschlag eingetragen, aber noch nicht ausdrücklich bestätigt: die Forschung zieht beim Aufbruch mit; Wetter
   hält ein bis drei Spieltage; Reisevorbereitung als Projekt (Wagenbau) statt Wartezeit; Größenordnung des Dorfs
   (4 bis 15–20 Siedler) und der Träger (1 bis 3, Korb mit 5).
7. Codes: Der Code gehört künftig zum Spieler statt zur Siedlung – Abläufe in `mockups/siedlung-code.html` anpassen.
8. Brauchen Gebäude Arbeiter? Vorschlag: nein. Die Siedler mit Beruf arbeiten sichtbar an ihrem Gebäude, aber ohne
   Zuteilung und ohne Zählen; zugeteilt wird nur, wer trägt und wer im Trupp loszieht. Ob die Träger echt tragen,
   klärt das MVP.
9. Lager: ein Fach je Ware (Vorschlag) oder Platz je Warenfamilie (Baustoffe, Nahrung, Waren)?
