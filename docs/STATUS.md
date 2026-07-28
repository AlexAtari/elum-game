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

- drehbare Browserkugel mit zentralem HQ und 91 Grundstücken
- UI-unabhängiges Kartenmodell mit Feld-IDs, symmetrischen
  Nachbarlisten und berechneten Graphdistanzen
- getrennte normalisierte Kugelkoordinaten und flache
  Layoutpositionen
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
- orthografische Kugelprojektion mit ausgeblendeter Rückseite,
  sichtbaren Nachbarverbindungen und erkennbaren Pentagonen
- Touch-Drehung, Pinch-/Mausrad-Zoom, HQ-Zentrierung und Feldauswahl
  auf dem Zielgraphen
- Ziel-Startfelder im normalen Browser-Spielzustand
- zwei Startfelder je Kolonie
- Nahrung, Energie, Erz, Kristalle und Credits
- Kristallförderung durch Harvester auf natürlichen und durch
  Meteore aufgewerteten Vorkommen
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
- seedbasierte Meteore und kapazitätsbegrenzter interstellarer
  Kristallkäufer in der Headless-Simulation
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
| Nova | 36,0 % | 2,11 | 19,6 | 106,0 |
| Vega | 26,0 % | 2,37 | 19,2 | 78,0 |
| Agima | 23,0 % | 2,58 | 18,0 | 201,5 |
| Orion | 15,0 % | 2,94 | 17,3 | 224,3 |

Die Seriensimulation verwendet jetzt dieselbe lexikografische
Schlusswertung wie die Browserpartie: Bevölkerung,
Abrechnungsvermögen, übrige Ressourcen und Harvester. Der separat
ausgewiesene Ökonomiewert bleibt nur eine Diagnosegröße und
entscheidet keine Partie.

Systemische Beobachtungen aus dem aktuellen Lauf:

- 143 unterschiedliche Endergebnisse
- 141,7 Markttransaktionen je Partie
- 3,5 direkte Spielertransaktionen je Partie
- direkter Handelsanteil 2,5 %
- 137,2 HQ-Lagertransaktionen je Partie
- 1,0 Verkauf an den interstellaren Käufer je Partie
- durchschnittlich 2,4 Meteore je Partie
- 9,42 Versorgungssignale je Partie
- davon 585 Bevölkerungsrückgänge, 501 leere Nahrungs- und
  149 leere Energiebestände

Die gemeinsame Agentenregel erlaubt die erste Expansion von zwei auf
drei Harvester bereits bei sicherer Versorgung der unmittelbar
folgenden Runde. Baukosten und ein gemeinsamer Restpuffer von
20 Credits müssen gedeckt sein. Spätere Harvester benötigen weiterhin
die vollen profilabhängigen Mehr-Runden-Reserven. Ein bereits
brachliegender Harvester darf ein angrenzendes Grundstück zum
Mindestgebot erschließen, solange derselbe Kreditpuffer erhalten
bleibt. Optionale höhere Gebote bleiben gesperrt.

Jede Kolonie startet zusätzlich mit einer mitgebrachten
Kristallprobe. Profile mit Kristallreserve 0 bieten sie am Markt an;
Profile mit Reserve 1 behalten sie zunächst. Damit ist der
Kristallmarkt schon vor dem Erreichen einer natürlichen Ader
wirtschaftlich relevant, ohne die kristallfreien Startgrundstücke zu
verändern.

Im Referenzlauf enden die Kolonien mit durchschnittlich 2,9 bis
3,1 Harvestern und 2,9 bis 3,0 Grundstücken. Die erste
Harvestererweiterung liegt im Mittel um Runde 3,0; das erste
zusätzliche Grundstück je nach Kolonie zwischen Runde 4,09 und 5,67.
Die natürlichen Fernzonenadern werden weiterhin nicht zuverlässig
erreicht.

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
3. die Folgeexpansion nach dem dritten Harvester so stabilisieren,
   dass Kristalladern
   innerhalb von 20 Runden tatsächlich erreichbar werden,
4. Karten- und Ereignisbalancing mit Playtests prüfen.

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
Werte können dort jetzt als vierte Harvesterproduktion gefördert
werden; Meteorboni fließen in denselben Ertrag ein. Die
konservative Meteorvariante mit zwei garantierten und einem optionalen
dritten Einschlag ist ebenfalls aktiv; Kraterzentren werden öffentlich
markiert und Aufwertungen bei fünf Sternen gedeckelt. Der
interstellare Kristallkäufer ist mit einer Kapazität von `1/2/3/4`
Einheiten und einem auf 90 Prozent gedämpften, zwischen 20 und
60 Credits gedeckelten Referenzkursgebot aktiv. Die
zufällige Neuzuordnung der Startkorridore pro Browserpartie folgt in
einem späteren Spielstart-Schritt.

Nächste technische Reihenfolge:

1. Folgeexpansion nach dem dritten Harvester für den Zugang zu
   Fernzonen balancieren.
2. Hochsicherheits-Kristalltransporter ergänzen.

Details: `docs/PLANET_MAP.md`.
<!-- ELUM-PLANET-STATUS:END -->
