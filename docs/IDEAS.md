# E.L.U.M.
## Future Ideas

**Version:** 0.1

---

# Race Mode

**Status:** Version 2

## Ziel

Ein alternativer Spielmodus für erfahrene Spieler, bei dem Geschwindigkeit Teil der Strategie wird.

## Grundidee

Der führende Spieler bestimmt den aktuellen Spielstand.

Spieler, die ihre Runde noch nicht abgeschlossen haben, werden auf den aktuellen Spielstand synchronisiert.

Nicht abgeschlossene Runden verfallen.

## Herausforderungen

- Grundstückskonflikte
- Marktkonflikte
- Synchronisation der Ereignisse
- Fairness

## Noch offen

- Wie werden Grundstückskonflikte gelöst?
- Wie wird der Markt synchronisiert?
- Wie funktioniert das Leaderboard?
- Welche Zeitlimits sind sinnvoll?

---

# Weekly Challenge

Alle Spieler erhalten:

- denselben Seed
- dieselbe Karte
- dieselben Ereignisse

Vergleich ausschließlich über das Leaderboard.

---

# Daily Challenge

Kurze tägliche Herausforderung mit wechselnden Sonderregeln.

---

# Koloniestatus und Ausscheiden

**Status:** Merkzettel für Multiplayer

Jede Kolonie erhält später einen eigenen Status:

- aktiv
- kritisch, aber möglicherweise noch durch Handel rettbar
- ausgeschieden

Im Einzelspiel gegen die KI kann das Ausscheiden des menschlichen Spielers die Partie unmittelbar beenden. Optional kann die Partie weiter beobachtet werden.

Im Mehrspielermodus scheidet nur die betroffene Kolonie aus. Die übrigen Spieler setzen die Partie fort.

Sobald der Markt verfügbar ist, bedeutet ein Energiebestand von null nicht automatisch das Ausscheiden. Vorher muss geprüft werden, ob die Kolonie durch Kauf, Verkauf oder Handel noch gerettet werden kann.
