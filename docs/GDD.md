# E.L.U.M.
## Exploration, Logistics, Utilization & Mining

**Game Design Document**

**Version:** 0.2 "Foundation"
**Status:** Draft
**Last Updated:** 2026-07-19

---

# 1. Vision

E.L.U.M. ist ein rundenbasiertes Strategiespiel für Smartphones, inspiriert vom Klassiker M.U.L.E.

Die Spieler gründen auf dem Planeten **Agima** eine Kolonie, erschließen neue Gebiete, bauen Ressourcen ab und entwickeln ihre Siedlung zur erfolgreichsten Kolonie des Planeten.

Eine Partie dauert etwa **20–30 Minuten**.

Das Spiel soll leicht zu erlernen, aber schwer zu meistern sein.

---

# 2. Designprinzipien

Während der gesamten Entwicklung gelten folgende Grundsätze:

- Easy to learn. Difficult to master.
- Mobile First.
- Wenige Regeln – viele Entscheidungen.
- Jede Ressource muss dauerhaft wichtig bleiben.
- Neue Mechaniken dürfen das Spiel nicht unnötig komplizierter machen.

---

# 3. Spielziel

Gewonnen hat der Spieler mit dem höchsten Gesamtvermögen nach der letzten Runde.

Das Vermögen setzt sich zusammen aus:

- Credits
- Grundstücken
- Harvestern
- gelagerten Ressourcen
- Bevölkerung

Die Gewichtung wird später im Balancing definiert.

---

# 4. Spielablauf

Jede Partie dauert etwa 15–20 Runden.

Jede Runde besteht aus:

1. Weltereignis
2. Grundstücke kaufen
3. Harvester verwalten
4. Produktion
5. Versorgung
6. Bevölkerungswachstum
7. Markt
8. Rundenabschluss

---

# 5. Spielkarte

Die Karte besteht aus Hexfeldern.

Eigenschaften:

- pro Partie zufällig generiert
- faire Startregionen
- Nebel des Krieges
- Expansion nur über angrenzende Grundstücke
- Bodeneignung vor Kauf sichtbar
- Besonderheiten nach Kauf sichtbar

---

# 6. Grundstücke

Jedes Feld besitzt für jede Ressource eine Qualität von 0 bis 3 Sternen.

Diese Qualität ist vor dem Kauf sichtbar.

Beispiel:

Nahrung ★★★

Energie ★

Erz ★★

Kristalle ☆

Zusätzlich besitzt jedes Feld versteckte Eigenschaften.

Diese werden erst nach dem Kauf sichtbar.

Beispiele:

- Kristallvorkommen
- besonders fruchtbarer Boden
- instabiler Untergrund

---

# 7. Harvester

Harvester sind universelle Maschinen.

Eigenschaften:

- ein Harvester pro Grundstück
- Ressource jederzeit wechselbar
- Produktion richtet sich nach Bodeneignung
- können beschädigt oder zerstört werden

Jeder Harvester benötigt pro Runde Energie.

Steht nicht genügend Energie zur Verfügung, können einzelne Harvester nicht betrieben werden.

Der Spieler entscheidet selbst, welche Harvester aktiv bleiben.

---

# 8. Produktion

Der Ertrag richtet sich nach der Sternenbewertung des Feldes.

Die tatsächliche Produktion schwankt leicht.

Beispiel:

★★★ Feld

- 25 % → 2 Einheiten
- 50 % → 3 Einheiten
- 25 % → 4 Einheiten

Dadurch bleibt jede Runde leicht unvorhersehbar.

---

# 9. Ressourcen

## Nahrung

- versorgt die Bevölkerung
- Überschüsse fördern das Wachstum

## Energie

- versorgt die Kolonie
- versorgt alle Harvester

## Erz

- Bau neuer Harvester
- Verkauf am Markt

## Kristalle

- selten
- höchste Verkaufspreise

## Credits

Spielwährung.

---

# 10. Bevölkerung

Alle Einwohner leben ausschließlich im Hauptquartier.

Es gibt keine Arbeiter auf einzelnen Feldern.

Die Bevölkerung:

- wächst
- kann schrumpfen
- erhöht den Gesamtwert der Kolonie

Das Hauptquartier entwickelt sich optisch mit wachsender Bevölkerung.

---

# 11. Markt

Jeder Spieler darf einmal pro Runde handeln.

Es gibt drei Möglichkeiten:

- kaufen
- verkaufen
- nichts tun

Alle Transaktionen werden gleichzeitig ausgeführt.

Angebot und Nachfrage verändern die Marktpreise für die nächste Runde.

---

# 12. Ereignisse

Es existieren:

- globale Ereignisse
- lokale Ereignisse

Beispiele:

- Erdbeben
- Rekordernte
- Solarsturm
- neue Kristallader

---

# 13. Spielende

Nach der letzten Runde wird das Gesamtvermögen berechnet.

Der Spieler mit dem höchsten Vermögen gewinnt.

---

# 14. Version-2-Ideen

Diese Ideen gehören bewusst **nicht** zu Version 1:

- Forschung
- Aktienmarkt
- Konzerne
- Grundstückshandel
- Diplomatie
- Multiplayer
- Kampagne

---

# Offene Punkte

- Balancing
- Ereignisliste
- KI
- Benutzeroberfläche
- Sound
- Animationen