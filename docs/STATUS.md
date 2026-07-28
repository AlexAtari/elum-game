# Projektstatus

**Automatisch erfasste Basis:** Branch `main`, Commit
`34cf55a`, Arbeitsbaum beim Erzeugen der Dokumentation:
**sauber**  
**Erstellt:** 2026-07-26

Diese Angaben sind ein Startpunkt. Vor jeder Arbeit immer erneut
`git status --short` und `git log -5 --oneline` ausführen.

## Produktkern

- Planet: Agima
- Spieltyp: rundenbasierte Kolonie- und Wirtschaftsstrategie
- Zielplattform: Browser und Smartphones
- Standardpartie: 15 Runden, ungefähr 20–30 Minuten
- Hauptwertung: Bevölkerung
- weitere Gleichstandswerte: Credits, Ressourcen, Harvester
- vier Kolonien: Agima, Orion, Nova und Vega

## Implementiert

- flache radiale Browserkarte mit zentralem HQ und 91 Grundstücken
- UI-unabhängiges Kartenmodell mit Feld-IDs, symmetrischen
  Nachbarlisten und berechneten Graphdistanzen
- getrennte flache Layoutpositionen für die bestehende Hexdarstellung
- interner, deterministischer 92-Felder-Graph mit einem HQ,
  91 Grundstücken, zwölf Pentagonen und 80 Hexagonen
- validierte Nachbarzahlen, vollständige Verbindung und
  reproduzierbare Feld-IDs des Zielgraphen
- vier intern festgelegte, strukturell gleichwertige Startkorridore
  und zwei gegenüberliegende neutrale HQ-Nachbarn
- seedbasierte, reproduzierbare Zuordnung aller vier Korridore an
  vier Teilnehmer
- reproduzierbare Entfernungszonen mit 9 Start-, 10 inneren,
  33 Explorations- und 40 Fernzonenfeldern
- sichtbare Nachbarverbindungen, erkennbare Pentagone sowie
  Touch-, Zoom- und Feldauswahl auf dem Zielgraphen
- Ziel-Startfelder im normalen Browser-Spielzustand
- zwei Startfelder je Kolonie
- Nahrung, Energie, Erz, Kristalle und Credits
- Harvesterbau und mehrere parallele Bauaufträge
- Harvesterplatzierung, Produktion, Umrüstung und Versetzung
- Energiebedarf der Harvester
- Versorgung und Bevölkerungsentwicklung
- globale und lokale Ereignisse
- freiwillige Märkte für vier Ressourcen
- HQ-Lager als neutraler Handelspartner
- direkte Einzeltransaktionen zwischen Marktteilnehmern
- dauerhaft gespeicherte Rivalenkolonien
- autonome Land-, Harvester-, Investitions- und Marktlogik
- Zwischen- und Abschlussrangliste
- Headless-Einzel- und Seriensimulation
- GitHub-Pages-Deployment mit Test, Lint und Build

## Grundstücksauktion – aktueller Sollstand

Treffen mindestens zwei Gebote auf ein Grundstück:

1. Es findet immer eine grafische Auktion statt.
2. Startpreis ist das höchste verdeckte Gebot.
3. Der alleinige Höchstbietende startet in Führung.
4. Ohne höheres Gebot gewinnt dieser zum Startpreis.
5. Bei gleichem Höchstgebot startet die bisherige
   Stichentscheidung ohne Führenden.
6. Ein gleich hohes späteres Gebot übernimmt die Führung nicht.

## Agenten-Balancing

Letzter bekannter 100-Partien-Stand der Profilabstimmung:

| Kolonie | Siegquote | Durchschnittsrang | Ø Vermögen |
|---|---:|---:|---:|
| Agima | 28,0 % | 2,28 | 598,4 |
| Nova | 27,5 % | 2,51 | 577,5 |
| Vega | 23,0 % | 2,49 | 592,1 |
| Orion | 21,5 % | 2,63 | 586,6 |

Die Profile gelten vorläufig als ausreichend ausgeglichen und
sollten nicht ohne neue Seriensimulation verändert werden.

Systemische Beobachtungen aus demselben Lauf:

- 108,7 Markttransaktionen je Partie
- 3,6 direkte Spielertransaktionen je Partie
- direkter Handelsanteil 3,3 %
- 105 HQ-Lagertransaktionen je Partie
- 27,40 Versorgungswarnungen je Partie
- häufigste Warnungen: Bevölkerungsrückgang, leere Nahrung,
  leere Energie

## Aktuelle UI-Akzeptanzkriterien

Mobile Rangliste:

- eigene Kartenansicht statt breiter Desktoptabelle,
- Platz 4 erscheint unten, Platz 3 darüber, dann 2 und 1,
- vier feste Slots; bereits sichtbare Karten bewegen sich nicht,
- ruhiger, etwas langsamer Einflug,
- vollständige Ansicht bleibt länger sichtbar,
- Weiter-Schaltfläche nach vollständiger Aufdeckung.

Vor Änderungen prüfen, welche dieser Punkte bereits im
Repository enthalten sind. Lokale, noch nicht commitete
Patchdateien sind nicht automatisch Teil des Projektstands.

## Nächste systemische Themen

Nach UI- und Dokumentationsarbeiten:

1. direkten Spielerhandel gegenüber HQ-Handel erhöhen,
2. Versorgungswarnungen reduzieren,
3. dabei die ausgeglichenen Siegquoten erhalten,
4. Mehrspieler-Markt und sichtbare Rivalen weiter verfeinern,
5. Karten- und Ereignisbalancing mit Playtests prüfen.

## Später, nicht Teil des aktuellen Kerns

- Race beziehungsweise Living Mode
- asynchroner Mehrspielermodus
- Weekly und Daily Challenges
- umfangreicher Technologiebaum
- zusätzliche Planeten und Kampagnen

Diese Punkte stehen unter Vorbehalt und dürfen den kleinen,
vollständigen Kern von Version 1 nicht unnötig vergrößern.

<!-- ELUM-PLANET-STATUS:BEGIN -->
## Beschlossenes Zielbild – noch nicht vollständig implementiert

- 20 Runden mit sichtbarem Countdown bis zum Versorgungsschiff
- Aktivierung der intern vorbereiteten zufälligen
  Startkorridor-Zuordnung im späteren Browser-Spielstart
- Kartenregeln über Feld-IDs, Nachbarlisten und Graphdistanzen
- interstellarer Käufer als zusätzlicher Kristallmarktteilnehmer
- regelmäßige Hochsicherheits-Kristalltransporter
- Bewertung nicht verkaufter Kristalle zum offiziellen
  Orientierungspreis; Start- und Rückfallwert 40 Credits

Der Browserprototyp verwendet weiterhin 15 Runden, aber bereits den
92-Felder-Graphen und vier natürliche, abgestufte Kristalladern.
Kristallwerte werden erst auf eigenen Grundstücken offengelegt. Die
konservative Meteorvariante mit zwei garantierten und einem optionalen
dritten Einschlag ist ebenfalls aktiv; Kraterzentren werden öffentlich
markiert und Aufwertungen bei fünf Sternen gedeckelt. Die
zufällige Neuzuordnung der Startkorridore pro Browserpartie folgt in
einem späteren Spielstart-Schritt.

Nächste technische Reihenfolge:

1. interstellaren Käufer ergänzen.
2. danach erneut simulieren und balancieren.

Details: `docs/PLANET_MAP.md`.
<!-- ELUM-PLANET-STATUS:END -->
