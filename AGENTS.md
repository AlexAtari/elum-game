# AGENTS.md

## Geltungsbereich

Diese Regeln gelten für das gesamte Repository.

## Vor dem Arbeiten

1. `docs/PROJECT_CONTEXT.md` lesen.
2. `docs/STATUS.md` lesen.
3. `git status --short` ausführen.
4. `git log -5 --oneline` ausführen.
5. relevante Tests vor dem Ändern lesen.

Eine externe Patchdatei oder Chatnachricht ist kein Beweis dafür,
dass eine Änderung bereits im Repository enthalten ist.

## Quellenhierarchie

Für implementiertes Verhalten:

1. Code
2. Tests
3. `docs/STATUS.md`
4. `docs/PROJECT_CONTEXT.md`
5. GDD und Balancing

Für Designabsicht:

1. `docs/DESIGN.md`
2. `docs/GDD.md`
3. `docs/BALANCING.md`
4. `docs/IDEAS.md` nur als späterer Möglichkeitsraum

Widersprüche ausdrücklich benennen und nicht still korrigieren.

## Technische Regeln

- Browserpartie und Headless-Simulation getrennt halten.
- Keine Demo-, Test- oder Simulationswerte in den normalen
  Spielstart einbauen.
- Spielregeln UI-unabhängig und testbar halten.
- Komponenten dürfen Kernregeln nicht duplizieren.
- Agenten müssen dieselben legalen Aktionen verwenden.
- sichtbare Texte über i18n führen, sofern übersetzbar.
- kleine, zusammenhängende Änderungen bevorzugen.
- keine fremden lokalen Änderungen überschreiben.

## Pflichtprüfung

```bash
cd web
npm test
npm run lint
npm run build
```

Bei UI-Änderungen zusätzlich Desktop und Smartphone prüfen.

## Dokumentationspflicht

Nach einer Regeländerung:

- `docs/STATUS.md` aktualisieren,
- GDD oder Balancing nachziehen,
- bei Strukturänderung `docs/ARCHITECTURE.md` aktualisieren,
- `docs/PROJECT_CONTEXT.md` kompakt und widerspruchsfrei halten.

## Übergabe

Am Ende nennen:

- geänderte Dateien,
- fachliche Wirkung,
- ausgeführte Prüfungen,
- bekannte offene Punkte,
- empfohlenen Commit-Text.
