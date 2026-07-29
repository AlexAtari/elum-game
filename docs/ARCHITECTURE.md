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

### 5. Match-Konfiguration

`match.ts` beschreibt eine Partie unabhängig von React und Netzwerk:

- vier stabile Teilnehmer-IDs,
- je Teilnehmer eine menschliche lokale, menschliche entfernte oder
  KI-Steuerung,
- die Strategieprofile der KI-Sitze,
- eine versionierte, vollständig JSON-serialisierbare Konfiguration,
- seedbasierte Startkorridore mit genau zwei Feldern je Teilnehmer.

`GameState.match` führt diese Konfiguration im Browserzustand mit.
`GameState.colonies` ist die einzige gespeicherte Quelle für die
dynamischen Daten aller vier Sitze. Bevölkerung, Credits, Ressourcen,
Harvester, Bauaufträge, Grundstücke und Harvesterzuweisungen liegen
dort teilnehmerbezogen. Frühere Agima-Felder auf der Wurzel,
`opponentTileIds` und der separate `rivals`-Record wurden entfernt.
Gegnerischer Besitz wird bei Bedarf aus der Kolonie-Map abgeleitet.

`ColonyEconomyState` definiert die gemeinsamen Wirtschaftsfelder.
`selectColonies`, `selectLocalColony` und `selectRivalColonies`
stellen gezielte Leseansichten auf der kanonischen Map bereit.
Statusanzeige, Karte, Markt und Rangliste lesen damit ohne
Zustandskopien.

### Validierte Spielkommandos

`gameCommands.ts` bildet die erste UI- und transport-unabhängige
Schreibgrenze für Spielerentscheidungen. Ein `GameCommand` enthält:

- Protokollversion `1`,
- eine bis 128 Zeichen lange `commandId`,
- den handelnden `participantId`,
- die vom Absender erwartete Runde,
- einen diskriminierten Aktionstyp mit geprüftem Payload.

`parseGameCommand` nimmt ausdrücklich `unknown` entgegen und erzeugt
aus zulässigen Eingaben ein normalisiertes, serialisierbares
Kommando. Fremde Objektfelder werden nicht in das normalisierte
Kommando übernommen. `executeGameCommand` lehnt fehlerhafte,
veraltete, doppelte oder nach den Kernregeln illegale Aktionen mit
einem stabilen Fehlercode ab. Nur erfolgreiche Kommandos erzeugen
einen neuen `GameState`; ihre IDs werden in
`processedCommandIds` gespeichert. Die Liste ist auf die letzten 512
Erfolge begrenzt.

Die erste geschlossene Kommandogruppe umfasst:

- Harvester aus dem freien Pool einsetzen,
- Harvesterproduktion ändern,
- Harvester vom Grundstück entfernen,
- Harvesterbau beauftragen.

Die zugrunde liegenden Operationen in `game.ts` akzeptieren einen
beliebigen `ParticipantId`. Agima-Wrapper bleiben für bestehende
Headless-Aufrufer kompatibel. `App.tsx` erzeugt für sichtbare
Spielereingaben nur noch die vier entsprechenden Kommandos. Ob ein
Kommando lokal oder über das Netzwerk eintrifft, verändert seine
Validierung und Ausführung nicht.

Die Identität eines Netzwerkclients darf später nicht aus dem
Kommando selbst vertraut werden. Ein Server-/Transportadapter muss
den authentifizierten Sitz mit `participantId` abgleichen, bevor er
das Kommando an diese Schicht übergibt.

Die Harvester-Gesamtzahl, freie Spieler-Harvester und deren
Feldzuweisungen gehören jetzt zum `GameState`. Einsetzen, Umrüsten und
Entfernen laufen über reine Funktionen in `game.ts`; React hält davon
keine eigene Kopie mehr. Dadurch enthält ein serialisierter
Browserzustand erstmals den vollständigen Harvesterstand von Agima.

`updateColony` bildet inzwischen die zentrale Schreibgrenze für die
dynamischen Grunddaten eines beliebigen Teilnehmers. Der Aufrufer
arbeitet immer mit demselben `ColonyState`; die Funktion ersetzt
atomar genau den betreffenden Eintrag in `GameState.colonies`.

Jeder Kolonieeintrag speichert außerdem je Grundstück die Runde, ab
der dessen Kristallwert als entdeckt gilt.
`isColonyCrystalDiscovered` bildet daraus die gemeinsame
Informations- und Produktionsgrenze für UI, Kernabrechnung und
Agenten. Gegnerischer Besitz bleibt abgeleitet;
`isColonyLandTargetAdjacent` zentralisiert die Graphprüfung für
menschliche und autonome Grundstücksaktionen.

Darauf bauen `addColonyOwnedTile` und `executeColonyTrade` auf.
Letztere überträgt Credits und genau eine Ressourceneinheit atomar
zwischen zwei beliebigen Teilnehmersitzen. Auch Orion verwendet im
Browsermarkt nun diesen beidseitigen Transaktionspfad. Globale und
lokale Ereignisse, der Spieler-Harvesterbau sowie autonome
Rivalen-Landkäufe schreiben ebenfalls über `updateColony`.

`runRound` schreibt inzwischen auch Agimas Versorgung, Produktion,
Bevölkerung, Harvesterfertigstellung und Grundstücksgewinn über
`updateColony`. Orion erhält einen in der grafischen Auktion
gewonnenen Besitz über denselben Pfad.

`advanceRivalColonies` bleibt als reine Record-Operation für die
Headless-Simulation bestehen. `advanceRivalColoniesInGame` übernimmt
ihr Ergebnis im Browser teilnehmerbezogen und bewahrt anschließend
die zusätzlichen Diagnosefelder der KI. Browserpartie und Simulation
verwenden damit weiterhin dieselben Rivalenregeln, ohne ihre
Zustandscontainer zu vermischen.

Browser- und Simulationsadapter greifen auf gespeicherten
Browserzustand nur noch über `colonies` oder die Selektoren zu. Die
Headless-Simulation behält ihren eigenen internen Agima-Agentenstand,
spiegelt ihn an ihrer Browserzustandsgrenze jedoch ebenfalls in die
kanonische Map. Das aktuelle Modell der grafischen Auktion bleibt bis
zu seiner späteren Mehrbieter-Erweiterung noch auf Agima und Orion
zugeschnitten.

Grundstücks- und Ressourcenauktionen sind noch nicht Teil dieser
Schicht: Ihr aktuelles Zustandsmodell ist weiterhin auf Agima und
Orion zugeschnitten. Zuerst werden Gebote, Marktrollen und
Auktionszustände teilnehmerneutral modelliert; anschließend können
auch sie denselben Kommandopfad verwenden. Danach kann der
verbleibende Kernzufall reproduzierbar über den Match-Seed laufen.

Eine spätere Lobby konfiguriert nur die Controller der vier Sitze.
Nicht menschlich belegte Sitze können mit den vorhandenen KI-Profilen
gefüllt werden. Netzwerkverbindungen und geheime Informationen
gehören nicht in diese öffentliche Match-Konfiguration.

### 6. Rivalenoperationen

`rival*.ts` führt gemeinsame autonome Vorgänge aus, zum Beispiel:

- Grundstückserwerb,
- Harvesterbetrieb,
- Investitionen,
- Marktteilnahme.

Orion-spezifische Dateien bleiben dort sinnvoll, wo seine
Strategie bewusst eigenständig ist.

### 7. Simulation

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

`planetProjection.ts` richtet die Kugel am HQ aus, erzeugt aus
gemeinsamen Dreiecksflächen lückenlose sphärische Dualzellen, rotiert
die normalisierten Positionen und projiziert sie orthografisch in den
SVG-Raum. Zellen am Horizont werden gegen die Vorderseite der Kugel
geschnitten; Rückseitenfelder werden nicht interaktiv gerendert.
`HexMap.tsx` zeichnet daraus unsichtbare, zusammenhängende Hexagon-
und Pentagonzellen und verwaltet Touch-Drehung, Zoom sowie
HQ-Zentrierung. `PlanetSurface.tsx` bereitet aus einer gemeinsamen
marsartigen, fotorealistischen Welttextur und moderat
differenzierten, räumlich geglätteten Ressourcenfarbnuancen eine
diffuse Oberflächenkarte vor. `planetSurfaceTint.ts` hält die reine
Farbzuordnung für Nahrung, Energie und Erz getrennt von Canvas und
React testbar. Der aktuelle Rundenwert steuert sowohl die
Ressourcennuance als auch die Überblendung zwischen Mars- und
Terraformingbasis; die Spiellogik bleibt davon unberührt.

Die geologische Basisebene wird für den Nahzoom mit 1024 × 512
Pixeln abgetastet. Die rechenintensive Ressourcenfarbkarte bleibt
getrennt bei 512 × 256 Pixeln und wird erst beim Rendern mit der
Basisebene multipliziert.

Die geglättete Ressourcenkarte speichert zusätzlich im Alphakanal
den lokalen Terraforminganteil. Dieser beginnt in Runde 1 bei null
und steigt bis Runde 20. Eine Grundentwicklung erreicht alle
Regionen; Nahrungseignung erhöht den lokalen Anteil. Mars- und
Terraformingbasis verwenden dieselben Weltkoordinaten und werden vor
der Ressourcentönung pro sichtbarem Pixel gemischt.
`unprojectPlanetViewPosition` ordnet jeden sichtbaren Canvas-Pixel
bei jeder Kameradrehung wieder einer festen Weltkoordinate zu. So
dreht sich eine durchgehende Textur ohne Feldnähte mit der Kugel,
während SVG-Zellen ausschließlich Interaktion, Auswahl und
Statusmarkierungen tragen. Diese Geometrie bleibt reine Darstellung
und verändert keine Spielregel.
Rivalenbesitz wird in `HexMap.tsx` aus den getrennten
`ownedTileIds` von Orion, Nova und Vega gelesen.
`createRadialGraphLayout` bleibt als
reproduzierbares flaches Hilfslayout verfügbar.

Eine gemeinsame SVG-Lichtmaske über der Canvas-Oberfläche verwendet absolute
Kugelansichtskoordinaten und bleibt deshalb beim Drehen im
Ansichtsraum fest. Sichtbare Feldnummern werden nicht gerendert.
`planetMap.ts` ordnet den 91 stabilen Grundstücks-IDs ebenso viele
eindeutige Londoner Stationsnamen zu. `getPlanetTileName` bildet die
gemeinsame Anzeigegrenze für Karte, Auktionen, Infosheet und
Meteorberichte; Regeln und serialisierte Zustände verwenden weiterhin
die IDs.

`App.tsx` hält die reine Planungsnavigation als lokalen Zustand
`colony | headquarters`. Die Kolonieansicht rendert Kugel und
Grundstücksdetails, während das HQ Marktstarter, Versorgungsplanung,
Rundenvorschau, Harvesterbau und Rundenabschluss enthält. Die
gemeinsamen Spieldaten bleiben davon unberührt. `RoundReport`
transportiert abgeschlossene Explorationen mit Feld-ID und
effektivem Kristallwert; `RoundBriefingPanel` löst erst bei der
Anzeige den Stationsnamen auf. Ein Ergebnis-Button übergibt die
Feld-ID zurück an `App.tsx`; beim erneuten Mounten erhält `HexMap`
diese als `focusTileId`. `createRotationForTile` berechnet aus den
Kugelkoordinaten die Rotation, die das Feld in die Ansichtsmitte
dreht.

`hq-four-colonies.webp` ist das gemeinsame HQ-Motiv für Marker und
Verwaltungsansicht. Die SVG-Karte schneidet dieselbe Bilddatei auf
einen runden, kontrastumrandeten Marker zu; die HQ-Ansicht zeigt das
vollständige quadratische Luftbild mit erklärender Bildunterschrift.

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
