# Prüfstand Alpha 0.7

Stand: 19.10.2026. Die Abnahme gilt jeweils für den genannten Umfang, nicht pauschal für spätere Oberflächen.

## Lokal erfolgreich

- `npm test`: 80 reine Tests in Tarif-, Kosten-, AfA-, Planungs-, Jahres-, Speicher- und Szenariomodulen.
- Enthalten: 3.000 deterministische Modelle mit unterschiedlichen Einkommen, Kosten, AfA, Erstattungen, 1–12 Mietmonaten und Zielbeträgen. Jedes Ergebnis erreicht das Ziel; ein Cent weniger Miete reicht nicht, sofern die Lösung nicht bereits 0 € ist. Fester Seed für reproduzierbare Fehler.
- `npm run check`: Syntaxprüfung aller automatisch gefundenen JavaScript-Dateien in src, tests, e2e und scripts sowie Playwright-Konfiguration. Zusätzlich Versionszuordnung von Browsermodulen, Stylesheet und Tarifabruf geprüft, um gemischte alte/neue Assets nach Pages-Updates zu verhindern. Kein ESLint-/Typprüfungsnachweis.
- Playwright-Testliste: acht Fälle × zwei Engines = 16 Fälle gefunden. Dies allein ist kein Browserlauf.
- DOM-Funktionsdurchgang mit temporärem jsdom: zwölf Speichergruppen erfolgreich mit neuer Oberfläche, einschließlich Restore/Neuberechnung, Drafts, Delete ohne Sitzungsverlust, Import/Undo an/aus, fehlerhafte/zu große/fremde Versions-/Jahresdateien, Mehrtab-Pause, geschützter Recovery-Download, verweigertem Speicher, Quota-/Löschfehlern, überholten Dateilesungen, 100 Kostenpositionen und Rollback bei Anwendungsfehler.
- Kein lokaler echter Browserlauf in dieser Arbeitsumgebung. Browsertests sind deshalb auf GitHub Actions eingerichtet.

## Unabhängige Referenzfälle

| Fall | Zusatzsteuer/Jahr | Frei pro Monat im Jahresdurchschnitt |
| --- | ---: | ---: |
| Gehaltsbasis 45.000 €, Miete 1.400 € × 12, Zahlungen 335 € × 12, AfA/Abzüge offen = 0 | 6.720 € | 505 € |
| Gleiches Modell, ein erwarteter Leerstandsmonat, Zahlungen laufen weiter | 6.160 € | 435 € |
| Start Juli, Miete 2.000 € × 6, Erstattung 100 € × 6, Zahlungen 100 € × 12, Kostenabzug 600 €, Jahres-AfA 1.200 €, Basis 45.000 € | 4.320 € | 590 € |

Im letzten Fall Jahres-Cash 7.080 €. Ohne Erstattung, bei sonst gleichem Modell und Ziel 12.000 € Jahres-Cash: minimale Miete 3.466,67 € je Mietmonat.

Die bisherigen Tarifgrenzen, Freibetragsfälle, Rückwärts-Centgrenzen, unabhängigen Zahlungen/Erstattungen/Abzüge, Rücklagen, AfA-Herleitung, 6/7-AfA-Monatsgrenze, Verlust ohne Gutschrift, Einkommenswege und unveränderte Miete im Anschaffungsvergleich bleiben in der Suite enthalten.

## Neue Darstellungs- und Eingabefälle

- DOM-freier Rohwertaufbau reproduziert die obigen Rechenfälle. Inaktive Felder werden nicht zur Berechnung herangezogen.
- Komma/Punkt/Gruppierung mit Komma; mehrdeutige reine Punktgruppen werden erklärt abgewiesen. Keine Rundung des Rechenkerns zur Eingabe/Anzeige.
- Vergleich pro m²: eigener Wert, strikte Über-Grenze, Gleichheit ohne Warnung, leere/ungültige optionale Metadaten ohne Veränderung der Mietrechnung.
- Grafik: Kostenersatz enthalten; gleiche Jahresdurchschnittsbasis, Rücklage/Puffer getrennt, AfA keine zusätzliche Zahlung. Defizit als Zuschuss; kein falscher positiver Überschuss. Legenden-Cents summieren sich zur angezeigten Gesamtsumme, auch wenn interne Beträge Bruchteile eines Cents haben.
- Fehler im optionalen Kaufvergleich verdecken das gültige Miet-Ergebnis nicht.
- Format 1/2 nach 3 mit neuen Defaults, unveränderten Geldwerten und wertgleicher Umschreibung technisch mehrdeutiger alter Dezimalpunkte. Fehlerhafte/vermischte Versionen werden nicht still repariert. Aktuelle Rohwerte einschließlich Dezimalkomma werden nicht als Tarife/Ergebnisse übernommen, sondern neu berechnet.

## Browser-Smoke-Tests in CI

Workflow `Alpha checks`, Job `browser`: `npm ci`, Playwright-Browser/Abhängigkeiten installieren, `npm run test:e2e`. Statischer Testserver läuft ausschließlich auf localhost und verwendet `/mietklar/` wie Pages. Playwright ist eine Entwicklungsabhängigkeit, kein Bestandteil der ausgelieferten App. Jeder Browserfall prüft zusätzlich, dass alle angefragten Browsermodule, Stylesheets und Tarifdaten zur aktuellen Paketversion gehören.

Chromium und WebKit prüfen jeweils:

1. Live-Ergebnis, beide Richtungen, Komma/Punkt und Tastatur am Regler.
2. Regeljahr-Leerstand, Kalenderjahr, AfA-Nutzungsmonate und ungültige Zustände/Ergebnisunterdrückung.
3. Einnahmenaufteilung, stimmige Summen und Defizitdarstellung.
4. Eigener m²-Vergleich, isolierter Kaufvergleichsfehler und USt-Sperre.
5. Opt-in, Neuladen, Dateiexport, Import/Undo und ausschließlich eigene lokale Löschung.
6. Tatsächliche Dateiimporte der alten Formate 1 und 2 bei ausgeschalteter Speicherung.
7. Aktuelles Druckblatt und Print-CSS; zusätzlich PDF-Erzeugung in Chromium. Kein Nachweis des nativen OS-Druckdialogs.
8. 320/390/1280-px-Breiten ohne Dokument-Überlauf, Fokus/Home, eigene Position und Textausgabe ohne HTML-Injektion.

Browser-Nachweis: Commit `84d28f6889a0f0a01946639b26b763a38c528e26`, [Actions-Lauf 39296249582](https://github.com/ieeks/mietklar/actions/runs/39296249582): 80 reine Tests, Syntax und alle 16 Browserfälle erfolgreich, ohne Testwiederholung. Ein zunächst beobachteter WebKit-Aufklappfehler nach Zahlen-Blur wurde durch Vermeidung unveränderter doppelter Renderläufe korrigiert. Erneut bestanden nach letzter Druckkorrektur: Commit `a12c1e4002a2b840a6461932988a13070fdca419`, [Actions-Lauf 39296676398](https://github.com/ieeks/mietklar/actions/runs/39296676398), wiederum 80 + 16 ohne Retry. Die mobile 390-px-Aufnahme und beide Seiten des in Chromium erzeugten Ergebnisblatts wurden visuell geprüft: keine abgeschnittenen Spalten, Annahmen mit eigener Überschrift auf der Folgeseite. Anschließend werden nur noch Asset-Versionszuordnung und Dokumentation abschließend geprüft. Automatische Screenshots/PDF/Report werden für sieben Tage als GitHub-Testartefakt mit ausschließlich fiktiven Daten aufbewahrt. Sie werden nicht ins Repository übernommen. Ein erzeugter Screenshot ist allein keine manuelle visuelle Abnahme.

## Historische und manuelle Nachweise

- Nutzer bestätigte am 19.10.2026 die iPhone-/Safari-Bedienung der Alpha 0.1.
- Nutzer hat Speichern/Sicherung der Alpha 0.5 am 19.10.2026 ausdrücklich abgenommen.
- Alpha 0.6: Syntax, 68 Tests, Kosten-/AfA-/Planungs-DOM-Regressionen, Speicher- und Kalenderjahresfälle sowie Migration bestanden. GitHub Actions und Pages für Commit `09edeb6d9f3ffbd9fa46cd3ed4b26d1628c33ee7` erfolgreich bestätigt.

## Noch offen

- Neue Einseitenansicht mit echtem iPhone/Safari: Lesbarkeit, Einklappen, virtuelle Kommatastatur, Dateiablage/-auswahl und Druck-/PDF-Dialog. Linux-WebKit mit Mobile-Viewport ersetzt diesen Test nicht.
- Neue Kalender-/Regeljahresbedienung manuell abnehmen; bisherige Speicher-Abnahme nicht still auf den ganzen Umbau übertragen.
- Teilmonate, abweichende Zu-/Abflusszeitpunkte, Ausfälle, mehrere Eigentümer, USt/Vorsteuer und vollständige persönliche Veranlagung sind außerhalb des implementierten Modells.
