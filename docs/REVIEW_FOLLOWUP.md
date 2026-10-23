# Review-Follow-up zur Alpha 0.7

Grundlage: vom Nutzer am 19.10.2026 übermittelter Code-Review zur Alpha 0.6 sowie Screenshot einer Einseitenansicht mit ausdrücklich fiktiver Beispielrechnung. Originaldateien bleiben außerhalb des öffentlichen Repos. Nach Besprechung wurde die Umsetzung der Einseitenansicht mit echtem Rechenkern beauftragt.

## Übernommene Produktentscheidungen

Ergebnis oben; beide Richtungen direkt darunter; Regler und genaues Zahlenfeld. Eingaben mit Zusammenfassungen einklappen, fachliche Hilfen erhalten. Helle, freundliche mietklar.-Gestaltung weiterführen. Grafik aus echten Beträgen mit gemeinsamer Jahresdurchschnittsbasis inklusive Kostenersatz; Defizit separat. Eigener m²-Vergleich als Orientierung und Browser-Druckblatt. Keine gesetzliche Mietpreisgrenze und keine neue automatische Steuer-/Rechtsfreigabe.

## Findings

| Finding | Stand / Entscheidung |
| --- | --- |
| F1 Leerstand im Volljahr | Vorher bewusst zwölf Mietmonate; Kalenderjahr konnte bereits Jänner + Leerstand. Jetzt eigener erwarteter Leerstand im typischen Vermietungsjahr. Monatserstattung nach Mietmonaten, Zahlungen weiterhin zwölf Monate, jährliche Abzüge/AfA unabhängig. |
| F2 UI-Monolith | DOM-freier Szenarioaufbau in scenario.js; Orchestrierung, Kostenkarten, Formular- und Ergebnisdarstellung getrennt. Pure Pipeline und Darstellungsdaten unabhängig getestet. |
| F3 Browsertests | Acht Smoke-Fälle in Chromium/WebKit als CI, inklusive Speicherung/Dateien, Jahreswechsel der Planung, Druckmedien, Fokus und mobilem Layout. Endgültigen Lauf commitbezogen prüfen. |
| F4 null/undefined | Allgemeine öffentliche AfA-API noch separat vereinheitlichen. Neue Formpipeline normalisiert Rohwerte; kein umfassender API-Fix behauptet. |
| F5 Freibetrag-Kappung | Nach Review kein abweichendes Steuerergebnis im aktuellen Modell, aber semantisch sauberere Begrenzung bleibt separat zu prüfen/testen. In diesem UI-Umbau keine Tarifänderung. |
| F6 Tarifkonfiguration | Alpha 0.8.0-alpha.2: eine aktive Tarifdatei in tariff.js; Jahr, Quelle und Prüfdatum aus dem Dokument. Oberfläche, AfA-Jahresgrenze, Druck und Sicherungen folgen diesem Jahr. Dateiname und Dokumentjahr müssen passen; andere Sicherungsjahre bleiben geschützt. Weitere fachliche Regelwerte vor neuer Jahresfreigabe prüfen. |
| F7 Gleitkomma | Darstellung zentral formatiert, Grafik-Centwerte passend verteilt; Export speichert Roh-Eingaben. Keine ungeprüfte Zwischenrundung, welche die minimale Cent-Miete verändern könnte. Kein kompletter Cent-Rechenkern. |
| F8 wiederholte Tarifprüfung | Zurückgestellt: Validierung bleibt an öffentlichen Rechenwegen erhalten. Erst messen, dann gezielt optimieren. |
| F9 CSP | Separater gezielter Schritt; bestehende Inline-Styles/Chart-Stile vor einer verbindlichen Policy prüfen. Keine neue Verschlüsselungsbehauptung für lokale Daten. |
| F10 Tooling | Syntaxdateien werden automatisch gefunden. ESLint/ts-check nicht eingeführt; kein entsprechender Prüfnachweis behauptet. |
| F11 Modellgrenzen | Persönliche Steuerfaktoren, Verlustgutschrift und jährlicher Kaufvergleich bleiben transparent abgegrenzt. |
| F12 iOS-Dezimalkomma | Monetäre Textfelder mit Dezimal-Tastaturhinweis, gemeinsamer Parser und Browser-Smoke-Fälle mit Komma/Punkt. Mehrdeutige Tausenderpunkte werden nicht still umgedeutet. Nativen iPhone-Tastaturdurchgang weiter manuell prüfen. |

## Nächste Reihenfolge

Neue Oberfläche auf iPhone abnehmen; Kosten-Prüfhilfe der Alpha 0.8 einschließlich Garage gemeinsam prüfen. Kleinere Kern-/Tooling-Findings getrennt und mit eigenen Gegenfällen bearbeiten. Die Tarifauswahl ist zentralisiert; vor einem neuen Jahr fachliche Werte und Quellen prüfen. Die Erweiterung auf Kredit/USt oder komplette persönliche Steuerveranlagung ist hier nicht vorgesehen.

