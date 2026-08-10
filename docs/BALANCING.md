# E.L.U.M.
## Balancing Document

**Version:** 0.2
**Status:** Draft  
**Last Updated:** 2026-08-01

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
| Runden Standardmodus | 20 |
| Zielspielzeit | zunächst 35–45 Minuten, neu zu messen |
| möglicher Schnellmodus | 15 Runden, später festzulegen |

Der Standardmodus mit 20 Runden ist im Browser und in der
Headless-Simulation aktiv. Die bisherige 15-Runden-Basis ist damit nur
noch ein möglicher, nicht implementierter Schnellmodus.

## Aktuelle Simulationsbasis

Der reproduzierbare Referenzlauf umfasst 200 vollständige Partien mit
Markt und den Seeds 1 bis 200. Die Siegquote wird mit derselben
lexikografischen Wertung wie im Browser bestimmt.

| Kolonie | Siegquote | Ø Rang | Ø Bevölkerung | Ø Abrechnungsvermögen |
|---|---:|---:|---:|---:|
| Agima | 10,0 % | 2,85 | 19,6 | 209,5 |
| Orion | 8,5 % | 2,98 | 19,1 | 213,9 |
| Nova | 34,0 % | 1,94 | 21,5 | 59,2 |
| Vega | 47,5 % | 1,85 | 22,4 | 24,6 |

Der breitere Ökonomiewert aus Ressourcen, Bevölkerung, Harvestern und
Land dient ausschließlich der Diagnose. Er ist kein
Gleichstandskriterium.

Der Lauf erzeugt durchschnittlich 164,2 Markttransaktionen und 2,67
Versorgungssignale je Partie. 2,5 % des Volumens sind direkte
Geschäfte zwischen Kolonien.

Das auf 15 Nahrung, 15 Energie und 6 Erz erhöhte Startlager reduziert
die frühen Engpässe deutlich. Im aktuellen Lauf treten 240
Bevölkerungsrückgänge, 266 leere Nahrungs- und nur noch 9 leere
Energiebestände auf. Gleichzeitig profitieren die expansiven Profile
überproportional: Die Siegquote reicht nun von 8,5 bis 47,5 Prozent.
Die Startreserve ist als Spielregel übernommen; die dadurch sichtbar
gewordene Profilverschiebung bleibt ein offener Balancingpunkt.

### Isolierter Vergleich: geglätteter Normalbedarf

Die folgenden Varianten wurden noch gegen den früheren Startbestand
von 10 Nahrung, 10 Energie und 5 Erz gemessen. Die
Headless-Simulation kann neben dem unveränderten Standardmodell
`grouped` eine reine Analysevariante `smoothed` ausführen. Dort bleibt
der Normalbedarf bis zehn Einwohner bei zwei Einheiten und steigt
anschließend alle fünf Einwohner um eine Einheit: 11–15 Einwohner
benötigen drei, 16–20 wieder vier Einheiten Nahrung und HQ-Energie.
Browser und Multiplayer verwenden weiterhin ausschließlich die
Gruppenregel.

Im Vergleich derselben 200 Seeds reduziert die geglättete Variante
die Versorgungssignale von 8,70 auf 4,20 und erhöht die Fernzonenquote
von 11,0–20,5 Prozent auf 29,0–55,0 Prozent. Gleichzeitig steigen
vollständig leere Nahrungslager von 259 auf 433 Fälle, Vega endet im
Mittel nur noch mit 36,8 Credits, und die Siegquote reicht von
18,0 bis 37,0 Prozent. Die Glättung bestätigt damit den
Versorgungssprung als Expansionsbremse, ist in dieser Form aber noch
nicht als neue Spielregel freigegeben.

### Isolierter Vergleich: höhere Grundproduktion

Eine zweite Headless-Variante lässt die Gruppenversorgung unverändert
und erhöht stattdessen in jeder zweiten Runde die Produktion jedes
aktiven Nahrungs- oder Energieharvesters um eine Einheit. Erz und
Kristalle erhalten keinen Bonus. Das entspricht im Mittel einer
halben zusätzlichen Einheit je geeignetem Harvester und Runde.

Über dieselben 200 Seeds sinken die Versorgungssignale von 8,70 auf
3,91. Leere Nahrungslager gehen von 259 auf 195, leere Energielager
von 137 auf 10 zurück. Der direkte Handelsanteil steigt von 1,5 auf
3,8 Prozent, und die Fernzonenquote erreicht 24,5 bis 42,5 Prozent.
Gleichzeitig steigt die mittlere Endbevölkerung von 16,9–17,6 auf
22,9–24,1, während sich die Siegquoten auf 14,5 bis 33,0 Prozent
spreizen. Die Variante ist damit der bessere Versorgungskandidat,
aber noch keine freigegebene Browser- oder Multiplayer-Regel.

### Mittelspielmessung und gezielter Energievergleich

Die Seriensimulation wertet die Runden 5–12 jetzt zusätzlich je
Agentenprofil aus. Gemessen werden Produktion und Verbrauch von
Nahrung und Energie, Lagerstände, Harvester-Energieausfälle, freie
Harvester, Marktteilnahmen und Versorgungssignale. Die Produktion
wird aus Lageränderung, tatsächlichem Verbrauch und dem Marktfluss
derselben Runde rekonstruiert.

Im früheren Referenzlauf mit 10 Nahrung, 10 Energie und 5 Erz liegt
die Nahrungsproduktion im
Mittelspiel je nach Kolonie bei 2,9–3,4 Einheiten gegenüber 3,5–4,0
Verbrauch. Energie liegt bei 4,0–4,6 Produktion gegenüber 4,4–5,2
Gesamtverbrauch. Harvester fallen deshalb in 52,4–67,7 Prozent der
Mittelspielrunden aus. Gleichzeitig stehen nur 0,03–0,23 Harvester
je Kolonie und Runde ungenutzt bereit. Der Engpass ist damit nicht
eine allgemein zu hohe Harvesterzahl, sondern die laufende
Versorgung der eingesetzten Harvester.

Die reine Analysevariante `energy-boosted` gibt ausschließlich
Energieharvestern in jeder zweiten Runde eine zusätzliche Einheit.
Über dieselben 200 Seeds sinken leere Energielager von 137 auf 5 und
die Mittelspiel-Ausfallquote auf 27,6–48,7 Prozent. Der direkte
Handelsanteil steigt von 1,5 auf 3,0 Prozent. Gleichzeitig wächst die
Endbevölkerung auf 21,6–22,5, Nahrungsleerstände steigen von 259 auf
282 und die Siegquote spreizt sich auf 13,5–35,5 Prozent. Daher wird
auch diese Variante nicht als Browser- oder Multiplayer-Regel
übernommen. Als nächster Kandidat ist die Energie-Notfalllogik zu
untersuchen, ohne Produktion oder Bevölkerungswachstum pauschal zu
erhöhen.

Jede Kolonie startet mit einer Kristallprobe im Lager. Agenten mit
Kristallreserve 0 dürfen sie anbieten; Agenten mit Reserve 1 behalten
sie zunächst. Dadurch übernimmt der interstellare Käufer im
Referenzlauf durchschnittlich 1,0 Kristall je Partie. Die Probe stammt
nicht von einem Startgrundstück; alle Startfelder bleiben
kristallfrei. Pro Partie entstehen weiterhin durchschnittlich
2,4 Meteore. Die Seriensimulation vergibt jetzt ausschließlich
kristallfreie Startgrundstücke und misst die Folgeexpansion direkt:
Nach dem dritten Harvester dürfen Agenten bis zu zwei zusätzliche
Prospektionsfelder zum Mindestgebot erschließen. Diese Route ist bei
akuter Versorgungskrise gesperrt, hält 10 Credits Restreserve und
bewertet äußere angrenzende Felder stärker, ohne deren Ressourcenwert
zu ignorieren. Mit dem erhöhten Startlager erreichen die Kolonien die
Fernzone nun in 44,5 bis 68,5 Prozent und natürliche Aderausläufer in
44,5 bis 50,5 Prozent der Partien. Die durchschnittlich größte
HQ-Distanz liegt bei 4,4 bis 4,7.

Für den Ausbau von zwei auf drei Harvester gilt ein gemeinsames,
profilunabhängiges Sicherheitsfenster. Die Kolonie muss die
unmittelbar folgende Runde vollständig mit Nahrung und Energie
versorgen können; dabei zählt der Energiebedarf des neuen Harvesters
bereits mit. Nach den Baukosten müssen 20 Credits übrig bleiben.
Kritische Versorgung sperrt auch diesen Bau.

Steht ein fertiggestellter Harvester mangels Grundstück brach, darf
die Kolonie genau das Mindestgebot auf ein freies angrenzendes Feld
setzen, sofern der gemeinsame Kreditpuffer von 20 Credits erhalten
bleibt. Das ist notwendige Produktionsinfrastruktur, keine optionale
Überbietung. Alle weiteren Harvester und höheren Landgebote verwenden
wieder die profilabhängigen Mehr-Runden- und Kreditreserven.

Nach dieser ersten Produktionsausweitung darf eine Kolonie höchstens
zwei weitere unbewirtschaftete Prospektionsfelder besitzen. Sie bietet
dort ebenfalls nur den Mindestpreis, behält mindestens 10 Credits und
startet keinen Kauf bei akut unzureichender Versorgung. Diese Felder
bilden eine äußere Route; sie erzeugen ohne Harvester noch keinen
Ertrag.

---

# 3. Spielstart pro Spieler

| Parameter | Startwert |
|---|---:|
| Hauptquartier | 1 |
| Harvester | 2 |
| Grundstücke | 2 |
| Credits | 150 |
| Bevölkerung | 10 |
| Nahrung | 15 |
| Energie | 15 |
| Erz | 6 |
| Kristalle | 1 |

Der Startkristall ist eine mitgebrachte Probe im Lager und kein Ertrag
der kristallfreien Startgrundstücke.

---

# 4. Kosten

| Objekt oder Aktion | Kosten |
|---|---:|
| Grundstück | 25 Credits |
| Harvester | 30 Credits + 3 Erz |

Für Version 0.1 können Grundstücke nicht verkauft werden.

## Grundstücksauktion

### Auslöser

- Ein einzelner Bieter gewinnt ohne zusätzliche Echtzeitauktion.
- Bei mindestens zwei Geboten auf dasselbe Grundstück startet
  immer die grafische Auktion, unabhängig von der Differenz der
  verdeckten Gebote.

### Startzustand

- Startpreis: höchstes verdecktes Gebot
- Mindestpreis für ein Übergebot: Startpreis plus 1 Credit
- alleiniger Höchstbietender: beginnt als Führender
- identisches Höchstgebot: kein anfänglicher Führender

### Auflösung

- Ohne Übergebot gewinnt ein anfänglicher Führender zum
  Startpreis.
- Bei anfänglichem Gleichstand muss ein Beteiligter ein gültiges
  Übergebot aktivieren.
- Ein gleich hohes Gebot ändert die Führung nicht.
- Siegerpreis ist das am Ende geführte Gebot.
- Der Spieler kann niemals über seine verfügbaren Credits bieten.
- Ein unterlegenes reserviertes Spielergebot wird vollständig
  erstattet.

### Aktuelle Zeiten

- Ankündigung: 5 Sekunden
- Auktion: 10 Sekunden

Die Zeiten sind Playtest-Werte und können verändert werden,
ohne die Auflösungsregel zu ändern.

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

Kristalle können nur produziert werden, wenn nach dem Kauf eine
vollständige Explorationsrunde abgerechnet wurde. Ein Kauf in Runde N
bleibt während Runde N+1 unerforscht; ab Runde N+2 ist der
Kristallwert bekannt und förderbar. Vorher steht Kristallproduktion
für dieses Feld weder Spielern noch Agenten zur Auswahl. Der
Kristallwert wird beim Eintritt in Runde N+2 einmal im Infosheet
gemeldet; diese Meldung verändert weder Dauer noch Ertrag der
Exploration. Der
Harvester verwendet anschließend den effektiven Sternwert aus
natürlicher Ader plus gedeckelten Meteorboni. Umrüstung, Versetzung
und Energieverbrauch entsprechen den anderen Produktionsarten.

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

Für je angefangene zehn Einwohner wählt der Spieler für Nahrung und
HQ-Energie unabhängig eine Versorgungsstufe von 0 bis 3. Die geplante
Menge einer Ressource ist:

`aufgerundete Bevölkerungsgruppen × gewählte Versorgungsstufe`

Bei 20 Einwohnern verbraucht eine normale Versorgung der Stufe 2
daher vier Nahrung und vier HQ-Energie.

## Harvester

| Parameter | Startwert |
|---|---:|
| Energie je aktivem Harvester | 1 |

Versorgungsreihenfolge:

1. HQ-Energie
2. aktive Harvester
3. verbleibende Energie zählt als Überschuss

Bei Energiemangel werden Harvester automatisch nach der im GDD
festgelegten Prioritätsregel deaktiviert.

---

# 7. Bevölkerungsentwicklung

Für Nahrung und HQ-Energie wird nach dem tatsächlichen Verbrauch die
erreichte Stufe je angefangene zehn Einwohner ermittelt. Die niedrigere
der beiden Stufen bestimmt die Bevölkerungsentwicklung:

| wirksame Versorgungsstufe | Bevölkerungsänderung |
|---:|---:|
| 0 | −1 |
| 1 | 0 |
| 2 | +1 |
| 3 | +2 |

Es gibt kein separates Wachstumspunktekonto.

---

# 8. Hunger und Energiemangel

## Nahrungs- oder HQ-Energiemangel

Die knappere der beiden Ressourcen bestimmt die wirksame
Versorgungsstufe. Bei Stufe 1 stagniert die Bevölkerung, bei Stufe 0
sinkt sie in dieser Runde um einen Einwohner. Mangelserien besitzen
keine zusätzliche, separat gespeicherte Strafstufe.

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

Im gemeinsamen Vierer-Markt entscheiden Orion, Nova und Vega anhand ihrer eigenen Vorräte, Credits und Wirtschaftsprofile unabhängig über Käufer-, Verkäufer- oder Aussetzerrolle sowie Wunschmenge und Preislimit. Das HQ-Lager bleibt unabhängig von diesen Entscheidungen als Handelspartner verfügbar.

## Marktzeiten

| gespielte Runde | Ankündigungszeit | Rollenwahl | Auktionszeit |
|---:|---:|---:|---:|
| 1 | 5 Sekunden | 5 Sekunden | 30 Sekunden |
| 2 | 4 Sekunden | 5 Sekunden | 25 Sekunden |
| ab 3 | 3 Sekunden | 5 Sekunden | 20 Sekunden |

Nimmt niemand an einem Ressourcenmarkt teil, entfällt die Auktionszeit vollständig.

Jede Ressource kann pro Runde global genau einmal initiiert werden. Das Recht wird bereits beim Aufruf verbraucht und zu Beginn der nächsten Runde für alle vier Ressourcen erneuert.

## Vorläufige KI-Kolonien

Orion, Nova und Vega besitzen eigene gespeicherte Koloniezustände.
Versorgung, Produktion, Markt, Harvesterbau und Grundstückserwerb
laufen über dieselben gemeinsamen Agentenregeln wie bei Agima in der
Headless-Simulation. Profilwerte gewichten Reserven, Produktion und
optionale Gebote; Kosten, Aktionsgrenzen, Nachbarschaft und das
Sicherheitsfenster der ersten Expansion sind für alle gleich.

Die Routinen und die Seed-Verwendung sind deterministisch, damit
Playtests wiederholbar bleiben.

---

# 11. Planet und Kartenwerte

## Zielstruktur

| Parameter | Zielwert |
|---|---:|
| Kartenfelder insgesamt | 92 |
| neutrales HQ | 1 |
| erwerbbare Grundstücke | 91 |
| Hexagone | 80 |
| Pentagone | 12 |
| Startgrundstücke je Spieler | 2 |
| Grundstückserwerbe je Spieler und Runde | maximal 1 |

Der Browserprototyp verwendet den validierten 92-Felder-Graphen
inzwischen als Spielkarte. Die Darstellung projiziert die
normalisierten Kugelkoordinaten orthografisch; sie verändert weder
Nachbarschaften noch wirtschaftliche Feldwerte.

## Entfernungszonen

| Bereich | früherer Zielwert | implementierter Graph |
|---|---:|---:|
| HQ und Startzone | 9 | 9 |
| innere Koloniezone | ungefähr 18 | 10 |
| Explorationszone | ungefähr 29 | 33 |
| planetare Fernzone | ungefähr 36 | 40 |

Die implementierte Zuordnung folgt vollständigen
Graphdistanzebenen: übrige Distanzen 1–2 innen, Distanzen 3–4
Exploration und Distanzen 5–8 Fernzone. Die Abweichung von den alten
Zielgrößen wird in Simulationen geprüft.

## Startkorridore

Vier feste Korridore werden vorab auf vergleichbare Expansionswege,
Entfernung zur Fernzone, Nähe zu Pentagonen und Engpässen sowie die
Erreichbarkeit strategischer Regionen geprüft. Zwei der sechs direkten
HQ-Nachbarn bleiben zu Spielbeginn neutral.

Im implementierten Graph besitzt jeder äußere Startkorridor drei
weiterführende Verbindungen. Alle vier Korridore haben denselben
Abstand zum nächsten Pentagon und zur Fernzone.

## Natürliche Kristalladern

- vier natürliche 5-Sterne-Kerne,
- bevorzugt in der Fernzone,
- keine Kerne auf Pentagonen oder Startfeldern,
- unregelmäßige Abstufung über vier, drei und zwei Sterne,
- keine natürlichen 5-Sterne-Zufallsfelder außerhalb der Adern.

Implementierte Ausgangsgröße je Ader:

- ein Feld mit fünf Sternen,
- zwei Felder mit vier Sternen,
- drei Felder mit drei Sternen,
- vier Felder mit zwei Sternen.

Die vier Kerne liegen in der Fernzone und halten untereinander
mindestens vier Graphschritte Abstand. Überlappende Ausläufer werden
nicht addiert; der höhere Feldwert gilt.

## Interstellarer Kristallkäufer

| Parameter | erste Simulationsbasis |
|---|---:|
| Kapazität Runde 1–4 | 1 Einheit |
| Kapazität Runde 5–9 | 2 Einheiten |
| Kapazität Runde 10–14 | 3 Einheiten |
| Kapazität ab Runde 15 | 4 Einheiten |
| Preisfaktor zum Referenzkurs | 90 % |
| Mindestgebot | 20 Credits |
| Höchstgebot | 60 Credits |

Diese gedeckelte Variante ist implementiert. Bei Startkurs 40 bietet
der Käufer 36 Credits. Das Angebot folgt dem Referenzkurs gedämpft,
ohne diesen durch eigene Käufe direkt zu verändern. Die knappe
Rundenkapazität verhindert eine Verkaufsgarantie.

## Meteorparameter

| Parameter | klein | Standard | groß |
|---|---:|---:|---:|
| Zentrum-Aufwertung | +3 | +3 | +3 |
| direkte +2-Felder | 3 | 4 | 5 |
| äußere +1-Felder | 4 | 6 | 8 |
| maximale Entfernung | 2 | 2 | 2 |
| maximaler Feldwert | 5 | 5 | 5 |

Die kleine Variante mit drei direkten und vier äußeren Feldern ist
die konservative Standardbasis. Die mittlere und große Variante
bleiben konfigurierbare Tests. Eine Größenverteilung wird erst nach
Simulationen festgelegt.

Die kleine Variante ist im Browser implementiert. Einschläge werden
auf maximal fünf Kristallsterne gedeckelt. Frühere Aufwertungen werden
kumuliert; ein bereits ausgeschöpftes Feld erhält keinen weiteren
effektiven Bonus.

---

# 12. Spielende

Die Standardpartie endet nach **20 vollständig abgerechneten
Runden**.

Die Rangfolge wird lexikografisch ermittelt:

1. höhere Bevölkerung
2. höheres abrechenbares Vermögen aus Credits plus
   `Kristallbestand × offizieller Kristallkurs`
3. höhere Summe aller übrigen Ressourcen ohne Kristalle
4. mehr Harvester

Der offizielle Kristallkurs entspricht dem zuletzt veröffentlichten
Orientierungspreis. Sein Start- und Rückfallwert beträgt 40 Credits je
Kristall. Eine einzelne Transaktion setzt diesen Kurs nicht direkt.
Ohne Handel in einer Runde bleibt er unverändert; ohne einen einzigen
Kristallhandel in der gesamten Partie gilt am Spielende der
Referenzkurs von 40 Credits. Kristalle werden in Stufe 3 nicht noch
einmal gezählt. Nach Runde 20 beginnt keine Runde 21.

---

## Multiplayer-Rundenzeit

| Parameter | Standard |
|---|---:|
| Planungszeit je Runde | 4 Minuten |
| erste sichtbare Warnstufe | 60 Sekunden |
| dringende Warnstufe | 15 Sekunden |
| maximale automatische Versorgung | Normalversorgung |

Die Frist wird serverseitig geführt und während gemeinsamer
Ressourcen- und Grundstücksauktionen pausiert. Ein automatischer Plan
wählt für Nahrung und Energie gemeinsam die höchste vollständig aus
dem aktuellen Lager bezahlbare Stufe bis maximal Normalversorgung.

---

# 13. Zu beobachtende Fragen im Playtest

- Ist Energie dauerhaft knapp genug?
- Wird zu viel Nahrung angesammelt?
- Wächst die Bevölkerung zu schnell?
- Sind Kristalle zu mächtig?
- Werden neue Harvester früh genug gebaut?
- Entstehen mehrere sinnvolle Strategien?
- Welche reale Spielzeit erreicht die 20-Runden-Partie?
- Wie viele Grundstücke besitzt eine Kolonie nach 20 Runden?
- Sind die vier Startkorridore statistisch gleichwertig?
- Stabilisiert der interstellare Käufer den Preis, ohne Überangebot
  folgenlos zu machen?
- Sind Meteoriten stark genug für Konflikte, aber nicht
  spielentscheidend?
- Wie groß müssen innere, Explorations- und Fernzone sein?

---

# 14. Noch nicht festgelegt

- endgültige grafische Entfaltung der 92 Felder
- genaue Zonengrenzen
- Hintergrundverteilung der Kristallwerte
- Mindestabstand und Größe natürlicher Kristalladern
- Kapazitätskurve, Preis und Deckel des interstellaren Käufers
- Wahrscheinlichkeit kleiner, mittlerer und großer Meteor-Krater
- endgültige Häufigkeit und Stärke der übrigen Ereignisse
- Kosten für beschädigte Harvester
- endgültige Vermögensgewichtung
- Koloniestufen und technologische Boni
