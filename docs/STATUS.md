# Projektstatus

**Automatisch erfasste Basis:** Branch `main`, Commit
`34cf55a`, Arbeitsbaum beim Erzeugen der Dokumentation:
**sauber**  
**Erstellt:** 2026-07-26

Diese Angaben sind ein Startpunkt. Vor jeder Arbeit immer erneut
`git status --short` und `git log -5 --oneline` ausführen.

## Produktkern

- Planet: Agima
- Spieltyp: rundenbasierte Kolonie- und Wirtschaftsstrategie
- Zielplattform: Browser und Smartphones
- Standardpartie: 20 Runden, zunächst ungefähr 35–45 Minuten
- Hauptwertung: Bevölkerung
- weitere Gleichstandswerte: Vermögen einschließlich Kristallkurs,
  übrige Ressourcen ohne Kristalle, Harvester
- vier Kolonien: Agima, Orion, Nova und Vega

## Implementiert

- alle vier Kolonien starten wirtschaftlich gleich mit 15 Nahrung,
  15 Energie, 6 Erz, einer Kristallprobe, 150 Credits und zwei
  Harvestern
- serialisierbare Match-Konfiguration mit vier gleichartigen
  Teilnehmersitzen für Agima, Orion, Nova und Vega
- je Sitz getrennt konfigurierbare menschliche lokale, menschliche
  entfernte oder KI-Steuerung; freie Mehrspielersitze können dadurch
  später ohne Sondermodell mit KI belegt werden
- seedbasierte und reproduzierbare Startkorridor-Zuordnung als Teil
  der versionierten Match-Konfiguration
- gemeinsamer `ColonyState`-Grundtyp und symmetrische,
  UI-unabhängige Leseansicht auf Agima, Orion, Nova und Vega
- eine kanonische, serialisierbare `GameState.colonies`-Map als
  einzige dynamische Zustandsquelle aller vier Kolonien
- individueller, serialisierbarer Gebietsentdeckungsstand je Kolonie:
  Startbesitz und direkte Nachbarn sind anfangs aufgedeckt; jeder
  Grundstückserwerb deckt das neue Feld und dessen Nachbarn dauerhaft
  ausschließlich für den Käufer auf
- Einzel- und Mehrspielerkarten verdecken nicht aufgedeckte Gebiete
  mit einer zusammenhängenden, planetenverankerten Wolkendecke;
  Ressourcen, Besitz, Harvester, Felddetails und Aktionen bleiben dort
  verborgen und die Felder sind nicht auswählbar
- autoritative Multiplayer-Snapshots begrenzen fremden Besitz,
  Harvesterzuweisungen und feldbezogene Harvester-IDs auf die vom
  empfangenden Sitz bereits aufgedeckten Felder; fremde
  Aufdeckungslisten und Kristallexplorationen werden vollständig
  entfernt, während eigene Daten sowie öffentliche Auktionen und
  Meteoriteneinschläge erhalten bleiben
- frühere Agima-Wirtschaftsfelder auf der Spielzustandswurzel, der
  separate `rivals`-Record und die gespeicherte
  `opponentTileIds`-Kopie sind entfernt; Gegnerbesitz wird abgeleitet
- Harvester-Gesamtzahl, freie Harvester und sämtliche
  Spielerzuweisungen liegen im serialisierbaren Spielzustand statt
  in getrennten React-Zuständen
- UI-unabhängige Zustandsoperationen für Einsetzen, Umrüsten und
  Entfernen der Spieler-Harvester
- versionierte, vollständig serialisierbare Kommandoschicht für
  Harvester einsetzen, Produktion ändern, Harvester entfernen,
  Harvesterbau beauftragen sowie Grundstücksgebote abgeben und
  zurücknehmen; Ressourcenmärkte starten, Rollen und Preisangebote
  setzen, Einzeltransaktionen ausführen und Märkte abschließen;
  Grundstücks- und Ressourcenauktionen phasenweise fortschalten
  sowie Live-Gebote der grafischen Grundstücksauktion bewegen
- Laufzeitprüfung von Kommandoformat, Teilnehmer, erwarteter Runde
  und Aktionslegalität; erfolgreiche Kommando-IDs werden begrenzt im
  Spielzustand gespeichert und dadurch höchstens einmal ausgeführt
- dieselben teilnehmerbezogenen Kommandooperationen funktionieren
  für lokale und entfernte menschliche Sitze; die React-Oberfläche
  sendet ihre Harvester-, Bau-, Grundstücks- und Marktaktionen
  bereits ausschließlich über diese Grenze
- verdeckte Grundstücksgebote, reservierte Credits, Führender und
  Eröffnungsgebote der grafischen Auktion sind nach
  `ParticipantId` gespeichert; Reservierung, Erstattung, Siegerpreis
  und Besitzübertragung verwenden keine fest verdrahtete
  Spieler-/Orion-Seite mehr
- Phase, laufende Gebote und aktueller Führender der grafischen
  Grundstücksauktion liegen im `GameState`; Spieler und Orion
  verändern sie über dieselbe validierte Kommandogrenze
- die vorhandene grafische Oberfläche zeigt weiterhin den
  Agima-Orion-Konflikt; das Kernmodell kann zusätzliche Bieter
  aufnehmen, deren Darstellung folgt mit der Mehrspieler-UI
- aktiver Ressourcenmarkt, Initiator, Rollen und Preisangebote aller
  beteiligten Kolonien sowie die aktuelle Marktphase liegen
  serialisierbar im `GameState`;
  Marktstart und Abschluss sind dadurch nicht mehr nur lokaler
  React-Zustand
- Lagerhandel, interstellarer Kristallverkauf und direkte
  Koloniegeschäfte funktionieren für beliebige `ParticipantId`;
  Transaktionskommandos prüfen aktive Rolle, Angebot, Gegenangebot,
  Preis, Credits und Bestand
- Markt- und Grundstücksphasen werden nur über validierte,
  erwartungsgebundene Kommandos fortgeschaltet; lokale Timer lösen
  diese Kommandos im Singleplayer aus, sind aber nicht mehr die
  Quelle des Phasenzustands
- Countdown, Avatarbewegungen und KI-Auswahl bleiben vorerst lokale
  Darstellung beziehungsweise Singleplayer-Adapter
- die lokale Ressourcenauktion initialisiert Preispositionen nur beim
  einmaligen Eintritt in die Auktionsphase; kanonische Angebotsupdates
  setzen aktive Käufer- oder Verkäuferfiguren nicht mehr zurück
- transportneutraler autoritativer Match-Serverkern mit
  Sitzungsbindung an menschliche `ParticipantId`, Abwehr von
  Identitätswechseln und vom Serverzustand isolierten,
  revisionsnummerierten Zustands-Snapshots
- Client-Kommandos für Auktionsphasen sind an der Servergrenze
  gesperrt; der Serverkern plant die Fristen aus den gemeinsamen
  Markt- und Grundstückszeiten und führt fällige Phasenkommandos
  selbst aus
- Zustandsabonnements erhalten nach jedem erfolgreichen Kommando
  sowie jedem serverseitigen Phasenwechsel einen neuen Stand;
  verbundene Clients erhalten daraus ihren personalisierten Snapshot
  einschließlich autoritativem `deadlineAt`
- versioniertes JSON-Nachrichtenprotokoll für Lobbybeitritt,
  Wiederaufnahme, Bereitschaft, Matchstart, Matchneustart und
  Spielkommandos mit
  vollständiger Laufzeitvalidierung unbekannter Eingaben
- transportneutrale Vier-Sitz-Lobby: erster menschlicher Sitz wird
  Host, weitere Spieler erhalten freie Koloniesitze, der Host
  startet nach Bereitschaft aller verbundenen Menschen und freie
  Sitze werden mit den vorhandenen KI-Profilen gefüllt
- geheime Reconnect-Tokens werden nur an die zugehörige Verbindung
  gesendet und nie in Lobby-Snapshots veröffentlicht; nach einem
  Verbindungsabbruch kann derselbe Sitz während Lobby oder Partie
  mit einer neuen Verbindung übernommen werden
- Lobby-Seed, Controller und zugewiesene Startkorridore werden beim
  Start gemeinsam in den kanonischen Spielzustand übernommen
- serverseitige Rundenbarriere mit validierten Versorgungsplänen pro
  menschlichem Sitz; öffentliche Match-Snapshots enthalten nur die
  teilnehmerbezogene Bereitschaft und keine fremden Planwerte
- autoritative Planungsfrist von vier Minuten je Multiplayer-Runde;
  Match-Snapshots enthalten die laufende Serverfrist oder den
  pausierten Restwert, und die Oberfläche warnt bei 60 sowie
  15 verbleibenden Sekunden
- Ressourcen- und Grundstücksauktionen pausieren die Planungsfrist;
  nach ihrem Ende läuft exakt die zuvor verbleibende Zeit weiter
- am Fristende erhalten fehlende oder getrennte menschliche Sitze
  automatisch die höchste gemeinsam bezahlbare Versorgung bis
  maximal Normalversorgung; bestehende Aktionen und
  Harvesterzuweisungen bleiben unverändert
- nach der Bereitschaft sind weitere Spielkommandos dieses Sitzes
  gesperrt; die Bereitschaft bleibt bei einem Reconnect erhalten
- nach allen menschlichen Plänen führt der Server genau eine
  gemeinsame Rundenabrechnung aus; entfernte menschliche Kolonien
  verwenden ihre eigene Versorgung und werden nicht als KI
  fortgeschrieben
- freie KI-Sitze werden in derselben Abrechnung serverseitig
  fortgeführt; eine offene grafische Grundstücksauktion wird zuvor
  vollständig über die autoritativen Phasen aufgelöst
- startbarer lokaler Node-WebSocket-Server verbindet JSON-Clients
  mit der transportneutralen Lobby und dem autoritativen Matchkern
- dynamische Lobby-Registry erzeugt beim ersten Verbindungsaufbau
  jeden gültigen Lobbycode unabhängig; Sitze, Reconnect-Tokens,
  Bereitschaft, Matchzustand und Timer bleiben vollständig zwischen
  den Codes isoliert
- vollständig verlassene Lobbys bleiben zehn Minuten für Reconnects
  erhalten und werden danach einschließlich Zustand, Timer und
  Tokens bereinigt; eine neue Verbindung in der Schonfrist bricht
  die Löschung ab
- feste WebSocket-Route, maximale Payloadgröße, Ablehnung von
  Binärdaten, Health-Endpunkt mit aktueller Lobbyanzahl, zufällige
  Verbindungs-IDs und sauberes Disconnect-/Shutdown-Verhalten sind
  implementiert
- echte Transporttests decken zwei Clients, gemeinsamen Matchstart,
  Sitzübernahme per Reconnect-Token, eine vollständige erste
  Smoke-Runde und den gemeinsamen Abschluss einer zweiten Runde nach
  dem Reconnect ab; die erste setzt einen Harvester, reserviert ein
  Grundstücksgebot, führt direkte Geschäfte auf allen vier Märkten
  aus, rechnet beide menschlichen Pläne gemeinsam ab und prüft den
  fortgesetzten Rundenzustand nach dem Reconnect
- Loopback ist die sichere Standardbindung; für Smartphone-Tests
  kann der Server bewusst im lokalen WLAN geöffnet werden
- Startseite enthält eine responsive Mehrspieler-Lobby neben dem
  unveränderten Einzelspielerstart
- die Einzelspieler-Startseite erscheint ohne vorgeschaltetes Video;
  erst „Neue Kolonie“ startet zwei lokal gebündelte,
  stummgeschaltete Videos direkt hintereinander, danach beginnt die
  Partie; die Sequenz ist jederzeit überspringbar und zeigt keinen
  sichtbaren Abschnittszähler
- auf Smartphones werden die 16:9-Startvideos zentriert vergrößert;
  links und rechts werden zusammen ungefähr 20 Prozent abgeschnitten,
  damit die Sequenz im Hochformat präsenter erscheint
- sichtbare Eingaben für Name, WebSocket-Server und Lobby-ID sowie
  Vier-Sitz-Übersicht, Verbindungsstatus, Bereitschaft und
  Host-Startsteuerung sind implementiert
- ein sichtbarer Aufweck-Button ruft vor dem Beitritt den aus der
  WebSocket-Adresse abgeleiteten Health-Endpunkt auf und zeigt
  Kaltstart, Bereitschaft oder einen erneuten Versuch verständlich an;
  ein schreibfreier Fallback weckt auch ältere Server ohne lesbare
  CORS-Antwort
- verbundene Teilnehmer können einen Einladungslink teilen; beim
  Öffnen wechselt die Startseite direkt in die Mehrspieler-Lobby und
  übernimmt Serveradresse sowie Lobbycode validiert, ohne Name,
  Reconnect-Token oder automatischen Beitritt zu übertragen
- Browserclient übernimmt Lobby- und Match-Snapshots, speichert das
  geheime Reconnect-Token nur lokal und nimmt denselben Sitz nach
  einem Verbindungsabbruch automatisch wieder auf
- nach dem Start werden freie Sitze sichtbar als KI übernommen und
  jeder menschliche Sitz sieht zunächst dieselbe überspringbare
  Startvideosequenz und wechselt danach in seine teilnehmerbezogene
  Spielansicht; laufende Match-Snapshots starten die Sequenz nicht
  erneut
- Karte, HQ, Harvesteraktionen, Grundstücksgebote,
  Ressourcenmärkte und Rundenplanung lesen ausschließlich
  autoritative Match-Snapshots und senden validierte
  Netzwerkkommandos; fremde Sitze führen dadurch keine lokale
  Agima-Logik aus
- die Mehrspieler-Planetensicht zentriert beim Einstieg das eigene
  Startgrundstück; mobile Harvesteraktionen sind oberhalb des
  Browser-Sicherheitsbereichs fest verankert, kontrastreich sichtbar
  und zeigen die Anzahl freier Harvester
- persönliche Mehrspieler-Marktangebote sind für Käufer mit dem
  HQ-Verkaufspreis und für Verkäufer mit dem HQ-Ankaufspreis
  vorbelegt, sodass das unveränderte Standardlimit direkt handelbar
  ist
- der Mehrspieler-Kristallmarkt zeigt das aktuelle Gebot und die
  verbleibende Rundenkapazität des interstellaren Käufers; aktive
  Verkäufer können ihm über eine eigene Schaltfläche einen Kristall
  verkaufen, sofern Bestand, Kapazität und persönliches Limit passen
- jeder initiierte Ressourcenmarkt führt alle vier Kolonien in einer
  gemeinsamen Teilnehmerliste; jede Kolonie kann unabhängig vom
  Initiator kaufen, verkaufen oder aussetzen, und bereits eine aktive
  andere Kolonie führt in die Handelsphase
- freie KI-Sitze wählen Rolle und Preislimit im autoritativen
  Mehrspielermarkt serverseitig aus ihrer eigenen Wirtschaftslage;
  kompatible aktive Angebote zweier Kolonien erhalten eine direkte
  Einzeltransaktion, während Grundstücksauktionen unverändert nur
  ihre tatsächlichen Bieter umfassen
- teilnehmerbezogene Multiplayer-Rundenbriefings zeigen Produktion,
  Versorgung, Bevölkerung, Grundstücksausgang, neue Harvester und
  abgeschlossene Kristallexplorationen; Explorationsergebnisse
  öffnen auf Wunsch direkt das zugehörige Kartenfeld
- der Server hält Berichte getrennt je menschlichem Sitz und fügt
  nur den eigenen Bericht in dessen personalisierten Snapshot ein;
  unpersonalisierte Snapshots enthalten keine Rundendaten
- beim Übergang in eine neue Multiplayer-Runde wählt der Server das
  globale Ereignis reproduzierbar aus Match-Seed und Rundennummer,
  aktiviert seine sofortigen Wirkungen genau einmal für alle vier
  Kolonien und hält Sperren, Kosten- und Produktionswirkungen im
  kanonischen Zustand
- das Multiplayer-Briefing kündigt das für die neu beginnende Runde
  aktive globale Ereignis an; der private Wirtschaftsbericht bleibt
  davon getrennt der gerade abgeschlossenen Runde zugeordnet
- teilnehmerneutrale Multiplayer-Rangliste mit der offiziellen
  Sortierung nach Bevölkerung, Vermögen einschließlich
  Kristallreferenzkurs, übrigen Ressourcen und Harvestern
- jeder menschliche Sitz sieht seine aktuelle Platzierung in der
  kompakten Statuszeile, die vollständige Rangliste im HQ und nach
  jeder Abrechnung zuerst den gemeinsamen Zwischenstand, danach das
  private Ereignis- und Koloniebriefing
- nach der Abrechnung der 20. Runde markiert der Server den Match-
  Snapshot endgültig als beendet und weist weitere Spielkommandos
  sowie Rundenpläne unabhängig vom Client zurück
- auf der Abschlussrangliste kann nur der Host die bestehende
  Spielgruppe in dieselbe wartende Lobby zurückführen; Namen,
  Sitzplätze und Reconnect-Tokens bleiben erhalten, die Bereitschaft
  wird für die nächste Partie zurückgesetzt
- private lokale Multiplayer-Ereignisse werden pro menschlichem Sitz
  reproduzierbar aus Match-Seed, Runde und Teilnehmer gewählt und
  mit einer getrennten Verzögerung von zwei bis sechs Sekunden
  serverseitig aktiviert
- die Aktivierung wartet während Ressourcen- und
  Grundstücksauktionen; unmittelbare Ressourcen-, Credit- und
  Bevölkerungswirkungen sowie einrundige Sperren betreffen nur die
  ausgewählte Kolonie
- personalisierte Match-Snapshots enthalten ausschließlich die
  lokale Ereignis-ID des eigenen Sitzes; unpersonalisierte
  Snapshots und fremde Sitz-Snapshots entfernen diese IDs
- die Multiplayer-Meldung verwendet die bestehende lokalisierte,
  responsive Ereigniskarte und kann nach sechs Sekunden verschwinden,
  ohne die kanonische Wirkung oder Sperre vorzeitig zu löschen
- gemeinsame teilnehmerbezogene Schreibgrenze für Bevölkerung,
  Credits, Ressourcen, Harvesterzahlen und Grundstücksbesitz
- globale Ereignisse, lokale Agima-Ereignisse, Spieler-Harvesterbau,
  direkter Koloniehandel und autonome Rivalenkäufe verwenden diese
  gemeinsame Schreibgrenze
- direkte Geschäfte mit Orion werden wie Geschäfte mit Nova und Vega
  vollständig in beiden beteiligten Kolonien verbucht
- Browser-Rundenabrechnung schreibt Agimas Versorgung, Produktion,
  Bevölkerung und fertiggestellte Harvester über die gemeinsame
  Koloniegrenze
- Rivalen-Rundenabrechnung bleibt als Headless-Funktion separat und
  wird im Browser über einen teilnehmerbezogenen Adapter übernommen
- Landgewinne von Agima und Orion aus der grafischen Auktion werden
  über denselben Besitzpfad abgeschlossen
- drehbare Browserkugel mit zentralem HQ und 91 Grundstücken
- UI-unabhängiges Kartenmodell mit Feld-IDs, symmetrischen
  Nachbarlisten und berechneten Graphdistanzen
- getrennte normalisierte Kugelkoordinaten und flache
  Layoutpositionen
- interner, deterministischer 92-Felder-Graph mit einem HQ,
  91 Grundstücken, zwölf Pentagonen und 80 Hexagonen
- validierte Nachbarzahlen, vollständige Verbindung und
  reproduzierbare Feld-IDs des Zielgraphen
- vier intern festgelegte, strukturell gleichwertige Startkorridore
  und zwei gegenüberliegende neutrale HQ-Nachbarn
- seedbasierte, reproduzierbare Zuordnung aller vier Korridore an
  vier Teilnehmer
- reproduzierbare Entfernungszonen mit 9 Start-, 10 inneren,
  33 Explorations- und 40 Fernzonenfeldern
- orthografische Kugelprojektion mit ausgeblendeter Rückseite,
  sichtbaren Nachbarverbindungen und erkennbaren Pentagonen
- Touch-Drehung, Pinch-/Mausrad-Zoom, HQ-Zentrierung und Feldauswahl
  auf dem Zielgraphen
- immersive Kolonieansicht ohne Kartenrahmen: Weltraum und ein
  vergrößerter, leicht unterhalb der Bildschirmmitte platzierter
  Planet füllen den gesamten Bildschirm; die Kolonieüberschrift ist
  entfernt, während Runde, Rang und Kolonievorräte ohne einfarbige
  Leiste darüber schweben;
  auf Smartphones hält ein festes Sieben-Spalten-Raster auch den
  Kristallvorrat vollständig im sichtbaren Bereich
- jedes sichtbare Grundstück zeigt direkt seine stärkste normale
  Ressource und deren Wert; ab dem 1,24-fachen Zoom oder bei Auswahl
  erscheinen Nahrung, Energie und Erz mehrzeilig auf dem Feld; ihre
  Schrift wächst proportional mit dem Planetenzoom bis zum 2,2-fachen
  Nahzoom, entdeckte eigene Kristalle zusätzlich
- kontextabhängige Aktionsbuttons erscheinen direkt in der
  holografischen Grundstücksübersicht und nur für legale
  Grundstücksgebote, Harvesterplatzierung oder Harvesterverwaltung;
  unter dem Planeten bleibt keine getrennte Aktionsleiste, das HQ
  wird direkt über sein Planetenfeld geöffnet und die frühere
  HQ-beschriftete Zentriertaste verwendet ein neutrales Zielsymbol
- die ausgewählte sichtbare Parzelle erhält eine
  holografische Detailkarte mit Name, Besitzer und Ressourcenwerten;
  sie verwendet wieder ihre ursprüngliche Breite, Höhe, Schrift und
  Innenabstände und weicht abhängig vom Feldquadranten immer in die
  diagonal gegenüberliegende der vier bildschirmsicheren Ecken aus;
  die beiden unteren Smartphone-Ecken reichen bis knapp oberhalb der
  Zoomsteuerung und nutzen den zuvor freien Raum;
  eine feine Leuchtlinie verbindet sie mit dem tatsächlich
  gerenderten Feld
- Produktionswahl und Gebotshöhe lösen sich beim Öffnen aus der
  Feldkarte und erscheinen als größere, gut lesbare temporäre
  Glasfläche; auf Smartphones bleibt die normale Feldkarte kompakt
- durchgehende fotorealistische, marsartige Oberflächentextur aus
  Rostboden, Terrakotta, Ocker und dunklem Basalt ohne gezeichnete
  Ressourcenmotive oder harte Biome
- hochauflösende geologische Basisebene mit Regolith, Sedimenten,
  Erosionsfächern und Basaltbrüchen für den 2,2-fachen Nahzoom
- lückenlos aneinander anschließende sphärische Dualzellen aus den
  gemeinsamen Dreiecksflächen des Planetengraphen
- kugelrichtige Rückprojektion einer gemeinsamen Welttextur, die
  beim Drehen fest auf dem Planeten bleibt
- moderat differenzierte, räumlich geglättete Farbnuancen: Nahrung
  olivgrün, Energie kühl blaugrau und Erz eisenrot
- stufenlose visuelle Terraformingentwicklung über alle 20 Runden:
  von der Marsbasis zur erdähnlichen Vegetationsbasis
- nahrungsreiche Regionen entwickeln sich schneller und stärker;
  karge sowie erzreiche Regionen behalten länger Marsgestein
- aktuell mit Harvestern bewirtschaftete Grundstücke erhalten einen
  weich auslaufenden zusätzlichen Grün- und Terraforminganteil, der
  von Runde 1 bis 20 sichtbar zunimmt und keine Regeln verändert
- feste gerichtete Beleuchtung mit heller Einfallsseite, weich
  abgedunkelter Gegenseite; der frühere blaue Kugelrand ist entfernt
- dichteres, tief gestaffeltes Sternfeld statt schwarzer
  Kartenfläche; zwei Sternenebenen verschieben sich mit der Yaw- und
  Pitch-Rotation des Planeten und bleiben nach einer vollständigen
  Drehung nahtlos; eine kleine leuchtende Sonne und ein entfernter
  Ringplanet wandern bei der Planetendrehung auf Außenbahnen um die
  Kugel; ihr Abstand zur Planetenoberfläche bleibt beim Zoomen
  konstant, sodass die Kugel sie nicht mehr überdeckt
- keine sichtbaren Feldnummern auf der Kugel; Feld-IDs bleiben in
  Spielstand und Diagnose erhalten
- alle 91 Grundstücke tragen feste, eindeutige Londoner
  U-Bahn-Stationsnamen; Detailansicht, Auktionen, Rundenbericht und
  barrierefreie Bezeichnungen verwenden diese Namen
- deutlich markiertes zentrales HQ mit eigenem Luftbild: vier
  Kolonie-HQs von Agima, Orion, Nova und Vega sind über Korridore an
  eine gemeinsame Zentralkuppel angeschlossen; dasselbe Motiv
  füllt die vollständige projizierte HQ-Zelle und erscheint außerdem
  in der HQ-Ansicht
- größere kontrastunterlegte Harvesterzeichen; Kolonienamen bleiben
  auf belegten Feldern weiterhin sichtbar
- getrennte Besitzanzeige für Orion, Nova und Vega statt einer
  gemeinsamen Orion-Beschriftung aller Rivalenfelder; kontrastreiche,
  mobil vergrößerte Kolonienamen bleiben auch auf der
  unvergrößerten Kugel lesbar
- ruhige Felder ohne permanente Polygonrahmen; Konturen erscheinen
  bei Hover, Tastaturfokus oder Auswahl, notwendige Spielmarkierungen
  bleiben sichtbar
- Ziel-Startfelder im normalen Browser-Spielzustand
- zwei Startfelder je Kolonie
- Nahrung, Energie, Erz, Kristalle und Credits
- Kristallförderung durch Harvester auf natürlichen und durch
  Meteore aufgewerteten Vorkommen
- nach abgeschlossener Exploration steht Kristallproduktion in der
  mobilen Harvester-Auswahl an erster Stelle; vier verfügbare
  Produktionsarten erscheinen als scrollbares 2×2-Raster
- Kristallwerte neu gekaufter Felder bleiben eine vollständige
  Folgerunde verborgen und sind erst ab der darauffolgenden Runde
  sichtbar und förderbar; dies gilt auch für KI-Kolonien
- abgeschlossene Kristallexplorationen werden zu Beginn der
  Freigaberunde mit Grundstücksname und Ergebnis im Infosheet
  gemeldet; ein Antippen öffnet das Grundstück und dreht die Kugel
  automatisch darauf
- aufgeräumte Planungsoberfläche mit kompakter Statuszeile samt
  aktuellem Rang: Karte und Grundstücksdetails liegen in der
  Kolonieübersicht; das separat betretbare HQ zeigt zunächst nur
  Koloniestatus, Harvesterbau sowie die Einstiege „Zu den Auktionen“
  und „Zum Lager“; Marktstarter beziehungsweise Versorgungsvorschau
  und Rundenabschluss liegen in diesen Untermenüs
- grüner Rückweg „Hauptquartier verlassen“ zur Kolonieübersicht und
  eigener Rückweg aus jedem Untermenü zum HQ; Antippen des HQ-Markers
  öffnet die Verwaltungsansicht ebenfalls
- die Lagervorschau fasst Bevölkerungsversorgung und
  Harvesterenergie als „Verbrauch in dieser Runde“ zusammen und zeigt
  Nahrung, gesamte Energie sowie den Gesamtverbrauch
- eine gemeinsame Lagerübersicht stellt für Einzel- und Mehrspieler
  Vorrat vor der Runde, Verbrauch, Produktion und erwarteten Vorrat
  danach einschließlich Kristallen direkt gegenüber; Bevölkerung
  sowie aktive, pausierte und insgesamt vorhandene Harvester stehen
  darunter, Versorgungs- und Harvesterenergieengpässe erscheinen als
  hervorgehobene Warnungen
- Harvesterbau und mehrere parallele Bauaufträge
- Harvesterplatzierung, Produktion, Umrüstung und Versetzung
- Energiebedarf der Harvester
- Versorgung und Bevölkerungsentwicklung
- globale und lokale Ereignisse
- freiwillige Märkte für vier Ressourcen
- HQ-Lager als neutraler Handelspartner
- direkte Einzeltransaktionen zwischen Marktteilnehmern
- dauerhaft gespeicherte Rivalenkolonien
- autonome Land-, Harvester-, Investitions- und Marktlogik
- zentrale Graphprüfung stellt sicher, dass auch autonome
  Grundstückskäufe ausschließlich auf angrenzende Felder zielen
- Zwischen- und Abschlussrangliste
- sichtbarer Countdown bis zum Versorgungsschiff
- Versorgungsschiff und Ablösung nach der 20. Abrechnung
- Headless-Einzel- und Seriensimulation
- seedbasierte Meteore und kapazitätsbegrenzter interstellarer
  Kristallkäufer in der Headless-Simulation
- GitHub-Pages-Deployment mit Test, Lint und Build

## Nächster Architekturbaustein

Der Mehrspielerpfad deckt jetzt den vollständigen
Partielebenszyklus von Lobby und Hoststart über autoritative Runden,
Ereignisse und Rangliste bis zum serverseitig gesperrten Partieende
und gemeinsamen Rückweg in dieselbe Lobby ab. Eine autoritative
Rundenfrist verhindert inzwischen auch Blockaden durch untätige oder
getrennte Spieler. Derselbe Server verwaltet inzwischen mehrere
dynamische, voneinander isolierte Lobbycodes und bereinigt leere
Räume nach einer zehnminütigen, durch Reconnect abbrechbaren
Schonfrist. Einladungslinks übernehmen inzwischen Serveradresse und
Lobbycode direkt in den Mehrspielerpfad. Ein Render-Blueprint
konfiguriert den Node-Web-Service mit Plattform-Port, Health Check,
öffentlicher Bind-Adresse und auf GitHub Pages begrenzter
Browser-Origin. Der kostenlose Dienst `elum-multiplayer` ist unter
`https://elum-multiplayer.onrender.com` angelegt; Health Check und
TLS-WebSocket-Handshake sind erfolgreich geprüft. Die
GitHub-Pages-Oberfläche verwendet ihn standardmäßig über `wss://`.
Da der kostenlose Web-Service nach Inaktivität einschläft, kann die
erste Antwort rund eine Minute dauern. Die Lobby kann ihn deshalb
über einen eigenen Button wecken; `/health` ist dafür ohne
Zugangsdaten browserlesbar und liefert nur aggregierte Zustandsdaten.
Der Server hält WebSocket-Verbindungen mit einem 30-sekündigen
Ping/Pong-Heartbeat sauber und entfernt nicht mehr antwortende
Sockets; der Health-Endpunkt veröffentlicht Bereitschaft sowie
Lobby- und Verbindungszahl. `/metrics` stellt zusätzlich
Prometheus-kompatible, rein aggregierte Gauges und Prozesszähler für
Lobbys, Verbindungen, Nachrichten und abgewiesene Upgrades bereit.
Eine versionierte JSON-Speicherhülle mit Ablaufzeit, asynchronem
Speichervertrag und In-Memory-Adapter bildet die neue
Persistenzgrenze. Sie isoliert Lobbycodes und Objektmutationen und
verwirft abgelaufene Einträge beim Lesen. Wartende Lobbys exportieren
Seed, Revision, menschliche Sitze, Bereitschaft und geheime
Reconnect-Tokens als eigene Version-1-Nutzlast; Verbindungs-IDs
bleiben prozesslokal. Unbekannte Nutzlasten werden gegen Version,
Phase, IDs, Seed, Revision, kanonische Sitzfolge, Hostrolle, Namen
und eindeutige Tokens validiert. Aus gültigen Nutzlasten lässt sich
eine wartende Lobby mit zunächst getrennten Sitzen und erhaltenen
Reconnect-Tokens wiederherstellen. Der autoritative Matchkern
exportiert inzwischen einen eigenen Version-1-Snapshot aus
kanonischem Spielzustand, Revision, Abschlussstatus, privaten
Rundenplänen und -berichten, Server-Kommandosequenz sowie absoluten
Phasen-, Runden- und lokalen Ereignisfristen. Sitzungs-IDs,
Abonnenten und Timer-Handles bleiben prozesslokal. Speicherhülle und
Grundstruktur der persistenzspezifischen Felder werden validiert;
eine Wiederherstellungsfunktion setzt Zustand, private
Bereitschaften, Berichte, Sequenz und sämtliche autoritativen Fristen
fort. Laufende Lobbys exportieren denselben Match-Snapshot zusammen
mit Seed, Revision, menschlichen Sitzen und Reconnect-Tokens als
`playing`-Variante der Version-1-Nutzlast. Sie können mit getrennten
Sitzen wiederhergestellt und anschließend über die erhaltenen Tokens
fortgesetzt werden. Alte Prozess-Sitzungen werden nicht übernommen.
Die WebSocket-Registry lädt beim ersten Zugriff wartende oder laufende
Lobbys, speichert Lobby- und Matchänderungen geordnet und ersetzt beim
Matchstart den wartenden durch den laufenden Snapshot. Dazu gehören
auch Änderungen durch serverseitige Timer ohne neue Clientnachricht.
Integrationstests stellen sowohl eine wartende als auch eine bereits
laufende Partie mit Reconnect-Token und Spielzustand über zwei
Serverinstanzen und einen gemeinsam injizierten Speicher wieder her.
Aktive Räume erhalten eine getrennte 24-Stunden-TTL; nach
dem letzten Disconnect gilt die zehnminütige Reconnect-Schonfrist.
Ein getesteter Redis-/Valkey-Adapter speichert Datensatz und TTL
atomar, validiert externe JSON-Werte und wird beim Prozessstart über
eine gültige `REDIS_URL` ausgewählt. Ohne Variable bleibt der
In-Memory-Adapter aktiv. Der Blueprint provisioniert einen privaten
kostenlosen Render-Key-Value-Dienst in derselben Region und bezieht
dessen interne Verbindungs-URL direkt als `REDIS_URL`; Zugangsdaten
stehen dadurch nicht im Repository. Dieser externe Prozessspeicher
schützt Lobby- und Matchzustand gegen Neustarts des Web-Service, der
kostenlose Key-Value-Tarif besitzt jedoch selbst keine
Festplattenpersistenz. Noch offen sind belastbare dauerhafte
Speicherung sowie externe Langzeitspeicherung der Metriken. Eine
unabhängige GitHub Action
prüft Health und erwartetes Metrikformat alle sechs Stunden sowie
manuell; Fehler werden dadurch als fehlgeschlagene Workflow-Läufe
sichtbar, ohne die kostenlose Render-Instanz dauerhaft warm zu
halten. GitHub Pages hostet weiterhin nur das statische Frontend.

## Grundstücksauktion – aktueller Sollstand

Treffen mindestens zwei Gebote auf ein Grundstück:

1. Es findet immer eine grafische Auktion statt.
2. Startpreis ist das höchste verdeckte Gebot.
3. Der alleinige Höchstbietende startet in Führung.
4. Ohne höheres Gebot gewinnt dieser zum Startpreis.
5. Bei gleichem Höchstgebot startet die bisherige
   Stichentscheidung ohne Führenden.
6. Ein gleich hohes späteres Gebot übernimmt die Führung nicht.

## Agenten-Balancing

Aktueller 200-Partien-Stand mit 20 Runden, Markt und den Seeds
1 bis 200:

| Kolonie | Siegquote | Durchschnittsrang | Ø Bevölkerung | Ø Abrechnungsvermögen |
|---|---:|---:|---:|---:|
| Agima | 10,0 % | 2,85 | 19,6 | 209,5 |
| Orion | 8,5 % | 2,98 | 19,1 | 213,9 |
| Nova | 34,0 % | 1,94 | 21,5 | 59,2 |
| Vega | 47,5 % | 1,85 | 22,4 | 24,6 |

Die Seriensimulation verwendet jetzt dieselbe lexikografische
Schlusswertung wie die Browserpartie: Bevölkerung,
Abrechnungsvermögen, übrige Ressourcen und Harvester. Der separat
ausgewiesene Ökonomiewert bleibt nur eine Diagnosegröße und
entscheidet keine Partie.

Systemische Beobachtungen aus dem aktuellen Lauf:

- 129 unterschiedliche Endergebnisse
- 164,2 Markttransaktionen je Partie
- 4,1 direkte Spielertransaktionen je Partie
- direkter Handelsanteil 2,5 %
- 159,1 HQ-Lagertransaktionen je Partie
- 1,0 Verkauf an den interstellaren Käufer je Partie
- durchschnittlich 2,4 Meteore je Partie
- 2,67 Versorgungssignale je Partie
- davon 240 Bevölkerungsrückgänge, 266 leere Nahrungs- und
  9 leere Energiebestände

Diese aktuelle Referenz verwendet das erhöhte gemeinsame Startlager
von 15 Nahrung, 15 Energie und 6 Erz. Es löst die frühen
Energieengpässe deutlich, verschiebt die Siegquote aber zugunsten von
Nova und Vega auf eine Spanne von 8,5 bis 47,5 Prozent. Diese
Profilverschiebung ist der wichtigste offene Balancingpunkt.

Der Versorgungssprung am elften Einwohner ist als wahrscheinlichster
systemischer Engpass identifiziert: normale HQ-Versorgung steigt dort
von jeweils zwei auf vier Nahrung und Energie. Mit zwei aktiven
Harvestern wächst der gesamte Energiebedarf zugleich von vier auf
sechs Einheiten. Geglättete Verbrauchsschwellen und höhere
Grundproduktion müssen als getrennte Zahlenvarianten simuliert werden,
bevor eine Balancingänderung übernommen wird.

Die folgenden isolierten Varianten wurden noch mit dem früheren
Startlager von 10 Nahrung, 10 Energie und 5 Erz verglichen. Die
Seriensimulation besitzt eine ausdrücklich isolierte
Versorgungsvariante `smoothed`: Bei 11–15 Einwohnern benötigt die
Normalversorgung drei statt sofort vier Einheiten Nahrung und
HQ-Energie; ab 16 Einwohnern gelten wieder vier. Browser und
Multiplayer bleiben unverändert im Modell `grouped`. Über dieselben
200 Seeds sinken die Versorgungssignale in der Variante von 8,70 auf
4,20 und die Fernzonenquote steigt auf 29,0 bis 55,0 Prozent. Zugleich
nehmen vollständig leere Nahrungslager von 259 auf 433 zu und Vegas
durchschnittliche Credits fallen auf 36,8. Die Variante ist daher ein
Diagnoseergebnis und noch keine übernommene Regeländerung.

Als zweite isolierte Variante behält `boosted` die Gruppenversorgung
bei und gibt ausschließlich Nahrungs- und Energieharvestern in jeder
zweiten Runde eine zusätzliche Einheit. Im 200-Partien-Vergleich
sinken die Versorgungssignale auf 3,91, Nahrungsleerstände auf 195 und
Energieleerstände auf 10. Direkter Handel steigt auf 3,8 Prozent und
die Fernzonenquote auf 24,5 bis 42,5 Prozent. Die Endbevölkerung liegt
jedoch bereits bei 22,9 bis 24,1 und die Siegquote zwischen 14,5 und
33,0 Prozent. Auch diese Variante bleibt deshalb vorerst auf die
Headless-Analyse begrenzt; Browser und Multiplayer verwenden das
Produktionsmodell `current`.

Die Batchauswertung misst zusätzlich das Mittelspiel der Runden 5–12
je Agentenprofil: Produktion und Verbrauch, Lagerstände,
Harvester-Energieausfälle, freie Harvester, Marktaktivität und
Versorgungssignale. Mit dem früheren Startlager standen
durchschnittlich nur 0,03 bis
0,23 Harvester ungenutzt bereit, während in 52,4 bis 67,7 Prozent der
Mittelspielrunden mindestens ein eingesetzter Harvester wegen Energie
ausfiel. Mit dem neuen Startlager sinkt die Ausfallquote auf 22,3 bis
54,1 Prozent; freie Harvester bleiben mit höchstens 0,01 weiterhin
praktisch bedeutungslos.

Die isolierte Analysevariante `energy-boosted` erhöht nur die
Energieproduktion in jeder zweiten Runde. Sie reduziert leere
Energielager über 200 Seeds von 137 auf 5 und die Ausfallquote im
Mittelspiel auf 27,6 bis 48,7 Prozent. Weil zugleich
Nahrungsleerstände auf 282 steigen, die Endbevölkerung auf 21,6 bis
22,5 wächst und die Siegquote auf 13,5 bis 35,5 Prozent auseinander
geht, bleibt auch diese Variante aus Browser und Multiplayer
ausgeschlossen. Produktions- und Verbrauchsregeln bleiben dadurch
unverändert.

Die gemeinsame Agentenregel erlaubt die erste Expansion von zwei auf
drei Harvester bereits bei sicherer Versorgung der unmittelbar
folgenden Runde. Baukosten und ein gemeinsamer Restpuffer von
20 Credits müssen gedeckt sein. Spätere Harvester benötigen weiterhin
die vollen profilabhängigen Mehr-Runden-Reserven. Ein bereits
brachliegender Harvester darf ein angrenzendes Grundstück zum
Mindestgebot erschließen, solange derselbe Kreditpuffer erhalten
bleibt. Optionale höhere Gebote bleiben gesperrt.

Nach dem dritten Harvester darf die Agentenplanung bis zu zwei weitere
unbewirtschaftete Prospektionsfelder als äußere Route kaufen. Dafür
gilt ausschließlich das Mindestgebot, eine Restreserve von 10 Credits
und eine Sperre bei akuter Versorgungskrise. Die HQ-Distanz ergänzt in
diesem Infrastrukturfenster den Ressourcenwert des Feldes.

Jede Kolonie startet zusätzlich mit einer mitgebrachten
Kristallprobe. Profile mit Kristallreserve 0 bieten sie am Markt an;
Profile mit Reserve 1 behalten sie zunächst. Damit ist der
Kristallmarkt schon vor dem Erreichen einer natürlichen Ader
wirtschaftlich relevant, ohne die kristallfreien Startgrundstücke zu
verändern.

Im Referenzlauf enden die Kolonien mit durchschnittlich 3,0 bis 3,1
Harvestern und 4,2 bis 4,8 Grundstücken. Die erste
Harvestererweiterung liegt im Mittel um Runde 3,0; das erste
zusätzliche Grundstück je nach Kolonie zwischen Runde 2,66 und 4,0.
Die Seriensimulation vergibt ausschließlich kristallfreie
Startgrundstücke und misst Folgeexpansion, Fernzonen und natürliche
Adern getrennt. Die durchschnittlich größte HQ-Distanz liegt bei
4,4 bis 4,7. Je nach Kolonie wird die Fernzone in 44,5 bis 68,5
Prozent und ein natürlicher Aderausläufer in 44,5 bis 50,5 Prozent der
Partien erreicht. Die Erschließung ist damit deutlich häufiger,
profitiert aber ebenfalls ungleich vom höheren Startlager.

## Aktuelle UI-Akzeptanzkriterien

Mobile Rangliste:

- eigene Kartenansicht statt breiter Desktoptabelle,
- Platz 4 erscheint unten, Platz 3 darüber, dann 2 und 1,
- vier feste Slots; bereits sichtbare Karten bewegen sich nicht,
- ruhiger, etwas langsamer Einflug,
- vollständige Ansicht bleibt länger sichtbar,
- Weiter-Schaltfläche nach vollständiger Aufdeckung.

Vor Änderungen prüfen, welche dieser Punkte bereits im
Repository enthalten sind. Lokale, noch nicht commitete
Patchdateien sind nicht automatisch Teil des Projektstands.

## Nächste systemische Themen

Nach UI- und Dokumentationsarbeiten:

1. Spielaktionen als validierte, UI-unabhängige Befehle abbilden und
   verbleibenden Kernzufall vollständig seedbasiert ausführen,
2. Produktions- und Marktentscheidungen stärker differenzieren,
   damit Angebot und Nachfrage nicht synchron verlaufen,
3. die durch das höhere Startlager verstärkte Bevorzugung von Nova
   und Vega in den Agentenentscheidungen ausgleichen,
4. die Harvester-Energie-Notfalllogik untersuchen, um Ausfälle zu
   reduzieren, ohne Produktion, Bevölkerung oder HQ-Sicherheitsnetz
   pauschal zu vergrößern,
5. die Folgeexpansion nach dem dritten Harvester so stabilisieren,
   dass Kristalladern
   innerhalb von 20 Runden tatsächlich erreichbar werden,
6. Karten- und Ereignisbalancing mit Playtests prüfen.

## Später, nicht Teil des aktuellen Kerns

- Race beziehungsweise Living Mode
- asynchroner Mehrspielermodus
- Weekly und Daily Challenges
- umfangreicher Technologiebaum
- zusätzliche Planeten und Kampagnen

Diese Punkte stehen unter Vorbehalt und dürfen den kleinen,
vollständigen Kern von Version 1 nicht unnötig vergrößern.

<!-- ELUM-PLANET-STATUS:BEGIN -->
## Beschlossenes Zielbild – noch nicht vollständig implementiert

- Aktivierung der intern vorbereiteten zufälligen
  Startkorridor-Zuordnung im späteren Browser-Spielstart
- Kartenregeln über Feld-IDs, Nachbarlisten und Graphdistanzen
- regelmäßige Hochsicherheits-Kristalltransporter

Der Browserprototyp verwendet 20 vollständig abgerechnete Runden mit
sichtbarem Versorgungsschiff-Countdown, Abschlussankunft und
lexikografischer Zielwertung. Er verwendet außerdem den
92-Felder-Graphen und vier natürliche, abgestufte Kristalladern.
Kristallwerte werden erst nach einer vollständigen Explorationsrunde
auf eigenen Grundstücken offengelegt. Die Werte können dort danach
als vierte Harvesterproduktion gefördert werden; Meteorboni fließen
in denselben Ertrag ein. Die
konservative Meteorvariante mit zwei garantierten und einem optionalen
dritten Einschlag ist ebenfalls aktiv; Kraterzentren werden öffentlich
markiert und Aufwertungen bei fünf Sternen gedeckelt. Der
interstellare Kristallkäufer ist mit einer Kapazität von `1/2/3/4`
Einheiten und einem auf 90 Prozent gedämpften, zwischen 20 und
60 Credits gedeckelten Referenzkursgebot aktiv. Die
zufällige Neuzuordnung der Startkorridore pro Browserpartie folgt in
einem späteren Spielstart-Schritt.

Nächste technische Reihenfolge:

1. Folgeexpansion nach dem dritten Harvester für den Zugang zu
   Fernzonen balancieren.
2. Hochsicherheits-Kristalltransporter ergänzen.

Details: `docs/PLANET_MAP.md`.
<!-- ELUM-PLANET-STATUS:END -->
