# E.L.U.M.
## Balancing Document

**Version:** 0.1  
**Status:** Draft  
**Last Updated:** 2026-07-19

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

Alle Käufe und Verkäufe werden zum aktuellen Preis ausgeführt.

Der neue Preis gilt ab der nächsten Runde.

| Verhältnis von Nachfrage zu Angebot | Preisänderung |
|---|---:|
| deutlich mehr Nachfrage | +20 % |
| etwas mehr Nachfrage | +10 % |
| ungefähr ausgeglichen | 0 % |
| etwas mehr Angebot | −10 % |
| deutlich mehr Angebot | −20 % |

Der Preis kann in einer Runde maximal um 20 % steigen oder fallen.

Alle gewünschten Mengen werden ausgeführt. Der Marktbestand ist in Version 1 unbegrenzt.

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