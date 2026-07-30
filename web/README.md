# E.L.U.M. Web

## Lokale Entwicklung

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## Lokaler Multiplayer-Server

Nur auf diesem Rechner:

```bash
npm run server
```

Im lokalen WLAN, damit Smartphones denselben Server erreichen:

```bash
ELUM_SERVER_HOST=0.0.0.0 npm run server
```

Die vorgeschlagene Standardlobby `mars-alpha` ist auf Port `8787`
erreichbar:

```text
ws://<RECHNER-IP>:8787/multiplayer?lobby=mars-alpha
```

Konfiguration:

- `ELUM_SERVER_HOST`: Bind-Adresse, standardmäßig `127.0.0.1`
- `ELUM_SERVER_PORT`: expliziter TCP-Port; gewinnt vor `PORT`
- `PORT`: Plattform-Port, ohne beide Portvariablen standardmäßig `8787`
- `ELUM_LOBBY_ID`: Lobbycode der ausgegebenen Beispieladresse,
  standardmäßig `mars-alpha`
- `ELUM_MATCH_SEED`: reproduzierbarer Match-Seed, standardmäßig `1`
- `ELUM_ALLOWED_ORIGINS`: optionale, kommaseparierte Liste exakt
  erlaubter Browser-Origins, zum Beispiel
  `https://alexatari.github.io,http://localhost:5173`
- `REDIS_URL`: optionale geheime `redis://`- oder `rediss://`-URL;
  aktiviert den externen Redis-/Valkey-Speicher für wartende Lobbys

Der Health-Endpunkt liegt unter
`http://<RECHNER-IP>:8787/health`.
Er meldet Bereitschaft, Zahl der aktuell gehaltenen Lobbys und Zahl
der aktiven WebSocket-Verbindungen. Der Server sendet verbundenen
Clients alle 30 Sekunden einen WebSocket-Ping; Verbindungen ohne Pong
werden beim nächsten Intervall beendet und können anschließend über
den vorhandenen Reconnect-Pfad wieder aufgenommen werden.

Der Prometheus-kompatible Endpunkt
`http://<RECHNER-IP>:8787/metrics` veröffentlicht ausschließlich
aggregierte Prozesszähler:

- aktuell gehaltene Lobbys und WebSocket-Verbindungen,
- insgesamt akzeptierte Verbindungen,
- insgesamt empfangene Nachrichten,
- insgesamt abgewiesene WebSocket-Upgrades.

Lobbycodes, Anzeigenamen, Reconnect-Tokens und Matchzustände werden
nicht als Metriken ausgegeben.

Der gehostete Dienst kann lokal mit derselben Prüfung wie die
regelmäßige GitHub Action kontrolliert werden:

```bash
npm run monitor:server
```

`monitor-multiplayer.yml` führt diesen Smoke-Test zusätzlich alle
sechs Stunden und manuell aus. Das Intervall lässt die kostenlose
Render-Instanz zwischen Prüfungen schlafen; ein fehlgeschlagener
Health- oder Metrikcheck wird als fehlgeschlagener Workflow-Lauf
sichtbar.

Jeder nicht leere Lobbycode bis 128 Zeichen erzeugt bei der ersten
WebSocket-Verbindung einen eigenen Spielraum. Unterschiedliche Codes
teilen weder Sitze noch Reconnect-Tokens oder Matchzustände. Nach der
letzten getrennten Verbindung bleibt eine Lobby zehn Minuten für
Reconnects erhalten. Eine neue Verbindung mit demselben Code bricht
die Bereinigung ab; bleibt die Lobby leer, werden Zustand, Timer und
Reconnect-Tokens danach vollständig verworfen.

Die React-Startseite enthält eine Mehrspieler-Lobby. Sie leitet den
Server standardmäßig aus dem aktuellen Seitenhost und Port `8787` ab;
Server und Lobby-ID können in der Oberfläche geändert werden. Nach
dem Beitritt kann jeder Teilnehmer einen Einladungslink teilen. Der
Link öffnet den Mehrspielerpfad direkt und übernimmt Serveradresse
sowie Lobbycode; Name, Reconnect-Token und automatischer Beitritt
werden bewusst nicht in die URL aufgenommen. Nach dem Matchstart
wechselt jeder menschliche Sitz in seine eigene
teilnehmerbezogene Spielansicht. Karte, HQ, Harvester,
Grundstücksgebote, Ressourcenmärkte und Rundenplanung verwenden dort
ausschließlich Server-Snapshots und Netzwerkkommandos. Nach der
gemeinsamen Abrechnung erhält jeder Sitz ein privates Rundenbriefing
einschließlich antippbarer Explorationsergebnisse. Das globale
Ereignis der neuen Runde wird serverseitig für alle Kolonien
ausgewählt, aktiviert und im Briefing angekündigt. Die gemeinsame
Rangliste erscheint nach jeder Abrechnung, dauerhaft im HQ und als
kompakte aktuelle Platzierung in der Kolonieansicht. Private lokale
Ereignisse werden je menschlichem Sitz verzögert vom Server
angewendet und nur dem betroffenen Client als Meldung gezeigt. Nach
vier Minuten ergänzt der Server fehlende Rundenpläne automatisch mit
einer konservativen Versorgung; gemeinsame Auktionen pausieren diese
Frist und die Oberfläche zeigt den verbindlichen Countdown. Nach
der 20. Abrechnung sperrt der Server weitere Spielaktionen. Der Host
kann anschließend alle verbundenen Spieler mit erhaltenen
Sitzplätzen und Reconnect-Tokens in dieselbe Lobby zurückführen.

## Render-Deployment

Die Blueprint-Datei `../render.yaml` definiert einen Node-Web-Service
mit Build, Health Check, öffentlicher Bind-Adresse und einer auf die
GitHub-Pages-Origin begrenzten Origin-Policy. In Render:

1. Repository als Blueprint verbinden und `render.yaml` anwenden.
2. Der angelegte Dienst ist unter
   `https://elum-multiplayer.onrender.com` erreichbar.
3. Die GitHub-Pages-Version verwendet automatisch
   `wss://elum-multiplayer.onrender.com`; andere Clients können diese
   Adresse weiterhin manuell eintragen.

Render terminiert TLS; der Node-Prozess selbst spricht intern HTTP
und bindet an den von Render gesetzten `PORT`. Öffentliche Clients
müssen `wss://` verwenden. Für zusätzliche Frontend-Domains wird
`ELUM_ALLOWED_ORIGINS` im Render-Dashboard um deren exakte
`https://`-Origin ergänzt.

Für externe Lobby-Persistenz wird ein Render-Key-Value-Dienst in
derselben Region angelegt und dessen interne URL als geheime
`REDIS_URL` am Web-Service gesetzt. Ohne diese Variable startet der
Server bewusst mit dem lokalen In-Memory-Adapter. Der Blueprint
provisioniert den Key-Value-Dienst noch nicht automatisch.

Der aktuelle Matchzustand lebt im Arbeitsspeicher eines einzelnen
Serverprozesses. Der Dienst darf deshalb noch nicht horizontal
skaliert werden; ein Deploy oder Instanzwechsel beendet laufende
Partien. Der Matchkern kann seinen prozessunabhängigen Zustand
inzwischen als eigene Version-1-Nutzlast exportieren. Sie umfasst
`GameState`, Revision, Abschlussstatus, private Rundenpläne und
-berichte, Server-Kommandosequenz sowie absolute Phasen-, Runden- und
lokale Ereignisfristen, aber keine Sitzungs-IDs oder Timer-Handles.
Speicherhülle und Grundstruktur der persistenzspezifischen Felder
werden geprüft. Der Matchkern kann diese Nutzlast inzwischen mit
privaten Bereitschaften und Berichten sowie den Restfristen aller
autoritativen Timer wiederherstellen. Alte Prozess-Sitzungen werden
nicht übernommen. Die Lobby kann eine laufende Partie zusammen mit
Seed, Revision, menschlichen Sitzen und Reconnect-Tokens als
`playing`-Variante desselben Version-1-Formats exportieren und mit
zunächst getrennten Sitzen wiederherstellen. Die Registry-
Speicheranbindung fehlt noch.
`server/lobbyPersistence.ts` enthält bereits den
versionierten JSON-Datensatz, den asynchronen Speichervertrag und
einen ablaufzeitfähigen In-Memory-Adapter. Wartende Lobbys können
Seed, Revision, Sitzdaten, Bereitschaft und Reconnect-Tokens als
eigene Version-1-Nutzlast exportieren; Verbindungs-IDs werden nicht
exportiert. Gespeicherte Nutzlasten werden
vollständig validiert und können als wartende Lobby wiederhergestellt
werden. Die reservierten Sitze beginnen getrennt und verbinden sich
über ihre erhaltenen Reconnect-Tokens erneut. Die Lobby-Registry lädt
diesen Zustand vor dem ersten Verbindungsaufbau und speichert
Änderungen wartender Räume geordnet. Beim Matchstart und nach der
endgültigen Bereinigung wird der wartende Snapshot gelöscht. Aktive
wartende Räume verwenden eine 24-Stunden-TTL; nach dem letzten
Disconnect gilt die zehnminütige Reconnect-Schonfrist.

Der Redis-/Valkey-Adapter speichert Datensatz und Ablaufzeit atomar
und validiert geladene JSON-Werte erneut. Der aktuell provisionierte
Render-Dienst hat jedoch noch keine `REDIS_URL` und verwendet daher
weiterhin den In-Memory-Adapter. Tatsächliche Provisionierung,
Speicheranbindung laufender Matches sowie instanzübergreifende
Sitzungen sind der nächste Ausbau.
