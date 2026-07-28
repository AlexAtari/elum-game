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
- Standardpartie: 20 Runden, zunächst ungefähr 35–45 Minuten
- Hauptwertung: Bevölkerung
- weitere Gleichstandswerte: Vermögen einschließlich Kristallkurs,
  übrige Ressourcen ohne Kristalle, Harvester
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
- sichtbarer Countdown bis zum Versorgungsschiff
- Versorgungsschiff und Ablösung nach der 20. Abrechnung
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

Aktueller 200-Partien-Stand mit 20 Runden, Markt und den Seeds
1 bis 200:

| Kolonie | Siegquote | Durchschnittsrang | Ø Bevölkerung | Ø Abrechnungsvermögen |
|---|---:|---:|---:|---:|
| Nova | 28,5 % | 2,10 | 11,8 | 180,8 |
| Orion | 28,5 % | 2,31 | 11,2 | 214,0 |
| Agima | 28,0 % | 2,91 | 10,6 | 196,8 |
| Vega | 15,0 % | 2,69 | 10,8 | 133,9 |

Die Seriensimulation verwendet jetzt dieselbe lexikografische
Schlusswertung wie die Browserpartie: Bevölkerung,
Abrechnungsvermögen, übrige Ressourcen und Harvester. Der separat
ausgewiesene Ökonomiewert bleibt nur eine Diagnosegröße und
entscheidet keine Partie.

Systemische Beobachtungen aus dem aktuellen Lauf:

- 82 unterschiedliche Endergebnisse
- 127,5 Markttransaktionen je Partie
- 1,3 direkte Spielertransaktionen je Partie
- direkter Handelsanteil 1,0 %
- 126,2 HQ-Lagertransaktionen je Partie
- 52,25 Versorgungssignale je Partie
- davon 4.989 Bevölkerungsrückgänge, 2.276 leere Nahrungs- und
  3.181 leere Energiebestände

Ein Kontrolllauf ohne Markt erhöht die Versorgungssignale auf 56,52
je Partie und senkt Vegas durchschnittliche Bevölkerung von 10,8 auf
8,8. Das HQ ist damit derzeit ein Sicherheitsnetz; der geringe direkte
Handel entsteht vor allem, weil mehrere Kolonien gleichzeitig
dieselben Ressourcen benötigen.

Konservative Einzeländerungen an Vegas Profil zeigten
Rundungsschwellen: oberhalb der Schwelle blieb das Ergebnis
unverändert, der nächste Schritt hob Vega auf 42 % und drückte Nova
auf 8 %. Deshalb wurden in diesem Paket keine Profilwerte geändert.

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

1. Produktions- und Marktentscheidungen stärker differenzieren,
   damit Angebot und Nachfrage nicht synchron verlaufen,
2. Versorgungssignale reduzieren, ohne das HQ-Sicherheitsnetz
   pauschal zu vergrößern,
3. Vegas Schwäche systemisch statt über eine Rundungsschwelle im
   Profil korrigieren,
4. Kristallförderung, Meteore und interstellaren Käufer in die
   Headless-Simulation aufnehmen,
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

- Aktivierung der intern vorbereiteten zufälligen
  Startkorridor-Zuordnung im späteren Browser-Spielstart
- Kartenregeln über Feld-IDs, Nachbarlisten und Graphdistanzen
- regelmäßige Hochsicherheits-Kristalltransporter

Der Browserprototyp verwendet 20 vollständig abgerechnete Runden mit
sichtbarem Versorgungsschiff-Countdown, Abschlussankunft und
lexikografischer Zielwertung. Er verwendet außerdem den
92-Felder-Graphen und vier natürliche, abgestufte Kristalladern.
Kristallwerte werden erst auf eigenen Grundstücken offengelegt. Die
konservative Meteorvariante mit zwei garantierten und einem optionalen
dritten Einschlag ist ebenfalls aktiv; Kraterzentren werden öffentlich
markiert und Aufwertungen bei fünf Sternen gedeckelt. Der
interstellare Kristallkäufer ist mit einer Kapazität von `1/2/3/4`
Einheiten und einem auf 90 Prozent gedämpften, zwischen 20 und
60 Credits gedeckelten Referenzkursgebot aktiv. Die
zufällige Neuzuordnung der Startkorridore pro Browserpartie folgt in
einem späteren Spielstart-Schritt.

Nächste technische Reihenfolge:

1. erneut simulieren und balancieren.
2. Hochsicherheits-Kristalltransporter ergänzen.

Details: `docs/PLANET_MAP.md`.
<!-- ELUM-PLANET-STATUS:END -->
