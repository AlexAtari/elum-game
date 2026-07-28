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
│   │   ├── planetMap.ts     UI-unabhängiger Kartengraph und Geometriedaten
│   │   ├── planetProjection.ts reine Kugelprojektion
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

- Kugelkarte und Feldauswahl,
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
- Die Seriensimulation zählt zusätzlich die Gründe abgelehnter
  Harvesterbauten, erfolgreiche Baurunden sowie die erste
  Harvester- und Grundstückserweiterung jeder Kolonie.

Die gemeinsame Agentenplanung besitzt für einen brachliegenden
Harvester ein enges Infrastruktursicherheitsfenster: Der Landkauf
bleibt auf das Mindestgebot und einen Restpuffer von 20 Credits
begrenzt. Die Rivalen ermitteln Kandidaten ausschließlich im
92-Felder-Zielgraphen und prüfen echte Nachbarschaft zu eigenem Land.

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

Der aktuelle Prototyp verwendet einen 92-Felder-Planetengraphen mit
normalisierten Kugelkoordinaten.

### Implementierte Modellgrenze

`web/src/planetMap.ts` enthält inzwischen:

- stabile Feld-IDs,
- symmetrische Nachbarlisten,
- aus dem Graphen berechnete HQ-Distanzen,
- Feldformen,
- Graphvalidierung,
- davon getrennte normalisierte Kugelpositionen und eine flache
  Hilfspositionstabelle.

Zusätzlich erzeugt `targetPlanetMap` deterministisch den beschlossenen
92-Felder-Graphen durch eine Icosaeder-Unterteilung der Frequenz 3:

- ein HQ auf einem Hexagon,
- 91 weitere Felder,
- zwölf Pentagonknoten mit fünf Nachbarn,
- 80 Hexagonknoten mit sechs Nachbarn,
- normalisierte Kugelpositionen als geometrische Referenz.

`targetStartConfiguration` legt vier feste Korridore mit je einem
Feld in Graphdistanz 1 und 2 fest. Zwei gegenüberliegende
HQ-Nachbarn bleiben neutral. `targetPlanetZones` klassifiziert die
Startfelder separat und ordnet alle übrigen Felder anhand vollständiger
Distanzringe den inneren, Explorations- und Fernzonen zu.
`assignStartCorridors` verteilt die vier Korridore seedbasiert und
reproduzierbar genau einmal auf vier Teilnehmer.

Agentennachbarschaft, Simulation und Harvesterpriorisierung verwenden
keine axialen Koordinaten mehr. Der normale Browser-Spielzustand
verwendet den 92-Felder-Graphen und die acht Ziel-Startfelder.

`planetProjection.ts` richtet die Kugel am HQ aus, rotiert die
normalisierten Positionen und projiziert sie orthografisch in den
SVG-Raum. Rückseitenfelder werden nicht interaktiv gerendert.
`HexMap.tsx` zeichnet daraus die echten Nachbarverbindungen, Hexagone
und Pentagone und verwaltet Touch-Drehung, Zoom sowie
HQ-Zentrierung. SVG-Muster und CSS-Intensitätsklassen bilden die
stärkste Ressourceneignung und deren Sternwert ab; Interaktionskonturen
werden getrennt von Gelände- und Statusflächen gezeichnet. Diese
Geometrie bleibt reine Darstellung und verändert keine Spielregel.
`createRadialGraphLayout` bleibt als
reproduzierbares flaches Hilfslayout verfügbar.

`createNaturalCrystalVeins` wählt vier voneinander entfernte
Hexagonkerne in der Fernzone und erweitert sie schrittweise zu
zusammenhängenden 5/4/3/2-Sterne-Adern. Die zusammengeführten Werte
werden über `targetCrystalRatings` in das Feldmodell übernommen. Die
Darstellung liest diese Werte erst für eigene Grundstücke aus; freie
und gegnerische Felder bleiben verdeckt.

`meteor.ts` kapselt den seedbasierten Einschlagsplan, die Auswahl
gültiger freier Hexagonzentren, den konservativen unregelmäßigen
Krater und die gedeckelte Addition der Kristallboni. `GameState`
speichert Seed, Plan und erfolgte Einschläge. `runRound` erzeugt einen
fälligen Einschlag erst nach der Grundstücksauswertung und gibt ihn
zusätzlich im `RoundReport` zurück. Dadurch bleiben Rundenprognosen
rein und wiederholbar.

`ProductionType` umfasst Kristalle als vierte Harvesterproduktion.
Spieler- und Rivalenproduktion lesen dafür
`getEffectiveCrystalRating`; natürliche Ader und bisherige
Meteorboni werden dadurch in Browserpartie und Simulation über
dieselbe Kernregel ausgewertet.

`interstellarCrystalBuyer.ts` berechnet aus Runde, Referenzkurs und
bereits übernommener Menge das sichtbare Kaufgebot und die verbleibende
Kapazität. `executeMarketTrade` behandelt
`interstellar-buyer` als eigene Gegenpartei, die nur Kristalle kauft
und weder HQ-Lager noch Lagerfluss verändert. Der Verbrauch wird im
`GameState` gespeichert und bei der Rundenabrechnung zurückgesetzt.
`MarketPanel` nimmt das begrenzte Gebot in die Bestpreisermittlung auf.
Die Headless-Markträumung führt dieselbe Gegenpartei separat vom
HQ-Lager und dessen Preisfluss. `initialCrystalStock` erlaubt
gezielte Analyseszenarien, ohne den normalen Spiel- oder
Simulationsstart zu verändern.

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

1. Folgeexpansion nach dem dritten Harvester bis zu den Fernzonen
   stabilisieren,
2. später optional eine grafische Polyederentfaltung ergänzen.

`GAME_ROUND_LIMIT` begrenzt Browserpartie und Simulation auf 20
vollständig abgerechnete Runden. `runRound` hält den Folgezustand nach
der letzten Abrechnung auf Runde 20; die Oberfläche kann daher keine
Runde 21 beginnen. `getRoundsUntilSupplyShip` liefert den sichtbaren
Countdown. Die Abschlussrangliste bewertet nach Bevölkerung,
Vermögen aus Credits plus Kristallkurs, übrigen Ressourcen ohne
Kristalle und Harvesterzahl.

`compareSimulationFinalScores` bildet dieselbe Reihenfolge in der
Headless-Simulation ab. Seriensimulationen bestimmen gemeinsame Sieger
und Ränge mit diesem Vergleich. Der weiterhin berechnete umfassendere
Ökonomiewert ist ausdrücklich nur eine Diagnosekennzahl.

Zufällige Verteilungen müssen Seeds unterstützen, damit Tests und
Simulationen reproduzierbar bleiben.

Details: [`PLANET_MAP.md`](PLANET_MAP.md).
<!-- ELUM-PLANET-ARCHITECTURE:END -->
