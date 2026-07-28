# Technische Architektur

## Überblick

E.L.U.M. ist derzeit eine clientseitige React-/TypeScript-
Anwendung. Die Kernregeln sind weitgehend als testbare
TypeScript-Funktionen modelliert. React orchestriert die sichtbaren
Spielphasen und hält den interaktiven Zustand.

## Verzeichnisse

```text
elum-game/
├── .github/workflows/       GitHub-Pages-Deployment
├── docs/                    Design- und Projektdokumentation
├── web/
│   ├── src/
│   │   ├── components/      React-Oberfläche
│   │   ├── i18n/            Sprache und Zahlenformatierung
│   │   ├── game.ts          zentrale Regeln und Zustände
│   │   ├── planetMap.ts     UI-unabhängiger Kartengraph und Layoutdaten
│   │   ├── agents.ts        gemeinsame Agentenplanung
│   │   ├── orion*.ts        Orion-spezifische Entscheidungen
│   │   ├── rival*.ts        gemeinsame Rivalenoperationen
│   │   ├── simulation*.ts   Headless-Simulationen
│   │   └── *.test.ts        Vitest-Tests
│   └── package.json
└── README.md
```

## Zentrale Schichten

### 1. Kernregeln – `game.ts`

Enthält unter anderem:

- `GameState` und zentrale Datentypen,
- Karte und Felder,
- Ressourcen und Marktpreise,
- Versorgung und Bevölkerungsentwicklung,
- Harvesterbau, Produktion, Umrüstung und Versetzung,
- Grundstücksgebote und Auktionsauflösung,
- Ressourcenhandel,
- Ereigniswirkungen,
- Rundenausführung,
- Ranglisteneinträge.

Regeländerungen sollten hier oder in einer spezialisierten,
UI-unabhängigen Datei umgesetzt und mit Tests abgesichert werden.

### 2. UI-Orchestrierung – `App.tsx`

`App.tsx` verbindet die Phasen:

- Planungsansicht,
- Grundstücksauktion,
- freiwillige Ressourcenauktion,
- Rundenabrechnung,
- Rangliste,
- Rundenbericht,
- Ereignisanzeige.

Die Komponente koordiniert Zustandsübergänge, sollte aber keine
zweite, abweichende Version der Spielregeln enthalten.

### 3. Komponenten – `components/`

Wichtige Bereiche:

- Hexkarte und Feldauswahl,
- Marktstart und Marktauktion,
- Grundstücksauktion,
- Versorgungs- und Harvesterplanung,
- Rangliste,
- Ereignisse und Rundenbericht.

Komponenten-CSS liegt jeweils möglichst nahe an der Komponente.

### 4. Agenten

`agents.ts` definiert gemeinsame Entscheidungsgrundlagen.
Spezialisierte Dateien setzen konkrete Strategien um.

Derzeitige Rollen:

- Agima – Spieler beziehungsweise Headless-Agent
- Orion – ausgewogene Strategie
- Nova – expansionsorientiert
- Vega – industrieorientiert

Die Profile sollen sich erkennbar unterscheiden, aber dieselben
Regeln, Kosten und Aktionsgrenzen verwenden.

### 5. Rivalenoperationen

`rival*.ts` führt gemeinsame autonome Vorgänge aus, zum Beispiel:

- Grundstückserwerb,
- Harvesterbetrieb,
- Investitionen,
- Marktteilnahme.

Orion-spezifische Dateien bleiben dort sinnvoll, wo seine
Strategie bewusst eigenständig ist.

### 6. Simulation

Die Simulation ist ein Analysewerkzeug und keine zweite
Browser-Spielimplementierung.

- Einzelspielsimulation untersucht einen vollständigen Lauf.
- Seriensimulation vergleicht viele Seeds.
- Berichte zeigen Rangfolge, Vermögen, Markttransaktionen und
  Versorgungswarnungen.

Wichtige Grenze:

> Headless-Simulationen dürfen die normale Browserpartie nicht
> durch Demo-Zustände, Testwerte oder vereinfachte Regeln
> verändern.

## Rundenfluss

Vereinfacht:

```text
Rundenbeginn
  → Planung und freiwillige Märkte
  → gegebenenfalls Grundstücksauktion
  → Rundenabrechnung
  → Rangliste
  → globaler Bericht / neue Runde
```

Marktgeschäfte wirken vor der Versorgung sofort auf Credits und
Bestände. Produktion und Versorgung werden in der
Rundenabrechnung verarbeitet.

## Grundstücksauktion

Bei mindestens zwei Geboten für dasselbe Grundstück startet eine
grafische Auktion. Der höchste verdeckte Betrag ist der
Startpreis. Ein alleiniger Höchstbietender beginnt als Führender.
Bei gleichem Höchstgebot startet die Stichentscheidung ohne
Führenden oberhalb des gemeinsamen Preises.

## Ressourcenmarkt

Jede Ressource kann pro Runde höchstens einmal initiiert werden.
Direkter Handel zwischen Kolonien soll Vorrang vor dem
ungünstigeren HQ-Lagerhandel haben. Jede Transaktion überträgt
genau eine Einheit.

## Internationalisierung

`web/src/i18n/` enthält Kontext, Übersetzungsnachrichten und
Formatierung. Neue sichtbare Texte sollen nicht dauerhaft direkt
in Komponenten eingebaut werden, sofern sie übersetzbar sein
müssen.

## Tests

Die Tests sind nach Fachbereichen verteilt:

- `game.test.ts` – Kernregeln
- `agents.test.ts` – gemeinsame Agentenlogik
- `orion*.test.ts` – Orion-Strategien
- `rival*.test.ts` – Rivalenoperationen
- `simulation*.test.ts` – Headless- und Batchsimulation
- `i18n/*.test.ts` – Sprache und Formatierung

Bei einem Fehler zuerst den kleinsten passenden Test ausführen,
danach die gesamte Suite.

## Deployment-Datenfluss

```text
Push auf main
  → GitHub Actions
  → npm ci
  → Test
  → Lint
  → Build
  → Upload von web/dist
  → GitHub Pages
```

<!-- ELUM-PLANET-ARCHITECTURE:BEGIN -->
## Zielarchitektur der Planetenkarten

Der aktuelle Prototyp verwendet axiale Hexkoordinaten. Das
beschlossene Zielbild ist ein 92-Felder-Planetengraph.

### Implementierte Modellgrenze

`web/src/planetMap.ts` enthält inzwischen:

- stabile Feld-IDs,
- symmetrische Nachbarlisten,
- aus dem Graphen berechnete HQ-Distanzen,
- Feldformen,
- Graphvalidierung,
- eine davon getrennte flache Positionstabelle.

Agentennachbarschaft, Simulation und Harvesterpriorisierung verwenden
keine axialen Koordinaten mehr. `HexMap.tsx` liest die bisherigen
Axialkoordinaten ausschließlich aus `flatPositions`.

Die alte 61-Felder-Prototypkarte und ihre sichtbare Anordnung bleiben
unverändert. Ihre bestehenden Gelände-Eignungen werden beim Aufbau
vorübergehend über die alte flache Position reproduziert. Mit dem
92-Felder-Graphen wird dieser Adapter durch explizite beziehungsweise
seedbasiert erzeugte Kartendaten ersetzt.

Kernprinzip:

> Spielregeln arbeiten mit Feld-IDs, Nachbarlisten und
> Graphdistanzen; Koordinaten und Polygongeometrie gehören zur
> Darstellung.

Ein künftiges Feldmodell enthält mindestens:

```ts
interface PlanetTile {
  id: string
  neighborIds: string[]
  distanceFromHq: number
  shape: "hexagon" | "pentagon"
  position: {
    flat?: { x: number; y: number }
    sphere?: { x: number; y: number; z: number }
  }
}
```

`distanceFromHq` ist kein frei gepflegter Kartenwert. Die Distanz wird
aus `neighborIds` per Graphsuche berechnet und darf anschließend für
Abfragen zwischengespeichert werden. Graph und Distanzwerte können so
nicht unabhängig voneinander veralten.

Weitere Umsetzungsreihenfolge:

1. 92-Felder-Graph hinzufügen und validieren,
2. Startpositionen und Zonen berechnen,
3. Graph zunächst flach darstellen,
4. Kristalladern und Meteoriten anbinden,
5. später eine 3D-Kugel ergänzen.

Zufällige Verteilungen müssen Seeds unterstützen, damit Tests und
Simulationen reproduzierbar bleiben.

Details: [`PLANET_MAP.md`](PLANET_MAP.md).
<!-- ELUM-PLANET-ARCHITECTURE:END -->
