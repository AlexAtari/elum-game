# Onboarding

## Ziel

Nach diesem Dokument soll ein neues Teammitglied das Projekt
lokal starten, die wichtigsten Dateien finden, Änderungen sicher
prüfen und den Unterschied zwischen implementiertem Stand,
Zieldesign und späteren Ideen verstehen können.

## 1. Repository einrichten

```bash
git clone https://github.com/AlexAtari/elum-game.git
cd elum-game
```

Prüfen:

```bash
git status
git branch --show-current
git log -5 --oneline
```

Die reguläre Entwicklung erfolgt auf Basis von `main`. Vor einer
Änderung immer prüfen, ob lokale, noch nicht commitete Arbeiten
vorhanden sind.

## 2. Webprojekt installieren

```bash
cd web
npm ci
```

Das Projekt verwendet React, TypeScript, Vite und Vitest. Die
verwendeten Versionen stehen in `web/package.json` und
`web/package-lock.json`.

## 3. Lokal starten

```bash
npm run dev
```

Die im Terminal genannte Adresse im Browser öffnen.

Produktionsbuild lokal prüfen:

```bash
npm run build
npm run preview
```

## 4. Pflichtprüfungen

```bash
npm test
npm run lint
npm run build
```

Ein Patch gilt erst dann als technisch abgeschlossen, wenn diese
Prüfungen erfolgreich sind. Bei Regeländerungen müssen passende
Tests ergänzt oder angepasst werden.

## 5. Dokumentation zuerst einordnen

Vor der Arbeit lesen:

- aktueller Stand: `docs/STATUS.md`
- technische Orientierung: `docs/ARCHITECTURE.md`
- Spielregel: `docs/GDD.md`
- konkrete Werte: `docs/BALANCING.md`
- Ereignisse: `docs/EVENTS.md`
- Sprache: `docs/I18N.md`

`docs/IDEAS.md` enthält Möglichkeiten für später und darf nicht
als bereits beschlossen oder implementiert behandelt werden.

## 6. Typischer Entwicklungsablauf

1. Aufgabe und Akzeptanzkriterien festhalten.
2. relevante Tests und Quelldateien lesen.
3. kleine, zusammenhängende Änderung umsetzen.
4. gezielte Tests ausführen.
5. vollständige Tests, Lint und Build ausführen.
6. UI auf Desktop und Mobilgerät prüfen, falls betroffen.
7. Status und Fachbeschreibung aktualisieren.
8. `git diff` kontrollieren.
9. mit einer präzisen Commit-Nachricht committen.

Beispiel:

```bash
git diff --check
git status --short
git add <dateien>
git commit -m "fix: describe the completed change"
git push
```

## 7. Architekturregeln

- Die normale Browserpartie darf durch Headless-Simulationen
  nicht verändert werden.
- Spielregeln gehören möglichst in testbare, UI-unabhängige
  Funktionen.
- UI-Komponenten sollen Regeln darstellen, nicht neu erfinden.
- Agenten verwenden dieselben legalen Aktionen und Grenzen wie
  menschliche Spieler.
- Markt, Grundstücksauktion und Rundenabrechnung sind getrennte
  Phasen.
- Übersetzbare UI-Texte gehören in `web/src/i18n/messages/`.

## 8. Deployment

`.github/workflows/deploy-pages.yml` wird bei einem Push auf
`main` oder manuell gestartet. Der Workflow:

1. checkt das Repository aus,
2. installiert mit `npm ci`,
3. führt `npm test` aus,
4. führt `npm run lint` aus,
5. baut mit `npm run build`,
6. veröffentlicht `web/dist` auf GitHub Pages.

Live-Adresse:

https://alexatari.github.io/elum-game/

## 9. Mobile Prüfung

Bei mobilen Änderungen mindestens prüfen:

- kein horizontaler Überlauf,
- alle Schaltflächen erreichbar,
- Text wird nicht abgeschnitten,
- Animationen verschieben bereits lesbare Inhalte nicht,
- Hoch- und Querformat,
- Touchbedienung,
- vollständiges Neuladen nach dem Deployment.

## 10. Häufige Fehler

### Live-Seite zeigt scheinbar den alten Stand

Lokalen und ausgelieferten Asset-Namen vergleichen:

```bash
grep -oE 'assets/index-[^"]+\.(css|js)' web/dist/index.html

curl -L -sS   "https://alexatari.github.io/elum-game/?nocache=$(date +%s)"   | grep -oE 'assets/index-[^"]+\.(css|js)'
```

### Tests sind grün, UI aber falsch

Unit-Tests bestätigen Regeln und Datenfluss, ersetzen aber keine
visuelle Prüfung auf einem echten Smartphone.

### Dokument und Code widersprechen sich

Nicht raten. Den Widerspruch benennen, relevante Tests lesen und
die Entscheidung anschließend in beiden Ebenen nachziehen.
