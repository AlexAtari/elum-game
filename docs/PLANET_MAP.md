# Planet, Karte, Kristalle und Meteore

**Status:** beschlossenes Zielbild, noch nicht vollständig implementiert
**Last Updated:** 2026-07-27

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

Das HQ liegt auf einem Hexagon. Die Karte wird zunächst flach
dargestellt. Eine drehbare 3D-Kugel folgt später als alternative
Ansicht desselben Graphen.

Alle Grundstücke sind wirtschaftlich gleich große Spieleinheiten.
Sichtbare Größenunterschiede beeinflussen weder Produktion noch Preis.

## 2. Graph als Regelgrundlage

Jedes Feld besitzt langfristig mindestens:

- eine stabile Feld-ID,
- eine Liste der Nachbarfeld-IDs,
- eine geometrische Position für die Darstellung,
- die kürzeste Entfernung zum HQ,
- die Form `hexagon` oder `pentagon`,
- Gelände- und Ressourcenwerte,
- einen verdeckten Kristallwert,
- Besitzer und Harvesterzustand.

Spielregeln verwenden Feld-IDs, Nachbarschaften und Graphdistanzen.
Flache Koordinaten dienen nur der Darstellung.

## 3. HQ und Startpositionen

Das HQ gehört keinem einzelnen Spieler und zugleich allen Kolonien
als gemeinsame Hilfskonstruktion, Markt- und Verwaltungsstation.

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

Mehrere unabhängige Konflikte können mehrere nacheinander ausgeführte
Grundstücksauktionen erzeugen.

## 5. Entfernungszonen

Die Zonen werden über die kürzeste Zahl von Feldschritten zum HQ
bestimmt. Es gibt keinen Kartenrand.

| Bereich | vorläufige Zielgröße |
|---|---:|
| HQ und acht Startfelder | 9 |
| innere Koloniezone | ungefähr 18 |
| Explorationszone | ungefähr 29 |
| planetare Fernzone | ungefähr 36 |
| Gesamt | 92 |

Die endgültigen Grenzen folgen vollständigen Entfernungsebenen.
Die Fernzone darf beim Balancing zulasten der inneren Zone vergrößert
werden.

## 6. Natürliche Kristalladern

Die Karte enthält vorläufig vier natürliche Kristalladern.

Jede Ader besitzt:

- einen 5-Sterne-Kern,
- unregelmäßige 4-Sterne-Felder,
- anschließende 3-Sterne-Felder,
- auslaufende 2-Sterne-Felder.

Regeln:

- Kerne werden stark zur Fernzone gewichtet,
- Kerne liegen nicht auf Pentagonen,
- Kerne liegen nicht auf Startgrundstücken,
- Kerne halten einen konfigurierbaren Mindestabstand,
- Adern dürfen sich berühren, aber nicht vollständig überlagern,
- außerhalb der Adern entstehen natürlich keine zufälligen
  5-Sterne-Felder.

## 7. Kristallmarkt und Transporte

Die Kristallauktion funktioniert grundsätzlich wie die Märkte für
Nahrung, Energie und Erz. Spieler können als Käufer oder Verkäufer
teilnehmen.

Zusätzlich existiert ein interstellarer Käufer:

- begrenzte Kaufmenge je Runde,
- wachsende Kapazität im Verlauf der Partie,
- konfigurierbarer Einstiegspreis,
- konfigurierbare Preisreaktion und Obergrenze,
- Marktstabilisierung ohne Verkaufsgarantie.

Erste Simulationsbasis:

- Startkapazität: eine Einheit,
- zunächst Wachstumsstufe `+1`,
- ab ungefähr Runde 5 Wachstumsstufe `+2`,
- ab ungefähr Runde 10 Wachstumsstufe `+3`,
- ab ungefähr Runde 15 Wachstumsstufe `+4`.

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

Als Nächstes:

1. 92-Felder-Graph einführen und validieren.
2. faire Startkorridore auswählen.
3. Graph zunächst flach darstellen.
4. Entfernungszonen berechnen.
5. Kristalladern erzeugen.
6. Meteoriten implementieren.
7. interstellaren Käufer ergänzen.
8. Countdown und Storytexte ergänzen.
9. Simulation und Balancing.
10. später 3D-Kugel.
