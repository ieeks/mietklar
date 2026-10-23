# Prüfstand Alpha 0.8

Stand: 23.10.2026. Die Abnahme gilt jeweils für den genannten Umfang, nicht pauschal für spätere Oberflächen.

## Lokal erfolgreich

- `npm test`: 99 reine Tests in Tarif-, Kosten-, AfA-, Planungs-, Jahres-, Speicher- und Szenariomodulen.
- Enthalten: 3.000 deterministische Modelle mit unterschiedlichen Einkommen, Kosten, AfA, Erstattungen, 1–12 Mietmonaten und Zielbeträgen. Jedes Ergebnis erreicht das Ziel; ein Cent weniger Miete reicht nicht, sofern die Lösung nicht bereits 0 € ist. Fester Seed für reproduzierbare Fehler.
- `npm run check`: Syntaxprüfung aller automatisch gefundenen JavaScript-Dateien in src, tests, e2e und scripts sowie Playwright-Konfiguration. Zusätzlich Versionszuordnung von Browsermodulen, Stylesheet und Tarifabruf geprüft, um gemischte alte/neue Assets nach Pages-Updates zu verhindern. Kein ESLint-/Typprüfungsnachweis.
- Playwright-Testliste: zwölf Fälle × zwei Engines = 24 Fälle gefunden. Dies allein ist kein Browserlauf.
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
8. 320/390/1280-px-Breiten ohne Dokument-Überlauf, Fokus/Home, eigene Position und Textausgabe ohne HTML-Injektion. Ab Alpha 0.7.0-alpha.2 zusätzlich: „Alles zuklappen“ beim Scrollen erreichbar, alle Haupt-/Unterbereiche und Sicherung geschlossen, Fokus erhalten, Ergebnis und exportierte Eingabewerte unverändert; beim Wiederöffnen bleiben Untergruppen geschlossen.

9. Geldfeld-Anzeige mit Tausenderpunkten, Bearbeitung ohne Gruppierung, Null ersetzen (auch bei Cursor hinter der Null), dynamische Kostenfelder und exakte Rohwerte im Export; zusätzliche Dezimalstellen und ungültige/mehrdeutige Entwürfe bleiben erhalten.

Browser-Nachweis: Commit `84d28f6889a0f0a01946639b26b763a38c528e26`, [Actions-Lauf 39296249582](https://github.com/ieeks/mietklar/actions/runs/39296249582): 80 reine Tests, Syntax und alle 16 Browserfälle erfolgreich, ohne Testwiederholung. Ein zunächst beobachteter WebKit-Aufklappfehler nach Zahlen-Blur wurde durch Vermeidung unveränderter doppelter Renderläufe korrigiert. Erneut bestanden nach letzter Druckkorrektur: Commit `a12c1e4002a2b840a6461932988a13070fdca419`, [Actions-Lauf 39296676398](https://github.com/ieeks/mietklar/actions/runs/39296676398), wiederum 80 + 16 ohne Retry. Die mobile 390-px-Aufnahme und beide Seiten des in Chromium erzeugten Ergebnisblatts wurden visuell geprüft: keine abgeschnittenen Spalten, Annahmen mit eigener Überschrift auf der Folgeseite. Abschließende Asset-Prüfung ebenfalls bestanden: Commit `862408a91f5240c735e253d0f7419f037827a57d`, [Actions-Lauf 39297708469](https://github.com/ieeks/mietklar/actions/runs/39297708469), Syntax/80 Tests und 16 Browserfälle ohne Retry. Alle angefragten Browsermodule, Stylesheet und Tarifdaten trugen die aktuelle Versionskennung. Danach nur Dokumentationsabschluss; den aktuellen Pages-Status bei späteren Sitzungen direkt auf GitHub prüfen. Automatische Screenshots/PDF/Report werden für sieben Tage als GitHub-Testartefakt mit ausschließlich fiktiven Daten aufbewahrt. Sie werden nicht ins Repository übernommen. Ein erzeugter Screenshot ist allein keine manuelle visuelle Abnahme.

## Historische und manuelle Nachweise

- Nutzer bestätigte am 19.10.2026 die iPhone-/Safari-Bedienung der Alpha 0.1.
- Nutzer hat Speichern/Sicherung der Alpha 0.5 am 19.10.2026 ausdrücklich abgenommen.
- Alpha 0.6: Syntax, 68 Tests, Kosten-/AfA-/Planungs-DOM-Regressionen, Speicher- und Kalenderjahresfälle sowie Migration bestanden. GitHub Actions und Pages für Commit `09edeb6d9f3ffbd9fa46cd3ed4b26d1628c33ee7` erfolgreich bestätigt.

## Noch offen

- Neue Einseitenansicht mit echtem iPhone/Safari: Lesbarkeit, Einklappen, virtuelle Kommatastatur, Dateiablage/-auswahl und Druck-/PDF-Dialog. Linux-WebKit mit Mobile-Viewport ersetzt diesen Test nicht.
- Neue Kalender-/Regeljahresbedienung manuell abnehmen; bisherige Speicher-Abnahme nicht still auf den ganzen Umbau übertragen.
- Teilmonate, abweichende Zu-/Abflusszeitpunkte, Ausfälle, mehrere Eigentümer, USt/Vorsteuer und vollständige persönliche Veranlagung sind außerhalb des implementierten Modells.

## Komfortänderung Alpha 0.7.0-alpha.2

Commit `c903019d44b7e37132fca5fd3374d1fa938ffe63`, [Actions-Lauf 39300301463](https://github.com/ieeks/mietklar/actions/runs/39300301463): Syntax, Asset-Zuordnung, 80 reine Tests und alle 16 Chromium-/WebKit-Fälle erfolgreich. Der bestehende mobile Bedienungsfall prüft zusätzlich den erreichbaren Zuklapp-Button, geschlossene Untergruppen, Fokus und unveränderte Sicherungswerte. Die native iPhone-Abnahme bleibt offen.

## Geldfelder Alpha 0.7.0-alpha.3

Commit `6c4e946e43381d657ff3acff4083b3edf08da1d0`, [Actions-Lauf 39303286104](https://github.com/ieeks/mietklar/actions/runs/39303286104): Syntax und Asset-Zuordnung, 83 reine Tests sowie alle 18 Chromium-/WebKit-Fälle ohne Wiederholung erfolgreich. Native Auswahl beim Fokus wird abgeschlossen, bevor die Gruppierung zur Bearbeitung entfernt wird; dadurch bleibt auch die vorhandene Alles-Markierung in Chromium erhalten. Geprüft: Beträge ersetzen, Null überschreiben, Cursor hinter der Null, dynamische Kostenfelder, keine Rundung zusätzlicher Stellen und exakt unveränderte Rohwerte im Export. Nativer iPhone-/Safari-Test weiterhin offen.

## AfA-Erklärung Alpha 0.7.0-alpha.4

Commit `109bcf90dfb8c0c94a6faeb5bee08f6a5fbd9ede`, [Actions-Lauf 39305412730](https://github.com/ieeks/mietklar/actions/runs/39305412730): Syntax/Asset-Zuordnung, 83 reine Tests und alle 18 Chromium-/WebKit-Fälle ohne Retry erfolgreich. Bestehende Browserfälle erweitert: eingegebener Kaufpreis und Kaufjahr, aber Grundanteilstatus offen → konkreter Hinweis direkt an der Summe; bewusste Einordnung → Hinweis verschwindet; tatsächlicher Nullwert ohne falschen Offen-Status. Jahresroute separat geprüft: bekannter Volljahreswert bei noch offener Jahresauswahl sowie reguläre 0 Nutzungsmonate. Rechenwerte und Speicherformat unverändert.

## Kosten-Prüfhilfe Alpha 0.8

Lokal Syntax/Assetprüfung und 95 reine Tests erfolgreich. Neue Gegenfälle: Voll-MRG ohne künstliche Einzelvereinbarungspflicht für Wasser, Teil-MRG ohne Vertrag, widersprüchlich als geprüft angegebene Grundlage, ausgeschlossene Überwälzung trotz eingeplanter Zahlung, Reparatur/Beratung außerhalb zusätzlicher MRG-BK, Rücklageneinzahlung gegenüber tatsächlicher Fondsarbeit, kalenderjährlich unabhängiger Abzug. Neue Metadaten verändern das finanzielle Modell nicht. Format 3 → 4 erhält rohe Kommawerte und ergänzt ausschließlich leere/offene Prüffelder; strikte alte Kategorien bleiben geschützt.

Browser-Suite jetzt zehn Fälle × Chromium/WebKit = 20. Neuer Fall: geerbter Kontext, Kategorie und Vereinbarung, Quellen, Hinweise im Ergebnisblatt, Text ohne HTML-Ausführung, Breiten 320/390/1280, Reservewechsel mit gesperrten Auswahlen, erneutes Öffnen nach Import und Alles-zuklappen ohne Datenverlust. Neue manuelle iPhone-Abnahme weiterhin offen.

Alpha 0.8 Browser-Nachweis: Commit `8f791152c98aa0daa89dbe395c235d777f019b11`, [Actions 39310549482](https://github.com/ieeks/mietklar/actions/runs/39310549482): Syntax/Assetprüfung, 95 reine Tests und alle 20 Chromium-/WebKit-Fälle erfolgreich. Die fachlichen Hinweise sind bedingt; eine echte iPhone-Abnahme und konkrete Vertrags-/Belegprüfung bleiben offen.


## Zentrales Tarifjahr und Quellenanzeige · 0.8.0-alpha.2

Lokal Syntax-/Assetprüfung und 99 reine Tests erfolgreich. Die zusätzliche Tarifprüfung validiert ausgewähltes Dateijahr, Tarifstruktur, HTTPS-Quelle, Quellenbezeichnung und ein echtes ISO-Prüfdatum. Aktuelle 2026-Rechenwerte und Format-4-Sicherungen bleiben unverändert. Ein abweichendes Sicherungsjahr nennt beide Jahre und wird nicht übernommen.

Browser-Suite jetzt zwölf Fälle × Chromium/WebKit = 24: Quellenlink/Prüfdatum am Ergebnis und im Druckblatt; fiktiver Jahreswechsel durch genau eine geänderte Tarifdatei-Auswahl, alle Jahresbeschriftungen, AfA-Kaufjahresgrenze, Exportjahr und unveränderte geschützte lokale Altsicherung; abgewiesener Fremdjahresimport ohne Eingabeverlust. Falsches Dokumentjahr, unsicherer Quellenlink und ungültiges Prüfdatum sperren Start und Druck. Das fiktive Folgejahr nutzt bewusst unveränderte Teststufen und ist kein realer Tarif.

Lokaler Browserlauf noch nicht möglich: Browser-Download lieferte ein unvollständiges ZIP. Der CI-Nachweis für diesen Commit wird nach dem Lauf ergänzt. Native iPhone-/Safari-Abnahme bleibt offen.
