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
- bei Bedarf eine Ressourcenauktion initiieren und daran teilnehmen

## 3. Grundstücksauktionen

- Alle Gebote werden gleichzeitig aufgedeckt.
- Der Höchstbietende gewinnt.
- Gleichstände werden unmittelbar in einer grafischen Stichauktion entschieden. Eine fünfsekündige Ankündigung nennt vorher das Feld, die Beteiligten und den Startpreis.
- Der Startpreis beträgt das bisherige Gleichstandsgebot plus einen Credit. Nach dem Countdown läuft die eigentliche Auktion zehn Sekunden.
- Die beteiligten Spieler starten unterhalb des Preisbalkens. Der erste Schritt nach oben aktiviert das Mindestgebot; weitere Schritte verändern das Gebot in Ein-Credit-Schritten.
- Der zuerst erreichte Preis führt. Das bloße Erreichen desselben Preises übernimmt die Führung nicht; dafür ist ein um einen Credit höheres Gebot nötig.
- Der Führende darf den Balken wieder nach unten ziehen. Er bleibt am Gebot des nächsten Spielers hängen, der dadurch die Führung übernimmt. Am Startpreis bleibt ein bereits aktiviertes Mindestgebot bestehen.
- Der aktuell führende Spieler blinkt beziehungsweise pulsiert deutlich.
- Gebote sind durch die verfügbaren Credits begrenzt. Aktiviert niemand den Startpreis, bleibt das Feld frei.

Das Grundstück wird erst zu Beginn der nächsten Runde übertragen.

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

## 7. Produktion

Alle mit Energie versorgten Harvester produzieren gleichzeitig. Normal arbeitende Harvester produzieren den vollen Ertrag. Harvester in Umrüstung produzieren in der Übergangsrunde die neue Ressource mit halbem Ertrag. Harvester, die nach einer Versetzung auf einem neuen Feld eingerichtet werden, produzieren in der Übergangsrunde nichts.

## 8. Versorgung und Bevölkerungsentwicklung

Die zuvor festgelegten Mengen an Nahrung und Energie werden der Bevölkerung zugeteilt.

Abhängig von der Versorgung wächst die Bevölkerung, stagniert oder schrumpft.

## 9. Rundenende

- Versorgung, Harvesterenergie, Produktion, Bauabschlüsse und Bevölkerungsentwicklung werden nach dem letzten Ressourcenmarkt gemeinsam abgerechnet.
- Markt- und Lagerwerte werden aktualisiert.
- Nach der Abrechnung wird eine gemeinsame Kolonie-Rangliste eingeblendet.
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

Bei identischen Höchstgeboten findet nach einer fünfsekündigen Ankündigung eine grafische Stichauktion zwischen den beteiligten Spielern statt. Der Startpreis liegt einen Credit über dem Gleichstandsgebot. Alle Beteiligten stehen zunächst darunter und können den gemeinsamen Bestgebotsbalken in Ein-Credit-Schritten nach oben schieben oder wieder zurückziehen. Wer einen Preis zuerst erreicht, behält bei einem späteren Gleichstand die Führung. Zieht sich der Führende bis zu einem wartenden Spieler zurück, bleibt der Balken dort hängen und die Führung wechselt. Der Führende wird durch einen Blinkeffekt hervorgehoben. Nach zehn Sekunden gewinnt er zu seinem angezeigten Gebot; ohne aktiviertes Mindestgebot bleibt das Feld frei.

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

Ressourcenauktionen sind freiwillige Aktionen innerhalb der Planungsphase. Jeder Spieler darf eine noch verfügbare Auktion initiieren; global kann jede Ressource jedoch nur einmal pro Runde aufgerufen werden. Das verhindert wiederholte Märkte für dieselbe Ware und hält die Rundendauer kalkulierbar. Das Auktionsrecht gilt mit dem Aufruf als verbraucht, auch wenn anschließend niemand teilnimmt.

Die frei wählbaren Ressourcenmärkte sind:

1. 🌾 Nahrung
2. ⚡ Energie
3. ⛏ Erz
4. 💎 Kristalle

Nach dem Aufruf wird die Planungsansicht zunächst durch eine kurze Auktionsankündigung ersetzt. Sie dauert in Runde 1 fünf Sekunden, in Runde 2 vier Sekunden und ab Runde 3 drei Sekunden. Angezeigt werden die aufgerufene Ressource, der Initiator, der aktuelle Bestand dieser Ressource bei allen vier Kolonien, die eigenen Credits sowie der Hinweis, sich auf Käufer, Verkäufer oder Nichtteilnahme vorzubereiten.

Nach dem Ankündigungs-Countdown beginnt eine fünfsekündige Rollenwahl. Eine Bewegung nach oben meldet den Spieler als Verkäufer, eine Bewegung nach unten als Käufer und die Mittelposition als nicht teilnehmend. Bis zum Ablauf der Positionierungszeit darf die Auswahl geändert werden; danach ist die Rolle für diese Ressourcenauktion festgelegt.

Meldet sich kein Spieler als Käufer oder Verkäufer, wird die Ressourcenauktion vollständig übersprungen. Nach einer abgeschlossenen oder übersprungenen Auktion kehrt das Spiel in dieselbe Planungsphase zurück. Die Rundenabrechnung beginnt ausschließlich über „Runde ausführen“ und startet keine automatische Marktfolge.

Ein Käufer kann sein Gebot niemals über seine aktuell verfügbaren Credits erhöhen. Reicht sein Guthaben nicht für das günstigste aktive Verkaufsangebot, zeigt die Marktsteuerung dessen Preis und den fehlenden Betrag. Liegt bereits ein Kaufgebot im Markt und sinken die Credits durch eine Transaktion unter diesen Preis, wird das Gebot automatisch auf das neue bezahlbare Maximum zurückgenommen oder vollständig hinter das Lager gestellt.

Käufer und Verkäufer handeln gleichzeitig auf einem gemeinsamen Markt.

Die Verkäufer starten am oberen Ende des Marktes.

Die Käufer starten am unteren Ende.

Durch die Bewegung ihres Avatars verändern die Spieler ihr Preisangebot.

Jeder Schritt verändert den Preis um einen Credit.

Eine horizontale Linie markiert jeweils den niedrigsten Verkaufspreis und das höchste Kaufgebot. Die Linien laufen dynamisch mit den führenden Marktteilnehmern mit. Käufer und Verkäufer können die jeweils andere Preislinie erreichen, aber nicht überschreiten.

Die Auktionsdauer wird im Spielverlauf kürzer. Neue Spieler erhalten dadurch in den ersten Runden mehr Zeit, während spätere Märkte zügiger ablaufen. Ein Balken zeigt die verbleibende Auktionszeit zusätzlich zur Sekundenanzeige an.

Während der Auktion zeigt die Oberfläche nur unmittelbar relevante Informationen: den eigenen Bestand der gehandelten Ressource, die eigenen Credits, den Bestand des HQ-Gesamtlager, die ausgeführten Geschäfte sowie die Preislinien. Die allgemeine Statusübersicht und das vorherige Rundenergebnis werden währenddessen ausgeblendet. Der neutrale Bereich „Nicht teilnehmen“ dient nur der Rollenwahl und verschwindet mit Beginn der Auktion. Steigende Werte werden bei einer Transaktion kurz grün, sinkende Werte kurz rot hervorgehoben.

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

Die Preisskala übernimmt die Anzeige der aktuellen Angebotshöhe. Deshalb zeigt ein Avatar während der Auktion keinen Preis, sondern seinen aktuellen Bestand der gehandelten Ressource. Beim Verkäufer sinkt diese Zahl pro Verkauf um eine Einheit, beim Käufer steigt sie pro Kauf um eine Einheit; die Anzeige aktualisiert sich unmittelbar und erhält einen kurzen Farbpuls. In der ersten technischen Marktstufe beginnt Orions sichtbarer Bestand je Ressourcenauktion bei vier Einheiten. Nova und Vega besitzen als reine Layout-Testfiguren noch keinen simulierten Bestand und bleiben mit „wartet“ gekennzeichnet.

Die erste technische Ausbaustufe bildet frei initiierbare Nahrungs-, Energie-, Erz- und Kristallauktionen gegen den KI-Konkurrenten „Konsortium Orion“ und das HQ-Gesamtlager ab. Vor jeder einzelnen Auktion wird die Rolle neu gewählt. Orion beginnt sichtbar im neutralen Bereich und zeigt seine Entscheidung nach kurzer Bedenkzeit durch eine Bewegung an. Seine angezeigte Rolle gilt anschließend tatsächlich für die Auktion. Weitere Spieler werden anschließend auf demselben Marktprinzip ergänzt.

Für die Erprobung des Vierer-Layouts werden Nova und Vega zunächst als sichtbare Testspieler eingeblendet. Sie zeigen Rollen und Platzbedarf, greifen in dieser Zwischenstufe aber noch nicht in Vorräte, Credits oder die Handelswarteschlange ein.

## Zwischenstand nach der Rundenabrechnung

Nach „Runde ausführen“ wird die Runde vollständig abgerechnet. Anschließend sehen alle Spieler vor Beginn der nächsten Planung denselben Zwischenstand. Die Rangliste vergleicht in dieser Reihenfolge:

1. Bevölkerung
2. Credits
3. Gesamtzahl der eingelagerten Ressourcen
4. Anzahl der eigenen Harvester

Die Reihenfolge entspricht zugleich der vorläufigen Rangfolge bei Gleichstand: Bevölkerung besitzt die höchste Bedeutung, danach entscheiden Credits, Ressourcen und Harvester. Die eigene Kolonie wird deutlich hervorgehoben. Die Plätze werden vom letzten bis zum ersten Rang im Abstand von jeweils einer Sekunde aufgedeckt. Der Erstplatzierte erhält zusätzlich ein kleines Kronensymbol. Sobald alle Plätze sichtbar sind, bleibt die vollständige Rangliste weitere drei Sekunden stehen und wechselt danach ohne Bestätigung automatisch in die nächste Planungsrunde. Dieser gemeinsame Ablauf dient später im Mehrspielermodus zugleich als synchroner Übergang für alle Teilnehmer.

Alle vier Ranglistenplätze stammen aus dauerhaft gespeicherten Koloniezuständen. Orion, Nova und Vega besitzen jeweils eine eigene Bevölkerung, Credits, Ressourcenbestände und Harvesterzahl. In der ersten KI-Ausbaustufe werden ihre Versorgung und Produktion mit einer einfachen deterministischen Rundenroutine abgerechnet. Dadurch reagieren ihre Ranglistenwerte auf ihren tatsächlichen Vorrat und nicht mehr auf reine Anzeigeformeln. Grundstückserwerb, Harvesterbau und die vollständige Teilnahme der KI-Kolonien am Markt werden in den folgenden Ausbaustufen an denselben Zustand angeschlossen.

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
