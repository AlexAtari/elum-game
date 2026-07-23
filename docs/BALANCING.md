# E.L.U.M.
## Balancing Document

**Version:** 0.2
**Status:** Draft  
**Last Updated:** 2026-07-23

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

## Grundstücks-Stichauktion

| Parameter | Vorläufiger Wert |
|---|---:|
| Ankündigungszeit | 5 Sekunden |
| Dauer | 10 Sekunden |
| Gebotsschritt | 1 Credit |
| Eingabesperre zwischen Schritten | 0,3 Sekunden |
| Orions Schrittintervall | 1,1 Sekunden |

Bei identischen verdeckten Höchstgeboten werden die reservierten Credits zunächst wieder freigegeben. Der Startpreis der Stichauktion beträgt Gleichstandsgebot plus einen Credit. In der grafischen Stichauktion darf kein Teilnehmer oberhalb seiner verfügbaren Credits bieten. Wer einen Preis zuerst erreicht, bleibt bei einem anschließenden Gleichstand in Führung; die Führung wechselt erst bei einem höheren Gebot oder wenn der Führende seinen Balken bewusst bis zu einem wartenden Spieler zurückzieht. Ein abgegebenes Gebot kann nicht unter den Startpreis gesenkt werden. Der Führende wird durch einen pulsierenden Blinkeffekt sichtbar gemacht. Aktiviert niemand den Startpreis, bleibt das Feld frei. Der Gewinner bezahlt sein tatsächliches Schlussgebot.

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

Vorläufige Werte für Nahrung, Energie, Erz und Kristalle:

| Parameter | Nahrung | Energie | Erz | Kristalle |
|---|---:|---:|---:|---:|
| Orientierungspreis zu Spielbeginn | 8 Credits | 8 Credits | 15 Credits | 40 Credits |
| HQ-Ankaufspreis | Orientierung −3 | Orientierung −3 | Orientierung −5 | Orientierung −10 |
| HQ-Verkaufspreis | Orientierung +3 | Orientierung +3 | Orientierung +5 | Orientierung +10 |
| HQ-Lagerbestand zu Spielbeginn | 20 | 20 | 20 | 10 |
| minimale Orientierung | 3 Credits | 3 Credits | 5 Credits | 15 Credits |
| maximale Orientierung | 17 Credits | 17 Credits | 30 Credits | 80 Credits |

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
| sichtbare Bedenkzeit von Orion | 1,2 Sekunden |
| Menge je abgeschlossener Transaktion | 1 Einheit |
| Orions Wunschmenge je Ressourcenauktion | 4 Einheiten |
| Orions Höchstpreis als Käufer | Orientierungspreis +1 |
| Orions Mindestpreis als Verkäufer | Orientierungspreis −1 |
| erste Handelsstufe | 1 Einheit je Sekunde |
| zweite Stufe nach 3 Sekunden Kontakt | 1 Einheit je 0,65 Sekunden |
| dritte Stufe nach 6 Sekunden Kontakt | 1 Einheit je 0,35 Sekunden |

Bei mehreren passenden Partnern entscheidet zunächst die Ankunftsreihenfolge. Nach jeder einzeln übertragenen Einheit wird die Reihenfolge erneut ausgewertet.

Im ersten KI-Prototyp wählt Orion nach kurzer sichtbarer Bedenkzeit die Gegenrolle des Spielers. Bei jeder vierten Kombination aus Runde und Ressource setzt Orion testweise aus; das HQ-Lager bleibt dann als Handelspartner verfügbar. Eine spätere KI-Version entscheidet anhand eigener Vorräte und Credits unabhängig.

## Marktzeiten

| gespielte Runde | Ankündigungszeit | Rollenwahl | Auktionszeit |
|---:|---:|---:|---:|
| 1 | 5 Sekunden | 5 Sekunden | 30 Sekunden |
| 2 | 4 Sekunden | 5 Sekunden | 25 Sekunden |
| ab 3 | 3 Sekunden | 5 Sekunden | 20 Sekunden |

Nimmt niemand an einem Ressourcenmarkt teil, entfällt die Auktionszeit vollständig.

Jede Ressource kann pro Runde global genau einmal initiiert werden. Das Recht wird bereits beim Aufruf verbraucht und zu Beginn der nächsten Runde für alle vier Ressourcen erneuert.

## Vorläufige KI-Kolonien

Orion, Nova und Vega besitzen eigene gespeicherte Koloniezustände. Ihre erste technische Rundenroutine verwendet dieselbe Normalversorgung wie Agima und produziert pro Harvester drei Einheiten nach einem festen, koloniespezifischen Produktionszyklus.

| Kolonie | Produktionszyklus |
|---|---|
| Orion | Nahrung → Energie → Erz |
| Nova | Nahrung → Energie → Nahrung → Erz |
| Vega | Energie → Erz → Nahrung → Erz |

Die Routine ist bewusst deterministisch, damit Playtests wiederholbar bleiben. Credits, Harvesterzahl und Grundstücke verändern sich in dieser Stufe noch nicht automatisch. Diese Werte werden erst durch die folgenden KI-Aktionen und die Anbindung an Markt und Grundstücksauktion verändert.

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
