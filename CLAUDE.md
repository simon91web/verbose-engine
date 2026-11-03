# Lichtung

Privates Spiel (Ketten-Puzzle mit Siedlungsaufbau) – kein Cansol-Programm.

- **Gestaltung:** [`docs/design.md`](docs/design.md). Das Cansol-Designsystem (`cansol-design/DESIGN.md`) gilt hier
  ausdrücklich nicht (Entscheidung Simon, 30.10.2026). Die Arbeitsweise bleibt: planen → Mockup (Laptop und 390 px,
  Tag und Abend) → OK abwarten → bauen.
- **Konzept und Technik:** [`docs/konzept.md`](docs/konzept.md).
- **Grafik:** im MVP Lucide-Symbole als Platzhalter; später gemalte, eigene Grafiken. Keine Grafiken, Namen oder
  Abläufe aus Puzzle Craft übernehmen – nur das Genre ist Vorbild.

## Versionen und CHANGELOG

Festgelegt mit Simon, 03.11.2026.

- **Eine Spielversion für alles:** dieselbe Nummer in `apps/web`, `apps/server` und `packages/spiel`
  (jeweils `package.json`).
- **Zählweise:** `enhancement` erhöht die Minor-Version (0.2.0 → 0.3.0), `bug` den Patch (0.3.0 → 0.3.1).
- **Die Planung vergibt die Nummer** im Titel des Issues, z. B. „MVP 1: Rechenkern … (0.2.0)“.
- **Die Umsetzung** setzt die Nummer in allen drei `package.json` und trägt sie in [`CHANGELOG.md`](CHANGELOG.md)
  ein: neueste Version oben, Überschrift `## 0.2.0 – JJJJ-MM-TT`, darunter kurze Punkte in Alltagssprache mit
  Issue-Nummer.
- Arbeitszweig ist derzeit `entwurf/lichtung`; Commits tragen `(#N)`.
