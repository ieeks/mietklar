# Übergabe: mietklar. Alpha 0.1

Stand: 18.10.2026, Europe/Vienna. Nächster Einstieg: README, diese Datei, ROADMAP, docs/RESEARCH lesen. Danach zuerst den aktuellen Branch/Commit prüfen; die nächste Sitzung nicht aus dem Gesprächsgedächtnis rekonstruieren.

## Ziel und bestätigte Entscheidungen

- Österreichische Dauervermietung, Eigentumswohnung, kein Kredit.
- Wunschbetrag X ist **frei verfügbares Geld nach Kosten, zusätzlicher Einkommensteuer und gewähltem Puffer**. Monatszahl ist ein Jahresdurchschnitt, keine Garantie gleichbleibender Zahlungseingänge.
- Zuerst Rückwärtsrechnung: gewünschter Monatsüberschuss → benötigte Hauptmiete. Vorwärtsmodus ist geplant, noch kein eigener UI-Modus.
- **Geführte Bedienung** wurde gegenüber Kompakt gewählt, damit Wohnungskosten, AfA und BK erklärt werden können.
- Name **mietklar.** und Akzentpunkt ausdrücklich beibehalten. Warme zurückhaltende Gestaltung; konkrete Feinabstimmung offen.
- Aktuelle Vorschreibung zuerst, aufklappbare Jahresabrechnung dahinter. Mehr Detail nur bei Bedarf.
- Der User hat `ieeks/mietklar` angelegt. Öffentliches Repo, `main`; GitHub-Zugriff wurde geprüft.
- Gewünschter Abschluss dieser Sitzung: aktuellen Stand als Alpha sichern und so dokumentieren, dass nahtlos weitergearbeitet werden kann. Keine Behauptung einer produktionsreifen Lösung.

## Was tatsächlich implementiert ist

`index.html`, `style.css`, `src/ui.js`: fünf klickbare Schritte; die App startet regulär bei Ziel/Einkommen. Einzelne Kostenpositionen, Teilweiterverrechnung, „noch prüfen“, Rücklage, eigene Kosten und persönlicher Puffer. AfA-Eingabe oder einfache Herleitung aus einer bereits bestätigten Basis. Ergebnis und Anschaffungsvergleich.

`src/calc.js`: geprüfte 2026-Tarifberechnung, positiver Vermietungsüberschuss, vereinfachter Veranlagungsfreibetrag im Fall Arbeitnehmer + eine Vermietung, keine Verlust-Steuergutschrift. Bisektion mit abschließender Prüfung des minimalen Cent-Mietbetrags. Cash-only-Rücklagen und AfA sind getrennt.

`data/tarif-2026.json`: einzige Tarifquelle im Code mit Quelle und Prüfdatum. `tests/calc.test.js`: 11 Testfälle, einschließlich Grenzstufen und Vorwärts-/Rückwärtsabgleich. `.github/workflows/checks.yml`: Syntax und Rechentests bei Push/PR.

## Wichtige Alpha-Annahmen und Schulden

1. „Noch prüfen“ lässt den gesamten Kostenbetrag beim Eigentümer, Teilweiterverrechnung nur den Rest. Das ist eine konservative **Weiterverrechnungsannahme**. Die Alpha nimmt trotzdem alle laufenden Kosten als sofort abzugsfähig an. Nicht als konservative Gesamtsteuerrechnung verkaufen. Vor Beta beide Prüfungen unabhängig modellieren.
2. Einnahmen aus weiterverrechneten Kosten und entsprechende Ausgaben gleichen sich im 12-Monate-Modell aus; nur der selbst getragene Kostenrest bleibt in der vereinfachten Rechenformel. Bei Leerstand, abweichenden Erstattungen oder zeitlichen Differenzen muss das Jahresmodell erweitert werden.
3. Gehalt ist KZ 245 minus im Modell eingegebener Werbungskosten. Andere persönliche Steuerfaktoren fehlen. Kein Jahresbrutto-zu-Netto-Lohnrechner.
4. AfA-Modus „herleiten“ setzt eine bestätigte Gebäude-AfA-Basis voraus. Kein vollständiger Kaufpreis-/Grundanteils-/Erwerbsarten-Assistent.
5. Umsatzsteuerpflicht/unbekannt blendet Ergebnisse aus. Keine gemischten USt-Sätze oder Vorsteuerberechnung implementiert. Die steuerliche Behandlung eines früheren Immobilienkaufs entscheidet nicht automatisch über den heutigen Vermietungs-USt-Status.
6. Anschaffungsvergleich: gleicher Mietbetrag, aktuelles Jahr. Bei Sofortabzug > 1.000 € oder Jahres-AfA > Kaufpreis wird kein Vergleichsergebnis gezeigt. Das ersetzt keine Prüfung wirtschaftlicher Einheiten, Privatanteil, Inbetriebnahme und zulässigem Jahresabzug.
7. Historische Jahresabrechnung ist aktuell **nur ein fiktives UI-Beispiel**, keine importierbare oder bearbeitbare Buchhaltung. Keine Nachzahlung/Gutschrift wird in die normale Zielmiete gerechnet.
8. Alle numerischen Beispielwerte sind fiktiv. Die Anlage wurde aus privaten Unterlagen strukturell abgeleitet; deren Dateien/Inhalte und tatsächliche Zahlen wurden nicht veröffentlicht.

## Fachlicher Recherche-Stand

Private Unterlagen wurden zur Klärung der Objektstruktur gelesen. Für das besprochene Ausgangsszenario wurde eine freifinanzierte Neubau-Eigentumswohnung mit Baubewilligung nach 8.5.1945 festgestellt. Daraus ergibt sich als grundsätzliche Planungseinordnung MRG-Teilanwendung. **Objektbezogene Daten und Dokumente bleiben außerhalb des Repos.** Das ist keine generelle Zuordnung für jede künftige Nutzereingabe.

Ein Mietvertrag besteht für die geplante Dauervermietung noch nicht. Kostenüberwälzung muss daher erst wirksam vereinbart werden. Die MRG-Vollanwendungs-Kostenliste nicht als automatisch geltenden Katalog für diesen Fall darstellen. Prüfregeln müssen Mietrechtsszenario, Vertrag und Kostenposition berücksichtigen. WEG-Rücklage in der Planung beim Eigentümer belassen. Andere Konstellationen nicht pauschal erlauben/verbieten.

Die Vorschreibung enthält getrennte BK, Wasser, Heizung, Warmwasser, I-Fonds. Jahresabrechnungen können zusätzlich Verwaltung, Versicherung, Bewachung, Service/Wartung, Telefon einer Anlage, Garagenkosten und aus Rücklagen bezahlte Arbeiten enthalten. Anhand des Kontonamens keine rechtliche oder steuerliche Freigabe erteilen. Fläche und Nutzwertanteil nicht verwechseln.

## Sinnvoller nächster Arbeitsblock

1. Alpha im Browser und auf iPhone/Safari ausprobieren; konkrete UX-Rückmeldungen erfassen.
2. Im Kostenmodell **Zahlung, erwartete Mietererstattung und bestätigten Steuerabzug** getrennt führen; Quellen/Status je Position ergänzen.
3. Objekt-/Mietrechtsszenario und „noch kein Mietvertrag“ als Eingaben ergänzen, Vorschläge mit Begründung statt automatischer Freigaben.
4. Persönliche AfA und Vermietungs-USt-Status separat verifizieren. Keine weiteren privaten Unterlagen in Commits aufnehmen.
5. Erst danach weitere Features aus ROADMAP und Pages-Veröffentlichung.

## Prüfen / weiterentwickeln

```sh
npm run check
npm test
python3 -m http.server 8080
```

Syntax- und Rechentests erfolgreich. Browserlauf konnte mangels installiertem Chromium in der Arbeitsumgebung nicht durchgeführt werden. Nicht als End-to-End-getestet bezeichnen. Die Inline-Vorschau wurde in der Unterhaltung gezeigt; deren endgültige UI-Abnahme ist noch offen.

## Projektpflege

Kleine statische App ohne unnötiges Framework. Keine echten Finanzdaten in Fixtures. Rechenkern und UI getrennt halten. Bei fachlicher Änderung Gegenbeispiele ergänzen. Dokumente nach dem endgültigen Stand umschreiben; ROADMAP erledigte Punkte markieren. Nicht versehentlich persönliche PDFs, OCR-Zwischendateien oder den gesamten Scratch-Ordner committen.
