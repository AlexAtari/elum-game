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
- Harvesterbau beauftragen,
- verdecktes Grundstücksgebot abgeben,
- eigenes Grundstücksgebot zurücknehmen,
- Ressourcenmarkt starten und abschließen,
- Marktrolle und aktives Preisangebot setzen,
- einzelne Markttransaktion ausführen,
- Ressourcenmarktphase erwartungsgebunden fortschalten,
- Grundstücksauktionsphase erwartungsgebunden fortschalten,
- laufendes Gebot einer Grundstücksauktion erhöhen oder senken.

Die zugrunde liegenden Operationen in `game.ts` akzeptieren einen
beliebigen `ParticipantId`. Agima-Wrapper bleiben für bestehende
Headless-Aufrufer kompatibel. `App.tsx` erzeugt für sichtbare
Spielereingaben nur noch die entsprechenden Kommandos. Ob ein
Kommando lokal oder über das Netzwerk eintrifft, verändert seine
Validierung und Ausführung nicht.

Die Identität eines Netzwerkclients darf später nicht aus dem
Kommando selbst vertraut werden. Ein Server-/Transportadapter muss
den authentifizierten Sitz mit `participantId` abgleichen, bevor er
das Kommando an diese Schicht übergibt.

### Autoritativer Match-Serverkern

`authoritativeMatch.ts` kapselt einen laufenden `GameState` hinter
einer transportneutralen Servergrenze. Ein vorgeschalteter Transport
authentifiziert eine Verbindung und übergibt anschließend eine
`AuthenticatedSeat`-Bindung aus undurchsichtiger `sessionId` und
`ParticipantId`. Der Kern akzeptiert nur menschlich konfigurierte
Sitze, verhindert gleichzeitige Doppelbelegung und vergleicht bei
jedem Kommando die gebundene Identität mit dessen `participantId`.
Der Kommandoinhalt selbst gilt damit nicht als Identitätsnachweis.

Erfolgreiche Kommandos erhöhen eine monotone Snapshot-Revision.
Abonnenten erhalten vollständige, strukturierte Kopien aus
`GameState`, Revision, endgültigem Matchstatus und optionaler
autoritativer Phasenfrist.
Fehlerhafte, fremde oder nicht authentifizierte Kommandos verändern
weder Zustand noch Revision und werden nicht verteilt. Fehler eines
einzelnen Abonnenten können die Zustandsmaschine nicht unterbrechen.

Die Phasenkommandos beider Auktionsarten sind für Client-Sitzungen
gesperrt. Der Serverkern ermittelt stattdessen aus der kanonischen
Phase und den gemeinsamen Zeitwerten eine Frist, hält sie bei
wirtschaftlichen Kommandos innerhalb derselben Phase stabil und
führt bei Ablauf selbst ein normal validiertes Kommando aus. Jeder
Snapshot enthält dafür ein absolutes `deadlineAt`; ein Client kann
daraus seinen Countdown darstellen, ohne selbst Autorität über den
Phasenwechsel zu besitzen.

Die Rundenbarriere liegt ebenfalls im Serverkern. Jeder menschliche
Sitz übermittelt einen validierten Versorgungsplan; seine kanonischen
Harvesterzuweisungen werden direkt aus dem `GameState` gelesen. Ein
bereiter Sitz kann bis zur Abrechnung keine weiteren Spielkommandos
mehr ausführen. Snapshots veröffentlichen nur die IDs der bereiten
Teilnehmer, nicht deren verdeckte Versorgungswerte. Sobald alle
Menschen bereit sind, werden KI-Sitze serverseitig berücksichtigt und
genau eine gemeinsame Rundenabrechnung ausgeführt. Eine noch offene
grafische Grundstücksauktion bleibt dabei eine echte Barriere: Der
Server startet und beendet zunächst ihre kanonischen Phasen und
rechnet die Runde erst nach der Auflösung ab.

Nach der 20. Abrechnung setzt der Matchkern `finished` dauerhaft auf
`true`. Weitere `GameCommand`s und Versorgungspläne werden danach an
derselben autoritativen Grenze mit `match-finished` abgewiesen; die
sichtbare Abschlussrangliste ist daher nicht die einzige Sperre.

`multiplayerRound.ts` adaptiert die vorhandene Rundenökonomie für
beliebige menschliche Koloniesitze. Damit dieselben Produktions-,
Versorgungs-, Umrüstungs- und Ereignisregeln gelten, wird die
bestehende Abrechnung wiederverwendet; nur die lokalen Agima-Ereignisse
bleiben wie im Regelmodell auf Agima beschränkt. Die gemeinsame
Rundenmetadaten-, KI-, Grundstücks- und Meteorabrechnung läuft genau
einmal.

`server/websocketGameServer.ts` bildet die konkrete, weiterhin dünne
lokale Leitung. Ein Node-HTTP-Server stellt `/health` bereit und
übergibt ausschließlich Upgrades auf
`/multiplayer?lobby=<Lobby-ID>` an `ws`. Jede Verbindung erhält eine
zufällige interne Verbindungs-ID; Textnachrichten werden als JSON an
die Lobby weitergereicht, Lobbyantworten an genau den zugehörigen
Socket serialisiert. Binärnachrichten, falsche Pfade und zu große
Payloads werden abgewiesen. Disconnects werden der Lobby gemeldet,
damit deren Reconnect-Modell unverändert greift.

Der Adapter enthält keine Spielregeln und keinen eigenen Lobby- oder
Matchzustand. Standardmäßig bindet das Startskript nur an
`127.0.0.1`; für Smartphone-Tests im lokalen WLAN kann es explizit an
`0.0.0.0` gebunden werden. Die bestehende lokale React-Partie
verwendet weiterhin direkt die Kommandoschicht.

### Multiplayer-Protokoll und Lobby

`multiplayerProtocol.ts` definiert die JSON-serialisierbaren
Nachrichten beider Richtungen und normalisiert Clientdaten aus
`unknown`. Das Protokoll Version 1 umfasst Lobbybeitritt,
Sitzungswiederaufnahme, Bereitschaft, Matchstart, Matchneustart,
eingebettete `GameCommand`s und Versorgungspläne für die
Rundenbarriere. Sichtbare
Lobby-Snapshots enthalten ausschließlich
öffentliche Sitzdaten; Reconnect-Tokens erscheinen nur in der
gezielten Bestätigung an genau eine Verbindung.

`multiplayerLobby.ts` verwaltet vier feste Koloniesitze oberhalb des
autoritativen Matchkerns. Der erste Beitritt erhält Agima und die
Hostrolle, weitere Menschen werden deterministisch auf die noch
freien Sitze verteilt. Starten darf nur der verbundene Host, nachdem
alle menschlichen Sitze bereit und verbunden sind. Nicht belegte
Sitze werden beim Start mit den bestehenden Profilen `balanced`,
`expansion` und `industry` als KI konfiguriert.

Die Lobby erzeugt aus Seed, Controllern und den zugehörigen
Startkorridoren einen gemeinsamen initialen `GameState` und bindet
alle menschlichen Verbindungen an den `AuthoritativeMatch`. Nach
einem Transportabbruch bleibt der Sitz reserviert. Ein geheimes,
undurchsichtiges Reconnect-Token kann ihn an eine neue
Verbindungs-ID binden und liefert sofort den aktuellen Lobby- und
Match-Snapshot. Transportfehler werden isoliert, damit ein
geschlossener Socket keine Zustandsoperation unterbricht.

Nach einem beendeten Match darf ausschließlich der Host
`restart-match` senden. Die Lobby löst ihr Matchabonnement, verwirft
den abgeschlossenen Matchkern und wechselt mit denselben menschlichen
Sitzen und Reconnect-Tokens zurück nach `waiting`; lediglich alle
Bereitschaften werden zurückgesetzt. Der wartende Lobby-Snapshot
entfernt in jedem Browser den alten Match-Snapshot, sodass alle
verbundenen Spieler gemeinsam in der Lobby landen.

Der lokale WebSocket-Adapter ist durch einen echten
Zwei-Client-Integrationstest einschließlich Matchstart, Disconnect
und Reconnect abgesichert. Token-Erzeugung und Sitzbindung verbleiben
auf der Serverseite. GitHub Pages kann weiterhin nur das Frontend
hosten, aber nicht diesen dauerhaft laufenden Dienst. Für öffentlichen
Betrieb fehlen deshalb noch Backend-Hosting, TLS mit `wss://`,
Origin-Policy sowie betriebliche Überwachung.

Die lokale React-Partie koordiniert ihre Runde weiterhin in
`App.tsx`; der Mehrspieler-Client verwendet stattdessen
`submit-round-plan` und übernimmt ausschließlich Server-Snapshots.
Lobby und Spielansicht verwenden damit denselben vorhandenen
Transport, ohne lokale Kopien des kanonischen Spielzustands
fortzuschreiben.

`MultiplayerLobbyScreen.tsx` bildet inzwischen den ersten
Browserclient dieses Protokolls. Die Startseite trennt Einzel- und
Mehrspielerpfad. Der Mehrspielerpfad leitet im lokalen Netz den
WebSocket-Host aus dem aktuellen Seitenhost ab, lässt Server und
Lobby-ID editieren und sendet Beitritt, Bereitschaft und Hoststart
über die typisierten Protokollnachrichten. Lobby-Snapshots erzeugen
die Vier-Sitz-Ansicht; Reconnect-Token werden nur lokal für die
automatische Wiederaufnahme desselben Sitzes gespeichert.

Nach dem Matchstart wechselt der Client in
`MultiplayerGameScreen.tsx`. Die Komponente leitet Kolonie,
Besitzfelder, Harvester und Versorgung aus der zugewiesenen
`ParticipantId` und dem aktuellen Match-Snapshot ab. Bauen,
Umrüsten, Versetzen, Grundstücksgebote und Marktaktionen werden als
`game-command`, der Rundenabschluss als `submit-round-plan` gesendet.
Die vereinfachten Mehrspielerpanels zeigen die kanonischen
servergesteuerten Markt- und Auktionsphasen; die aufwendigen
Singleplayeranimationen bleiben davon getrennte Darstellungsadapter.

Nach einer gemeinsamen Rundenabrechnung bewahrt
`AuthoritativeMatch` die von `runMultiplayerRound` erzeugten
teilnehmerbezogenen `RoundReport`s bis zur nächsten Abrechnung auf.
`getSnapshot(participantId)` fügt ausschließlich den Bericht dieses
Sitzes ein; der unpersonalisierte Snapshot enthält keinen Bericht.
Die Lobby versendet deshalb nach jeder Revision getrennte
Match-Snapshots an die verbundenen Menschen. So zeigt
`RoundBriefingPanel` im Mehrspielerpfad Produktion, Versorgung,
Bevölkerungsänderung, Grundstücksausgang, Harvester und
Explorationen, ohne fremde Rundendaten über den Transport
offenzulegen.

Bevor der Snapshot der neuen Runde veröffentlicht wird, wählt der
Server das globale Ereignis deterministisch aus Match-Seed und
Rundennummer aus und aktiviert es über dieselbe
`activateGlobalEvent`-Kernoperation wie der Einzelspieler. Sofortige
Credit- und Kristalländerungen werden dadurch einmalig auf alle vier
Kolonien angewendet; Produktionsmodifikatoren, Kostenänderungen und
Aktionssperren bleiben als `activeGlobalEvent` für die bevorstehende
Runde im kanonischen Zustand. Das Briefing zeigt dieses neue
Ereignis, während der private `RoundReport` weiterhin die
Wirtschaftsdaten der gerade abgeschlossenen Runde beschreibt.

`createParticipantLeaderboardEntries` leitet dieselbe offizielle
Sortierung für einen beliebigen menschlichen Sitz ab und markiert nur
diesen Eintrag als eigene Kolonie. Die Multiplayeransicht zeigt nach
jeder Abrechnung zunächst den gemeinsamen Zwischenstand und danach
das private Briefing. Außerhalb dieses Übergangs bleibt die aktuelle
Platzierung kompakt in der Statuszeile; im HQ steht die vollständige
Rangliste ohne zusätzlichen Serverzustand bereit, da alle Werte aus
dem autoritativen `GameState` abgeleitet werden.

Lokale Multiplayer-Ereignisse werden ebenfalls reproduzierbar aus
Match-Seed, Runde und `ParticipantId` gewählt. Der Server plant für
jeden menschlichen Sitz eine getrennte Verzögerung zwischen zwei und
sechs Sekunden; während einer Ressourcen- oder Grundstücksauktion
wird die Aktivierung in kurzen Abständen aufgeschoben. Die
Kernoperation `applyColonyLocalEvent` verändert ausschließlich die
betroffene Kolonie und speichert Sperren in der
teilnehmerbezogenen `activeLocalEvents`-Map. Der bisherige
`activeLocalEvent`-Wert bleibt als Agima-Kompatibilitätsansicht für
den Einzelspieler erhalten.

Beim Erzeugen eines personalisierten Snapshots entfernt der Server
alle fremden lokalen Ereignis-IDs aus dem `GameState`. Ein Sitz
erhält nur seinen eigenen Map-Eintrag; ein unpersonalisierter
Snapshot enthält keinen lokalen Ereigniseintrag. Die sichtbare
`LocalEventNotice` darf nach sechs Sekunden geschlossen werden,
während die kanonische Wirkung beziehungsweise Sperre bis zur
Rundenabrechnung erhalten bleibt.

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
kanonische Map.

Das Grundstücksauktionsmodell speichert verdeckte Gebote,
Creditreservierungen, Eröffnungsgebote und Führung als
`ParticipantId`-Maps beziehungsweise Teilnehmer-ID. Die
Kernoperationen für Gebot, Rücknahme, Beginn und Auflösung sind damit
mehrbieterfähig. `App.tsx` sendet das lokale Gebot und seine
Rücknahme als Kommando; Orions KI-Entscheidung wird danach als
Singleplayer-Adapter über dieselbe teilnehmerbezogene Kernoperation
ergänzt. Die aktuelle grafische Komponente stellt weiterhin nur
Agima und Orion dar. Eine Mehrspieleroberfläche muss zusätzliche
Bieter sichtbar machen, ohne das Zustandsmodell erneut zu ändern.

Während der grafischen Auktion liegen auch `phase`, `liveBids` und
der aktuelle Führende im `GameState`. `announcement → auction →
finished` wird durch Kommandos mit erwarteter Ausgangsphase
fortgeschaltet. Veraltete oder doppelte Übergänge verändern den
Zustand nicht. Auch die sichtbaren Gebotsbewegungen von Agima und
Orion verwenden dieselbe Kommandooperation.

`GameState.activeResourceMarket` hält Ressource, Runde, Initiator,
Phase, Rollen und aktive Preisangebote nach `ParticipantId`.
`announcement → declaration → auction → finished` wird durch den
Initiator und mit Prüfung der erwarteten Ausgangsphase
fortgeschaltet. Eine neutrale Initiatorrolle beendet den Markt nach
der Erklärung direkt. Marktstart,
Rollenerklärung, Preisangebot, Transaktion und Abschluss laufen über
dieselbe Kommandoschicht. Lager- und interstellarer Handel verwenden
denselben Teilnehmerparameter wie direkte Koloniegeschäfte. Vor
einer Transaktion prüft der Kern passende Käufer-/Verkäuferrollen,
aktive Angebote, Preisberührung, Credits, Bestand und
Lagerverfügbarkeit. Nur der Initiator darf den aktiven Markt
abschließen.

Die grafische Marktkomponente bleibt ein Singleplayer-Adapter: Sie
berechnet Countdown, sichtbare Bewegungen und die Auswahl des aktiven
KI-Gegenübers lokal, spiegelt aber jede wirtschaftlich relevante
Rolle, Preisposition und abgelaufene Phase über Kommandos in den
kanonischen Zustand. Für echten Mehrspielerbetrieb übernimmt ein
Serveradapter die Zeitplanung und verteilt die resultierenden
Zustände; das bereits vorhandene Phasenmodell bleibt dabei
unverändert. Danach kann der verbleibende Kernzufall reproduzierbar
über den Match-Seed laufen.

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
Führenden oberhalb des gemeinsamen Preises. Gebote und reservierte
Credits sind teilnehmerbezogen; beim Auktionsbeginn werden alle
verdeckten Reservierungen erstattet und nur das abschließende
Siegergebot erneut belastet. Ein einzelnes Gebot gewinnt bei der
Rundenabrechnung automatisch.

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
