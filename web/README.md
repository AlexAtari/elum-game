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

Standardmäßig läuft eine Lobby `mars-alpha` auf Port `8787`:

```text
ws://<RECHNER-IP>:8787/multiplayer?lobby=mars-alpha
```

Konfiguration:

- `ELUM_SERVER_HOST`: Bind-Adresse, standardmäßig `127.0.0.1`
- `ELUM_SERVER_PORT`: TCP-Port, standardmäßig `8787`
- `ELUM_LOBBY_ID`: Lobby-ID, standardmäßig `mars-alpha`
- `ELUM_MATCH_SEED`: reproduzierbarer Match-Seed, standardmäßig `1`

Der Health-Endpunkt liegt unter
`http://<RECHNER-IP>:8787/health`.

Die React-Startseite enthält eine Mehrspieler-Lobby. Sie leitet den
Server standardmäßig aus dem aktuellen Seitenhost und Port `8787` ab;
Server und Lobby-ID können in der Oberfläche geändert werden. Nach
dem Matchstart wechselt jeder menschliche Sitz in seine eigene
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
der 20. Abrechnung sperrt der Server weitere Spielaktionen. Der Host
kann anschließend alle verbundenen Spieler mit erhaltenen
Sitzplätzen und Reconnect-Tokens in dieselbe Lobby zurückführen.

Für öffentliches Hosting werden ein dauerhaft laufender Dienst, TLS
(`wss://`) und eine konkrete Origin-Policy benötigt.
