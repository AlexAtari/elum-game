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

- Browserprototyp: 15 Runden, ungefähr 20–30 Minuten
- beschlossenes Ziel: 20 Runden, zunächst 35–45 Minuten,
  durch Playtests neu zu messen
- aktuelle Wertung: Bevölkerung, Credits, Ressourcen, Harvester
- Zielwertung: Bevölkerung, Credits plus Kurswert verbliebener
  Kristalle, übrige Ressourcen ohne Kristalle, Harvester

### Ressourcen

- Nahrung
- Energie
- Erz
- Kristalle
- Credits

### Harvester

- ein Harvester pro Grundstück
- produziert genau eine Ressource
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

- 15 Runden
- flache Hexkarte mit HQ und 60 Grundstücken
- Kartenregeln für Nachbarschaft und Distanz bereits vom flachen
  Layout getrennt
- 92-Felder-Zielgraph intern vorhanden und validiert, aber noch nicht
  an Browserzustand oder Darstellung angeschlossen

### Nächster Regelstand

- 20 vollständig abgerechnete Runden
- sichtbarer Countdown bis zum Versorgungsschiff
- 92 Kartenfelder: ein HQ und 91 Grundstücke
- zwölf Pentagone und 80 Hexagone
- vier radiale Startkorridore mit je zwei kristallfreien Feldern
- Kartenlogik über Nachbarlisten und Graphdistanzen
- vier natürliche Kristalladern
- interstellarer Käufer im Kristallmarkt
- regelmäßige Hochsicherheits-Kristalltransporter
- zwei garantierte und möglicherweise drei Meteoriten
- Kugel erst als spätere Darstellung

### Arbeitsreihenfolge

1. Dokumentation
2. Startpositionen und Zonen
3. flache Darstellung des 92-Felder-Graphen
4. Kristalladern
5. Meteoriten
6. interstellarer Käufer
7. Countdown
8. Simulation
9. später 3D-Kugel

Verbindliche Details: `docs/PLANET_MAP.md`.
<!-- ELUM-PLANET-CONTEXT:END -->
