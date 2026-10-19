# Designrichtung

Stand: 19.10.2026, Alpha 0.7.

Die Wortmarke **mietklar.** mit Terrakotta-Punkt bleibt. Auf das Nutzerfeedback zu den dunklen/grünlichen Flächen folgt eine bewusst helle Oberfläche mit warmem Creme, klaren Eingaben und sparsamen farbigen Akzenten.

## Einseitenansicht

Die frühere Fünf-Schritte-Führung ist ersetzt. Oben stehen das echte Ergebnis, beide Rechenrichtungen, ein genaues Zahlenfeld mit Regler und die Aufteilung der gesamten Mietereinnahmen. Kosten, Einkommen, AfA, Zeitraum und optionale Vergleiche lassen sich darunter aufklappen. Die fachlichen Hilfen bleiben dort direkt bei den Eingaben. Die Wortmarke springt zurück zum Ergebnis und setzt den Fokus dorthin.

Auf kleinen Bildschirmen sind die Ergebnisabstände kompakter. Geldbeträge verwenden Textfelder mit Dezimaltastatur; Monatszähler bleiben Ganzzahlfelder. Ein separater Druckbereich blendet die Bedienoberfläche aus und enthält Rechnung und Annahmen.

## Aktuelle Farben

| Rolle | Farbe |
| --- | --- |
| Seitenhintergrund | `#f8f5f0` |
| Karten | `#fffdf9` |
| Haupttext | `#342c28` |
| Sekundärtext | `#756b63` |
| Linien | `#e6dfd6` |
| Hinweisflächen | `#fbe8df` |
| Hauptaktion/Akzentpunkt | `#b84e32` |

Die helle Darstellung ist unabhängig vom System-Dunkelmodus. Eine optionale dunkle Gestaltung ist nicht implementiert.

## Prüfstand und nächste Abnahme

Automatische Chromium-/WebKit-Fälle prüfen 320/390/1280-px-Breiten, Fokus, Regler und Druckdarstellung. Die mobile 390-px-Aufnahme und beide Seiten des Chromium-PDF wurden visuell angesehen; keine abgeschnittenen Spalten oder Überläufe gefunden. Das ersetzt weder eine Nutzerabnahme des neuen Designs noch einen Test der nativen iPhone-/Safari-Datei- und Druckdialoge. Diese gemeinsame Abnahme ist der nächste Schritt; historische Alpha-0.1-Tests gelten nur für die damalige Oberfläche. Nachweise siehe [TESTING.md](TESTING.md).
