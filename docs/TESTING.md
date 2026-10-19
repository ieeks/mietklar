# Prüfung der Alpha 0.2

Stand: 19.10.2026.

## Erfolgreich lokal ausgeführt

- `npm run check`: Syntax von UI, Rechenkern und Kostenmodul.
- `npm test`: 20 Rechen-/Kostenmodelltests bestanden (11 bestehende, 9 neue).
- HTML-Nesting und eindeutige IDs statisch geprüft.
- Zusätzlicher DOM-Funktionsdurchgang mit temporärem jsdom außerhalb der Projektabhängigkeiten: Navigation/Home und Fokus, Erhalt der Eingaben, getrennte Erstattung/Abzüge, Monat/Jahr, überhöhte Teilbeträge, inaktive leere Felder, neue Position/Entfernen, Textausgabe ohne HTML-Injektion, USt-Ergebnisunterdrückung und Anschaffungsgrenze.
- Keine zusätzlichen Produktionsabhängigkeiten.

## Rechenfälle

Die ursprünglichen 11 Fälle bleiben erhalten: Tarifgrenzen, 40/48-%-Wechsel, Freibetrag, negative Vermietung ohne Gutschrift, centgenaue Zielsuche, Cash-Rücklage, AfA und Anschaffungen.

Neue unabhängige Gegenbeispiele bei 45.000 € Gehalts-Tarifbasis, 2.000 € monatlicher Hauptmiete, ohne Gebäude-AfA:

| Fall | Steuerlicher Vermietungsüberschuss / Jahr | Zusatzsteuer / Jahr | Verfügbar / Monat |
| --- | ---: | ---: | ---: |
| Zahlung 100 €/Monat, Erstattung und Abzug ungeklärt | 24.000 € | 9.600 € | 1.100 € |
| Gleiche Zahlung, Mieter erstattet 100 €/Monat, kein angesetzter Abzug | 25.200 € | 10.080 € | 1.160 € |
| Gleiche Zahlung, volle Erstattung und voller bestätigter Abzug | 24.000 € | 9.600 € | 1.200 € |
| Gleiche Zahlung, keine Erstattung, voller bestätigter Abzug | 22.800 € | 9.120 € | 1.140 € |

Weitere neue Fälle: Monats-/Jahresäquivalenz, eigenständiger Jahresabzug auch ohne neue Zahlung, Rücklage und Puffer ohne automatischen Abzug, ignorierte inaktive Felder, ungültige Status/Einheiten/Beträge, Erstattung über Zahlung, Manipulation von Rücklage/Puffer sowie 16 Kombinationen aus Erstattungs- und Steuerstatus mit minimalem Cent-Mietbetrag.

## Manuelle und externe Nachweise

- Nutzer bestätigte am 19.10.2026 den iPhone-/Safari-Bedienungstest der vorherigen Alpha 0.1.
- GitHub Pages ist aktiviert. Die zuvor veröffentlichte Alpha wurde vom Nutzer aufgerufen.
- Der alte Alpha-0.1-Safari-Durchgang ist keine Abnahme der neuen Kostenoberfläche.

## Nicht durchgeführt / noch offen

- Kein visueller Browserlauf der Alpha 0.2: Chromium fehlt; Installationsversuch lieferte ein unbrauchbares Archiv. DOM-Prüfung ist kein Browser-Rendering-Test.
- Neue Kostenkarten auf iPhone/Safari, 320-px-Layout, Fokus/Tastatur und native Dezimaleingabe visuell prüfen.
- Zeitpunkte/Abfluss, Leerstand, mehrere Eigentümer, USt/Vorsteuer und vollständige persönliche Veranlagung sind nicht implementiert und nicht abgedeckt.
- Ein lokales Bestehen ist kein Nachweis des GitHub-Actions-/Pages-Laufs für den neuen Commit; dessen Status separat prüfen.

