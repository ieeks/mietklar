# Prüfung der Alpha 0.3

Stand: 19.10.2026.

## Erfolgreich lokal ausgeführt

- `npm run check`: Syntax von UI, Rechenkern, Kosten- und AfA-Modul.
- `npm test`: 30 Rechen-/Kosten-/AfA-Tests bestanden (20 bestehende, 10 neue).
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

## AfA-Fälle

Fiktives Kaufbeispiel: 300.000 € Kaufpreis + 15.000 € Nebenkosten = 315.000 €. Bei 30 % Grundanteil sind 94.500 € auszuscheiden; Gebäude-Basis 220.500 €, reguläre Jahres-AfA 3.307,50 €. In der gesonderten Startjahr-Vorschau 6 Monate → 1.653,75 €, 7 Monate → 3.307,50 €.

Getestet: offene/fehlende AfA ohne versteckten Default, bekannter Jahreswert, eingegebene Basis/Satz, alle Nebenkostenkomponenten, Grundanteil 0/100 %, fehlende/ungeklärte Grundlage, Käufe bis 2002 vs. ab 2003, Erbe/andere Erwerbsart/frühere Vermietung als Prüfpfad, bedingte 20/30/40-%-Vorschläge und Sonderfälle, 0/1/6/7/12 Nutzungsmonate, ungültige Werte. Bei unveränderter Miete ist AfA nur eine Steuerwirkung, keine erneute Kaufpreiszahlung.

DOM-Funktionsdurchgang zusätzlich erweitert: vier AfA-Wege, fehlende Angaben → 0, Kaufaufteilung, Startjahr-Vorschau ohne Änderung der Volljahres-Zielmiete, ausdrückliche Grundanteil-Übernahme und Invalidierung nach Hilfsänderung, gesonderte Nachweise, Erbe-Prüfpfad, negative/überhöhte Werte, ignorierte inaktive Felder und offene AfA im Ergebnis. Alle bisherigen Kosten-/Navigationsfälle dabei erneut bestanden.

## Manuelle und externe Nachweise

- Nutzer bestätigte am 19.10.2026 den iPhone-/Safari-Bedienungstest der vorherigen Alpha 0.1.
- GitHub Pages ist aktiviert. Die zuvor veröffentlichte Alpha wurde vom Nutzer aufgerufen.
- Der alte Alpha-0.1-Safari-Durchgang ist keine Abnahme der neuen Kosten-/AfA-Oberfläche.
- Alpha 0.2: GitHub Actions und Pages-Deployment für Commit 6a9e5c98bbfda49666aa7d5748aef8d284a12b3e erfolgreich bestätigt.

## Nicht durchgeführt / noch offen

- Kein visueller Browserlauf der Alpha 0.3: Chromium fehlt; Installationsversuch lieferte ein unbrauchbares Archiv. DOM-Prüfung ist kein Browser-Rendering-Test.
- Neue Kostenkarten und AfA-Hilfe auf iPhone/Safari, 320-px-Layout, Fokus/Tastatur und native Dezimaleingabe visuell prüfen.
- Zeitpunkte/Abfluss, Leerstand, mehrere Eigentümer, USt/Vorsteuer und vollständige persönliche Veranlagung sind nicht implementiert und nicht abgedeckt.
- Ein lokales Bestehen ist kein Nachweis des GitHub-Actions-/Pages-Laufs für den neuen Commit; dessen Status separat prüfen.


