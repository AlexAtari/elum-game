# E.L.U.M.

**Exploration, Logistics, Utilization & Mining**

E.L.U.M. ist ein rundenbasiertes Kolonie-, Ressourcen- und
Wirtschaftsstrategiespiel für Browser und Smartphones. Das Projekt
ist von M.U.L.E. inspiriert, entwickelt aber ein eigenständiges
Vier-Spieler-System mit Hexkarte, Versorgung, Grundstücks- und
Ressourcenauktionen sowie autonomen Rivalen.

**Live-Prototyp:**  
https://alexatari.github.io/elum-game/

## Projektstatus

Der Browser-Prototyp ist aktiv in Entwicklung. Eine Standardpartie
umfasst 15 Runden. Kernsysteme wie Karte, Versorgung, Produktion,
Ereignisse, Grundstücksauktionen, Ressourcenmärkte, Rangliste,
KI-Kolonien und Headless-Simulationen sind bereits vorhanden.

Die aktuelle technische Wahrheit steht in
[`docs/STATUS.md`](docs/STATUS.md). Offene Ideen sind keine
implementierten Funktionen.

## Schnellstart

Voraussetzungen:

- Git
- aktuelle Node.js-LTS-Version
- npm

```bash
git clone https://github.com/AlexAtari/elum-game.git
cd elum-game/web
npm ci
npm run dev
```

Vite zeigt anschließend die lokale Adresse im Terminal an.

## Qualitätsprüfung

Vor jedem Commit:

```bash
cd web
npm test
npm run lint
npm run build
```

Verfügbare npm-Befehle:

| Befehl | Zweck |
|---|---|
| `npm run dev` | lokaler Entwicklungsserver |
| `npm test` | vollständige Vitest-Suite |
| `npm run test:watch` | Tests im Watch-Modus |
| `npm run lint` | ESLint-Prüfung |
| `npm run build` | TypeScript- und Produktionsbuild |
| `npm run preview` | lokalen Produktionsbuild anzeigen |

## Dokumentation

| Einstieg | Dokument |
|---|---|
| Neues Teammitglied | [`docs/ONBOARDING.md`](docs/ONBOARDING.md) |
| Aktueller Implementierungsstand | [`docs/STATUS.md`](docs/STATUS.md) |
| Technische Architektur | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Neuer Chat oder Coding-Assistent | [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) |
| Regeln und Spielvision | [`docs/GDD.md`](docs/GDD.md) |
| Zahlen und Balancing | [`docs/BALANCING.md`](docs/BALANCING.md) |
| Designprinzipien | [`docs/DESIGN.md`](docs/DESIGN.md) |
| Ereignissystem | [`docs/EVENTS.md`](docs/EVENTS.md) |
| Internationalisierung | [`docs/I18N.md`](docs/I18N.md) |
| Spätere Ideen | [`docs/IDEAS.md`](docs/IDEAS.md) |
| Gesamter Dokumentationsindex | [`docs/README.md`](docs/README.md) |

## Code-Landkarte

- `web/src/game.ts` – Kernzustand und zentrale Spielregeln
- `web/src/App.tsx` – Ablauf und Verknüpfung der UI-Phasen
- `web/src/components/` – sichtbare Spieloberfläche
- `web/src/agents.ts` – gemeinsame Agentenentscheidungen
- `web/src/orion*.ts` – spezialisierte Orion-Logik
- `web/src/rival*.ts` – gemeinsame Rivalenlogik
- `web/src/simulation*.ts` – Headless- und Seriensimulationen
- `web/src/i18n/` – Übersetzungen und Formatierung

Details stehen in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Deployment

Ein Push auf `main` startet den GitHub-Actions-Workflow
`Deploy ELUM to GitHub Pages`. Der Workflow installiert die
Abhängigkeiten, führt Tests und Lint aus, baut `web/dist` und
veröffentlicht den Build auf GitHub Pages.

## Arbeitsregel

Code und Tests sind die verbindliche Quelle für bereits
implementiertes Verhalten. GDD und Balancing beschreiben die
beabsichtigten Regeln. Bei einem Widerspruch muss er sichtbar
gemacht und anschließend in Code oder Dokumentation aufgelöst
werden.
