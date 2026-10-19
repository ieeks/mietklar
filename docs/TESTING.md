# Prüfung der Alpha 0.6

Stand: 19.10.2026.

## Erfolgreich lokal ausgeführt

- `npm run check`: Syntax von UI, Rechenkern, Kosten-, AfA-, Planungs-, Jahres-, Speicher- und Speicherbedienungsmodul.
- `npm test`: 68 Rechen-/Kosten-/AfA-/Planungs-/Speicher-/Jahrestests bestanden (52 bestehende, 13 Jahresgruppen, 3 Migrations-/Jahresspeichergruppen).
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

## Rechenrichtungen und Einkommenswege

Neue unabhängige Beispiele:

- KZ 245 = 45.132 € minus einmal 132 € → Basis 45.000 €. Direkte Basis 45.000 € → unverändert 45.000 €, ohne erneute Abzüge.
- Bei 1.200 € auf die Pauschale anzurechnenden Werbungskosten: 45.132 € minus 1.200 € = 43.932 €, nicht zusätzlich minus 132 €.
- Fixe Hauptmiete 1.400 €, Basis 45.000 €, jährliche Zahlungen/Steuerabzüge je 3.600 €, AfA 2.400 € → Vermietungsüberschuss 10.800 €, Zusatzsteuer 4.320 €, monatlich frei 740 €.
- Öffentliches Startbeispiel bei noch offenen Abzügen: Miete 1.400 €, monatliche Zahlungen 335 €, AfA/sonstige Steuerabzüge 0 € → monatlich frei 505 €.
- Fixe Miete 100 € im 3.600-€-Kosten-/2.400-€-AfA-Modell → Zuschuss 200 €/Monat, keine erfundene Verlust-Steuergutschrift.

Weitere Fälle: höhere/niedrigere Werbungskosten, negative Gehaltsbasis als sichtbare Modellgrenze, ungültige aktive und ignorierte inaktive Einkommenswerte, gleiche Ergebnisse vorwärts/rückwärts bei identischer Miete und Mietererstattung, unveränderte Miete bei Anschaffung, ungültige Rechenrichtung und Modellwerte.

DOM-Funktionsdurchgang erweitert: beide Modi, richtige Überschriften/Beträge, Erhalt aller Eingaben, leeres inaktives Ziel, direkte Einkommensbasis trotz ungültiger inaktiver KZ-245-Felder, keine Doppelabzüge, Custom-Werbungskosten, negative Salden als Zuschuss, Ergebniswechsel mit Fokus, Kaufvergleich ohne Mieterhöhung. Kosten- und AfA-Funktionsfälle erneut enthalten.

## Speichern und Sicherung

Zwölf zusätzliche automatisierte Testgruppen in `tests/persistence.test.js`: vollständiger Roundtrip ohne Ergebnis-/Tarifübernahme und ohne Objekt-Aliasing; leere/negative Entwürfe; ungültiges JSON, fremde App/Version/Jahr; unbekannte oder fehlende Schlüssel inklusive Prototype-Payload; numerische Syntax/Endlichkeit/Größen und Textdaten; Typen/Auswahlen/Schritt/Textlängen; Kostenarten und unveränderliche Rücklagenregel; 100-Positionen- und UTF-8-Größengrenzen; Herkunft des übernommenen Grundanteils; kanonische Zeitstempel und unveränderte beschädigte Speicherstände; eigene Kennung bei Schreiben/Lesen/Löschen; propagierte Zugriffs-/Quota-/Löschfehler.

Zusätzlich zwölf DOM-Funktionsgruppen mit temporärem jsdom, ohne neue Projektabhängigkeit:

1. Anfangs aus; Bearbeiten/Verlassen schreibt nichts. Export funktioniert ohne Opt-in und liefert passenden Dateinamen/Inhalt.
2. Einschalten, dynamische Karten, Quellen, Rechenrichtung, Schritt und AfA-Herkunft speichern. Neue DOM-Instanz stellt die Werte wieder her und berechnet denselben Ergebniswert. Laden schreibt nicht neu. Grundanteil-Herkunft invalidiert nach Änderung weiterhin korrekt.
3. Leere aktive Felder bleiben als Entwurf erhalten; nach Laden kein veraltetes Ergebnis. Ausschalten entfernt nur die eigene Kennung, erhält aktuelle Eingaben und verhindert ausstehendes erneutes Speichern.
4. Import/Rückgängig bei aus- und eingeschalteter Speicherung. Beschädigte, fremde Jahres-/Versionsdateien, Zusatzfelder und übergroße Dateien lassen den Stand unverändert.
5. Andere Tabs pausieren ausstehende Schreibvorgänge; unlesbarer neuer Stand wird geschützt, fremdes Löschen hebt die Sperre wieder auf. Aktuelle Eingaben bleiben bestehen.
6. Nicht unterstützte gespeicherte Version bleibt original erhalten und herunterladbar. Gültiger Dateiimport überschreibt sie bei ausgeschalteter Speicherung nicht; bewusstes Löschen entsperrt die App.
7. Gesperrter Browserzugriff: Import/Export bleiben nutzbar.
8. Quota-Fehler: kein falsches „gespeichert“, Schalter bleibt nach fehlgeschlagenem Einschalten aus.
9. Fehlgeschlagenes Löschen: Meldung sichtbar, gespeicherter Stand bleibt erhalten, automatisches Speichern stoppt.
10. Älteres verzögertes Dateilesen kann einen neueren Import nicht überholen.
11. 100 importierte Kostenpositionen sperren Hinzufügen; Entfernen erlaubt es wieder.
12. Unerwartete Ausnahme während der Übernahme setzt den vorherigen Stand zurück und schreibt keine Speicherung.

Der gesamte bisherige Kosten-/AfA-/Planungs-DOM-Durchgang und die zwölf Speichergruppen wurden mit Alpha 0.6 erneut erfolgreich ausgeführt. Ein zusätzlicher Controller-Durchgang der Alpha 0.5 bestätigte den tatsächlichen 400-ms-Speichertimer, Flush bei verstecktem Dokument, Erhalt des letzten Standes bei späterem Quota-Fehler, erfolgreiches erneutes Speichern und Ignorieren fremder Speicherkennungen. Diese DOM-Durchgänge sind ergänzende lokale Prüfungen, kein im CI eingerichteter echter Browserlauf. Dateidownload wurde über Blob-Inhalt/Dateinamen geprüft; der native iOS-Dateidialog wurde nicht getestet.

## Kalenderjahr und Migration

13 neue Jahres-Testgruppen: Startmonat/Leerstand und Grenzen; zwölf weiterlaufende Kostenzahlungen trotz sechs Mietmonaten; kein automatischer Volljahresabzug; eigene Zahlungsmonate und ungekürzte Jahresbeträge; Rücklage/Puffer bei Leerstand; ungültige Jahres-Kostenangaben; Ziel = Monatsdurchschnitt × 12 mit minimalem Centbetrag für 1/3/6/9/12 Mietmonate; Vorwärtsrechnung und gesperrte Zielsuche bei 0 Mietmonaten; Gleichheit des zwölfmonatigen Modells; unabhängige AfA-Nutzungsmonate mit 6/7-Grenze; offene/eigene Jahres-AfA und Sonderpfade; Anschaffung bei unveränderter Miete.

Unabhängiges Beispiel: sechs Monate × 2.000 € Miete, 600 € Erstattungen, 1.200 € Zahlungen, 600 € Kostenabzug, 1.200 € AfA, Basis 45.000 € → Einkünfte 10.800 €, Zusatzsteuer 4.320 €, Jahres-Cash 7.080 €, Durchschnitt 590 €/Monat. Bei demselben Kosten-/Abzugsmodell ohne Erstattung verlangt ein Ziel von 1.000 €/Monat genau 3.466,67 € Miete je Mietmonat; ein Cent weniger unterschreitet das Jahresziel.

Drei neue Speichergruppen: vollständige Übernahme aller alten Felder/Schritte/Rechenrichtungen unter Volljahresmodus, kein Überschreiben beim Lesen, Rücklagenmigration, Ablehnen beschädigter oder gemischter Schema-Versionen, Roundtrip neuer Jahresfelder und unvollständiger Jahresentwürfe.

Zusätzlicher DOM-Durchgang erfolgreich: Volljahr → Kalenderjahr → Volljahr mit erhaltenen Werten; Jahresaufschlüsselung und richtige Durchschnitts-Gesamteinnahmen; separate Jahresabzüge/AfA; Wechsel 6/7 AfA-Monate und Leerstand ohne automatische AfA-Kürzung; ungültige/fractionale Leerstände und Zahlungsmonate; ungenutzte Felder; ungekürzte Jahresbeträge; Null-Mietmonatsfall; explizite Jahres-AfA trotz ungültiger ungenutzter Volljahresbasis; Schema-2-Speicherung/Neuladen/Export/Import/Rückgängig; tatsächliches Schema-1-Laden und Dateiimport mit identischem Volljahresergebnis und sichtbarem Übernahmehinweis.

## Manuelle und externe Nachweise

- Nutzer bestätigte am 19.10.2026 den iPhone-/Safari-Bedienungstest der vorherigen Alpha 0.1.
- Nutzer hat am 19.10.2026 Speichern/Sicherung der Alpha 0.5 ausdrücklich abgenommen. Dies ersetzt keine gesonderte Abnahme der neuen Jahresplanung.
- GitHub Pages ist aktiviert. Die zuvor veröffentlichte Alpha wurde vom Nutzer aufgerufen.
- Der alte Alpha-0.1-Safari-Durchgang ist keine Abnahme der neuen Kosten-/AfA-Oberfläche.
- Alpha 0.2: GitHub Actions und Pages-Deployment für Commit 6a9e5c98bbfda49666aa7d5748aef8d284a12b3e erfolgreich bestätigt.
- Alpha 0.4: GitHub Actions und Pages-Deployment für Commit b6662037f19c64d2349049f1800aaa04dad7aba8 erfolgreich bestätigt.
- Alpha 0.5: GitHub Actions und Pages-Deployment für Commit ef95c2430dfc7b53c635f1ba38720e53aaa5eba4 erfolgreich bestätigt.

## Nicht durchgeführt / noch offen

- Kein visueller Browserlauf der Alpha 0.6: Chromium fehlt; früherer Installationsversuch lieferte ein unbrauchbares Archiv. DOM-Prüfung ist kein Browser-Rendering-Test.
- Jahresplanung mit Start Juli, Leerstand, Zahlungsmonaten, eigenen Abzügen/AfA sowie gespeichertem Jahresmodus auf iPhone/Safari abnehmen. 320-px-Layout, Fokus/Tastatur und native Dezimaleingabe weiterhin gezielt visuell prüfen.
- Teilmonate, abweichende Zu-/Abflusszeitpunkte, Ausfälle, mehrere Eigentümer, USt/Vorsteuer und vollständige persönliche Veranlagung sind nicht implementiert und nicht abgedeckt.
- Ein lokales Bestehen ist kein Nachweis des GitHub-Actions-/Pages-Laufs für den neuen Commit; dessen Status separat prüfen.




