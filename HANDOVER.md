# Übergabe: mietklar. Alpha 0.5

Stand: 19.10.2026, Europe/Vienna. Nächster Einstieg: README, diese Datei, ROADMAP, docs/RESEARCH lesen. Danach zuerst den aktuellen Branch/Commit prüfen; die nächste Sitzung nicht aus dem Gesprächsgedächtnis rekonstruieren.

## Ziel und bestätigte Entscheidungen

- Österreichische Dauervermietung, Eigentumswohnung, kein Kredit.
- Der AfA-Assistent berücksichtigt das Szenario „bisher ausschließlich privat genutzt, erstmalige Vermietung“; keine bestehende Vermietungs-AfA voraussetzen. Ein individueller AfA-Jahreswert ist noch nicht ermittelt.
- Als gewünschte Planungsannahme Kleinunternehmerbefreiung verwenden (ohne Ausgangs-USt und ohne Vorsteuerabzug). Keine bestätigte Statusprüfung: 55.000-€-Grenze unternehmerweit beim selben Unternehmer, relevantes Vorjahr/laufendes Jahr und ein möglicher bindender Verzicht bleiben zu prüfen.
- Wunschbetrag X ist **frei verfügbares Geld nach Kosten, zusätzlicher Einkommensteuer und gewähltem Puffer**. Monatszahl ist ein Jahresdurchschnitt, keine Garantie gleichbleibender Zahlungseingänge.
- Beide Rechenrichtungen implementiert: gewünschter Monatsüberschuss → benötigte Hauptmiete und vorgegebene Hauptmiete → verbleibender Monatsüberschuss. Geführter Ablauf bleibt erhalten; Eingaben bleiben beim Wechsel bestehen.
- **Geführte Bedienung** wurde gegenüber Kompakt gewählt, damit Wohnungskosten, AfA und BK erklärt werden können.
- Name **mietklar.** und Akzentpunkt ausdrücklich beibehalten. Neue Designvorgabe: heller und freundlicher; grün-/olivlastige Flächen wurden als zu „military“ empfunden. Aktueller Entwurf mit warmem Weiß, Apricot-Flächen und Terrakotta-Akzent. Helle Darstellung zunächst als Standard; visueller Feinschliff und eine bewusst gestaltete optionale dunkle Variante bleiben offen. Siehe docs/DESIGN.md.
- Aktuelle Vorschreibung zuerst, aufklappbare Jahresabrechnung dahinter. Mehr Detail nur bei Bedarf.
- Der User hat `ieeks/mietklar` angelegt. Öffentliches Repo, `main`; GitHub-Zugriff wurde geprüft.
- Gewünschter Abschluss dieser Sitzung: aktuellen Stand als Alpha sichern und so dokumentieren, dass nahtlos weitergearbeitet werden kann. Keine Behauptung einer produktionsreifen Lösung.

## Was tatsächlich implementiert ist

Statische App mit fünf Schritten, heller Darstellung und Home-Button über die Wortmarke. Alpha 0.2 ergänzt dynamische Kostenkarten mit Monats-/Jahreszahlung, voller/teilweiser/keiner/ungeklärter Erstattung, eigener Steuerentscheidung und optionaler Quelle. Eigene Positionen sind hinzufügbar und entfernbar. Die Steuerdetails sind aufklappbar. „Geklärt“ ist die Angabe des Nutzers, keine Bestätigung der App.

`src/costs.js`: reine Normalisierung je Position und Aggregation. Ungeklärte Erstattung = 0 € Einnahme, ungeklärter Steuerabzug = 0 € Abzug. Zahlung bleibt vollständig als Cash-Kosten enthalten. Bekannter Jahresabzug kann separat erfasst werden, auch wenn er von den Zahlungen abweicht. Rücklagen-/Puffereinzahlung bleibt ohne Erstattung/Abzug.

`src/calc.js`: Jahresmodell mit getrennten `annualCashCosts`, `annualReimbursements`, `annualTaxCosts`, `annualAfa`. Mietererstattungen erhöhen Cash-Einnahmen und steuerliche Einnahmen. Keine automatische Neutralisierung gegen eine Ausgabe. 2026-Tarif, vereinfachter Veranlagungsfreibetrag für Gehalt plus eine Vermietung, keine Verlustgutschrift. Zielmiete mit minimaler Cent-Rundung.

`src/ui.js`: offene Positionen im Ergebnis; Mietrechtsszenario/Vertragsstatus beeinflussen erklärende Hinweise, erteilen keine Rechtsfreigabe und ändern nicht automatisch die eingegebene Erstattung. Noch kein Mietvertrag ist der Startwert, Mietrecht startet ungeklärt. Keine persönlichen Objektwerte als Defaults.

`src/planning.js`: gemeinsame Szenarioschnittstelle für beide Richtungen. Ziel-Modus ruft die centgenaue Mietsuche auf, Miet-Modus bewertet exakt die eingegebene Hauptmiete mit demselben Jahresmodell. Keine Zielmietsuche oder automatische Mieterhöhung bei Anschaffungen. Vorwärts-Ergebnis zeigt verfügbaren Betrag oder einen notwendigen Zuschuss; Hauptmiete/Kostenersatz/Gesamtzahlung bleiben getrennt.

Einkommenswege: KZ 245 aus aktiver nichtselbstständiger Arbeit mit einfacher 132-€-Pauschale oder höheren darauf anzurechnenden Werbungskosten; alternativ bereits bereinigte Gehalts-Tarifbasis ohne diese Vermietung. Im direkten Basisweg keine weiteren Abzüge; ungenutzte Felder beeinflussen weder Rechnung noch Validierung. Werbungskosten unter 132 € nutzen im einfachen Modell weiter die Pauschale; höhere Beträge ersetzen sie statt sie zu addieren. Zusätzlich zur Pauschale abziehbare Beträge/weitere persönliche Abzüge sind über eine passend bereinigte Basis zu berücksichtigen. Gehaltsbasis unter 0 wird nicht als Verlustausgleich modelliert, sondern mit Hinweis auf 0 begrenzt.

`src/afa.js`: AfA standardmäßig offen mit 0 €. Vier Wege: offen, bekannter voller Jahreswert, eingegebene Gebäudebasis/Satz, Kaufherleitung. Kaufherleitung für Käufe ab 2003 nach ausschließlich privater Nutzung: historische Kaufkosten plus passende Nebenkosten, Grundanteil abziehen, reguläre Jahres-AfA 1,5 %. Grundanteil muss bewusst als Planannahme oder vom Nutzer geklärter Anteil eingeordnet werden. Kein fiktiver AfA-Wert als Default.

Grundanteil-Hilfe: Bedingungen für 20/30/40 % aus GrundanteilV 2016, gesonderte Nachweise/erhebliche Abweichungen verhindern einen Pauschalvorschlag. Keine automatische Anwendung; ausdrücklicher Übernahme-Button. Änderung der zugrunde liegenden Hilfsangaben setzt einen zuvor übernommenen Vorschlag zurück. Individuell eingegebene Anteile werden nicht automatisch überschrieben.

Reguläre Startjahr-AfA bei 0/1–6/7–12 Nutzungsmonaten = 0/halb/voll. Diese Vorschau ändert **nicht** die Zielmiete für 12 vermietete Monate. Sonder-/beschleunigte AfA wird nicht automatisch berechnet. Gekaufter Altbestand bis 2002, frühere Vermietung und andere Erwerbsarten führen zur separaten Prüfung statt automatischer neuer Basis. Bestätigte Sonderwerte können über Jahreswert/Basis übernommen werden.

`src/persistence.js`: striktes versioniertes Eingabeformat, Dateigröße/Feldtypen/Auswahlen prüfen, keine Ergebnisse oder Tarife speichern. Rohwerte einschließlich leerer und negativer Entwürfe bleiben erhalten; fachliche Prüfung weiter im Rechner. Gleiche Tarifjahre erforderlich. Stabile lokale Kennung `mietklar:saved-inputs`, Schema 1. Format, Grenzen und Migrationsregeln in docs/STORAGE.md.

`src/storage-ui.js`: Opt-in zunächst aus, vorhandener gültiger Speicherstand stellt die frühere Auswahl wieder her. Speichern nach 400 ms sowie bei ausstehender Änderung beim Verlassen/Verbergen der Seite. Aus/Löschen entfernt nur die App-Kennung und lässt aktuelle Eingaben stehen. JSON-Import/-Export auch ohne Speichern; Import übernimmt die aktuelle Speicherwahl, schaltet sie nicht ein. Letzten Import innerhalb der Sitzung rückgängig machen. Vor Übernahme vollständig strukturell prüfen; bei unerwartetem Anwendungsfehler Formular zurücksetzen. Unlesbare/neuere/fremde Jahresstände nicht überschreiben: automatische Speicherung sperren, Original herunterladen oder löschen lassen. Speicherfehler sichtbar melden; keine falsche Erfolgsbestätigung. Änderung in anderem Tab pausiert hier die Speicherung, kein automatischer Geräte-/Tab-Abgleich.

`data/tarif-2026.json`: zentrale Tarifquelle mit Prüfdatum. 52 automatisierte Rechen-/Kosten-/AfA-/Planungs-/Speichertests. Die GitHub-Actions-Prüfung führt Syntax und Tests bei Push/PR aus. Keine neuen Produktionsabhängigkeiten.

## Wichtige Alpha-Annahmen und offene Punkte

1. Nur 12 vermietete Monate, ohne USt, 100 % Eigentümeranteil, kein Kredit. Gehalt wahlweise aus KZ 245 mit einfacher Werbungskostenberücksichtigung oder direkt als bereinigte Tarifbasis ohne diese Vermietung; keine volle persönliche Steuerveranlagung.
2. Zahlungs-/Erstattungsbeträge sind Planwerte, keine abgegrenzte Jahresbuchhaltung. Timing, Leerstand, Jahresausgleich und tatsächlich steuerlich zulässige Kosten werden nicht automatisch ermittelt. Ungeklärte Abzüge nicht mit einer abschließend richtigen Steuerprognose verwechseln.
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

1. Neue Kosten-/AfA-Oberfläche, beide Rechenrichtungen und Speichern auf iPhone/Safari ausprobieren. Insbesondere Neuladen, Export in Dateien, erneuter Import und Ausschalten/Löschen. Der Nutzer hat die Bedienung der vorherigen Alpha 0.1 am 19.10.2026 bestätigt; das ist keine Abnahme der neuen Karten.
2. Detaillierte bedingte Kostenhinweise/Kostenarten ausbauen und Garage fachlich führen. MRG-/Vertragseinordnung nicht automatisch freigeben.
3. Nächster größerer Rechenblock: tatsächliches Vermietungsjahr mit Vermietungsbeginn/Leerstand. Vorher Regeln und Gegenbeispiele festlegen; Zahlung, Ertrag, Steuerabzug und AfA nicht pauschal gemeinsam kürzen. AfA-Sonderfälle und weitere Erwerbsarten nur mit eigenen fachlichen Regeln ausbauen.
4. Persönlichen Fall anhand privater Unterlagen gegenprüfen, ohne Daten zu veröffentlichen. USt-Voraussetzungen separat verifizieren.

GitHub Pages ist aktiviert: https://ieeks.github.io/mietklar/. Änderungen auf main veröffentlichen automatisch.

## Prüfen / weiterentwickeln

```sh
npm run check
npm test
python3 -m http.server 8080
```

Syntax und 52 Rechen-/Kosten-/AfA-/Planungs-/Speichertests erfolgreich. Browser-Rendering der neuen Oberfläche ist nicht bestätigt: Chromium fehlt; früherer Downloadversuch lieferte ein unbrauchbares Archiv. Zusätzlich DOM-Funktionsdurchgänge mit temporärem jsdom, ohne Browser-Rendering; tatsächliche Fälle und Status stehen in docs/TESTING.md. Manueller Safari-Test der vorherigen Version bleibt als historischer Nachweis erhalten.

## Projektpflege

Kleine statische App ohne unnötiges Framework. Keine echten Finanzdaten in Fixtures. Rechenkern und UI getrennt halten. Bei fachlicher Änderung Gegenbeispiele ergänzen. Dokumente nach dem endgültigen Stand umschreiben; ROADMAP erledigte Punkte markieren. Nicht versehentlich persönliche PDFs, OCR-Zwischendateien oder den gesamten Scratch-Ordner committen.




