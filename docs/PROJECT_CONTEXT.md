---
project: E.L.U.M.
repository: https://github.com/AlexAtari/elum-game
live: https://alexatari.github.io/elum-game/
frontend_root: web
stack: React 19, TypeScript 6, Vite 8, Vitest 4
generated_from_branch: main
generated_from_commit: 34cf55a
generated_on: 2026-07-26
---

# E.L.U.M. – Projektkontext für neue Chats und KI-Assistenten

## Zweck

Dieses Dokument ist die **kompakte Übergabe**, wenn ein neuer
Chat, ein Coding-Agent oder ein neues Teammitglied ohne bisherigen
Gesprächsverlauf einsteigt. Es ersetzt nicht Code, Tests, GDD oder
Balancing, sondern zeigt, was zuerst gelesen und geprüft werden
muss.

## Startprotokoll

Vor jeder Aussage über den aktuellen Stand:

```bash
cd /Users/alex/VSCode/elum-game
git status --short
git log -5 --oneline
```

Danach lesen:

1. `docs/STATUS.md`
2. `docs/ARCHITECTURE.md`
3. relevante Tests
4. relevante Quelldateien
5. nur bei Regel- oder Designfragen GDD/Balancing

Niemals annehmen, dass eine in einem Chat erzeugte Patchdatei
bereits ausgeführt, committed oder deployed wurde.

## Projekt in einem Absatz

E.L.U.M. ist ein mobile-first entwickeltes, rundenbasiertes
Vier-Spieler-Strategiespiel auf dem Planeten Agima. Spieler
entwickeln Kolonien durch Grundstückserwerb, Harvester,
Ressourcenproduktion, Versorgung, Handel und Ereignisse.
Bevölkerung entscheidet primär über den Sieg. Die Browserpartie
und die Headless-Simulation verwenden dieselben Kernregeln,
dürfen aber nicht durch Demo- oder Analysezustände miteinander
vermischt werden.

## Nicht verhandelbare Leitlinien

- leicht zu lernen, schwer zu meistern
- faire Starts, Entscheidungskompetenz bestimmt den Erfolg
- mobile first
- wenige Regeln mit vielen Entscheidungen
- kurze, lesbare Spielphasen
- jede Ressource muss relevant bleiben
- keine unnötige Verwaltung
- Version 1 klein, vollständig und spielbar halten
- normale Browserpartie nicht für Simulationstests verbiegen

## Kernregeln

### Partie

- Browserpartie: 20 Runden, zunächst 35–45 Minuten,
  durch Playtests neu zu messen
- Wertung: Bevölkerung, Credits plus Kurswert verbliebener
  Kristalle, übrige Ressourcen ohne Kristalle, Harvester

### Ressourcen

- Nahrung
- Energie
- Erz
- Kristalle
- Credits
- Startlager jeder Kolonie: 10 Nahrung, 10 Energie, 5 Erz und eine
  mitgebrachte Kristallprobe; die zwei Startfelder bleiben
  kristallfrei

### Harvester

- ein Harvester pro Grundstück
- produziert genau eine Ressource, einschließlich Kristallen auf
  einem Vorkommen
- benötigt eine Energie je aktiver Runde
- neue Harvester kosten aktuell 30 Credits und 3 Erz
- Umrüstung: Übergangsrunde mit halber neuer Produktion
- Versetzung: Übergangsrunde ohne Produktion

### Grundstücke

- zwei Startfelder pro Kolonie
- weitere Felder müssen angrenzen
- bei mehreren Geboten immer grafische Auktion
- Startpreis = höchstes verdecktes Gebot
- alleiniger Höchstbietender startet in Führung
- bei gleichem Höchstgebot keine anfängliche Führung
- Gleichziehen übernimmt die Führung nicht

### Markt

- Reihenfolge: Nahrung, Energie, Erz, Kristalle
- jede Ressource höchstens einmal pro Runde
- Teilnahme freiwillig
- Käufer, Verkäufer oder keine Teilnahme
- direkte Koloniegeschäfte vor HQ-Lager
- eine Einheit je Transaktion
- HQ kauft ungünstiger und verkauft teurer
- nicht verkaufte Ressourcen bleiben im eigenen Lager

### Agenten

- Agima: Spieler beziehungsweise Headless-Agent
- Orion: ausgewogen
- Nova: Expansion
- Vega: Industrie
- Profile vorläufig eingefroren; Änderungen nur mit
  Seriensimulation bewerten

## Technische Landkarte

- `web/src/game.ts`: Kernzustand und zentrale Regeln
- `web/src/match.ts`: versionierte Teilnehmer- und
  Match-Konfiguration als Multiplayer-Grundlage
- `web/src/planetMap.ts`: Kartengraph, Graphdistanzen und getrennte
  Layoutpositionen; enthält Prototyp- und 92-Felder-Zielgraph
- `web/src/App.tsx`: sichtbarer Ablauf
- `web/src/components/`: UI
- `web/src/agents.ts`: gemeinsame Agentenlogik
- `web/src/orion*.ts`: Orion
- `web/src/rival*.ts`: gemeinsame Rivalenoperationen
- `web/src/simulation*.ts`: Analyse und Batchsimulation
- `web/src/i18n/`: Übersetzungen
- `docs/STATUS.md`: aktueller Stand
- `docs/GDD.md`: Zielregeln
- `docs/BALANCING.md`: Zahlen

## Arbeitsstil für Änderungen

Alex arbeitet auf dem Mac im Repository:

```bash
cd /Users/alex/VSCode/elum-game
```

Bevorzugter Patchstil:

- kleine, atomare Python-Installer
- Sicherung der geänderten Dateien unter `/tmp`
- genaue Trefferprüfung vor Ersetzungen
- Tests, Lint und Build
- automatischer Rollback bei Fehler
- danach explizite Git-Befehle

Keine fremden lokalen Änderungen überschreiben.

## Pflichtprüfung

```bash
cd /Users/alex/VSCode/elum-game/web
npm test
npm run lint
npm run build
```

Bei UI-Arbeiten zusätzlich auf echtem Smartphone testen.

## Aktuelle Schwerpunktlage

- Agentensiegquoten sind ausgeglichen.
- Direkter Handel ist im Vergleich zum HQ-Lager zu selten.
- Versorgungswarnungen treten zu häufig auf.
- Die mobile Rangliste wird auf feste Karten-Slots und ruhige
  Aufdeckung optimiert.
- Dokumentation wird als dauerhafte Übergabebasis ausgebaut.

## Antwortregeln für einen neuen Assistenten

1. Erst prüfen, nicht aus Erinnerung behaupten.
2. Implementierten Stand und Designziel trennen.
3. Bei Widerspruch Code und Tests als Implementierungsquelle
   verwenden und die Abweichung benennen.
4. Keine großen Refactorings ohne konkreten Nutzen.
5. Browserpartie und Simulation getrennt halten.
6. Nach Änderungen die relevante Dokumentation aktualisieren.
7. Bei längeren Aufgaben kurze Fortschrittsmeldungen geben.
8. Exakte Befehle immer mit Repository-`cd` ausgeben.

## Kopierbarer Startprompt für einen neuen Chat

```text
Wir arbeiten am Projekt E.L.U.M.:
https://github.com/AlexAtari/elum-game

Bitte behandle dich als Mitglied des Projektteams. Lies zuerst
AGENTS.md, docs/PROJECT_CONTEXT.md und docs/STATUS.md. Prüfe
danach den aktuellen Git-Status und die letzten Commits, bevor du
Aussagen über den Implementierungsstand machst.

Wichtig:
- normale Browserpartie und Headless-Simulation getrennt halten
- kleine atomare Änderungen mit Tests, Lint und Build
- keine lokalen Änderungen überschreiben
- bei UI-Arbeiten mobile Darstellung berücksichtigen
- Code/Tests sind die Quelle für implementiertes Verhalten
- GDD/BALANCING sind Ziel- und Regelbeschreibung

Aktuelle Aufgabe:
[HIER AUFGABE EINFÜGEN]
```

## Frischecheck

Dieses Dokument wurde aus Commit `34cf55a` erzeugt. Es kann nach
weiteren Commits veraltet sein. Darum immer Git und
`docs/STATUS.md` prüfen, bevor daraus konkrete Aussagen abgeleitet
werden.

<!-- ELUM-PLANET-CONTEXT:BEGIN -->
## Beschlossenes Zielbild vom 27.07.2026

### Implementierter Prototyp

- 20 vollständig abgerechnete Runden
- sichtbarer Countdown und Versorgungsschiff nach Runde 20
- Schlusswertung mit offiziellem Kristallreferenzkurs
- drehbare Kugelprojektion mit HQ und 91 Grundstücken
- Kartenregeln für Nachbarschaft und Distanz von Kugelprojektion und
  flachem Hilfslayout getrennt
- gemeinsame marsartige, fotorealistische Welttextur mit moderat
  differenzierten und räumlich geglätteten Ressourcenfarbnuancen;
  Polygonkonturen nur bei Interaktion oder notwendigem Spielstatus
- getrennte hochauflösende Geologiebasis und sparsamere
  Ressourcenfarbkarte für scharfen mobilen Nahzoom
- Überblendung von Mars- zu erdähnlicher Terraformingbasis über 20
  Runden; Nahrungseignung beschleunigt die rein visuelle Entwicklung
- lückenlose sphärische Dualzellen als unsichtbare
  Interaktionsflächen und kugelrichtige Rückprojektion der fest auf
  dem Planeten verankerten Oberflächentextur
- feste Sonnenbeleuchtung und atmosphärischer Rand; Feldnummern nur
  in Details und barrierefreien Namen, nicht auf der Kugeloberfläche
- mobile Kartenbreite mit schmaleren Seitenabständen und Nahzoom bis
  2,2-facher Ausgangsgröße
- 92-Felder-Zielgraph im Browserzustand und in der Darstellung aktiv
- getrennte Kartenbeschriftung der jeweils zwei Startfelder von
  Orion, Nova und Vega
- vier natürliche Kristalladern im Zielgraphen aktiv; Werte bleiben
  bis zum Grundstückserwerb verdeckt
- seedbasierte Meteore mit zwei garantierten und optional einem
  dritten konservativen Krater aktiv
- interstellarer Kristallkäufer mit begrenzter Rundenkapazität und
  gedämpftem Referenzkursgebot aktiv
- vier faire Startkorridore und vollständige Distanzzonen intern
  festgelegt; eine reproduzierbare seedbasierte Zuordnung ist an den
  Browser-Spielzustand angebunden
- versionierte, JSON-serialisierbare Match-Konfiguration mit vier
  gleichartigen Sitzen, konfigurierbaren menschlichen oder
  KI-Controllern und seedbasierten Startkorridoren
- kanonische, JSON-serialisierbare `GameState.colonies`-Map als
  einzige dynamische Zustandsquelle aller vier Teilnehmer; alte
  Agima-Wurzelfelder und der separate `rivals`-Record sind entfernt
- vollständiger Harvesterstand einschließlich freier Harvester und
  Zuweisungen teilnehmerbezogen im serialisierbaren `GameState`
- erste validierte, UI-unabhängige Kommandoschicht aktiv:
  teilnehmerbezogene Harvesterzuweisung, Produktionsänderung,
  Entfernung, Bauauftrag, Grundstücksgebot und Rücknahme sowie
  Marktstart, Rolle, Preisangebot, Transaktion und Marktabschluss;
  zusätzlich erwartungsgebundene Phasenwechsel beider
  Auktionsarten und Live-Gebotsbewegungen der Grundstücksauktion;
  React verwendet bereits denselben serialisierbaren Pfad wie
  spätere entfernte Eingaben
- Kommandos tragen Version, eindeutige ID, Teilnehmer und erwartete
  Runde; erfolgreiche IDs werden für höchstens-einmal-Ausführung im
  Spielzustand gespeichert
- teilnehmerbezogene Kristall-Exploration: Kauf in Runde N,
  verborgene Exploration in N+1, Offenlegung und Förderung ab N+2
- Infosheet meldet abgeschlossene Explorationen beim Eintritt in
  Runde N+2 mit Stationsname und Kristallwert; Ergebnisse öffnen
  antippbar das Grundstück und zentrieren es auf der Kugel
- Planungs-UI in Kolonieübersicht und HQ getrennt: Karte,
  Grundstücksdetails und kompakter Rangstatus außen; Märkte,
  Versorgung, Vorschau, Harvesterbau und Rundenabschluss im HQ
- 91 feste Londoner U-Bahn-Stationsnamen als sichtbare
  Grundstücksnamen; stabile Feld-IDs bleiben die interne
  Regelgrundlage
- gemeinsames HQ-Luftbild mit Zentralkuppel und vier angeschlossenen
  Kolonie-Lagern als Marker und Verwaltungsbild
- gemeinsame Nachbarschaftsprüfung für Spieler- und KI-Landaktionen
- teilnehmerbezogene Schreibgrenze für die dynamischen Grunddaten;
  Ereignisse, Spieler-Harvesterbau, direkter Koloniehandel und
  autonome Rivalen-Landkäufe verwenden sie bereits
- direkte Orion-Geschäfte werden wie Nova- und Vega-Geschäfte
  beidseitig in Credits und Ressourcen verbucht
- Grundstücksgebote, Reservierungen, Eröffnungsgebote und Führung
  der grafischen Auktion sind teilnehmerneutral gespeichert;
  Phase und laufende Gebote liegen ebenfalls kanonisch im
  `GameState`;
  Rundenabrechnung und Landgewinn beliebiger Bieter schreiben über
  die gemeinsame Koloniegrenze
- die bestehende grafische Auktionsansicht bleibt vorerst ein
  Agima-Orion-Adapter; zusätzliche Bieter benötigen nur noch eine
  erweiterte Darstellung, kein neues Kernzustandsmodell
- aktiver Ressourcenmarkt, Initiator, Rollen und Preisangebote
  sowie die aktuelle Phase liegen teilnehmerneutral im `GameState`;
  direkte Geschäfte,
  HQ-Lager und interstellarer Käufer verwenden dieselbe
  teilnehmerbezogene Kommando- und Prüfgrenze
- lokale Countdowns lösen validierte Phasenkommandos aus, statt
  selbst den Phasenzustand zu halten; sichtbare Bewegungen und
  KI-Auswahl bleiben Singleplayer-Adapter der grafischen Komponenten
- transportneutraler autoritativer Match-Serverkern bindet
  authentifizierte Sitzungen an menschliche Teilnehmer, verhindert
  Identitätsspoofing und verteilt revisionsnummerierte
  Zustands-Snapshots
- der Serverkern sperrt Phasenwechsel von Clients, plant
  Ressourcen- und Grundstücksauktionsfristen aus den gemeinsamen
  Zeitwerten und veröffentlicht das autoritative `deadlineAt`
- versioniertes, laufzeitvalidiertes Multiplayerprotokoll und
  transportneutrale Lobby für vier Koloniesitze implementiert:
  Hoststart nach Bereitschaft, KI-Füllung freier Sitze und
  revisionsnummerierte Lobby-Snapshots
- geheime Reconnect-Tokens erlauben die Wiederaufnahme desselben
  Sitzes mit einer neuen Verbindung; sie werden nicht an andere
  Lobbyteilnehmer verteilt
- Lobby-Konfiguration, Seed und Startkorridore werden gemeinsam in
  den initialen kanonischen Spielzustand übernommen
- serverseitige Rundenbarriere sammelt validierte Versorgungspläne
  aller menschlichen Sitze; Snapshots zeigen nur deren
  Bereitschaft, nicht die verdeckten Planwerte
- eine vierminütige autoritative Rundenfrist läuft in Match-
  Snapshots als gemeinsame Serverzeit, pausiert während Auktionen
  und reicht am Ende für fehlende oder getrennte Sitze einen
  konservativen, höchstens normalen Versorgungsplan ein
- bereite Teilnehmer sind gegen nachträgliche Spielkommandos
  gesperrt; Reconnects behalten ihre teilnehmerbezogene
  Rundenbereitschaft
- nach Bereitschaft aller Menschen führt der Server KI-Sitze und
  menschliche Koloniepläne in genau einer autoritativen
  Rundenabrechnung zusammen; offene Grundstücksauktionen werden
  vorher serverseitig beendet
- lokaler Node-WebSocket-Adapter verbindet echte JSON-Sockets mit
  Lobby und Matchkern, begrenzt Payloads und bietet einen
  Health-Endpunkt; Zwei-Client-Start, Disconnect und Reconnect sind
  als Integrationstest abgedeckt
- eine dynamische Server-Registry erzeugt unterschiedliche
  Lobbycodes bei der ersten Verbindung und isoliert deren Sitze,
  Reconnect-Tokens, Matchzustände und Timer; der konfigurierte
  Standardcode ist nur noch die vorgeschlagene Startadresse
- Startskript bindet sicher standardmäßig nur an Loopback und kann
  für Smartphone-Tests explizit im lokalen WLAN freigegeben werden
- React-Startseite bietet getrennte Einzel- und Mehrspielerpfade;
  die responsive Lobby verbindet sich mit einem editierbaren
  WebSocket-Ziel und zeigt alle vier Koloniesitze
- Name, Sitzvergabe, Bereitschaft, Hoststart, KI-Füllung,
  Verbindungsstatus und Wiederaufnahme per lokal gespeichertem
  Reconnect-Token sind über die sichtbare Oberfläche bedienbar
- nach dem Matchstart wechselt jeder menschliche Sitz in eine
  teilnehmerbezogene Spielansicht; Karte, HQ, Harvester,
  Grundstücksgebote, Ressourcenmärkte und Rundenplanung werden aus
  autoritativen Snapshots gespeist und als Netzwerkkommandos gesendet
- nach jeder gemeinsamen Abrechnung erhält jeder menschliche Sitz
  ausschließlich seinen eigenen Rundenbericht mit Produktion,
  Versorgung, Bevölkerung, Grundstücksausgang, neuen Harvestern und
  abgeschlossenen Explorationen; das Briefing kann direkt zum
  erkundeten Feld auf der Karte springen
- globale Ereignisse werden beim serverseitigen Übergang in die neue
  Runde reproduzierbar aus Match-Seed und Rundennummer gewählt,
  einmalig für alle Kolonien aktiviert und im gemeinsamen Briefing
  angekündigt
- die Multiplayeransicht leitet die offizielle Rangliste für jeden
  menschlichen Sitz aus dem autoritativen Zustand ab: Platzierung in
  der kompakten Statuszeile, vollständige Übersicht im HQ und
  gemeinsamer Zwischenstand vor dem privaten Rundenbriefing
- lokale Ereignisse werden pro menschlichem Sitz reproduzierbar aus
  Match-Seed, Runde und Teilnehmer gewählt, nach zwei bis sechs
  Sekunden außerhalb laufender Auktionen serverseitig angewendet und
  nur dem betroffenen Client als Ereignis-ID zugestellt
- die 20. Abrechnung setzt im autoritativen Snapshot ein endgültiges
  Matchende; danach lehnt der Server weitere Kommandos und
  Versorgungspläne ab
- nur der Host kann die verbundenen Menschen nach dem Partieende in
  dieselbe wartende Lobby zurückführen; Sitze und Reconnect-Tokens
  bleiben erhalten, alle Bereitschaften werden zurückgesetzt
- Rivalenabrechnung bleibt für Headless-Läufe eine getrennte
  Record-Funktion; der Browser übernimmt sie über einen Adapter
- nächster Strukturschritt: vollständig verlassene dynamische
  Lobbys nach einer Schonfrist aufräumen, danach Einladungslinks
  ergänzen und Backend-Hosting, TLS sowie Origin-Policy für
  öffentlichen Mehrspielerbetrieb festlegen

### Nächster Regelstand

- 92 Kartenfelder: ein HQ und 91 Grundstücke
- zwölf Pentagone und 80 Hexagone
- vier radiale Startkorridore mit je zwei kristallfreien Feldern
- Kartenlogik über Nachbarlisten und Graphdistanzen
- vier natürliche Kristalladern
- interstellarer Käufer im Kristallmarkt
- regelmäßige Hochsicherheits-Kristalltransporter
- zwei garantierte und möglicherweise drei Meteoriten
- orthografische Browserkugel mit Touch-Drehung, Zoom und
  HQ-Zentrierung

### Arbeitsreihenfolge

1. Dokumentation
2. Folgeexpansion nach dem dritten Harvester bis zu den Fernzonen
   stabilisieren
3. Hochsicherheits-Kristalltransporter
4. später optional eine alternative grafische Polyederentfaltung

Die 20-Runden-Seriensimulation wertet inzwischen nach derselben
Reihenfolge wie die Browserpartie. Der Referenzlauf mit 200 Partien
liegt zwischen 15,0 % und 36,0 % Siegen. Die gemeinsame erste
Expansion baut bei sicherer Folgerunde von zwei auf drei Harvester und
schützt nach Bau beziehungsweise Mindestgebot 20 Credits. Im Mittel
enden die Kolonien mit 2,9 bis 3,1 Harvestern und 2,9 bis 3,0
Grundstücken.

Kristalle sind inzwischen eine gemeinsame vierte
Harvesterproduktion; Meteore und der interstellare Käufer laufen auch
in der Headless-Simulation. Jede Kolonie startet mit einer
Kristallprobe. Der 200-Partien-Lauf erzeugt 2,4 Meteore und
1,0 interstellare Käufertransaktion je Partie. Natürliche
Fernzonenadern werden noch nicht zuverlässig erreicht.

Verbindliche Details: `docs/PLANET_MAP.md`.
<!-- ELUM-PLANET-CONTEXT:END -->
