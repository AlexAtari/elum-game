# Planet, Karte, Kristalle und Meteore

**Status:** beschlossenes Zielbild, noch nicht vollständig implementiert
**Last Updated:** 2026-07-31

Dieses Dokument konkretisiert die Karten-, Kristall- und Meteorregeln
des GDD. Zahlenwerte bleiben Balancingparameter. Bei Abweichungen zum
aktuellen Code beschreibt `docs/STATUS.md` den implementierten Stand.

## 1. Zielbild

Die Standardpartie verwendet künftig einen zusammenhängenden
Planetengraphen mit:

- 92 Kartenfeldern insgesamt,
- einem neutralen HQ,
- 91 erwerbbaren Grundstücken,
- zwölf Pentagonfeldern mit jeweils fünf Nachbarn,
- 80 Hexagonfeldern mit jeweils sechs Nachbarn.

Das HQ liegt auf einem Hexagon. Die Browserpartie zeigt eine drehbare
orthografische Kugelprojektion desselben Graphen. Rückseitenfelder
werden erst nach einer Drehung sichtbar und anklickbar.

Die Kugel erhält eine gemeinsame marsartige, fotorealistische
Welttextur aus Rostboden, Terrakotta, Ocker und dunklem Basalt ohne
gezeichnete Ressourcenmotive, Feldlinien oder harte Biomgrenzen.
Die geologische Basisebene verwendet eine höhere Abtastauflösung als
die getrennte Ressourcenfarbkarte, damit feiner Regolith,
Sedimentschichten und Basaltbrüche auch im Nahzoom sichtbar bleiben.
Nahrung erzeugt olivgrüne, Energie kühl blaugraue und Erz
eisenrote Farbnuancen. Diese werden aus den umliegenden Feldwerten
räumlich geglättet, sodass Ressourcenübergänge nicht an
Grundstückskanten abbrechen. Eine Rückprojektion ordnet die
sichtbaren Kugelpixel festen Weltkoordinaten zu; die Textur bleibt
deshalb beim Drehen auf dem Planeten verankert.

Von Runde 1 bis Runde 20 wird die Marsbasis in jedem Rundenschritt
mit einer deckungsgleichen Terraformingbasis überblendet. Eine
moderate Grundentwicklung betrifft den gesamten Planeten.
Nahrungseignung verstärkt den lokalen Anteil, sodass fruchtbare
Regionen früher dunkle Böden, Flechten und Vegetation zeigen.
Erzreiche und karge Regionen bleiben länger trocken und felsig.
Selbst der Endzustand enthält weiterhin Basalt, Ocker und
Halbtrockenzonen; offene Gewässer und Siedlungen werden nicht Teil
der Textur. Dies ist eine rein visuelle Kultivierungsanzeige und
ändert keine Ressourcensterne. Rivalenfelder werden anhand der
getrennten Besitzlisten als Orion, Nova oder Vega gekennzeichnet;
jede Kolonie beginnt weiterhin mit genau zwei Grundstücken.

Die Grundstücksflächen werden weiterhin als sphärische Dualzellen
aus den Mittelpunkten der angrenzenden Dreiecksflächen gebildet.
Benachbarte Zellen teilen exakt dieselbe Kante, dienen aber nur als
unsichtbare Interaktionsflächen. Standardfelder besitzen keine
permanente harte Umrandung; Hover, Tastaturfokus und Auswahl blenden
eine Kontur ein. Statusmarkierungen für Gebote und Meteorzentren
bleiben davon ausgenommen.

Eine globale, im Ansichtsraum feste Lichtverteilung überlagert alle
Zelltexturen gemeinsam. Sie erzeugt eine helle Einfallsseite und eine
weich abgedunkelte Gegenseite. Der Kartenviewport zeigt hinter der
Kugel ein tief gestaffeltes Sternfeld statt einer schwarzen Fläche.
Die beiden Sternenebenen verschieben sich mit der Yaw- und
Pitch-Rotation der Planetenkamera und erzeugen dezente räumliche
Parallaxe. Eine kleine leuchtende Sonne und ein entfernter
saturnähnlicher Ringplanet ergänzen die dichtere Sternkulisse als
rein visuelle Hintergrundelemente. Beide wandern bei Yaw- und
Pitch-Rotation deutlich in derselben Richtung durch das Sichtfeld.
Ein künstlicher farbiger Kugelrand wird nicht verwendet.
Feld-IDs erscheinen nicht als Text auf der Kugel. Die 91 Grundstücke
tragen stattdessen feste, eindeutige Namen nach Stationen der London
Underground. Diese Namen erscheinen in Felddetailansicht, Auktionen,
Rundenberichten und barrierefreien Interaktionsnamen. Die IDs bleiben
als interne Schlüssel erhalten.

Die mobile Darstellung reduziert äußere und innere Seitenabstände,
damit der Kugelviewport möglichst viel Bildschirmbreite erhält. Der
zulässige Nahzoom beträgt 2,2 gegenüber der Ausgangsansicht; die
Kugel bleibt dabei zentriert und wird weiterhin durch Drehen
navigiert.

Alle Grundstücke sind wirtschaftlich gleich große Spieleinheiten.
Sichtbare Größenunterschiede beeinflussen weder Produktion noch Preis.

## 2. Graph als Regelgrundlage

Jedes Feld besitzt langfristig mindestens:

- eine stabile Feld-ID,
- einen festen sichtbaren Stationsnamen,
- eine Liste der Nachbarfeld-IDs,
- eine geometrische Position für die Darstellung,
- die kürzeste Entfernung zum HQ,
- die Form `hexagon` oder `pentagon`,
- Gelände- und Ressourcenwerte,
- einen verdeckten Kristallwert,
- Besitzer und Harvesterzustand.

Spielregeln verwenden Feld-IDs, Nachbarschaften und Graphdistanzen.
Normalisierte Kugelkoordinaten und flache Hilfskoordinaten dienen nur
der Darstellung.

## 3. HQ und Startpositionen

Das HQ gehört keinem einzelnen Spieler und zugleich allen Kolonien
als gemeinsame Hilfskonstruktion, Markt- und Verwaltungsstation.
Seine Darstellung zeigt eine zentrale Kuppel und vier über Korridore
angeschlossene Außenlager. Jedes Außenlager repräsentiert das HQ
einer der vier Kolonien Agima, Orion, Nova und Vega.
Das Luftbild wird auf der Kugel an der projizierten Grundstücksform
ausgeschnitten und füllt das gesamte HQ-Feld statt nur eines kleinen
kreisförmigen Markers.
Auf der Kugel wird seine erste Ausbaustufe als deutlich erkennbare
Scheunen- und Lagerstation dargestellt. Spätere Ausbaustufen können
diese Silhouette mit wachsender Bevölkerung sichtbar erweitern.

Jeder der vier Spieler erhält zwei zusammenhängende Startgrundstücke:

1. ein Grundstück direkt am HQ,
2. ein daran angrenzendes Grundstück in Richtung vom HQ weg.

Damit entstehen vier radiale Startkorridore mit insgesamt acht
Startgrundstücken.

Der Graph definiert vier feste, vorab auf Gleichwertigkeit geprüfte
Startkorridore. Von den sechs direkten HQ-Nachbarn bilden vier den
Beginn dieser Korridore; die beiden übrigen bleiben zu Spielbeginn als
neutrale frühe Konflikt- und Expansionsfelder frei. Die vier
Startkorridore werden den Kolonien pro Partie zufällig zugeordnet.

Die intern implementierte Konfiguration verwendet:

| Korridor | inneres Feld | äußeres Feld |
|---|---|---|
| Start 1 | `P012` | `P015` |
| Start 2 | `P017` | `P022` |
| Start 3 | `P018` | `P027` |
| Start 4 | `P021` | `P060` |

`P011` und `P020` bleiben als gegenüberliegende HQ-Nachbarn neutral.
Alle vier äußeren Startfelder besitzen drei weiterführende Verbindungen
in Distanzring 3. Abstand zum nächsten Pentagon und kürzester Weg zur
Fernzone sind für alle vier Korridore identisch.

Für alle Startgrundstücke gilt:

- kein Pentagon,
- immer null Kristallsterne,
- sofortiger Besitz zu Spielbeginn,
- keine Grundstücksauktion,
- kein Meteorzentrum.

Die Startanordnung muss nicht optisch vierfach symmetrisch sein.
Entscheidend sind möglichst gleiche Bedingungen im Graphen:

- vergleichbare Entfernung zur Fernzone,
- vergleichbare Zahl freier Expansionswege,
- ähnliche Nähe zu Pentagonen und Engpässen,
- ähnliche Erreichbarkeit strategischer Regionen,
- keine einseitige frühe Sackgasse.

Einschließen anderer Spieler ist erlaubt.

## 4. Grundstückserwerb

Ein Spieler darf pro Runde höchstens ein Grundstück erwerben.

Gebote sind nur auf freie Grundstücke zulässig, die zu Beginn der
Runde an mindestens ein eigenes Grundstück angrenzen. Ein in derselben
Runde gewonnenes Grundstück eröffnet erst in der folgenden Runde neue
Expansionsmöglichkeiten.

Diese Graphregel gilt identisch für lokale Spieler, entfernte Spieler
und KI-Kolonien. Agenten erhalten ausschließlich tatsächlich
angrenzende Kandidaten und der Kaufpfad prüft die Nachbarschaft vor
der Besitzübertragung erneut.

Mehrere unabhängige Konflikte können mehrere nacheinander ausgeführte
Grundstücksauktionen erzeugen.

## 5. Entfernungszonen

Die Zonen werden über die kürzeste Zahl von Feldschritten zum HQ
bestimmt. Es gibt keinen Kartenrand.

| Bereich | früherer Zielwert | implementierter Graph |
|---|---:|---:|
| HQ und acht Startfelder | 9 | 9 |
| innere Koloniezone | ungefähr 18 | 10 |
| Explorationszone | ungefähr 29 | 33 |
| planetare Fernzone | ungefähr 36 | 40 |
| Gesamt | 92 | 92 |

Die implementierten Grenzen folgen vollständigen Entfernungsebenen:

- Startzone: HQ und die acht festgelegten Startfelder,
- innere Zone: übrige Felder der Distanzen 1 und 2,
- Explorationszone: Distanzen 3 und 4,
- Fernzone: Distanzen 5 bis 8.

Damit wird kein Distanzring künstlich geteilt. Die gegenüber dem alten
Zielwert größere Fernzone entsteht wie vorgesehen zulasten der inneren
Zone und wird später in Simulationen überprüft.

## 6. Natürliche Kristalladern

Die Karte enthält vier deterministisch erzeugte natürliche
Kristalladern. Jede Ader umfasst in der ersten Implementierung zehn
Felder.

Jede Ader besitzt:

- einen 5-Sterne-Kern,
- zwei unregelmäßige 4-Sterne-Felder,
- drei anschließende 3-Sterne-Felder,
- vier auslaufende 2-Sterne-Felder.

Regeln:

- Kerne werden stark zur Fernzone gewichtet,
- Kerne liegen nicht auf Pentagonen,
- Kerne liegen nicht auf Startgrundstücken,
- Kerne halten einen konfigurierbaren Mindestabstand,
- Adern dürfen sich berühren, aber nicht vollständig überlagern,
- außerhalb der Adern entstehen natürlich keine zufälligen
  5-Sterne-Felder.

Die Adern sind im 92-Felder-Graphen implementiert. Überlappende
Ausläufer behalten jeweils den höheren Wert. Im Browser bleibt der
Kristallwert auch nach dem Erwerb während einer vollständigen
Explorationsrunde verdeckt. Wird ein Grundstück in Runde N gekauft,
läuft die Exploration in Runde N+1; ab Runde N+2 werden Vorkommen und
Wert offengelegt und können für Kristallproduktion verwendet werden.
Beim Eintritt in Runde N+2 nennt das Infosheet Stationsname und
Ergebnis; danach bleibt der Wert in der Grundstücksdetailansicht
sichtbar. Diese Grenze gilt auch für Agenten und Headless-Läufe.

Auf einem eigenen Vorkommen kann ein Harvester Kristalle als vierte
Produktionsart fördern. Der wirksame Ertrag kombiniert den natürlichen
Wert mit bisherigen Meteorboni und bleibt bei fünf Sternen gedeckelt.
Dieselbe Regel gilt für Rivalen und Headless-Simulation.

Harvester werden auf der Kugel als deutlich vergrößerte,
kontrastunterlegte Maschinenmarkierung gezeigt. Der Koloniename bleibt
zusätzlich sichtbar, damit ein Harvester die Besitzinformation nicht
verdeckt.

## 7. Kristallmarkt und Transporte

Die Kristallauktion funktioniert grundsätzlich wie die Märkte für
Nahrung, Energie und Erz. Spieler können als Käufer oder Verkäufer
teilnehmen.

Jede Kolonie beginnt mit einer mitgebrachten Kristallprobe im Lager.
Sie gehört zu keinem Kartenfeld; die acht Startgrundstücke bleiben
kristallfrei. Dadurch kann die Kristallauktion bereits vor der
Erschließung einer natürlichen Ader kennengelernt werden.

Zusätzlich existiert ein interstellarer Käufer:

- begrenzte Kaufmenge je Runde,
- wachsende Kapazität im Verlauf der Partie,
- konfigurierbarer Einstiegspreis,
- konfigurierbare Preisreaktion und Obergrenze,
- Marktstabilisierung ohne Verkaufsgarantie.

Implementierte konservative Simulationsbasis:

- Runden 1 bis 4: eine Einheit,
- Runden 5 bis 9: zwei Einheiten,
- Runden 10 bis 14: drei Einheiten,
- ab Runde 15: vier Einheiten,
- Kaufgebot: 90 Prozent des offiziellen Referenzkurses,
- Mindestgebot: 20 Credits,
- Höchstgebot: 60 Credits.

Bei einem Referenzkurs von 40 Credits startet der Käufer daher mit
einem Gebot von 36 Credits. Seine Kapazität gilt je Runde und wird mit
jeder übernommenen Einheit reduziert. Nach Ausschöpfung zieht er sich
für den Rest der Runde zurück. Verkäufe an ihn verändern weder das
HQ-Lager noch dessen Nettofluss und garantieren wegen der begrenzten
Kapazität keinen Verkauf.

Die Headless-Simulation bildet Käufer und Meteore reproduzierbar ab.
Im aktuellen 200-Partien-Referenzlauf entstehen 2,4 Meteore, aber keine
Verkäufe an den Käufer, weil die Agenten nicht über ihre beiden
Startgrundstücke hinaus expandieren. Käuferpreis und Kapazität bleiben
deshalb unverändert; zuerst muss der Zugang zu Fernzonen getestet
werden.

Verkaufte Kristalle werden von spezialisierten
Hochsicherheits-Raumschiffen abgeholt. Diese Werttransporter:

- kommen regelmäßig während der Partie,
- übernehmen nur verkaufte Kristalle,
- bestätigen beziehungsweise übertragen die Credits,
- bringen keine Versorgungsgüter oder Personen,
- sind unabhängig vom Versorgungsschiff.

## 8. Versorgungsschiff und Spielende

Die Standardpartie umfasst 20 vollständig abgerechnete Runden.

Intern zählt der Code weiterhin aufsteigend von Runde 1 bis 20.
Die Oberfläche zeigt den Countdown bis zum Versorgungsschiff.

Das Versorgungsschiff:

- kommt erst nach Abschluss der 20 Runden,
- bringt Vorräte, Ersatzteile und neues Personal,
- bringt die Ablösung der aktuellen Kolonieleitung,
- markiert das Ende der Partie.

Nicht verkaufte Kristalle werden am Spielende zum offiziellen
Kristallkurs bewertet. Dieser entspricht dem zuletzt veröffentlichten
Orientierungspreis des Kristallmarkts und startet bei 40 Credits je
Kristall. Eine einzelne Transaktion setzt ihn nicht direkt. Gab es in
einer Runde keinen Kristallhandel, bleibt der Kurs unverändert; gab es
in der gesamten Partie keinen, gilt der Referenzkurs von 40 Credits.

## 9. Meteoriten

### Häufigkeit

- zwei Einschläge garantiert,
- 50 Prozent Wahrscheinlichkeit auf einen dritten,
- erster Einschlag ungefähr Runde 5 bis 6,
- zweiter Einschlag ungefähr Runde 10 bis 12,
- optionaler dritter Einschlag ungefähr Runde 15 bis 16,
- keine Einschläge in den letzten vier Runden.

Der Einschlagsplan wird zu Partiebeginn aus einem Seed erzeugt und im
Spielzustand gespeichert. Dadurch bleiben Vorschauen, Tests und
Simulationen reproduzierbar. Browserpartien erhalten bei einem
Neustart einen neuen Seed.

### Einschlagszentrum

Das Zentrum:

- muss unverkauft sein,
- darf nicht HQ oder Startfeld sein,
- liegt zunächst nicht auf einem Pentagon,
- hält möglichst Abstand zu früheren Einschlägen,
- wird als globales Ereignis am Rundenende angezeigt.

Nur das Zentrum muss unverkauft sein. Betroffene Nachbarfelder dürfen
bereits verkauft sein.

Falls kein gültiges Zentrum gefunden wird:

1. zunächst normale Regeln anwenden,
2. danach Überschneidungen zulassen,
3. danach Mindestabstand schrittweise reduzieren,
4. HQ, Startfelder und verkaufte Zentren bleiben ausgeschlossen,
5. notfalls fällt der Einschlag aus.

### Unregelmäßiger Krater

Alle Werte bleiben konfigurierbar. Konservative Standardbasis:

- Zentrum: `+3` Kristallsterne,
- drei direkte Nachbarn: jeweils `+2`,
- vier weitere Felder: jeweils `+1`,
- äußere Felder höchstens zwei Graphschritte entfernt,
- jedes Feld höchstens fünf Sterne,
- kein Feld wird doppelt ausgewählt,
- der Krater bleibt zusammenhängend und unregelmäßig.

Erweiterte Testvarianten dürfen vier direkte und sechs äußere
beziehungsweise fünf direkte und acht äußere Felder betreffen. Ihre
Verteilung wird erst nach Simulationen festgelegt.

### Sichtbarkeit

Alle Spieler sehen:

- Einschlagsort,
- Meteoranimation,
- grafische Geländeveränderung am Zentrum.

Die genaue Aufwertung bleibt verborgen. Besitzer bereits untersuchter
oder aktiv abgebauter Felder sehen den neuen Wert sofort.

Dieser Stand ist implementiert. Nach der Grundstücksauswertung einer
betroffenen Runde erzeugt `runRound` den Einschlag ohne globale
Seiteneffekte. Die Zwischenrangliste meldet das öffentliche Zentrum,
und die Karte markiert es dauerhaft als Krater. Auf freien und
gegnerischen Feldern bleiben die exakten Werte verborgen.

## 10. Pentagone

Pentagone sind normale erwerbbare Grundstücke. Der einzige feste
Unterschied ist ihre Nachbarschaft:

- Pentagon: fünf Nachbarn,
- Hexagon: sechs Nachbarn.

Version 1 gibt Pentagonen keinen Produktions-, Preis- oder
Ressourcenbonus. Sie bleiben visuell erkennbar.

Vorläufig ausgeschlossen sind:

- HQ auf einem Pentagon,
- Startgrundstücke auf Pentagonen,
- natürliche 5-Sterne-Kerne auf Pentagonen,
- Meteorzentren auf Pentagonen.

## 11. Umsetzungsreihenfolge

Abgeschlossen:

1. Dokumentation konsolidieren.
2. Kartenmodell von der Darstellung lösen.
3. 92-Felder-Graph einführen und validieren.
4. faire Startkorridore und Entfernungszonen festlegen.
5. Graph zunächst flach darstellen und an die Browserpartie anbinden.
6. erste Agentenexpansion auf drei Harvester und ungefähr drei
   Grundstücke stabilisieren.
7. normalisierte Kugelkoordinaten als drehbare Browserprojektion
   aktivieren.

Als Nächstes:

1. Folgeexpansion bis zu den Fernzonen simulieren und balancieren.
2. Hochsicherheits-Kristalltransporter ergänzen.
3. später optional eine alternative grafische Polyederentfaltung.
