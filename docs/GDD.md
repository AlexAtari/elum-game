# E.L.U.M.
## Exploration, Logistics, Utilization & Mining

# Game Design Document

**Version:** 0.4 "Core Gameplay"
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
- Marktauftrag festlegen

## 3. Grundstücksauktionen

- Alle Gebote werden gleichzeitig aufgedeckt.
- Der Höchstbietende gewinnt.
- Gleichstände werden unmittelbar über eine Stichauktion entschieden.

Das Grundstück wird jedoch erst zu Beginn der nächsten Runde übertragen.

## 4. Harvester einsetzen

Alle freien Harvester werden auf bereits eigene, unbestrittene Grundstücke gesetzt.

Neu eingesetzte Harvester produzieren bereits in derselben Runde.

## 5. Produktion

Alle aktiven Harvester produzieren gleichzeitig.

## 6. Versorgung

Die Kolonie verbraucht Nahrung und Energie.

Anschließend werden alle aktiven Harvester mit Energie versorgt.

## 7. Bevölkerungsentwicklung

Die Bevölkerung wächst oder stagniert abhängig von der Versorgung.

## 8. Markt

Alle Kauf- und Verkaufsaufträge werden gleichzeitig ausgeführt.

Anschließend werden die Marktpreise angepasst.

## 9. Rundenende

Prüfung auf Spielende.

Falls das Spiel nicht beendet ist, beginnt die nächste Runde.

---

# 5. Spielkarte

Die Karte besteht aus Hexfeldern.

Eigenschaften:

- gemeinsames Hauptquartier in der Kartenmitte
- jeder Spieler startet mit zwei automatisch zugewiesenen Startgrundstücken
- faire, symmetrisch erzeugte Startsektoren
- leichte Zufallsvariationen innerhalb der einzelnen Sektoren
- pro Partie zufällig generierte Karte
- Nebel des Krieges
- Expansion nur über angrenzende Grundstücke
- Bodeneignung vor dem Kauf sichtbar
- Besonderheiten nach dem Kauf sichtbar

Der Kartengenerator soll dafür sorgen, dass alle Spieler statistisch gleichwertige Startbedingungen erhalten.

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
- die Produktionsart kann vor jeder Produktionsphase geändert werden
- Harvester werden unabhängig von Grundstücken gebaut
- fertige Harvester stehen zunächst als freie Harvester im HQ bereit
- freie Harvester können auf jedem eigenen, unbestrittenen Grundstück eingesetzt werden
- Produktion richtet sich nach der Bodeneignung
- Harvester können beschädigt oder zerstört werden

Der Bau neuer Harvester kostet Credits und Erz.

Die Anzahl neu gebauter Harvester wird ausschließlich durch verfügbare Ressourcen begrenzt.

Jeder aktive Harvester benötigt Energie.

Steht nicht genügend Energie zur Verfügung, deaktiviert das Spiel automatisch Harvester nach einer noch festzulegenden Prioritätsregel.
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

- versorgt das Hauptquartier
- versorgt alle aktiven Harvester

Fehlt Energie, werden Harvester automatisch deaktiviert.

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

Alle Einwohner leben ausschließlich im gemeinsamen Hauptquartier.

Es existieren keine einzelnen Arbeiter auf den Grundstücken.

Die Bevölkerung:

- wächst bei guter Versorgung
- stagniert bei knapper Versorgung
- kann bei anhaltender Unterversorgung schrumpfen

Die Bevölkerung ist die wichtigste Kennzahl der Kolonie.

Sie entscheidet am Ende einer Partie über den Sieger.

Mit wachsender Bevölkerung entwickelt sich auch das Hauptquartier optisch weiter.

---

# 11. Markt

Jeder Spieler kann pro Runde genau einen Marktauftrag erteilen.

Möglichkeiten:

- Ressourcen kaufen
- Ressourcen verkaufen
- nichts tun

Alle Aufträge werden gleichzeitig ausgeführt.

Danach werden die Marktpreise anhand von Angebot und Nachfrage für die nächste Runde angepasst.

Die genaue Preisberechnung wird im Balancing definiert.

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
- Marktpreise
- Produktionsmengen
- Bevölkerungswachstum
- Energieverbrauch
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