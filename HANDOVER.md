# Übergabe: mietklar. Alpha 0.8

Stand: 23.10.2026, Europe/Vienna. Nächster Einstieg: README, diese Datei, ROADMAP, docs/RESEARCH lesen. Danach zuerst den aktuellen Branch/Commit prüfen; die nächste Sitzung nicht aus dem Gesprächsgedächtnis rekonstruieren.

## Ziel und bestätigte Entscheidungen

- Österreichische Dauervermietung, Eigentumswohnung, kein Kredit.
- Der AfA-Assistent berücksichtigt das Szenario „bisher ausschließlich privat genutzt, erstmalige Vermietung“; keine bestehende Vermietungs-AfA voraussetzen. Ein individueller AfA-Jahreswert ist noch nicht ermittelt.
- Als gewünschte Planungsannahme Kleinunternehmerbefreiung verwenden (ohne Ausgangs-USt und ohne Vorsteuerabzug). Keine bestätigte Statusprüfung: 55.000-€-Grenze unternehmerweit beim selben Unternehmer, relevantes Vorjahr/laufendes Jahr und ein möglicher bindender Verzicht bleiben zu prüfen.
- Wunschbetrag X ist **frei verfügbares Geld nach Kosten, zusätzlicher Einkommensteuer und gewähltem Puffer**. Monatszahl ist ein Jahresdurchschnitt, keine Garantie gleichbleibender Zahlungseingänge.
- Beide Rechenrichtungen implementiert: gewünschter Monatsüberschuss → benötigte Hauptmiete und vorgegebene Hauptmiete → verbleibender Monatsüberschuss. Eingaben bleiben beim Wechsel der Rechenrichtung bestehen; die Einseitenansicht ersetzt den früheren geführten Ablauf.
- Nach Review am 19.10.2026 neuer bestätigter Aufbau: **eine Seite mit Ergebnis oben**, Regler plus exaktem Zahlenfeld, aufklappbaren Eingaben und erhaltenen Kosten-/AfA-Hilfen. Frühere Fünf-Schritte-Bedienung ist ersetzt. Heller, freundlicher Stil und Wortmarke bleiben.
- Name **mietklar.** und Akzentpunkt ausdrücklich beibehalten. Neue Designvorgabe: heller und freundlicher; grün-/olivlastige Flächen wurden als zu „military“ empfunden. Aktueller Entwurf mit warmem Weiß, Apricot-Flächen und Terrakotta-Akzent. Helle Darstellung zunächst als Standard; visueller Feinschliff und eine bewusst gestaltete optionale dunkle Variante bleiben offen. Siehe docs/DESIGN.md.
- Aktuelle Vorschreibung zuerst, aufklappbare Jahresabrechnung dahinter. Mehr Detail nur bei Bedarf.
- Der User hat `ieeks/mietklar` angelegt. Öffentliches Repo, `main`; GitHub-Zugriff wurde geprüft.
- Gewünschter Abschluss dieser Sitzung: aktuellen Stand als Alpha sichern und so dokumentieren, dass nahtlos weitergearbeitet werden kann. Keine Behauptung einer produktionsreifen Lösung.

## Was tatsächlich implementiert ist

Statische Einseiten-App mit Ergebnis/Grafik oben, aufklappbaren Eingabegruppen und Home-Sprung zum Ergebnis über die Wortmarke. Regler ist an denselben echten Rechenkern wie das Zahlenfeld angebunden. Zusammenfassungen und offene Annahmen bleiben sichtbar. Alpha 0.7.0-alpha.2 ergänzt „Alles zuklappen“ in einer beim Scrollen sichtbaren Leiste über den Bereichen; schließt alle offenen Details einschließlich Untergruppen und Sicherung, ohne Eingaben oder Berechnung zu verändern. Optionaler eigener m²-Vergleich und Druck-Ergebnisblatt sind implementiert. Alpha 0.2 ergänzt dynamische Kostenkarten mit Monats-/Jahreszahlung, voller/teilweiser/keiner/ungeklärter Erstattung, eigener Steuerentscheidung und optionaler Quelle. Eigene Positionen sind hinzufügbar und entfernbar. Die Steuerdetails sind aufklappbar. „Geklärt“ ist die Angabe des Nutzers, keine Bestätigung der App.

`src/costs.js`: Volljahr oder Jahreskontext. Im Kalenderjahr monatliche Zahlungen mit eigenen Zahlungsmonaten, monatliche Erstattungen mit Mietmonaten; Jahresbeträge bleiben explizite Jahressummen. Abzug im Kalenderjahr über separate yearTaxStatus/yearTaxAnnual, standardmäßig offen, Rücklage/Puffer ohne Abzug. Weiterhin reine Normalisierung je Position und Aggregation. Ungeklärte Erstattung = 0 € Einnahme, ungeklärter Steuerabzug = 0 € Abzug. Zahlung bleibt vollständig als Cash-Kosten enthalten. Bekannter Jahresabzug kann separat erfasst werden, auch wenn er von den Zahlungen abweicht. Rücklagen-/Puffereinzahlung bleibt ohne Erstattung/Abzug.

`src/calc.js`: Jahresmodell mit getrennten `annualCashCosts`, `annualReimbursements`, `annualTaxCosts`, `annualAfa`. Mietererstattungen erhöhen Cash-Einnahmen und steuerliche Einnahmen. Keine automatische Neutralisierung gegen eine Ausgabe. Hauptmiete × rentMonths (Default 12), Jahres-Cash und Monatsdurchschnitt ÷ 12. Bei 0 Mietmonaten Vorwärtsrechnung möglich, Zielmietsuche mit erklärtem Fehler unterbunden. 2026-Tarif, vereinfachter Veranlagungsfreibetrag für Gehalt plus eine Vermietung, keine Verlustgutschrift. Zielmiete mit minimaler Cent-Rundung.

`src/amount-inputs.js`: Geldfelder mit getrenntem Rohwert und gruppierter Anzeige. Fokus zum Bearbeiten ohne Gruppierung; Null bei Fokus/Klick markieren, zusätzlich versehentlich führende Nullen beim Tippen entfernen, wenn der Zahlenwert gleich bleibt. Gruppierung auf Blur ohne Rundung, ohne weitere Berechnung und ohne Umwandlung der Sicherungswerte; Monate/Jahre/Prozentsätze bleiben getrennt. Auch dynamische Kostenfelder verwenden diese Erfassung.

Alpha 0.7.0-alpha.4: Der konkrete offene AfA-Schritt steht zusätzlich direkt an der effektiven Summe; bei offenem Status heißt die Zeile „Gebäude-AfA noch offen · vorerst“. Regeljahr nutzt die Meldung der Volljahresherleitung, Kalenderjahr die ausgewählte Jahresroute. Keine automatische Übernahme eines Grundanteils; reguläre 0 Nutzungsmonate und explizite Nullwerte bleiben gültige Nullwerte ohne Offen-Hinweis.

`src/ui.js`: kleine Orchestrierung für Zustand, Ereignisse, Regler, Home/Fokus, Druck und Persistenz. `src/cost-editor.js` verwaltet Kostenkarten und Rohwert-Erfassung. `src/form-view.js` stellt Gruppen/abhängige Felder, Hinweise und die AfA-Vorschau dar. `src/result-view.js` rendert Ergebnisse, Grafik, Vergleiche, offene Punkte und druckbares Ergebnisblatt. Keine neue Berechnung in der Darstellung.

`src/scenario.js`: DOM-freier buildScenarioInput/evaluateScenario-Weg aus rohen Formfeldern zu validiertem Jahresmodell, Einkommen, AfA und Kosten. Beide Richtungen verwenden weiter planning.js. Vergleichs- und Anschaffungsfehler verändern das Miet-Ergebnis nicht. buildFlow nutzt gemeinsame Jahresdurchschnittsbasis inklusive Erstattungen; Defizit als zusätzlicher Zuschuss, keine positiv gefärbte falsche Cash-Komponente. Nur Anzeige-Centbeträge werden für eine stimmige Legende verteilt, die Zielmietsuche bleibt ungerundet.

`src/numbers.js`: Komma/Punkt, deutsche Gruppierung mit Komma, endliche Zahlen; reine mehrdeutige Punktgruppen wie 45.000 werden erklärt zurückgewiesen. Textfelder statt nativer monetärer number-Eingaben behalten Kommas und Entwürfe; echte Monatszähler bleiben Integer-Felder. Keine Lohnbrutto-/Netto-Automatik.

`src/planning.js`: gemeinsame Szenarioschnittstelle für beide Richtungen. Ziel-Modus ruft die centgenaue Mietsuche auf, Miet-Modus bewertet exakt die eingegebene Hauptmiete mit demselben Jahresmodell. Keine Zielmietsuche oder automatische Mieterhöhung bei Anschaffungen. Vorwärts-Ergebnis zeigt verfügbaren Betrag oder einen notwendigen Zuschuss; Hauptmiete/Kostenersatz/Gesamtzahlung bleiben getrennt.

Einkommenswege: KZ 245 aus aktiver nichtselbstständiger Arbeit mit einfacher 132-€-Pauschale oder höheren darauf anzurechnenden Werbungskosten; alternativ bereits bereinigte Gehalts-Tarifbasis ohne diese Vermietung. Im direkten Basisweg keine weiteren Abzüge; ungenutzte Felder beeinflussen weder Rechnung noch Validierung. Werbungskosten unter 132 € nutzen im einfachen Modell weiter die Pauschale; höhere Beträge ersetzen sie statt sie zu addieren. Zusätzlich zur Pauschale abziehbare Beträge/weitere persönliche Abzüge sind über eine passend bereinigte Basis zu berücksichtigen. Gehaltsbasis unter 0 wird nicht als Verlustausgleich modelliert, sondern mit Hinweis auf 0 begrenzt.

`src/afa.js`: AfA standardmäßig offen mit 0 €. Vier Wege: offen, bekannter voller Jahreswert, eingegebene Gebäudebasis/Satz, Kaufherleitung. Kaufherleitung für Käufe ab 2003 nach ausschließlich privater Nutzung: historische Kaufkosten plus passende Nebenkosten, Grundanteil abziehen, reguläre Jahres-AfA 1,5 %. Grundanteil muss bewusst als Planannahme oder vom Nutzer geklärter Anteil eingeordnet werden. Kein fiktiver AfA-Wert als Default.

Grundanteil-Hilfe: Bedingungen für 20/30/40 % aus GrundanteilV 2016, gesonderte Nachweise/erhebliche Abweichungen verhindern einen Pauschalvorschlag. Keine automatische Anwendung; ausdrücklicher Übernahme-Button. Änderung der zugrunde liegenden Hilfsangaben setzt einen zuvor übernommenen Vorschlag zurück. Individuell eingegebene Anteile werden nicht automatisch überschrieben.

Reguläre Startjahr-AfA bei 0/1–6/7–12 Nutzungsmonaten = 0/halb/voll. Die frühere Vorschau im Kauf-Assistenten bleibt Information. Die Kalenderjahresplanung hat eine eigene bewusste AfA-Auswahl: offen/angegebener Jahresbetrag/reguläres erstes AfA-Jahr. Nur letzterer Weg verwendet den Volljahreswert und gesonderte AfA-Nutzungsmonate. Bei eigenem Jahresbetrag blockiert eine ungültige, ungenutzte Volljahresbasis die Jahresrechnung nicht. Sonder-/beschleunigte AfA wird nicht automatisch berechnet. Gekaufter Altbestand bis 2002, frühere Vermietung und andere Erwerbsarten führen zur separaten Prüfung statt automatischer neuer Basis. Bestätigte Sonderwerte können über Jahreswert/Basis übernommen werden.

`src/persistence.js`: striktes versioniertes Eingabeformat, Dateigröße/Feldtypen/Auswahlen prüfen, keine Ergebnisse oder Tarife speichern. Rohwerte einschließlich leerer und negativer Entwürfe bleiben erhalten; fachliche Prüfung weiter im Rechner. Gleiche Tarifjahre erforderlich. Stabile lokale Kennung `mietklar:saved-inputs`, Schema 3. Strikte Migration gültiger Schema-1- und Schema-2-Sicherungen: alte Felder unverändert, bei Schema 1 Volljahresmodus und Jahresdefaults ergänzen; beide alten Formate um erwarteten Regeljahres-Leerstand 0 und leere m²-Felder ergänzen. Bestehende Jahreswahl aus Format 2 erhalten. Jahresabzüge bleiben unabhängig. Alte mehrdeutige Punkt-Fractions werden wertgleich mit Komma dargestellt. Lesen schreibt die alte Kopie nicht um; erst nächste Eingabe/Speicherung schreibt Schema 3. Früherer Schrittwert wird aus Kompatibilität gespeichert, steuert die neue Oberfläche nicht mehr. Übernahmehinweis sichtbar. Format, Grenzen und Migrationsregeln in docs/STORAGE.md.

`src/storage-ui.js`: Opt-in zunächst aus, vorhandener gültiger Speicherstand stellt die frühere Auswahl wieder her. Speichern nach 400 ms sowie bei ausstehender Änderung beim Verlassen/Verbergen der Seite. Aus/Löschen entfernt nur die App-Kennung und lässt aktuelle Eingaben stehen. JSON-Import/-Export auch ohne Speichern; Import übernimmt die aktuelle Speicherwahl, schaltet sie nicht ein. Letzten Import innerhalb der Sitzung rückgängig machen. Vor Übernahme vollständig strukturell prüfen; bei unerwartetem Anwendungsfehler Formular zurücksetzen. Unlesbare/neuere/fremde Jahresstände nicht überschreiben: automatische Speicherung sperren, Original herunterladen oder löschen lassen. Speicherfehler sichtbar melden; keine falsche Erfolgsbestätigung. Änderung in anderem Tab pausiert hier die Speicherung, kein automatischer Geräte-/Tab-Abgleich.

`data/tarif-2026.json`: zentrale Tarifquelle mit Prüfdatum. 83 automatisierte Rechen-/Kosten-/AfA-/Planungs-/Speicher-/Formatierungstests. Die GitHub-Actions-Prüfung führt Syntax und Tests bei Push/PR aus. Keine Produktionsabhängigkeiten. Playwright ist fest gepinnte Entwicklungsabhängigkeit mit package-lock.json; CI installiert Chromium und WebKit.

`src/year.js`: Startmonat 1–12 und Leerstandsmonate innerhalb des restlichen Kalenderjahrs → Mietmonate. Regeljahresmodus nutzt separat erwartete Leerstandsmonate (0–12), ignoriert sonst ungenutzte Kalenderjahresfelder. Zahlungen laufen zwölf Monate weiter, monatliche Erstattungen folgen Mietmonaten, voller AfA-Wert bleibt separat. Eigener Jahres-AfA-Wert oder reguläre Erstjahresregel; Belegungsmonate und AfA-Nutzung unabhängig. Näheres in docs/YEAR_MODEL.md. Keine Bestimmung der Abzugsfähigkeit.

## Wichtige Alpha-Annahmen und offene Punkte

1. Volljahr oder Kalenderjahr 2026 mit ganzen Mietmonaten, ohne USt, 100 % Eigentümeranteil, kein Kredit. Gleiche Miete je Mietmonat und Zahlung im gleichen Jahr; kein Zahlungsledger für Nachzahlungen/Ausfälle/Teilmonate. Gehalt wahlweise aus KZ 245 mit einfacher Werbungskostenberücksichtigung oder direkt als bereinigte Tarifbasis ohne diese Vermietung; keine volle persönliche Steuerveranlagung.
2. Zahlungs-/Erstattungsbeträge sind Planwerte, keine abgegrenzte Jahresbuchhaltung. Leerstand ist als Anzahl voller Monate ab Start erfassbar. Einzelne Zahlungstermine, Jahresausgleich und tatsächlich steuerlich zulässige Kosten werden nicht automatisch ermittelt. Private Vorperioden und belegte Vermietungsabsicht selbst prüfen; Zahlungsmonate und Steuerjahresbeträge passend eingeben. Ungeklärte Abzüge nicht mit einer abschließend richtigen Steuerprognose verwechseln.
3. Jahresabzüge dürfen unabhängig von den Zahlungen eingegeben werden. Der Nutzer muss Zeitpunkt, Betrag, Vermietungsanteil und mögliche Verteilung klären. Gebäude-AfA und Anschaffungsvergleich nicht zusätzlich als Kostenposition doppelt erfassen.
4. AfA-Hilfe für den einfachen Kauf-/Privatnutzungsfall ist implementiert. Individuelle AfA noch nicht ermittelt. Nur mit passender Erwerbs-/Nutzungsgeschichte verwenden. Fehlende Angaben führen zu 0 € AfA mit Hinweis. Individuelle Basis, Kostenaufteilung, Sonderfälle und Vorjahreswerte werden nicht durch die App freigegeben.
5. Kleinunternehmerbefreiung als Planungsannahme. Unbekannter/steuerpflichtiger USt-Status blendet Ergebnisse aus. Keine gemischten USt-Sätze/Vorsteuer. Umsatzgrenze unternehmerweit beim selben Unternehmer prüfen.
6. Anschaffung bei gleicher Miete, vollem Kaufpreis als Zahlung und angegebenem Jahresabzug. Kein Vergleich bei Sofortabzug > 1.000 € oder Jahres-AfA > Kaufpreis. Kein Verlustausgleich. Monatswert heißt jetzt „Monatlich übrig im Anschaffungsjahr“ mit Erklärung Jahresbetrag ÷ 12.
7. Historische Jahresabrechnung bleibt ausschließlich fiktive Detailansicht ohne zusätzliche Wirkung auf die Zielmiete. Keine doppelte Erfassung der Akonti und Jahreskosten.
8. Ausschließlich fiktive öffentliche Beispielwerte. Private Dokumente und tatsächliche Zahlen werden nicht veröffentlicht.

## Fachlicher Recherche-Stand

Private Unterlagen wurden zur Klärung der Objektstruktur gelesen. Für das besprochene Ausgangsszenario wurde eine freifinanzierte Neubau-Eigentumswohnung mit Baubewilligung nach 8.5.1945 festgestellt. Daraus ergibt sich als grundsätzliche Planungseinordnung MRG-Teilanwendung. **Objektbezogene Daten und Dokumente bleiben außerhalb des Repos.** Das ist keine generelle Zuordnung für jede künftige Nutzereingabe.

Ein Mietvertrag besteht für die geplante Dauervermietung noch nicht. Kostenüberwälzung muss daher erst wirksam vereinbart werden. Die MRG-Vollanwendungs-Kostenliste nicht als automatisch geltenden Katalog für diesen Fall darstellen. Prüfregeln müssen Mietrechtsszenario, Vertrag und Kostenposition berücksichtigen. WEG-Rücklage in der Planung beim Eigentümer belassen. Andere Konstellationen nicht pauschal erlauben/verbieten.

Die Vorschreibung enthält getrennte BK, Wasser, Heizung, Warmwasser, I-Fonds. Jahresabrechnungen können zusätzlich Verwaltung, Versicherung, Bewachung, Service/Wartung, Telefon einer Anlage, Garagenkosten und aus Rücklagen bezahlte Arbeiten enthalten. Anhand des Kontonamens keine rechtliche oder steuerliche Freigabe erteilen. Fläche und Nutzwertanteil nicht verwechseln.

## Sinnvoller nächster Arbeitsblock

1. Neue Einseitenansicht auf iPhone/Safari abnehmen: beide Richtungen, Regler/exaktes Kommafeld, alle Hilfen, Speichern/Import, PDF-/Druckdialog und Layout. Speichern/Sicherung der Alpha 0.5 wurde am 19.10.2026 ausdrücklich abgenommen; das ist keine Abnahme des neuen Designs.
2. Neue Kosten-Prüfhilfe gemeinsam mit fiktiven Eingaben abnehmen; anschließend individuelle Belege und Vertragsgrundlagen privat prüfen. Vergleich pro m² bleibt Orientierung, keine gesetzliche Freigabe.
3. Weitere Review-Punkte und Reihenfolge in docs/REVIEW_FOLLOWUP.md. Tarifdatei/Jahr und Quellenanzeige sind seit 0.8.0-alpha.2 zentralisiert; vor einer neuen Jahresfreigabe die fachlichen Regeln erneut prüfen. Teilmonate/abweichende Zahlungen und persönliche Steuerfaktoren bleiben eigene größere Blöcke.
4. Persönlichen Fall privat gegenprüfen; keine Originale/echten Zahlen in GitHub. USt-Voraussetzungen separat klären.

GitHub Pages ist aktiviert: https://ieeks.github.io/mietklar/. Änderungen auf main veröffentlichen automatisch.

## Prüfen / weiterentwickeln

```sh
npm run check
npm test
python3 -m http.server 8080
```

Syntax und 80 Rechen-/Kosten-/AfA-/Planungs-/Speicher-/Szenariotests lokal erfolgreich, darunter 3.000 deterministische Zielmietfälle. Zusätzlicher Speicher-DOM-Durchgang mit zwölf Fehler-/Import-/Mehrtab-Gruppen erfolgreich. Acht Browserfälle in zwei Engines erfolgreich bestätigt: Actions-Lauf 39296249582 für Commit 84d28f6889a0f0a01946639b26b763a38c528e26, 16/16 ohne Retry. Kleine doppelte Blur-Renderläufe unterdrücken, damit ein nativer WebKit-Klick auf eine aufklappbare Gruppe nicht durch Textknoten-Austausch verloren geht. Import/Restore setzt den Render-Fingerprint bewusst zurück; Druck erzwingt aktuellen Neuaufbau. Druckkorrektur erneut bestätigt: a12c1e4002a2b840a6461932988a13070fdca419 / Actions 39296676398, 80 + 16 grün. Mobile Aufnahme und beide Druckseiten visuell angesehen. Konsistente Asset-Versionierung abschließend geprüft: 862408a91f5240c735e253d0f7419f037827a57d / Actions 39297708469, Syntax und 80 + 16 ohne Retry erfolgreich. Danach nur Dokumentationsabschluss. Für die Wiederaufnahme zuerst aktuellen main-Commit und Pages-Status direkt auf GitHub prüfen. Kein lokaler Browserlauf in dieser Umgebung; nativer iPhone-/Safari-Dialog bleibt manuelle Abnahme.

Alpha 0.7.0-alpha.3: Formatierungsänderung mit 83 reinen Tests und 18 Browserfällen ohne Retry bestätigt, Commit 6c4e946e43381d657ff3acff4083b3edf08da1d0 / Actions 39303286104. Gruppierung zur Bearbeitung erst nach Abschluss der nativen Fokus-/Textauswahl per Microtask entfernen, um Chromium-Auswahl zu erhalten. Rohwerte bleiben getrennt und unverändert; Schema bleibt 3. Siehe docs/TESTING.md.

Alpha 0.7.0-alpha.4: Erklärung der offenen AfA mit 83 reinen Tests und 18 Browserfällen bestätigt, Commit 109bcf90dfb8c0c94a6faeb5bee08f6a5fbd9ede / Actions 39305412730, ohne Retry. Grundanteil-Werteingabe allein hebt einen offenen Einordnungsstatus nicht auf. Konkreter fehlender Schritt erscheint zusätzlich direkt an der effektiven Summe; echte Nullbeträge bleiben getrennt.

## Projektpflege

Kleine statische App ohne unnötiges Framework. Vor einer neuen Versionsnummer `npm run assets:stamp` ausführen; HTML-Einstieg, Modulimporte und Tarifabruf tragen dieselbe Versionskennung, damit Browser beim Pages-Update keine alte Rechen-/UI-Datei wiederverwenden. Keine echten Finanzdaten in Fixtures. Rechenkern und UI getrennt halten. Bei fachlicher Änderung Gegenbeispiele ergänzen. Dokumente nach dem endgültigen Stand umschreiben; ROADMAP erledigte Punkte markieren. Nicht versehentlich persönliche PDFs, OCR-Zwischendateien oder den gesamten Scratch-Ordner committen.





## Aktueller Arbeitsblock: Alpha 0.8.0-alpha.1

Kosten-Prüfhilfe umgesetzt: `src/cost-guidance.js` enthält 18 bedingte Profile und unabhängige Warnungen/Nächste-Schritte, keine Berechnung. `cost-editor.js` zeigt eine optionale vierteilige Hilfe mit Kategorie, Leistungsbeschreibung, geerbtem Mietrecht/Vertragsstatus, Vereinbarungsangabe und unabhängigem Steuerhinweis. Quellen und Datum stehen je Karte. Ungeklärte/gegensätzliche eingeplante Erstattungen erscheinen zusätzlich in Ergebnis und Druckblatt. Keinerlei automatische Freigabe oder Anpassung der Erstattung/Abzüge durch einen Statuswechsel. Nur Rücklagenkategorie erzwingt wie bisher Eigentümer/kein Abzug; beim Verlassen der Rücklagenkategorie werden diese Auswahlen wieder offen.

Schema 4 ergänzt `composition` (max. 400 Zeichen), `agreement` (unknown/planned/documented/excluded) und neue Kategorien. Formate 1–3 werden zuerst strikt gegen ihre alten Regeln geprüft, dann neue Prüffelder leer/offen ergänzt. Bestehende Geldwerte, Zahlungen und Abzüge bleiben erhalten; keine Vertragsgrundlage aus alten Namen ableiten. Keine privaten Originale oder echten Beträge übernommen. Sammelposten und Einzelpositionen dürfen nicht doppelt erfasst werden. Gemeinsame Garagenkosten können in einer Wohnungsabrechnung stehen, ohne dass ein eigener Stellplatz vermietet wird; Zuordnung und Nutzungsrecht prüfen. Fondsarbeiten sind von Einzahlungen zu unterscheiden, keine doppelte Cash-Erfassung.

Nächster Nutzertest: eine fiktive Karte öffnen, Mietrecht/Vertragsstatus ändern, Kostenart/Vereinbarung prüfen, Quelle öffnen, alles zuklappen, Sicherung exportieren/importieren. Echte iPhone-/Safari-Dialoge weiterhin separat abnehmen. Individuelle Vertrags-/Belegprüfung und Gebäude-AfA sind dadurch nicht abgeschlossen.

Alpha 0.8 Browser-Nachweis: Commit `8f791152c98aa0daa89dbe395c235d777f019b11`, [Actions 39310549482](https://github.com/ieeks/mietklar/actions/runs/39310549482): Syntax/Assetprüfung, 95 reine Tests und alle 20 Chromium-/WebKit-Fälle erfolgreich. Die fachlichen Hinweise sind bedingt; eine echte iPhone-Abnahme und konkrete Vertrags-/Belegprüfung bleiben offen.


## Tarifdatei und Quelle · 0.8.0-alpha.2 / 23.10.2026

`src/tariff.js` wählt genau eine aktive Datei, derzeit `data/tarif-2026.json`. Der erwartete Jahrgang wird aus dem Dateinamen abgeleitet und gegen das Dokument geprüft. `loadActiveTariff` prüft Tarifstruktur, Jahr, HTTPS-Quellenlink, `sourceLabel` und `checkedAt`, bevor die Oberfläche startet. Jahresbeschriftungen, Kalenderplanung, AfA-Kaufjahresgrenze, Druckblatt und Sicherungen folgen diesem Dokumentjahr; keine Umschaltung nach Systemdatum. `sourceLabel` ergänzt die bestehende Datei; Stufen, Quelle und Prüfdatum 18.10.2026 bleiben fachlich unverändert. Quelle und Datum stehen unter dem Ergebnis und im Druck/PDF.

Speicherformat bleibt 4. Abweichende Sicherungsjahre werden weiterhin geschützt und mit beiden Jahren gemeldet, keine automatische Jahresmigration. `npm run check` prüft zusätzlich das aktive Dokument und genau eine Tarifdatei-Auswahl; Asset-Version 0.8.0-alpha.2 durchgehend gestempelt. Lokal 99 reine Tests und Syntax-/Assetprüfung erfolgreich. Browsernachweis siehe docs/TESTING.md. Weitere fachliche Regeln/Quellen und persönliche AfA werden dadurch nicht neu freigegeben.

Browsernachweis der Implementierung: Commit `f34e59de30923ceb0484abce2d291e064c7b5927`, [Actions 39967212316](https://github.com/ieeks/mietklar/actions/runs/39967212316): 99 reine Tests, Syntax-/Asset-/Tarifprüfung und alle 24 Chromium-/WebKit-Fälle ohne Retry erfolgreich. Mobile Quellenzeile visuell geprüft. Native iPhone-Abnahme bleibt offen.
