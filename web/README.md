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
dem Matchstart zeigt sie bereits den gemeinsamen Rundenstand. Die
eigentliche Spielansicht wird im nächsten Schritt an
Server-Snapshots und Netzwerkkommandos angeschlossen.

Für öffentliches Hosting werden ein dauerhaft laufender Dienst, TLS
(`wss://`) und eine konkrete Origin-Policy benötigt.
