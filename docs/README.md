# E.L.U.M. Dokumentation

Diese Seite ist der Navigationspunkt für alle Projektunterlagen.

## Empfohlene Lesereihenfolge

### Neues Teammitglied

1. [`ONBOARDING.md`](ONBOARDING.md)
2. [`STATUS.md`](STATUS.md)
3. [`ARCHITECTURE.md`](ARCHITECTURE.md)
4. das für die Aufgabe relevante Fachdokument

### Neuer Chatbot oder Coding-Assistent

1. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
2. `git status --short`
3. `git log -5 --oneline`
4. [`STATUS.md`](STATUS.md)
5. nur die für die aktuelle Aufgabe relevanten Dateien

### Game Design

1. [`DESIGN.md`](DESIGN.md)
2. [`GDD.md`](GDD.md)
3. [`BALANCING.md`](BALANCING.md)
4. [`EVENTS.md`](EVENTS.md)
5. [`IDEAS.md`](IDEAS.md)

## Dokumentrollen

| Dokument | Rolle |
|---|---|
| `README.md` | Projektstart und wichtigste Befehle |
| `ONBOARDING.md` | Einrichtung und Arbeitsablauf |
| `PROJECT_CONTEXT.md` | kompakte Übergabe für neue Chats und KI-Werkzeuge |
| `STATUS.md` | implementiert, in Arbeit, offen |
| `ARCHITECTURE.md` | technische Struktur und Datenfluss |
| `GDD.md` | vollständige Spielregeln und Zielbild |
| `BALANCING.md` | Kosten, Erträge, Zeiten und Playtest-Fragen |
| `DESIGN.md` | dauerhafte Designprinzipien |
| `EVENTS.md` | Ereignisse und Skalierung |
| `I18N.md` | Übersetzungsregeln |
| `IDEAS.md` | bewusst noch nicht zugesagte Erweiterungen |

## Rangfolge der Quellen

Bei widersprüchlichen Informationen gilt für den
**implementierten Stand**:

1. Code und Tests
2. `STATUS.md`
3. `PROJECT_CONTEXT.md`
4. GDD und Balancing
5. Ideas

Für das **angestrebte Design** gelten GDD, Balancing und Design
als Grundlage. Abweichungen zwischen Ziel und Implementierung
sollen nicht stillschweigend verschwinden, sondern als offene
Entscheidung dokumentiert werden.

## Pflege

Bei einer abgeschlossenen Entwicklungsstufe:

1. Tests und Build ausführen.
2. `STATUS.md` aktualisieren.
3. geänderte Regeln in GDD oder Balancing nachziehen.
4. bei einer Architekturänderung `ARCHITECTURE.md` aktualisieren.
5. `PROJECT_CONTEXT.md` kurz und aktuell halten.
