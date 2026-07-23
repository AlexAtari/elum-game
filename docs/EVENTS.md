# E.L.U.M.
## Event System

**Version:** 0.2
**Status:** Prototype implemented
**Last Updated:** 2026-07-23

---

# 1. Ziel

Ereignisse sollen jede Partie abwechslungsreicher machen und die
Spieler zu Anpassungen zwingen, ohne allein über Sieg oder Niederlage
zu entscheiden.

Der Prototyp trennt zwei unabhängig ausgewürfelte Systeme:

- **Globale Ereignisse** beeinflussen alle Kolonien eine Runde lang.
- **Lokale Ereignisse** verändern während der Planung sofort einen
  Vorrat der eigenen Kolonie.

---

# 2. Rundenübergang

Der sichtbare Ablauf zwischen zwei Runden lautet:

1. Die abgeschlossene Runde wird abgerechnet.
2. Die Rangliste schließt die alte Runde ab.
3. „Ereignisse & deine Kolonie“ eröffnet die neue Runde.
4. Die normale Planungsphase beginnt.
5. Ein ausgewähltes lokales Ereignis erscheint nach kurzer,
   zufälliger Verzögerung während der Planung.

Der Rundenbericht zeigt gruppiert:

- das globale Ereignis der neuen Runde oder ruhige Bedingungen
- produzierte Nahrung, Energie und Erz der letzten Runde
- die Bevölkerungsentwicklung
- gewonnenes oder verlorenes Land
- fertiggestellte Harvester
- ausgefallene Harvester und pausierte Umrüstungen

Er bleibt sichtbar, bis der Spieler die neue Runde bewusst beginnt.

---

# 3. Globale Ereignisse

- In Runde 1 tritt kein globales Ereignis auf.
- Ab Runde 2 beträgt die Wahrscheinlichkeit **40 % pro Runde**.
- Die Auswahl wird zu Beginn jeder Runde unabhängig neu getroffen.
- Ein globales Ereignis gilt genau für die bevorstehende Runde.
- Es verändert Spieler und KI-Kolonien nach derselben Regel.
- Dasselbe Ereignis darf mehrfach und auch in direkt
  aufeinanderfolgenden Runden auftreten.
- Produktion kann niemals unter null fallen.

## Ereignispool

| Art | Ereignis | Grundwirkung in Runde 1–6 |
|---|---|---|
| positiv | Fruchtbare Saison | +1 Nahrung pro aktivem Nahrungsharvester |
| positiv | Klarer Himmel | +1 Energie pro aktivem Energieharvester |
| positiv | Reiche Erzadern | +1 Erz pro aktivem Erzharvester |
| positiv | Kristallregen | +1 Kristall für jede Kolonie |
| positiv | Kolonialer Fördertopf | +15 Credits für jede Kolonie |
| positiv | Technologischer Durchbruch | Harvesterbau 10 Credits günstiger |
| negativ | Dürreperiode | −1 Nahrung pro aktivem Nahrungsharvester |
| negativ | Sonnensturm | −1 Energie pro aktivem Energieharvester |
| negativ | Instabile Minen | −1 Erz pro aktivem Erzharvester |
| negativ | Kristallstörung | bis zu −1 Kristall je Kolonie |
| negativ | Handelsblockade | keine Ressourcenauktion initiierbar |
| negativ | Vermessungsstopp | keine Grundstücksgebote |
| negativ | Unterbrochene Lieferketten | kein Harvesterbau |
| negativ | Ionennebel | keine Harvesterumrüstung oder -versetzung |
| negativ | Planetarisches Beben | bis zu 1 Harvester je Kolonie fällt aus |

Produktionsmodifikationen werden pro aktivem Harvester auf dessen
Feldertrag angewendet. Neu eingesetzte und während einer Umrüstung
produzierende Harvester unterliegen derselben globalen Lage.

---

# 4. Lokale Ereignisse

- In Runde 1 tritt kein lokales Ereignis auf.
- Ab Runde 2 beträgt die Wahrscheinlichkeit **50 % pro Runde**.
- Damit geschieht im langfristigen Mittel ungefähr alle zwei Runden
  ein lokales Ereignis.
- Es gibt absichtlich keine Sperr- oder Pausenrunde. Zwei oder mehr
  lokale Ereignisse dürfen direkt aufeinander folgen.
- Die Auswahl ist unabhängig von globalen Ereignissen. In derselben
  Runde können beide, eines oder keines auftreten.
- Das Ereignis wird nicht im Rundenbericht vorweggenommen.
- Es erscheint nach vorläufig zwei bis sechs Sekunden in der normalen
  Planungsphase.
- Während einer Ressourcen- oder Grundstücksauktion pausiert die
  Einblendung und wird erst wieder in der Planung ausgelöst.
- Die Ressourcen- oder Creditänderung wird sofort verbucht.
- Vorräte können durch ein negatives Ereignis nicht unter null fallen.

## Ereignispool des Prototyps

| Art | Ereignis | Grundwirkung in Runde 1–6 |
|---|---|---|
| positiv | Vergessenes Vorratslager | +3 Nahrung |
| positiv | Geladene Energiezellen | +3 Energie |
| positiv | Erzfund | +2 Erz |
| positiv | Kristallfragment | +1 Kristall |
| positiv | Kolonieförderung | +15 Credits |
| positiv | Neue Siedler | +1 Bevölkerung |
| negativ | Verdorbene Vorräte | −2 Nahrung, mindestens 0 |
| negativ | Leck im Energienetz | −2 Energie, mindestens 0 |
| negativ | Erzdiebstahl | −2 Erz, mindestens 0 |
| negativ | Abrechnungsbetrug | −10 Credits, mindestens 0 |
| negativ | Harvesterstörung | bis zu 1 Harvester fällt aus |
| negativ | Arbeitsstreik | kein Harvesterbau |
| negativ | Kommunikationsausfall | keine Ressourcenauktion initiierbar |
| negativ | Fehler im Landregister | keine Grundstücksgebote |
| negativ | Falsche Ersatzteile | keine Harvesterumrüstung |

Das ursprünglich vorgeschlagene lokale Ereignis Nr. 8 ist bewusst
nicht enthalten. Der Pool besteht aus sechs positiven und neun
negativen Ereignissen.

## Skalierung nach Runden

Alle Zahlenwirkungen verdoppeln sich nach jeweils sechs Runden:

| Runden | Faktor |
|---|---:|
| 1–6 | ×1 |
| 7–12 | ×2 |
| 13–18 | ×4 |
| 19–24 | ×8 |

Die Reihe wird entsprechend fortgesetzt. Die Regel gilt für Gewinne,
Verluste, Produktionsmodifikatoren, Rabatte und die Anzahl
ausfallender Harvester. Ein Ressourcenverlust endet immer bei null;
ein Harvesterpreis endet bei null Credits.

In der Standardpartie mit 15 Runden erreicht die Skalierung damit in
den Schlussrunden 13–15 den Faktor ×4.

Reine Aktionssperren besitzen keine Anzahl und werden deshalb nicht
skaliert. Sie gelten nur für die aktive Runde.

---

# 5. Darstellung

Globale Ereignisse stehen im Rundenstartbildschirm und nennen:

- den Namen des Ereignisses
- die betroffene Ressource
- die exakte Änderung pro aktivem Harvester
- die Dauer von einer Runde

Lokale Ereignisse erscheinen als kompakte Meldung über der
Planungsansicht und nennen:

- was in der Kolonie passiert ist
- die sofort verbuchte Änderung

Die Meldung verschwindet nach sechs Sekunden automatisch oder kann
vorher geschlossen werden. Sie darf Auktionen nicht überlagern.

---

# 6. Technische Regeln

- Ereignisse werden mit sprachneutralen IDs im Spielzustand geführt.
- Sichtbare Namen und Beschreibungen liegen ausschließlich in den
  Sprachkatalogen.
- Das aktive globale Ereignis wird im Spielzustand gespeichert und
  nach der Rundenabrechnung zurückgesetzt.
- Das aktive lokale Ereignis wird ebenfalls im Spielzustand
  gespeichert, damit seine Sperre oder sein Harvesterdefekt bis zur
  Abrechnung wirksam bleibt.
- Die Rundenabrechnung speichert das angewendete globale Ereignis im
  Rundenbericht.
- Die Auswahlfunktionen akzeptieren im Test kontrollierte Zufallswerte.
- Lokale Änderungen erzeugen einen neuen Spielzustand und verändern
  den vorherigen Zustand nicht direkt.

---

# 7. Playtest-Fragen

- Sind 40 % globale Ereignisse häufig genug?
- Wirken 50 % lokale Ereignisse tatsächlich wie „im Schnitt alle zwei
  Runden“?
- Fühlen sich direkt aufeinanderfolgende lokale Ereignisse lebendig
  oder hektisch an?
- Sind positive und negative Ereignisse gleich interessant?
- Bleibt der Rundenbericht bis zur bewussten Bestätigung verständlich
  und übersichtlich?
- Ist die Verzögerung lokaler Ereignisse während der Planung
  überraschend, ohne Eingaben zu stören?
- Ist die Verdopplung ab Runde 7 spürbar, ohne den Spielverlauf zu
  stark zu kippen?
- Bleiben Aktionssperren interessant, obwohl sie nicht skalieren?
- Sind sechs positive und neun negative Ereignisse im Zufallspool
  ausgewogen genug?

---

# 8. Spätere Erweiterungen

- Ereignisketten über mehrere Runden
- Entscheidungen mit mehreren Antwortmöglichkeiten
- Markt-, Politik- und Fraktionsereignisse
- seltene dauerhafte Ereignisse mit eigenen Fairnessregeln
