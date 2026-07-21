# E.L.U.M.
## Balancing Document

**Version:** 0.2
**Status:** Draft  
**Last Updated:** 2026-07-21

---

# 1. Ziel

Dieses Dokument enthält alle veränderbaren Zahlenwerte von E.L.U.M.

Die Werte sind zunächst Testwerte. Sie werden durch Paper-Playtests, Simulationen und spätere Testpartien angepasst.

Grundsatz:

> Zuerst Zahlen verändern, erst danach Regeln.

---

# 2. Partie

| Parameter | Startwert |
|---|---:|
| Spieler | 2–4 |
| Runden | 15 |
| Zielspielzeit | 20–30 Minuten |
| Aktionspunkte pro Runde | 3 |
| Maximal ansparbare Aktionspunkte | 5 |
| Aktionspunkte in Runde 1 | unbegrenzt |

---

# 3. Spielstart pro Spieler

| Parameter | Startwert |
|---|---:|
| Hauptquartier | 1 |
| Harvester | 2 |
| Grundstücke | 0 |
| Credits | 100 |
| Bevölkerung | 20 |
| Nahrung | 4 |
| Energie | 4 |
| Erz | 2 |
| Kristalle | 0 |
| Sichtbare Startfelder | 4 |
| In Runde 1 kaufbare Startfelder | 2 |

---

# 4. Kosten

| Objekt oder Aktion | Kosten |
|---|---:|
| Grundstück | 25 Credits |
| Harvester | 30 Credits + 3 Erz |
| Produktion eines Harvesters ändern | 1 AP |
| Harvester auf anderes eigenes Feld versetzen | 2 AP |
| Grundstück kaufen | 1 AP |
| Marktauftrag abgeben | 0 AP |

Für Version 0.1 können Grundstücke nicht verkauft werden.

---

# 5. Produktion

Die Sterne eines Grundstücks entsprechen dem durchschnittlichen Ertrag.

| Eignung | Möglicher Ertrag |
|---|---|
| 0 Sterne | 0 |
| 1 Stern | 0 / 1 / 2 |
| 2 Sterne | 1 / 2 / 3 |
| 3 Sterne | 2 / 3 / 4 |
| 4 Sterne | 3 / 4 / 5 |
| 5 Sterne | 4 / 5 / 6 |

Standardwahrscheinlichkeit:

| Ergebnis | Wahrscheinlichkeit |
|---|---:|
| Grundwert −1 | 25 % |
| Grundwert | 50 % |
| Grundwert +1 | 25 % |

Der Ertrag kann niemals negativ sein.

Kristalle können nur produziert werden, wenn nach dem Kauf ein Kristallvorkommen entdeckt wurde.

## Umrüstung und Versetzung

| Aktion | Energie in der Übergangsrunde | Produktion in der Übergangsrunde |
|---|---:|---:|
| erstmaliger Einsatz eines unbenutzten Harvesters | 1 | 100 % |
| Produktionswechsel auf demselben Feld | 1 | 50 % der neuen Ressource, aufgerundet |
| Versetzung auf ein anderes Feld | 1 | 0 % |
| folgende Runde nach erfolgreichem Übergang | 1 | 100 % |

Fehlt die benötigte Energie, pausiert die Umrüstung oder Einrichtung und wird in einer späteren Runde fortgesetzt.

---

# 6. Versorgung

## Bevölkerung

| Parameter | Startwert |
|---|---:|
| Nahrung je 10 Einwohner | 1 |
| Energie je 20 Einwohner | 1 |

Bei 20 Einwohnern benötigt das HQ daher:

- 2 Nahrung
- 1 Energie

## Harvester

| Parameter | Startwert |
|---|---:|
| Energie je aktivem Harvester | 1 |

Versorgungsreihenfolge:

1. HQ-Energie
2. aktive Harvester
3. verbleibende Energie zählt als Überschuss

Bei Energiemangel entscheidet der Spieler, welche Harvester stillstehen.

---

# 7. Bevölkerungswachstum

Wachstum entsteht nur bei einem Überschuss an Nahrung und Energie.

| Überschuss nach Versorgung | Wachstumspunkte |
|---|---:|
| mindestens 2 Nahrung und 1 Energie | 1 |
| mindestens 4 Nahrung und 2 Energie | 2 |
| mindestens 6 Nahrung und 3 Energie | 3 |

Für jeweils 5 Wachstumspunkte erhält die Kolonie:

- +5 Einwohner

Nicht genutzte Wachstumspunkte bleiben erhalten.

---

# 8. Hunger und Energiemangel

## Nahrungsmangel

| Dauer | Folge |
|---|---|
| 1 Runde | kein Bevölkerungswachstum |
| 2 Runden in Folge | −5 Einwohner |
| jede weitere Runde | weitere −5 Einwohner |

## Energiemangel

- Das HQ wird zuerst versorgt.
- Danach werden so viele Harvester aktiviert, wie Energie verfügbar ist.
- Harvester ohne Energie produzieren in dieser Runde nichts.

Grundstücke und Harvester gehen durch normalen Versorgungsmangel nicht verloren.

---

# 9. Lager

| Ressource | Startkapazität |
|---|---:|
| Nahrung | 20 |
| Energie | 20 |
| Erz | 20 |
| Kristalle | 20 |

Produktion oberhalb der Lagerkapazität verfällt.

Lagerausbau gehört nicht zu Version 1.

---

# 10. Markt

## Startpreise

| Ressource | Credits je Einheit |
|---|---:|
| Nahrung | 8 |
| Energie | 8 |
| Erz | 15 |
| Kristalle | 40 |

## Preisbewegung

Vorläufige Werte für den Nahrungsmarkt:

| Parameter | Testwert |
|---|---:|
| Orientierungspreis zu Spielbeginn | 8 Credits |
| HQ-Ankaufspreis | Orientierungspreis −3 |
| HQ-Verkaufspreis | Orientierungspreis +3 |
| HQ-Lagerbestand zu Spielbeginn | 20 Nahrung |
| minimale Orientierung | 3 Credits |
| maximale Orientierung | 17 Credits |

Der neue Orientierungspreis gilt ab der nächsten Runde.

| Nettoveränderung des HQ-Bestands | Preisänderung nächste Runde |
|---|---:|
| 1–3 Einheiten Zufluss | −1 Credit |
| 4–6 Einheiten Zufluss | −2 Credits |
| ab 7 Einheiten Zufluss | −3 Credits |
| 1–3 Einheiten Abfluss | +1 Credit |
| 4–6 Einheiten Abfluss | +2 Credits |
| ab 7 Einheiten Abfluss | +3 Credits |

Direkter Handel mit einer anderen Kolonie beeinflusst diesen Lagerwert nicht.

## Bewegung und Einzelhandel

| Parameter | Testwert |
|---|---:|
| maximaler Bewegungstakt für alle Teilnehmer | 1 Preisschritt je 0,3 Sekunden |
| Menge je abgeschlossener Transaktion | 1 Einheit |
| Orions Wunschmenge je Ressourcenauktion | 4 Einheiten |
| Orions Höchstpreis als Käufer | Orientierungspreis +1 |
| Orions Mindestpreis als Verkäufer | Orientierungspreis −1 |
| erste Handelsstufe | 1 Einheit je Sekunde |
| zweite Stufe nach 3 Sekunden Kontakt | 1 Einheit je 0,65 Sekunden |
| dritte Stufe nach 6 Sekunden Kontakt | 1 Einheit je 0,35 Sekunden |

Bei mehreren passenden Partnern entscheidet zunächst die Ankunftsreihenfolge. Nach jeder einzeln übertragenen Einheit wird die Reihenfolge erneut ausgewertet.

## Marktzeiten

| gespielte Runde | Positionierungszeit | Auktionszeit |
|---:|---:|---:|
| 1–3 | 8 Sekunden | 30 Sekunden |
| 4–7 | 6 Sekunden | 25 Sekunden |
| ab 8 | 5 Sekunden | 20 Sekunden |

Nimmt niemand an einem Ressourcenmarkt teil, entfällt die Auktionszeit vollständig.

---

# 11. Kartenwerte

| Spieler | Kartenumfang |
|---|---:|
| 2 | 37 Hexfelder |
| 3 | 49 Hexfelder |
| 4 | 61 Hexfelder |

Startregion:

- HQ plus vier sichtbare Nachbarfelder
- mindestens ein gutes Nahrungsfeld
- mindestens ein gutes Energiefeld
- mindestens ein gutes Erzfeld
- keine garantierten Kristalle

Expansion ist nur über Felder möglich, die an eigenes Land oder das HQ angrenzen.

---

# 12. Spielende und Vermögen

Vorläufige Wertung:

| Bestandteil | Wert |
|---|---:|
| Credits | 1:1 |
| Grundstück | ursprünglicher Kaufpreis |
| Harvester | 20 Credits |
| gelagerte Ressource | aktueller Marktpreis |
| Einwohner | 1 Credit je Einwohner |

Der Spieler mit dem höchsten Gesamtvermögen gewinnt.

Bei Gleichstand entscheidet:

1. höhere Bevölkerung
2. mehr Grundstücke
3. mehr Credits

---

# 13. Zu beobachtende Fragen im Playtest

- Ist Energie dauerhaft knapp genug?
- Wird zu viel Nahrung angesammelt?
- Wächst die Bevölkerung zu schnell?
- Sind Kristalle zu mächtig?
- Werden neue Harvester früh genug gebaut?
- Sind drei Aktionspunkte ausreichend?
- Ist das Versetzen eines Harvesters mit zwei AP zu teuer?
- Ist eine Energie für Umrüstung und Einrichtung angemessen?
- Ist die aufgerundete Produktion von 50 % während der Umrüstung zu hoch oder zu niedrig?
- Ist eine vollständige Ausfallrunde nach einer Versetzung angemessen?
- Werden Grundstücke regelmäßig gekauft?
- Entstehen mehrere sinnvolle Strategien?
- Bleibt eine Partie innerhalb von 20–30 Minuten?

---

# 14. Noch nicht festgelegt

- genaue Kartenverteilung
- Wahrscheinlichkeit von Kristallvorkommen
- Häufigkeit und Stärke von Ereignissen
- Kosten für beschädigte Harvester
- endgültige Vermögensgewichtung
- Koloniestufen und technologische Boni
