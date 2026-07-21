# E.L.U.M.
## Exploration, Logistics, Utilization & Mining

# Game Design Document

**Version:** 0.6 "Versorgung & Harvester"
**Status:** Draft
**Last Updated:** 2026-07-20

---

# 1. Vision

E.L.U.M. ist ein rundenbasiertes Strategiespiel für Smartphones, inspiriert vom Klassiker M.U.L.E.

Die Spieler entwickeln auf dem Planeten **Agima** die erfolgreichste Kolonie. Durch geschickte Expansion, Ressourcenmanagement und wirtschaftliche Entscheidungen wächst ihre Bevölkerung und damit ihre Kolonie.

Eine Partie dauert etwa **20–30 Minuten**.

Das Spiel soll leicht zu erlernen, aber schwer zu meistern sein.

---

# 2. Designprinzipien

Während der gesamten Entwicklung gelten folgende Grundsätze:

- Easy to learn. Difficult to master.
- Fair starts. Skill decides.
- Mobile First.
- Wenige Regeln – viele Entscheidungen.
- Jede Ressource muss dauerhaft wichtig bleiben.
- Neue Mechaniken dürfen das Spiel nicht unnötig komplizierter machen.
- Version 1 bleibt bewusst klein, elegant und vollständig.

---

# 3. Spielziel

Eine Partie dauert etwa **15–20 Runden**.

Nach der letzten Runde gewinnt der Spieler mit der **größten Bevölkerung**.

Die Bevölkerung ist der wichtigste Indikator für den Erfolg einer Kolonie.

Alle anderen Spielmechaniken dienen letztlich dazu, das Wachstum der Kolonie zu fördern.

Bei Gleichstand entscheiden weitere Kriterien (z. B. Credits oder Gesamtwert der Kolonie). Die genaue Reihenfolge wird später im Balancing definiert.

---

# 4. Spielablauf

Jede Runde besteht aus folgenden Phasen:

## 1. Rundenbeginn

- Grundstücke aus der letzten Auktion wechseln den Besitzer.
- Fertig gebaute Harvester werden als freie Harvester verfügbar.
- Ereignisse werden aktiviert.

## 2. Planungsphase

Alle Spieler planen gleichzeitig und verdeckt:

- Grundstücksgebote
- neue Harvester bauen
- freie Harvester einsetzen
- Produktionsart bestehender Harvester ändern
- Nahrung und Energie für die Bevölkerung zuteilen
- Marktteilnahme für die einzelnen Ressourcen festlegen

## 3. Grundstücksauktionen

- Alle Gebote werden gleichzeitig aufgedeckt.
- Der Höchstbietende gewinnt.
- Gleichstände werden unmittelbar über eine Stichauktion entschieden.

Das Grundstück wird erst zu Beginn der nächsten Runde übertragen.

## 4. Harvester einsetzen

Alle freien Harvester werden auf bereits eigene, unbestrittene Grundstücke gesetzt.

Neu eingesetzte Harvester können bereits in derselben Runde produzieren.

## 5. Energiezuweisung

Zuerst wird die für die Kolonie beziehungsweise das HQ vorgesehene Energie reserviert.

Anschließend werden die Harvester mit Energie versorgt. Jeder aktive Harvester benötigt eine Einheit Energie pro Runde.

Reicht die verbleibende Energie nicht für alle Harvester, werden einzelne Harvester automatisch nach der festgelegten Prioritätsregel deaktiviert.

## 6. Produktion

Alle mit Energie versorgten Harvester produzieren gleichzeitig. Normal arbeitende Harvester produzieren den vollen Ertrag. Harvester in Umrüstung produzieren in der Übergangsrunde die neue Ressource mit halbem Ertrag. Harvester, die nach einer Versetzung auf einem neuen Feld eingerichtet werden, produzieren in der Übergangsrunde nichts.

## 7. Versorgung und Bevölkerungsentwicklung

Die zuvor festgelegten Mengen an Nahrung und Energie werden der Bevölkerung zugeteilt.

Abhängig von der Versorgung wächst die Bevölkerung, stagniert oder schrumpft.

## 8. Markt

Die Ressourcen werden nacheinander in einer gemeinsamen, interaktiven Echtzeit-Marktphase gehandelt.

## 9. Rundenende

- Markt- und Lagerwerte werden aktualisiert.
- Prüfung auf Spielende.

Falls das Spiel nicht beendet ist, beginnt die nächste Runde.

---

# 5. Spielkarte

Die Karte besteht aus Hexfeldern.

Im zentralen HQ- und Marktgebiet verwaltet jeder Spieler einen eigenen Koloniebereich mit eigener Bevölkerung, eigenem Lager und eigener Versorgung.

Eigenschaften:

- zentrales HQ- und Marktgebiet in der Kartenmitte
- jeder Spieler startet mit zwei automatisch zugewiesenen Startgrundstücken
- faire, symmetrisch erzeugte Startsektoren
- leichte Zufallsvariationen innerhalb der einzelnen Sektoren
- pro Partie zufällig generierte Karte
- Nebel des Krieges
- Expansion nur über angrenzende Grundstücke
- Bodeneignung vor dem Kauf sichtbar
- Besonderheiten nach dem Kauf sichtbar

Der Kartengenerator soll dafür sorgen, dass alle Spieler statistisch gleichwertige Startbedingungen erhalten.

Die Startfelder jedes Spielers sind bewusst so gestaltet, dass mehrere sinnvolle Eröffnungsstrategien möglich sind.

Mindestens ein Startfeld bietet sowohl gute Nahrungsvorkommen als auch gute Erzvorkommen, sodass der Spieler bereits in der ersten Runde zwischen sicherem Wachstum und schneller Expansion entscheiden muss.

## Kartendesign

Die Spielkarte ist ein zentrales Balancing-Element.

Anstatt zusätzliche Spielregeln einzuführen, werden Spielfluss und Konflikte primär über die Gestaltung der Karte beeinflusst.

Dazu gehören beispielsweise:

- Kartengröße
- unpassierbare Gebiete
- natürliche Engstellen
- Ressourcenverteilung
- Abstand der Startgebiete

Ziel ist es, dass Spieler je nach Karte früher oder später aufeinander treffen, ohne künstliche Eingriffe in den Spielablauf.

---

# 6. Grundstücke

Jedes Feld besitzt für Nahrung, Energie und Erz eine Eignung zwischen 0 und 5 Sternen.

Die Sterne entsprechen dem durchschnittlichen Ertrag des Feldes.

Kristalle können ausschließlich auf Feldern mit einem entdeckten Kristallvorkommen gefördert werden.

Vor dem Kauf sichtbar:

- Nahrung
- Energie
- Erz

Nach dem Kauf sichtbar:

- Kristallvorkommen
- besondere Eigenschaften
- positive oder negative Effekte

Neue Grundstücke können ausschließlich ersteigert werden, wenn sie an mindestens ein bereits eigenes Grundstück angrenzen.

Freie Grundstücke werden über eine verdeckte Auktion vergeben.

Bei identischen Höchstgeboten findet sofort eine Stichauktion zwischen den beteiligten Spielern statt.

Die Gewinner erhalten das Grundstück zu Beginn der nächsten Runde.

---

# 7. Harvester

Harvester sind universelle Maschinen.

Eigenschaften:

- ein Harvester pro Grundstück
- ein Harvester produziert immer genau **eine Ressource**
- die Produktionsart kann während der Planungsphase geändert werden
- Harvester werden unabhängig von Grundstücken gebaut
- fertige Harvester stehen zunächst als freie Harvester im HQ bereit
- freie Harvester können auf jedem eigenen, unbestrittenen Grundstück eingesetzt werden
- Produktion richtet sich nach der Eignung des Grundstücks für die aktuell produzierte Ressource
- Harvester können beschädigt oder zerstört werden

Der Bau neuer Harvester kostet im aktuellen Prototyp **30 Credits und 3 Erz**. Ein zusätzlicher Energiepreis bleibt eine mögliche Balancing-Option.

Neue Harvester werden während der Planungsphase in Auftrag gegeben.

Die Baukosten werden sofort bezahlt.

Zu Beginn der folgenden Runde stehen alle fertiggestellten Harvester als freie Harvester im Hauptquartier bereit.

Die Anzahl gleichzeitig gebauter Harvester wird ausschließlich durch die verfügbaren Ressourcen begrenzt.

## Energieverbrauch

Jeder aktive Harvester benötigt pro Runde **eine Einheit Energie**.

Die Versorgung der Kolonie beziehungsweise des HQ hat Vorrang. Nur die danach noch verfügbare Energie kann für Harvester verwendet werden.

Steht nicht genügend Energie für alle Harvester zur Verfügung, werden Harvester automatisch deaktiviert.

Die Deaktivierung erfolgt in folgender Reihenfolge:

1. niedrigste Sternewertung der aktuell produzierten Ressource
2. Produktionsart
   - 💎 Kristalle
   - ⛏ Erz
   - ⚡ Energie
   - 🌾 Nahrung
3. größte Entfernung zum Hauptquartier
4. zufällige Auswahl bei vollständigem Gleichstand

Ein deaktivierter Harvester verbraucht in dieser Runde keine Energie und produziert keine Ressource. Sobald wieder genügend Energie verfügbar ist, wird er automatisch reaktiviert.

## Produktionswechsel

Die Produktionsart eines Harvesters kann während der Planungsphase geändert werden.

Die Umrüstung auf demselben Grundstück dauert eine Übergangsrunde.

Während dieser Runde benötigt der Harvester eine Einheit Energie und produziert bereits die neu gewählte Ressource mit **50 % Ertrag**. Bei ungeraden Produktionswerten wird zugunsten des Spielers auf die nächste ganze Einheit aufgerundet.

Ab der folgenden Runde produziert er die neu gewählte Ressource mit vollem Ertrag.

Steht für die Umrüstung keine Energie zur Verfügung, produziert der Harvester nichts und die Umrüstung pausiert bis zu einer späteren Runde mit ausreichender Energie.

## Harvester versetzen

Ein Harvester kann während der Planungsphase von seinem Grundstück entfernt werden und steht anschließend sofort wieder als freier Harvester im HQ zur Verfügung.

Wird ein bereits verwendeter Harvester auf einem Grundstück neu eingesetzt, benötigt die Einrichtung auf dem neuen Feld eine Übergangsrunde. Während dieser Runde verbraucht der Harvester eine Einheit Energie und produziert nichts.

Steht keine Energie zur Verfügung, pausiert die Einrichtung. Erst nach einer erfolgreich abgeschlossenen Einrichtungsrunde beginnt der Harvester mit der vollen Produktion.

Die erstmalige Platzierung eines bisher unbenutzten freien Harvesters benötigt keine Einrichtungsrunde. Er kann bereits in derselben Runde mit voller Leistung produzieren.

---

# 8. Produktion

Jeder aktive Harvester produziert genau eine Ressource.

Die produzierte Menge richtet sich nach der Eignung des Grundstücks.

Die tatsächliche Produktion schwankt leicht, um jede Runde abwechslungsreich zu gestalten.

Beispiel für ein ★★★-Feld:

- 25 % → 2 Einheiten
- 50 % → 3 Einheiten
- 25 % → 4 Einheiten

Die genauen Wahrscheinlichkeiten werden später im Balancing festgelegt.

Alle Harvester produzieren gleichzeitig.

---

# 9. Ressourcen

## Nahrung 🌾

- versorgt die Bevölkerung
- Überschüsse fördern das Bevölkerungswachstum
- wichtig für den Spielsieg

---

## Energie ⚡

- versorgt die Bevölkerung beziehungsweise das HQ
- versorgt alle aktiven Harvester
- jeder aktive Harvester benötigt eine Einheit Energie pro Runde

Die Versorgung der Bevölkerung beziehungsweise des HQ hat Vorrang.

Fehlt anschließend Energie für alle Harvester, werden sie nach der festgelegten Prioritätsregel automatisch deaktiviert.

---

## Erz ⛏

- Bau neuer Harvester
- Verkauf am Markt

Erz begrenzt gemeinsam mit Credits die Geschwindigkeit der Expansion.

---

## Kristalle 💎

- seltenste Ressource
- höchste Verkaufspreise
- wichtigste Einnahmequelle im späteren Spiel

---

## Credits 💰

Spielwährung.

Credits werden benötigt für:

- Grundstücksauktionen
- Bau neuer Harvester
- Markteinkäufe

---

# 10. Bevölkerung

Alle Einwohner einer Spieler-Kolonie leben im eigenen Koloniebereich des zentralen HQ.

Es existieren keine einzelnen Arbeiter auf den Grundstücken.

Die Bevölkerung ist die wichtigste Kennzahl der Kolonie und entscheidet am Ende einer Partie über den Sieger.

## Versorgung

Die Bevölkerung benötigt sowohl Nahrung als auch Energie.

Während der Planungsphase legt der Spieler über zwei Schieberegler fest, wie viel Nahrung und Energie die Bevölkerung in dieser Runde erhalten soll.

Vorläufige Versorgungsstufen je 10 Einwohner:

| Zuteilung je Ressource | Wirkung |
|---:|---|
| 0 Einheiten | Unterversorgung; die Bevölkerung schrumpft |
| 1 Einheit | Notversorgung; kein Wachstum |
| 2 Einheiten | normale Versorgung; leichtes Wachstum |
| 3 Einheiten | erhöhte Versorgung; stärkeres Wachstum |

Die Werte dienen zunächst als sinnvolle Ausgangsbasis für Playtests.

Beide Ressourcen sind für die Bevölkerungsentwicklung erforderlich. Die genaue Berechnung des gemeinsamen Effekts sowie die exakten Wachstums- und Schrumpfungsraten werden im Balancing festgelegt.

Der Spieler kann die Versorgung im Notfall bewusst reduzieren, um Nahrung oder Energie für andere Zwecke zurückzuhalten.

Mit wachsender Bevölkerung entwickelt sich auch das Hauptquartier optisch weiter.

---

# 11. Markt

Die Marktphase findet einmal pro Runde statt.

Jede Ressource wird nacheinander gehandelt:

1. 🌾 Nahrung
2. ⚡ Energie
3. ⛏ Erz
4. 💎 Kristalle

Vor dem Handel mit einer Ressource entscheidet jeder Spieler, ob er kaufen, verkaufen oder nicht teilnehmen möchte.

Käufer und Verkäufer handeln gleichzeitig auf einem gemeinsamen Markt.

Die Verkäufer starten am oberen Ende des Marktes.

Die Käufer starten am unteren Ende.

Durch die Bewegung ihres Avatars verändern die Spieler ihr Preisangebot.

Jeder Schritt verändert den Preis um einen Credit.

## Direkter Handel

Treffen sich Käufer und Verkäufer, beginnt der Handel sofort.

Solange Käufer und Verkäufer Kontakt halten, wird fortlaufend ungefähr alle **0,5 Sekunden eine Einheit** der Ressource übertragen.

Das Zeitintervall ist ein vorläufiger Balancing-Wert.

Der Handel endet, wenn:

- Käufer oder Verkäufer den Kontakt beenden
- der Verkäufer keine Einheiten mehr anbieten kann
- der Käufer nicht mehr genügend Credits besitzt

Der Käufer kann den Handel jederzeit beenden, indem er sich vom Verkäufer entfernt.

Der Verkäufer kann dem Käufer folgen und dadurch einen niedrigeren Preis akzeptieren.

Möchte der Käufer nicht weiterhandeln, muss er sich entsprechend vom Verkäufer entfernen.

Dadurch entsteht eine dynamische und humorvolle Preisverhandlung ohne Mengenmenüs oder zusätzliche Eingaben.

## Kolonielager

Das Kolonielager dient als neutraler Handelspartner.

Während der Marktphase können Spieler sowohl mit anderen Spielern als auch mit dem Kolonielager handeln.

Das Kolonielager kauft Ressourcen zu niedrigeren Preisen und verkauft sie zu höheren Preisen als ein direkter Handel zwischen Spielern.

Dadurch werden direkte Geschäfte zwischen Spielern belohnt, ohne den Handel mit dem Kolonielager zu erzwingen.

Nicht verkaufte Ressourcen verbleiben im Lager der eigenen Kolonie und können in späteren Runden verwendet werden.

Die genauen Marktpreise und ihre Anpassung an Angebot und Nachfrage werden später im Balancing festgelegt.

---

# 12. Ereignisse

Es gibt zwei Arten von Ereignissen.

## Globale Ereignisse

Betreffen alle Spieler.

Beispiele:

- Solarsturm
- Rekordernte
- Wirtschaftsboom
- Energiekrise

---

## Lokale Ereignisse

Betreffen einzelne Grundstücke oder Spieler.

Beispiele:

- Erdbeben
- neue Kristallader
- besonders fruchtbarer Boden
- beschädigter Harvester

Ereignisse sollen Abwechslung schaffen, ohne den Spielverlauf zufällig zu entscheiden.

Strategische Entscheidungen bleiben wichtiger als Glück.

---

# 13. Spielende

Eine Partie endet nach einer festgelegten Rundenzahl.

Standard:

15–20 Runden
(exakte Rundenzahl wird später im Balancing festgelegt)

Gewonnen hat der Spieler mit der größten Bevölkerung.

Bei Gleichstand entscheiden weitere Kriterien.

Die Reihenfolge wird später festgelegt.

Mögliche Tie-Breaker:

1. Credits
2. Gesamtwert der Kolonie
3. übrige Ressourcen

---

# 14. Version-2-Ideen

Diese Ideen gehören bewusst nicht zu Version 1.

## Spielmodi

- Race Mode
- Living World

## Siegbedingungen

- frei wählbare Siegbedingungen
- Bevölkerungsziel
- größtes Vermögen
- größte Fläche
- meiste Kristalle
- höchste Produktion

## Wirtschaft

- gemeinsame Harvester-Fabrik
- mehrere Märkte
- langfristige Handelsverträge

## Gameplay

- Forschung
- Diplomatie
- Grundstückshandel
- Konzerne
- Kampagne
- Multiplayer

---

# Offene Punkte

## Balancing

- Harvesterkosten
- Marktpreise und Preisentwicklung
- Produktionsmengen
- exakte Wachstums- und Schrumpfungsraten der Bevölkerung
- Zusammenspiel von Nahrungs- und Energieversorgung
- Rundung der Versorgung bei Bevölkerungszahlen außerhalb voller Zehnerschritte
- Übertragungsgeschwindigkeit im Markt
- Startwerte

---

## Kartengenerator

- Größe der Karte
- Anzahl der Startfelder
- Bewertung der Kartensektoren
- faire Startpositionen

---

## Benutzeroberfläche

- Mobile Layout
- Informationsdarstellung
- Harvesterverwaltung
- Auktionen
- Marktsteuerung
- Schieberegler für Nahrung und Energie

Der Statusblock soll während der Planung dauerhaft sichtbar sein und mindestens enthalten:

- Bevölkerung
- Credits
- Ressourcenbestände
- erwartete Produktion und Verbrauch
- aktuelle Versorgung
- freie Harvester
- Harvester im Bau
- aktive, deaktivierte und in Umrüstung befindliche Harvester

Änderungen gegenüber der vorherigen Runde sollen hervorgehoben werden.

---

## KI

- Expansionsstrategie
- Produktionsstrategie
- Marktstrategie

---

## Sound & Grafik

- HQ-Ausbaustufen
- Animationen
- Effekte
- Musik
