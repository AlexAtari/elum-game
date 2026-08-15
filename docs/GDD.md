# E.L.U.M.
## Exploration, Logistics, Utilization & Mining

# Game Design Document

**Version:** 0.6 "Versorgung & Harvester"
**Status:** Draft
**Last Updated:** 2026-07-21

---

# 1. Vision

E.L.U.M. ist ein rundenbasiertes Strategiespiel für Smartphones, inspiriert vom Klassiker M.U.L.E.

Die Spieler entwickeln auf dem Planeten **Agima** die erfolgreichste Kolonie. Durch geschickte Expansion, Ressourcenmanagement und wirtschaftliche Entscheidungen wächst ihre Bevölkerung und damit ihre Kolonie.

Eine Partie mit 20 Runden dauert nach aktueller Schätzung etwa
**35–45 Minuten**. Die tatsächliche Zielspielzeit wird mit Playtests
neu gemessen.

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

Eine Standardpartie dauert **20 Runden**.

Nach der letzten Runde gewinnt der Spieler mit der **größten Bevölkerung**.

Die Bevölkerung ist der wichtigste Indikator für den Erfolg einer Kolonie.

Alle anderen Spielmechaniken dienen letztlich dazu, das Wachstum der Kolonie zu fördern.

Bei Gleichstand entscheidet zuerst das abrechenbare Vermögen aus
Credits und dem Kurswert nicht verkaufter Kristalle. Danach folgen
die Summe der übrigen Ressourcen ohne Kristalle und zuletzt die
Anzahl der Harvester.

---

# 4. Spielablauf

Jede Runde besteht aus folgenden Phasen:

## 1. Rundenbeginn

- Grundstücke aus der letzten Auktion wechseln den Besitzer.
- Fertig gebaute Harvester werden als freie Harvester verfügbar.
- Nach der Rangliste eröffnet ein gruppierter Bericht die neue Runde.
- Der Bericht zeigt die Ergebnisse der eigenen Kolonie aus der
  abgeschlossenen Runde sowie die globale Lage der neuen Runde.
- Ein mögliches lokales Ereignis wird erst später während der
  Planungsphase sichtbar.

## 2. Planungsphase

Alle Spieler planen gleichzeitig und verdeckt:

- Grundstücksgebote
- neue Harvester bauen
- freie Harvester einsetzen
- Produktionsart bestehender Harvester ändern
- Nahrung und Energie für die Bevölkerung zuteilen
- bei Bedarf eine Ressourcenauktion initiieren und daran teilnehmen

## 3. Grundstücksauktionen

- Alle verdeckten Gebote werden gleichzeitig aufgedeckt.
- Gibt es für ein Grundstück nur einen Bieter, erhält er das Feld
  zu seinem Gebot.
- Treffen mindestens zwei Gebote auf dasselbe Grundstück, findet
  immer eine grafische Grundstücksauktion statt.
- Der Startpreis ist das höchste ursprüngliche verdeckte Gebot.
- Der Teilnehmer mit dem allein höchsten Startgebot beginnt als
  Führender.
- Erfolgt kein höheres Gebot, gewinnt der anfängliche Führende
  zum Startpreis.
- Bei identischen höchsten Startgeboten gibt es zunächst keinen
  Führenden. Das erste gültige Übergebot eröffnet die
  Stichentscheidung.
- Ein Teilnehmer übernimmt die Führung nur mit einem höheren
  Gebot. Gleichziehen reicht nicht.
- Gebote dürfen die verfügbaren Credits nicht überschreiten.
- Die Auktion wird vorher angekündigt und läuft anschließend als
  sichtbare Echtzeitphase.
- Das Grundstück wird nach der Auflösung im regulären
  Rundenübergang übertragen.

## 4. Freiwillige Ressourcenauktionen

Während der Planungsphase darf ein Spieler bei Bedarf eine interaktive Echtzeitauktion für Nahrung, Energie, Erz oder Kristalle initiieren. Jede Ressource kann global nur einmal pro Runde aufgerufen werden. Nach einer kurzen Ankündigung erhalten alle Spieler fünf Sekunden, um sich als Käufer, Verkäufer oder nicht teilnehmend einzuordnen.

Nach der einzelnen Auktion kehren alle Spieler in die Planungsphase zurück. Die übrigen Ressourcen starten nicht automatisch. Nicht initiierte Auktionen entfallen, sobald die Runde ausgeführt wird.

Marktgeschäfte verändern Vorräte und Credits sofort. Dadurch können Spieler fehlende Nahrung oder Energie noch kaufen, bevor sie die Runde ausführen. Neu produzierte Ressourcen stehen dagegen erst in der folgenden Planungsphase für eine Auktion zur Verfügung.

## 5. Harvester einsetzen

Alle freien Harvester werden auf bereits eigene, unbestrittene Grundstücke gesetzt.

Neu eingesetzte Harvester können bereits in derselben Runde produzieren.

## 6. Energiezuweisung

Zuerst wird die für die Kolonie beziehungsweise das HQ vorgesehene Energie reserviert.

Anschließend werden die Harvester mit Energie versorgt. Jeder aktive Harvester benötigt eine Einheit Energie pro Runde.

Reicht die verbleibende Energie nicht für alle Harvester, werden einzelne Harvester automatisch nach der festgelegten Prioritätsregel deaktiviert.

Ein ausschließlich wegen Energiemangels deaktivierter Harvester löst
automatisch eine Noternte auf seinem Feld aus. Sie benötigt keine
Energie und erzeugt genau eine Einheit Nahrung, Energie oder Erz.
Kristalle können nicht per Noternte gefördert werden. Während einer
Umrüstung oder Versetzung sowie bei ereignisbedingten technischen
Ausfällen findet keine Noternte statt.

## 7. Produktion

Alle mit Energie versorgten Harvester produzieren gleichzeitig. Normal arbeitende Harvester produzieren den vollen Ertrag. Harvester in Umrüstung produzieren in der Übergangsrunde die neue Ressource mit halbem Ertrag. Harvester, die nach einer Versetzung auf einem neuen Feld eingerichtet werden, produzieren in der Übergangsrunde nichts. Eine automatische Noternte wird zur Produktion derselben Runde addiert.

## 8. Versorgung und Bevölkerungsentwicklung

Die zuvor festgelegten Mengen an Nahrung und Energie werden der Bevölkerung zugeteilt.

Abhängig von der Versorgung wächst die Bevölkerung, stagniert oder schrumpft.

## 9. Rundenende

- Versorgung, Harvesterenergie, Produktion, Bauabschlüsse und Bevölkerungsentwicklung werden nach dem letzten Ressourcenmarkt gemeinsam abgerechnet.
- Markt- und Lagerwerte werden aktualisiert.
- Nach der Abrechnung wird eine gemeinsame Kolonie-Rangliste eingeblendet.
- Prüfung auf Spielende.
- Nach Runde 20 wird die Rangliste zur Abschlussrangliste. Sie nennt
  den Sieger und den eigenen Schlussrang; eine neue Partie kann von
  dort direkt gestartet werden.
- In allen früheren Runden folgt der Bericht „Ereignisse & deine
  Kolonie“ als Einstieg in die neue Runde.

Falls das Spiel nicht beendet ist, beginnt die nächste Runde.

---

# 5. Spielkarte

Das beschlossene Zielbild ist ein zusammenhängender Planetengraph mit
**92 Kartenfeldern**:

- ein neutrales gemeinsames HQ,
- 91 erwerbbare Grundstücke,
- zwölf Pentagonfelder mit fünf Nachbarn,
- 80 Hexagonfelder mit sechs Nachbarn.

Das HQ liegt auf einem Hexagon. Alle Grundstücke sind wirtschaftlich
gleich große Spieleinheiten.

Die Kernregeln arbeiten über stabile Feld-IDs, Nachbarlisten und
Graphdistanzen. Die Browserpartie stellt denselben Graphen als
drehbare orthografische Kugel dar. Die Rückseite ist ausgeblendet;
Ziehen dreht den Planeten, Pinch oder Mausrad zoomen und die
HQ-Steuerung stellt die Startorientierung wieder her.

Jeder Spieler startet mit zwei zusammenhängenden Grundstücken:

1. ein Grundstück direkt am HQ,
2. ein angrenzendes Grundstück weiter vom HQ weg.

Alle acht Startgrundstücke sind kristallfrei, liegen nicht auf
Pentagonen und werden ohne Auktion zugewiesen.

Jede Kolonie bringt unabhängig davon genau eine Kristallprobe in
ihrem Startlager mit. Sie kann im Kristallmarkt verkauft oder für die
Schlusswertung behalten werden und stammt nicht aus der Förderung
eines Startgrundstücks.

Die Karte besitzt keinen regeltechnischen Außenrand. Regionen werden
über die kürzeste Entfernung zum HQ eingeteilt. Strategisches
Blockieren und Einschließen sind erlaubt.

Die vollständige Spezifikation steht in
[`PLANET_MAP.md`](PLANET_MAP.md).

## Kartendesign

Konflikte und Expansion sollen primär durch Topologie, Entfernungen,
Kristallverteilung und Engstellen entstehen.

Der Browserprototyp verwendet den 92-Felder-Graphen in einer
drehbaren Kugelprojektion. Alle Felder sind durch Drehen erreichbar
und auswählbar. Eine mögliche spätere Polyederentfaltung würde
denselben Graphen verwenden.

Jede Kolonie beginnt mit Sicht auf ihre beiden Startgrundstücke und
deren direkte Nachbarn. Beim Erwerb eines Grundstücks werden dieses
Feld und seine direkten Nachbarn dauerhaft aufgedeckt; einmal
bekannte Gebiete verschwinden nicht wieder im Nebel. Nicht
aufgedeckte Gebiete zeigen weder Ressourcen noch Feldinformationen
oder Aktionen. Der verdeckte Kristallwert folgt unabhängig davon
weiterhin seiner eigenen Explorationsregel.

Der Planet verwendet eine gemeinsame fotorealistische, marsartige
Oberflächentextur aus oxidiertem Rostboden, Terrakotta, staubigem
Ocker und dunklem Basalt. Feiner Regolith, Sedimentschichten,
Erosionsfächer und Basaltbrüche bleiben auch im Nahzoom erkennbar.
Nahrung verschiebt diese Basis moderat in
Richtung Olivgrün, Energie in ein kühles Blaugrau und Erz in ein
dunkleres Eisenrot. Die Farbnuancen werden räumlich geglättet; es
gibt weder gezeichnete Ressourcensymbole noch harte Biome oder
Neustarts der Textur je Grundstück. Die Welttextur ist kugelrichtig
verankert und dreht sich mit dem Planeten. Die lückenlosen
sphärischen Dualzellen dienen der Interaktion, bleiben im
Normalzustand jedoch unsichtbar. Hover
beziehungsweise Tastaturfokus und die Auswahl durch Antippen lassen
die jeweilige Feldkontur aufscheinen. Gebote, Meteore und andere
notwendige Spielzustände dürfen weiterhin klar markiert werden.

Die Oberfläche entwickelt sich über alle 20 Runden schrittweise von
der Marsbasis zu einer deckungsgleichen, teilweise erdähnlichen
Vegetationsbasis. Nahrungsreiche Regionen terraformieren schneller
und vollständiger; karge sowie erzreiche Regionen behalten länger
Rostboden, Ocker und Basalt. Auch in Runde 20 bleiben trockene und
felsige Zonen sichtbar. Es entstehen keine Ozeane, Städte oder neuen
Geländemerkmale. Diese Entwicklung ist rein visuell und verändert
weder Sternebewertung noch Produktion. Grundstücke von Orion, Nova
und Vega werden ihrem tatsächlichen Besitzer zugeordnet und mit
dessen Namen angezeigt.

Die Kugel besitzt eine feste, von links oben einfallende Beleuchtung
mit weich abgedunkelter Gegenseite und sichtbarem atmosphärischem
Rand. Feldnummern werden nicht direkt auf der Kugel gezeigt. Jedes
der 91 Grundstücke besitzt stattdessen einen festen, eindeutigen
Namen aus dem Londoner U-Bahn-Netz. Detailansicht, Auktionen,
Rundenberichte und assistive Bedienung verwenden diesen Namen.
Stabile Feld-IDs bleiben ausschließlich die technische Grundlage
für Spielstand, Regeln und Diagnose.

Auf Smartphones nutzt das Kartenpanel den verfügbaren Bildschirm
mit schmalen Seitenabständen. Pinch und die Zoomtasten erlauben eine
Nahansicht bis zum 2,2-Fachen der Ausgangsgröße.

## Planungsoberfläche

Die normale Kolonieübersicht bleibt bewusst ruhig. Sie zeigt eine
kompakte Statuszeile einschließlich aktueller Platzierung, die
Planetenkugel und die Detailinformationen des ausgewählten eigenen
oder freien Grundstücks. Ressourcenauktionen, Versorgungsplanung,
Rundenvorschau, Harvesterbau und „Runde ausführen“ werden nur im
Hauptquartier gezeigt. Das HQ wird über seinen Kartenmarker oder
einen klaren Aktionsknopf betreten und besitzt einen eigenen Knopf
zurück zur Kolonieübersicht. Laufende Auktionen, Rangliste und
Infosheet bleiben eigenständige Spielphasen.

Das zentrale HQ wird als gemeinsame Kuppel mit vier über Korridore
angeschlossenen Kolonie-HQs dargestellt. Die vier Außenlager stehen
für Agima, Orion, Nova und Vega. Dasselbe Motiv kennzeichnet das HQ
auf der Kugel und dient als Leitbild der Verwaltungsansicht.

---

# 6. Grundstücke

Jedes Feld besitzt für Nahrung, Energie und Erz eine Eignung zwischen 0 und 5 Sternen.

Die Sterne entsprechen dem durchschnittlichen Ertrag des Feldes.

Kristalle können ausschließlich auf Feldern mit einem entdeckten
Kristallvorkommen gefördert werden. Sie sind dort eine reguläre
Harvesterproduktion mit demselben Energiebedarf sowie denselben
Umrüstungs- und Versetzungsregeln wie Nahrung, Energie und Erz. Der
Ertrag folgt dem effektiven Sternwert aus natürlicher Ader und
Meteoraufwertungen.

Vor dem Kauf sichtbar:

- Nahrung
- Energie
- Erz

Nach dem Kauf:

- Nahrung, Energie und Erz bleiben sichtbar,
- Kristallvorkommen und besondere Eigenschaften bleiben während
  einer vollständigen Explorationsrunde verborgen.

Nach einer vollständig abgerechneten Explorationsrunde sichtbar:

- Kristallvorkommen
- besondere Eigenschaften
- positive oder negative Effekte

Wird ein Grundstück in Runde N erworben, dient Runde N+1 seiner
Exploration. Das Ergebnis ist ab Runde N+2 sichtbar. Vorher kann dort
kein Harvester Kristalle fördern oder für Kristallproduktion
eingerichtet werden. Dieselbe Informations- und Produktionsgrenze
gilt für menschliche Spieler und Agenten. Zu Beginn von Runde N+2
meldet das Infosheet den Grundstücksnamen und den gefundenen
Kristallwert beziehungsweise „Kein Vorkommen“. Anschließend ist das
Ergebnis dauerhaft in der Grundstücksdetailansicht sichtbar. Das
Ergebnis ist antippbar; dadurch öffnet die Kolonieübersicht das
betroffene Grundstück und dreht die Kugel so, dass es zentriert
sichtbar wird.

Neue Grundstücke können ausschließlich ersteigert werden, wenn sie an mindestens ein bereits eigenes Grundstück angrenzen.

Freie Grundstücke werden über eine verdeckte Auktion vergeben.

<!-- STAGE25_CURRENT_LAND_RULE -->
Treffen mindestens zwei Gebote auf dasselbe freie Grundstück,
wird es in einer grafischen Grundstücksauktion entschieden.
Der Startpreis ist das höchste zuvor verdeckt abgegebene Gebot.

Der Teilnehmer mit dem allein höchsten Startgebot beginnt als
Führender. Erfolgt kein höheres Gebot, gewinnt er das Grundstück
zu diesem Startpreis. Bei identischen höchsten Startgeboten gibt
es zunächst keinen Führenden; die bisherige Stichentscheidung
beginnt oberhalb des gemeinsamen Startgebots.

Ein neues Gebot muss das aktuell führende Gebot übertreffen.
Das bloße Gleichziehen übernimmt die Führung nicht. Gebote sind
durch die verfügbaren Credits begrenzt. Nach Ablauf der Auktion
erhält der Führende das Grundstück zu seinem angezeigten Gebot.
Bei einem anfänglichen Gleichstand ohne aktiviertes Übergebot
bleibt das Grundstück frei. Die Übertragung erfolgt zu Beginn
der nächsten Runde.

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

Energiebedingt deaktivierte Harvester erzeugen automatisch eine
Noternte von einer Einheit ihrer eingestellten Ressource. Kristalle,
Umrüstungen, Versetzungen und technische Ereignisausfälle sind davon
ausgeschlossen.

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

## Kristalle

- seltenste Ressource,
- höchste Verkaufspreise,
- wichtige Einnahmequelle im späteren Spiel,
- natürliche Vorkommen bilden unregelmäßige, lesbare Adern,
- Kristallwerte bleiben bis zum Abschluss der ersten
  Explorationsrunde nach dem Kauf verborgen.

Kristalle werden im normalen Ressourcenmarkt gehandelt. Zusätzlich
tritt ein interstellarer Käufer mit begrenzter und im Spielverlauf
wachsender Kaufkapazität auf.

Agenten verkaufen Kristalle nur oberhalb ihrer ausdrücklich
festgelegten Kristallreserve. Eine Reserve von 0 erlaubt daher den
Verkauf der einzelnen Startprobe; eine Reserve von 1 hält sie
zunächst zurück. Die zusätzlichen Sicherheitspuffer für Nahrung,
Energie und Erz bleiben davon unberührt.

Verkaufte Kristalle werden regelmäßig von spezialisierten
Hochsicherheits-Transportern abgeholt. Diese Werttransporter sind
unabhängig vom Versorgungsschiff und bringen keine Waren oder
Personen.

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

Für je angefangene zehn Einwohner wird die tatsächlich erreichte
Stufe beider Ressourcen berechnet. Die niedrigere Stufe bestimmt den
gemeinsamen Effekt: Stufe 0 verändert die Bevölkerung um −1, Stufe 1
um 0, Stufe 2 um +1 und Stufe 3 um +2 Einwohner.

Der Spieler kann die Versorgung im Notfall bewusst reduzieren, um Nahrung oder Energie für andere Zwecke zurückzuhalten.

Mit wachsender Bevölkerung entwickelt sich auch das Hauptquartier optisch weiter.

---

# 11. Markt

Ressourcenauktionen sind freiwillige Aktionen innerhalb der Planungsphase. Jeder Spieler darf eine noch verfügbare Auktion initiieren; der Aufruf lädt immer alle vier Kolonien in denselben gemeinsamen Markt ein. Global kann jede Ressource jedoch nur einmal pro Runde aufgerufen werden. Das verhindert wiederholte Märkte für dieselbe Ware und hält die Rundendauer kalkulierbar. Das Auktionsrecht gilt mit dem Aufruf als verbraucht, auch wenn anschließend alle vier Kolonien aussetzen. Diese gemeinsame Teilnahme gilt nur für Ressourcenmärkte; an einer Grundstücksauktion nehmen weiterhin ausschließlich die tatsächlichen Bieter teil.

Die frei wählbaren Ressourcenmärkte sind:

1. 🌾 Nahrung
2. ⚡ Energie
3. ⛏ Erz
4. 💎 Kristalle

In Runde 1 wird die Planungsansicht nach dem Aufruf zunächst durch eine fünfsekündige Auktionsankündigung ersetzt. Angezeigt werden die aufgerufene Ressource, der Initiator, der aktuelle Bestand dieser Ressource bei allen vier Kolonien, die eigenen Credits sowie der Hinweis, sich auf Käufer, Verkäufer oder Nichtteilnahme vorzubereiten. Ab Runde 2 entfällt diese Einführung und der Markt beginnt direkt mit der Rollenwahl.

Nach dem Ankündigungs-Countdown beginnt eine fünfsekündige Rollenwahl direkt in der Auktionsarena. Zwei kleine statische Richtungstasten verändern ihre Position nicht: Der Aufwärtspfeil steht mittig oberhalb der Arena und bewegt die Figur über die neutrale Mitte zur Verkäuferseite; der Abwärtspfeil steht mittig unterhalb der Arena und bewegt sie zur Käuferseite. Die Mittelposition bedeutet weiterhin Nichtteilnahme. Kurzes Tippen bewegt einen Schritt; längeres Berühren lässt die Figur bis zum Loslassen weiterlaufen und hebt den gehaltenen Pfeil sichtbar hervor. Bis zum Ablauf der Positionierungszeit darf die Auswahl geändert werden; danach ist die Rolle für diese Ressourcenauktion festgelegt. Dieselben Richtungstasten steuern anschließend die Preisbewegung, ohne ihren Platz zu wechseln.

Meldet sich keine der vier Kolonien als Käufer oder Verkäufer, wird die Ressourcenauktion vollständig übersprungen. Die Entscheidung des Initiators besitzt dabei kein Sondergewicht: Sobald mindestens eine andere Kolonie aktiv kaufen oder verkaufen möchte, beginnt die Handelsphase. Nach einer abgeschlossenen oder übersprungenen Auktion kehrt das Spiel in dieselbe Planungsphase zurück. Die Rundenabrechnung beginnt ausschließlich über „Runde ausführen“ und startet keine automatische Marktfolge.

Ein Käufer kann sein Gebot niemals über seine aktuell verfügbaren Credits erhöhen. Reicht sein Guthaben nicht für das günstigste aktive Verkaufsangebot, zeigt die Marktsteuerung dessen Preis und den fehlenden Betrag. Liegt bereits ein Kaufgebot im Markt und sinken die Credits durch eine Transaktion unter diesen Preis, wird das Gebot automatisch auf das neue bezahlbare Maximum zurückgenommen oder vollständig hinter das Lager gestellt.

Käufer und Verkäufer handeln gleichzeitig auf einem gemeinsamen Markt.

Die Verkäufer starten am oberen Ende des Marktes.

Die Käufer starten am unteren Ende.

Durch die Bewegung ihres Avatars verändern die Spieler ihr Preisangebot.

Jeder Schritt verändert den Preis um einen Credit.

Eine horizontale Linie markiert jeweils den niedrigsten Verkaufspreis und das höchste Kaufgebot. Die Linien laufen dynamisch mit den führenden Marktteilnehmern mit. Käufer und Verkäufer können die jeweils andere Preislinie erreichen, aber nicht überschreiten.

Die Auktionsdauer wird im Spielverlauf kürzer. Neue Spieler erhalten dadurch in den ersten Runden mehr Zeit, während spätere Märkte zügiger ablaufen. Ein Balken zeigt die verbleibende Auktionszeit zusätzlich zur Sekundenanzeige an. Der Initiator kann die laufende Handelsphase über „Auktion verlassen“ sofort für alle beenden; bereits ausgeführte Einzeltransaktionen bleiben verbucht.

Während Rollenwahl und Auktion zeigt die Oberfläche oberhalb der Arena keine separate Ressourcen-, Lager- oder Handelsübersicht. Die Rollenwahl beginnt dadurch unmittelbar mit der Positionierungsphase. Während der Auktion steht der eigene aktuelle Bestand der gehandelten Ressource mit Symbol und Anzahl direkt über der eigenen Figur und aktualisiert sich nach jeder Transaktion; eine zusätzliche fixierte Bestands- oder Creditsleiste entfällt. Preislinien, konkrete Warnungen bei fehlenden Credits und die Abbruchaktion bleiben sichtbar. Die allgemeine Statusübersicht und das vorherige Rundenergebnis werden währenddessen ausgeblendet. Der neutrale Bereich „Nicht teilnehmen“ dient nur der Rollenwahl und verschwindet mit Beginn der Auktion. Steigende Werte werden bei einer Transaktion kurz grün, sinkende Werte kurz rot hervorgehoben.

Das HQ-Gesamtlager bildet den oberen und unteren Abschluss der Preisarena. Es gibt insgesamt genau zwei gemeinsame Marktlinien: Die rote Linie zeigt den niedrigsten Verkaufspreis, die blaue Linie das höchste Kaufgebot. Beide Linien sind bereits während der Rollenwahl sichtbar und liegen beim jeweiligen HQ-Preis. Wer sich als Verkäufer oder Käufer einordnet, wartet zunächst einen Schritt hinter dem entsprechenden Lager und hat noch kein aktives Angebot. Mit dem ersten Schritt in Richtung Markt läuft der Teilnehmer am Lager vorbei und erreicht die Lagerlinie, ohne deren Preis zu verändern. Erst weitere Schritte schieben die Linie mit festem Abstand vor dem Avatar in den Markt. Beim Rückzug folgt sie bis zum HQ-Preis. Ein zusätzlicher Schritt führt den Teilnehmer wieder hinter das Lager, während die Linie am Lager oder beim nächstbesten aktiven Angebot stehen bleibt. Verkäufer stehen oberhalb der roten Linie und Käufer unterhalb der blauen Linie. Die Lagergrafik liegt damit stets zwischen einer wartenden Figur und der zugehörigen Linie und bleibt unverdeckt. Die eigene Linie trägt keine zusätzliche Textplakette, da Name und Preis bereits am Avatar stehen. Marktteilnehmer, die ihre gewünschte Handelsmenge erreicht haben, ziehen ihr aktives Angebot sichtbar zurück. Nach Ende der Auktion wird die Arena vollständig geleert.

## Teilnehmerzustände und Rückzug

Ein Avatar besitzt während jeder Ressourcenauktion genau einen der folgenden Zustände:

1. **Unentschieden:** Der Teilnehmer steht während der Rollenwahl im neutralen Bereich.
2. **Parkend:** Nach der Wahl steht ein Verkäufer hinter dem oberen, ein Käufer hinter dem unteren Lager. Er nimmt noch nicht am Preiswettbewerb teil.
3. **An der Lagerlinie:** Der erste Schritt in den Markt stellt den Kontakt zur gemeinsamen Linie her, verändert den HQ-Preis aber noch nicht.
4. **Aktiv:** Weitere Schritte verbessern oder verschlechtern das Angebot und verschieben gegebenenfalls die gemeinsame Linie.
5. **Wartend:** Ein passendes Geschäft wird bereits von einem früher eingetroffenen Teilnehmer ausgeführt. Wartende Teilnehmer bleiben beweglich und können ihr Angebot zurückziehen.
6. **Ausgeschieden:** Der Teilnehmer befindet sich wieder hinter seinem Lager und ist kein aktives Angebot mehr.

Wer freiwillig nicht weiter handeln möchte, seine gewünschte Menge erreicht hat, keine verkaufbare Einheit mehr besitzt oder nicht genügend Credits für eine weitere Einheit hat, zieht sich sichtbar und schrittweise auf seiner Marktseite zurück. Ab diesem Moment ist sein Angebot für neue Geschäfte sofort inaktiv. War er der führende Anbieter seiner Marktseite, bleibt die gemeinsame Preislinie während des Rückwegs sichtbar an seinem Avatar und wandert Preisschritt für Preisschritt mit. Sie wird dabei nur noch als Rückzugsanimation gezeigt und kann keinen Handel mehr auslösen. Trifft die Linie auf ein besseres weiterhin aktives Angebot, übernimmt dieses die Linie; andernfalls führt der zurücklaufende Teilnehmer sie bis zum HQ-Preis. Anschließend macht der Avatar den letzten Schritt hinter das Lager und die Linie bleibt dort zurück. Auch ein durch Ressourcen- oder Geldmangel erzwungener Rückzug wird nicht als Sprung oder Flug dargestellt. Eine Figur darf nach dem Ausscheiden niemals mit der Kennzeichnung „fertig“ mitten in der Preisarena stehen bleiben: Jeder ruhende Avatar in der Arena signalisiert ein weiterhin verfügbares Angebot.

Während der laufenden Auktion enthält das seitliche Steuerfeld nur die beiden Pfeiltasten. Dauerhafte Erklärungen, Rollenüberschriften und KI-Statusmeldungen entfallen dort; Marktfiguren, Preislinien und Schaltflächen vermitteln den aktuellen Zustand. Die ausführlichere Hilfestellung bleibt auf die Positionierungsphase und ein späteres einmaliges Einführungstutorial begrenzt. Die beiden gleich breiten Schaltflächen stehen ohne zusätzliche gemeinsame Umrandung mit identischem Abstand untereinander und sind unabhängig vom restlichen Inhalt exakt auf der vertikalen Arenamitte verankert. Eine erscheinende oder verschwindende Transfermeldung besitzt einen eigenen Platz darunter und darf die Tasten niemals verschieben. Textwechsel, Preisänderungen und Handelsmeldungen dürfen weder die Arena noch die Pfeiltasten oder nachfolgende Elemente verschieben. Beide Schaltflächen behalten während einer Auktion Position und Höhe.

Die Auktionsarena ist die visuelle Hauptbühne der Marktphase und darf breiter als das normale Kolonie-Dashboard sein. Nur während der laufenden Auktion wird das Steuerfeld auf die schmalen, vertikal zentrierten und zweizeiligen Pfeiltasten reduziert. Positionierungs- und Ergebnisphase behalten eine breitere Textspalte, damit kein Hinweis über seinen Bereich hinausragt. Die Lager werden als kompakte Stationen am linken Rand dargestellt. Rechts davon verlaufen vier feste, ausreichend breite Laufspuren für die Teilnehmer. Rollenangaben erhalten in jedem Avatar eine eigene volle Textzeile, sodass weder Beschriftungen abgeschnitten werden noch Avatare untereinander oder mit Lagergrafiken kollidieren. Beide Bestpreislinien besitzen dieselbe Stärke und dieselbe grüne Grundfarbe. Treffen sie für einen Handel zusammen, pulsiert die verschmolzene Linie als unmittelbares Transfersignal. Eine gut lesbar mit „Preis“ überschriebene feste Preisskala am rechten Arenarand ersetzt die kleinen dynamischen Preisfähnchen an den Linien. Jeder Skalenwert besitzt einen gleich langen horizontalen Strich, der symmetrisch nach links und rechts über die senkrechte Skalenachse reicht. Vorübergehende Handelsmeldungen erscheinen außerhalb der Arena und verdecken niemals Figuren. Spätere Figuren, Animationen, Effekte und Grafiken verändern nur die Präsentation. Zustände, Preisgrenzen, Bestpreisführung, Linienübergabe, Handelsreihenfolge und Einzeltransaktionen bleiben davon unabhängig und werden nicht neu definiert.

Die gemeinsame Preislinie gehört nicht dauerhaft einem Teilnehmer. Im normalen Handel zeigt sie das beste aktuell aktive Angebot einer Marktseite. Während eines sichtbaren Rückzugs darf sie vorübergehend noch am bisherigen Linienführer hängen, ohne dass sein Angebot weiter handelbar ist. Zieht sich der führende Teilnehmer zurück, übernimmt das nächstbeste aktive Angebot die Linie, sobald es erreicht wird. Gibt es keinen weiteren Teilnehmer, führt der Rückweg die Linie bis zum entsprechenden HQ-Lagerpreis.

Die Preisskala übernimmt die Anzeige der aktuellen Angebotshöhe. Deshalb zeigt ein Avatar während der Auktion keinen Preis, sondern seinen aktuellen Bestand der gehandelten Ressource. Beim Verkäufer sinkt diese Zahl pro Verkauf um eine Einheit, beim Käufer steigt sie pro Kauf um eine Einheit; die Anzeige aktualisiert sich unmittelbar und erhält einen kurzen Farbpuls. Alle vier Kolonien verwenden dabei ihre tatsächlichen Bestände und Credits.

Nahrungs-, Energie-, Erz- und Kristallauktionen verwenden denselben Vierer-Markt. Vor jeder einzelnen Auktion wählen alle menschlichen und computergesteuerten Kolonien ihre Rolle neu. Alle vier Rollen und aktiven Preislimits sind Teil des gemeinsamen Spielzustands; passende direkte Geschäfte verändern Vorräte und Credits beider beteiligter Kolonien. Das HQ-Gesamtlager bleibt als verlässlicher, aber ungünstigerer Handelspartner verfügbar.

## Zwischenstand nach der Rundenabrechnung

Nach „Runde ausführen“ wird die Runde vollständig abgerechnet. Anschließend sehen alle Spieler vor Beginn der nächsten Planung denselben Zwischenstand. Die Rangliste vergleicht in dieser Reihenfolge:

1. Bevölkerung
2. abrechenbares Vermögen aus Credits und Kristallkurswert
3. Gesamtzahl der übrigen Ressourcen ohne Kristalle
4. Anzahl der eigenen Harvester

Die Reihenfolge entspricht zugleich der Rangfolge bei Gleichstand:
Bevölkerung besitzt die höchste Bedeutung, danach entscheiden
abrechenbares Vermögen, übrige Ressourcen und Harvester. Die eigene
Kolonie wird deutlich
hervorgehoben. Die Plätze werden vom letzten bis zum ersten Rang im
Abstand von jeweils einer Sekunde aufgedeckt. Der Erstplatzierte erhält
zusätzlich ein kleines Kronensymbol. Sobald alle Plätze sichtbar sind,
bleibt die vollständige Rangliste stehen. In den Runden 1 bis 19 wird
nun eine Weiter-Schaltfläche aktiv, über die alle Spieler in den
Rundenbericht der nächsten Runde wechseln. Nach Runde 20 bleibt die
Abschlussrangliste bis zum Start einer neuen Partie sichtbar.
Dieser gemeinsame Ablauf dient später im Mehrspielermodus zugleich als
synchroner Übergang für alle Teilnehmer.

## Bericht zum Beginn der neuen Runde

Nach der Rangliste erscheint „Ereignisse & deine Kolonie“. Die
Rangliste ist damit der Abschluss der alten Runde, während der Bericht
den Einstieg in die neue Runde bildet.

Der Bericht gruppiert zwei Informationsbereiche:

- **Globale Lage:** das für die neue Runde aktive globale Ereignis oder
  ruhige Bedingungen
- **Deine Kolonie:** Produktion der letzten Runde,
  Bevölkerungsentwicklung, Landgewinn oder -verlust,
  fertiggestellte Harvester sowie betriebliche Warnungen

Die Ansicht bleibt sichtbar, bis der Spieler die neue Runde bewusst
beginnt. Lokale Ereignisse werden dort nicht
vorweggenommen, sondern überraschend während der anschließenden
Planung eingeblendet.

Alle vier Ranglistenplätze stammen aus dauerhaft gespeicherten
Koloniezuständen. Orion, Nova und Vega besitzen jeweils eine eigene
Bevölkerung, Credits, Ressourcenbestände, Harvesterzahl und
Grundstücke. Versorgung, Produktion, Grundstückserwerb,
Harvesterbau und Marktteilnahme greifen auf diesen Zustand zu.

Für die erste Expansion von zwei auf drei Harvester gilt für alle
Agenten dieselbe konservative Ausnahme: Eine Versorgungswarnung
verhindert den Bau nicht, wenn Nahrung und Energie für die unmittelbar
folgende Runde einschließlich des zusätzlichen Harvesters sicher
sind. Eine kritische Versorgung verhindert den Bau weiterhin. Nach
den Baukosten müssen 20 Credits als gemeinsamer Sicherheitspuffer
verbleiben.

Ist ein fertiger Harvester ohne Grundstück, darf der Agent ein freies
angrenzendes Grundstück zum Mindestgebot erschließen, solange derselbe
Kreditpuffer erhalten bleibt. Weitere Harvester und optionale höhere
Gebote erfordern wieder die vollständigen profilabhängigen Reserven.

Die Headless-Seriensimulation verwendet für Sieger und Ränge exakt
dieselbe lexikografische Schlusswertung wie die Browserpartie. Ein
zusätzlicher umfassender Ökonomiewert darf nur als Diagnosekennzahl
erscheinen und die Rangfolge nicht verändern.

## Direkter Handel

Berühren sich die Preislinien von Käufer und Verkäufer, beginnt der Handel. Jede abgeschlossene Transaktion überträgt genau eine Einheit.

Nach jeder Einheit werden die führenden Angebote und die Reihenfolge der wartenden Marktteilnehmer erneut geprüft. Gibt es keinen anderen passenden wartenden Handelspartner, kann dasselbe Paar bei anhaltendem Kontakt die nächste Einheit handeln. Der Handel startet langsam und beschleunigt bei längerem ununterbrochenem Kontakt in zwei Stufen.

Treffen mehrere Käufer oder Verkäufer gleichzeitig auf einen passenden Gegenpart, erhält der zuerst eingetroffene Teilnehmer den nächsten Einzelhandel. Die übrigen Teilnehmer warten. Sie bleiben währenddessen frei beweglich und können ihr Angebot zurückziehen, bevor sie an der Reihe sind.

Alle menschlichen und computergesteuerten Marktteilnehmer unterliegen derselben maximalen Bewegungsgeschwindigkeit. Ein verfolgender Teilnehmer darf nicht schneller sein als derjenige, der sich von ihm entfernt. KI-Spieler besitzen außerdem eine begrenzte Wunschmenge sowie einen Höchstpreis beim Kaufen beziehungsweise Mindestpreis beim Verkaufen.

Vorläufige Playtest-Werte:

- während der ersten drei Kontaktsekunden: eine Einheit pro Sekunde
- nach drei Kontaktsekunden: eine Einheit ungefähr alle 0,65 Sekunden
- nach sechs Kontaktsekunden: eine Einheit ungefähr alle 0,35 Sekunden

Zeitpunkte und Intervalle sind vorläufige Balancing-Werte.

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

Der Ankaufspreis des HQ-Gesamtlager bildet die untere Grenze der Arena. Der Verkaufspreis des HQ-Gesamtlager bildet die obere Grenze. Das Lager ist damit ein verlässlicher, aber absichtlich ungünstigerer Handelspartner.

Dadurch werden direkte Geschäfte zwischen Spielern belohnt, ohne den Handel mit dem Kolonielager zu erzwingen.

Ressourcen, die Spieler an das HQ verkaufen, erhöhen dessen gemeinsamen Lagerbestand. Ressourcen, die Spieler vom HQ kaufen, verringern ihn.

Ein Nettozufluss ins HQ senkt den Orientierungspreis der Ressource in der folgenden Runde. Ein Nettoabfluss erhöht ihn. Direkter Handel zwischen Kolonien verändert den HQ-Lagerbestand nicht.

Nicht verkaufte Ressourcen verbleiben im Lager der eigenen Kolonie und können in späteren Runden verwendet werden.

---

## Interstellarer Kristallkäufer

In der Kristallauktion existiert ein zusätzlicher interstellarer
Käufer. Er verwendet dieselbe Auktionslogik wie andere Käufer, besitzt
aber eine begrenzte Kaufkapazität.

Die implementierte konservative Basis stellt in den Runden
`1/5/10/15` Kapazitäten von `1/2/3/4` Einheiten bereit. Das Kaufgebot
beträgt 90 Prozent des offiziellen Referenzkurses und bleibt zwischen
20 und 60 Credits. Bei Startkurs 40 liegt es bei 36 Credits.

Der Käufer erscheint sichtbar in der Kristallauktion. Jede übernommene
Einheit reduziert seine verbleibende Rundenkapazität; anschließend
zieht er sich zurück. Seine Käufe verändern das HQ-Lager nicht. Damit
stabilisiert er den Preisbereich, ohne jeden Verkauf oder einen
garantierten Mindestgewinn sicherzustellen.

# 12. Ereignisse

Es gibt zwei Arten von Ereignissen.

## Globale Ereignisse

Globale Ereignisse betreffen alle Kolonien nach derselben Regel. In
Runde 1 gibt es noch kein globales Ereignis. Ab Runde 2 wird es für
jede Runde unabhängig mit einer vorläufigen Wahrscheinlichkeit von
40 % bestimmt und im Rundenbericht angekündigt.

Der globale Pool umfasst 15 Ereignisse: sechs positive und neun
negative. Er enthält Produktionsboni und -verluste für Nahrung,
Energie und Erz, Kristall- und Creditänderungen, einen Rabatt auf
Harvesterbau, einzelne Harvester-Ausfälle sowie einrundige Sperren
für Markt, Grundstücke, Harvesterbau und Harvesterbewegungen.

Die Produktion kann dabei nicht unter null fallen. Dasselbe globale
Ereignis darf später erneut und auch in direkt aufeinanderfolgenden
Runden auftreten.

---

## Lokale Ereignisse

Lokale Ereignisse betreffen zunächst nur die eigene Kolonie. Ab Runde
2 wird in jeder Runde unabhängig mit einer Wahrscheinlichkeit von
50 % eines gewählt. Das entspricht langfristig ungefähr einem lokalen
Ereignis alle zwei Runden. Es gibt bewusst keine Pause zwischen zwei
Ereignissen; aufeinanderfolgende Treffer sind erlaubt.

Ein ausgewähltes lokales Ereignis tritt nach kurzer zufälliger
Verzögerung während der normalen Planungsphase auf. Der lokale Pool
umfasst ebenfalls 15 Ereignisse: sechs positive und neun negative.
Er verändert Ressourcen, Credits oder Bevölkerung sofort oder
blockiert für die verbleibende Runde Markt, Grundstücksgebote,
Harvesterbau oder Umrüstung. Eine Harvesterstörung kann aktive
Harvester für die Abrechnung ausfallen lassen. Das ursprünglich
vorgeschlagene lokale Ereignis Nr. 8 bleibt bewusst außen vor.

Zahlenwirkungen skalieren mit der Spieldauer. Sie gelten in Runde
1–6 einfach, in Runde 7–12 doppelt, in Runde 13–18 vierfach und
verdoppeln sich danach alle sechs Runden erneut. Aktionssperren werden
nicht skaliert und gelten stets nur für eine Runde.

Globale und lokale Ereignisse werden getrennt ausgewürfelt. Daher
können in derselben Runde beide, eines oder keines auftreten.

Ereignisse sollen Abwechslung schaffen, ohne den Spielverlauf zufällig zu entscheiden.

Strategische Entscheidungen bleiben wichtiger als Glück.

---

## Meteoriten

Meteoriten sind besondere globale Ereignisse am Rundenende:

- zwei Einschläge sind garantiert,
- ein dritter erfolgt mit 50 Prozent Wahrscheinlichkeit,
- Zeitfenster ungefähr Runde 5–6, 10–12 und optional 15–16,
- in den letzten vier Runden erfolgen keine neuen Einschläge.

Das Zentrum muss unverkauft sein und darf weder HQ, Startfeld noch
zunächst ein Pentagon sein. Nur das Zentrum muss frei sein.

Die konservative, konfigurierbare Standardbasis erhöht:

- das Zentrum um drei Kristallsterne,
- drei direkte Nachbarn um zwei Sterne,
- vier weitere zusammenhängende Felder um einen Stern.

Kein Feld steigt über fünf Sterne. Alle Spieler sehen Ort,
Animation und Geländeveränderung am Zentrum. Die genauen Aufwertungen
bleiben verborgen; Besitzer bereits untersuchter oder aktiv abgebauter
Felder sehen den neuen Wert sofort.

Größere Testvarianten mit vier direkten und sechs äußeren
beziehungsweise fünf direkten und acht äußeren Feldern bleiben
konfigurierbar. Sie sind nicht die Standardbasis.

Die konservative Variante ist im Browser implementiert. Der
seedbasierte Einschlagsplan enthält zwei garantierte und mit
50-prozentiger Wahrscheinlichkeit einen dritten Einschlag. Das
öffentliche Zentrum erscheint nach der Rundenabrechnung in der
Zwischenrangliste und bleibt anschließend auf der Karte markiert.

# 13. Spielende

Die Standardpartie endet nach **20 vollständig abgerechneten Runden**.

Intern zählt die Runde weiterhin aufsteigend. Die Oberfläche zeigt den
Countdown bis zum Versorgungsschiff. Nach der letzten Abrechnung trifft
es mit Vorräten, Ersatzteilen, neuem Personal und der Ablösung ein.

Dieser Ablauf ist im Browser umgesetzt: Der Countdown bleibt während
Planung, Markt, Ereignisbericht und Rangliste sichtbar. Nach der
20. Abrechnung meldet die Abschlussrangliste die Ankunft des
Versorgungsschiffs; ein Zustand für Runde 21 wird nicht erzeugt.

Gewonnen hat der Spieler mit der größten Bevölkerung.

Bei Gleichstand entscheiden:

1. abrechenbares Vermögen aus Credits plus Kurswert der nicht
   verkauften Kristalle,
2. Summe aller übrigen gelagerten Ressourcen ohne Kristalle,
3. Anzahl der Harvester.

Der offizielle Kristallkurs ist der zuletzt veröffentlichte
Orientierungspreis des Kristallmarkts. Er startet bei 40 Credits je
Kristall und wird nicht aus der zeitlich letzten Einzeltransaktion
abgeleitet. Findet in einer Runde kein Kristallhandel statt, bleibt
der Kurs unverändert. Kommt während der gesamten Partie kein
Kristallhandel zustande, gilt am Spielende der Referenzkurs von
40 Credits. Kristalle werden nicht zusätzlich als normale
Ressourceneinheiten gewertet.

Nach Runde 20 bleibt die Abschlussrangliste stehen, zeichnet den
Sieger aus und bietet eine neue Partie an. Es wird keine Runde 21
eröffnet.

## 13.1 Multiplayer-Rundenfrist

Im synchronen Mehrspielermodus stehen für jede Runde vier Minuten
Planungszeit zur Verfügung. Sobald alle menschlichen Kolonien ihre
Planung abgeschlossen haben, wird die Runde sofort abgerechnet.
Servergesteuerte Ressourcen- und Grundstücksauktionen pausieren die
Planungszeit.

Bei Ablauf reicht der Server für jeden noch fehlenden menschlichen
Sitz automatisch einen konservativen Plan ein. Bereits ausgeführte
Aktionen und Harvesterzuweisungen bleiben bestehen; es werden keine
neuen Aktionen erzeugt. Nahrung und Energie erhalten gemeinsam die
höchste vollständig bezahlbare Versorgungsstufe, höchstens
Normalversorgung. Die Kolonie nimmt anschließend regulär an
Produktion, Versorgung und Bevölkerungsauswertung teil. Dieselbe
Regel gilt bei einem Verbindungsabbruch; der Sitz bleibt für einen
Reconnect reserviert.

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

---

# Offene Punkte

## Balancing

- Harvesterkosten
- Marktpreise und Preisentwicklung
- Produktionsmengen
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
