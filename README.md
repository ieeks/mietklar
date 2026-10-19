# mietklar.

**Alpha 0.7 · Stand 19.10.2026**

Welche Hauptmiete brauchst du für deinen Wunschüberschuss – und was bleibt von einer vorgegebenen Miete nach Zahlungen, Rücklage und zusätzlicher Einkommensteuer?

Live: https://ieeks.github.io/mietklar/

Eine Seite mit Ergebnis oben, Regler plus genauem Zahlenfeld und aufklappbaren Eingaben. Die bisherigen Erklärungen zu Einkommen, Kosten und AfA bleiben erhalten. Alle Startwerte sind fiktiv. Bedienungs- und Modellvorschau, keine vollständige Steuerveranlagung oder automatische Mietrechtsprüfung.

## Starten und prüfen

Statische HTML/CSS/ES-Module, kein Backend, keine Produktionsabhängigkeiten. Node.js ab 22 für Prüfungen. Für einen lokalen Aufruf genügt ein Webserver:

```sh
python3 -m http.server 8080
```

Danach http://localhost:8080 öffnen. Alternativ `node scripts/serve.mjs` und http://127.0.0.1:4173/mietklar/ – diese Variante prüft zugleich den Pages-Unterpfad. Nicht direkt als lokale HTML-Datei öffnen, da die Tarifdatei geladen wird.

```sh
npm run check
npm test
```

Die Syntaxprüfung findet JavaScript-Dateien automatisch. 80 reine Rechen-, Kosten-, AfA-, Jahres-, Speicher- und Szenariotests, einschließlich 3.000 deterministischer Zielmietfälle. Für die zusätzlichen Browserprüfungen ist Playwright ausschließlich als Entwicklungsabhängigkeit enthalten:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

GitHub Actions prüft Syntax und Rechenfälle sowie acht Bedienungsfälle in Chromium und WebKit. Nachweise und verbleibende manuelle Abnahme: [TESTING.md](docs/TESTING.md).

## Bedienung

- Oben zwischen **Wunschbetrag** und **Miete vorgeben** wechseln. Regler und Zahlenfeld steuern dieselbe Berechnung. Centbeträge im Zahlenfeld möglich; der Regler verändert ganze Euro. Größere Zahlenwerte erweitern den Reglerbereich.
- Kosten, Rücklage/Puffer, zusätzliche Steuer und Überschuss stammen aus dem Rechenkern. Die Grafik verwendet gesamte Mietereinnahmen einschließlich Kostenersatz, durchgehend als Jahresdurchschnitt ÷ 12. Bei einem Defizit zeigt sie Ausgaben und zusätzlichen Finanzierungsbedarf; keinen positiven Überschuss.
- Einkommen, Kosten, Gebäude-AfA/USt, Zeitraum, optionalen m²-Vergleich und Anschaffungen aufklappen. Zusammenfassungen bleiben im eingeklappten Zustand sichtbar. Die Wortmarke springt zum Ergebnis und behält Eingaben.
- Komma oder Punkt als Dezimaltrennzeichen verwenden: `1400,50` oder `1400.50`. Deutsche Gruppierung mit Komma ist möglich: `45.000,00`. Mehrdeutige reine Punktangaben wie `45.000` werden zur Klärung zurückgewiesen, damit daraus nicht still 45 € oder 45.000 € werden.
- Optional Wohnfläche und eigenen Vergleichswert pro m² eingeben. Oberhalb dieses Werts erscheint ein Hinweis. Keine gesetzliche Mietpreisgrenze, keine automatische mietrechtliche Freigabe.
- **Drucken / PDF** öffnet den Browser-Druckdialog. Das Ergebnisblatt enthält aktuellen Jahressaldo, Miete, Einkommensbasis, Kosten-/Steuerbeträge und offene Annahmen. Die App-Bedienelemente werden ausgeblendet. Bei ungültigen Eingaben oder unpassendem USt-Status wird kein veraltetes Ergebnisblatt ausgegeben. Anschaffungen bleiben ein separater Vergleich.

## Rechenumfang

- Österreichische Dauervermietung, ein Eigentümer mit 100 % Anteil, kein Kredit, ohne USt. Unbekannter/steuerpflichtiger USt-Status unterdrückt Ergebnisse.
- Beide Richtungen verwenden dasselbe Jahresmodell und dieselbe minimale Cent-Miete.
- Typisches Vermietungsjahr mit erwartetem Leerstand: Miete und monatliche Erstattungen nach Mietmonaten; laufende Zahlungen weiterhin zwölf Monate, Jahresabzüge und volle AfA separat. Kein automatischer Abzug allein wegen Leerstands.
- Konkretes Kalenderjahr 2026: erster möglicher Mietmonat und volle Leerstandsmonate; Kosten mit eigenen Zahlungsmonaten, ungekürzte eingegebene Jahresbeträge, getrennte Jahresabzüge und eigene Jahres-AfA-Auswahl. [Jahresmodell](docs/YEAR_MODEL.md).
- Wunschüberschuss ist immer der Durchschnitt über zwölf Kalendermonate. 1.000 €/Monat bedeuten 12.000 € Jahresziel, auch bei spätem Beginn. Hauptmiete gilt je Mietmonat. Bei null Mietmonaten ist der Vorwärtsmodus möglich, eine Zielmiete jedoch nicht bestimmbar.
- Zahlung, erwartete Mietererstattung und angegebener steuerlicher Abzug sind unabhängig. Ungeklärt heißt getrennt 0 € Erstattung bzw. Abzug. Kein pauschales Neutralisieren von Betriebskosten; Kostenersatz zählt als Einnahme. Rücklage/Puffer sind Zahlungen ohne automatischen Abzug, AfA keine erneute Zahlung.
- KZ 245 mit einmal 132 € Pauschale oder höheren darauf anzurechnenden Werbungskosten; alternativ bereits passend bereinigte Gehalts-Tarifbasis ohne diese Vermietung, ohne erneute Abzüge. Zusätzlich zur Pauschale abziehbare Beträge und weitere persönliche Anpassungen über die bereinigte Basis führen. Negative Gehaltsbasis wird mit Hinweis auf 0 begrenzt.
- AfA offen = 0 €, bekannter voller Jahreswert, eigene Gebäudebasis/Satz oder Kaufherleitung ab Kaufjahr 2003 nach ausschließlich privater Nutzung. Grundanteilhilfe nur mit bewusster Übernahme. Kalenderjahres-AfA gesondert: offen, eigener Betrag oder reguläres erstes Halb-/Ganzjahr mit separat angegebenen AfA-Nutzungsmonaten.
- Anschaffungsvergleich hält die Hauptmiete unverändert, berücksichtigt volle Zahlung und tatsächlichen Jahresabzug. Ein Fehler im optionalen Vergleich verdeckt das gültige Miet-Ergebnis nicht.

## Grenzen und offene Prüfung

Keine vollständige persönliche Veranlagung: insbesondere keine automatische Verlustgutschrift, einkommensabhängigen Absetzbeträge, Sonderausgaben, Familienbonus-Ausschöpfung oder Progressionsvorbehalte; Freibetragsmodell nur Gehalt plus eine Vermietung ohne weitere einschlägige Einkünfte. Kleinunternehmerbefreiung bleibt eine Planungsannahme mit separat zu prüfenden Voraussetzungen.

Ganze Monate, gleiche Miete je Mietmonat, Zahlung im selben Jahr. Keine Teilmonate, Mietausfälle, Nachzahlungen oder automatische Abgrenzung rund um den Jahreswechsel. Abzüge, Vermietungsanteile, private Vorperioden, Verteilung und ernsthafte Vermietungsabsicht sind selbst zu klären. Ein Akonto ersetzt keine steuerliche Jahresermittlung. Gebäude-AfA nicht doppelt als Kostenposition erfassen.

Keine automatische Bewertung oder beschleunigte AfA. Ältere Käufe, Erbe/Schenkung und frühere Vermietung benötigen passende gesonderte Werte. Mietrechtliche Einordnung und Kostenüberwälzung werden nicht automatisch bestätigt; Details/Garage bleiben ausbaufähig. Die historische Jahresabrechnung ist nur eine fiktive Zusatzansicht und wird nicht ein zweites Mal eingerechnet.

WebKit-Prüfung ersetzt keinen Test des echten iPhone-/Safari-Datei- oder Druckdialogs. Nutzerabnahme von Speichern/Sicherung der Alpha 0.5 bleibt dokumentiert; die neue Oberfläche benötigt eine eigene Abnahme.

## Eingaben behalten

**Speichern & Sicherung** öffnen und bewusst einschalten; anfangs aus. Auch zulässige unvollständige Zahlenentwürfe bleiben erhalten. Ausschalten/Löschen entfernt nur die eigene lokale Kopie und lässt die aktuelle Sitzung stehen. JSON-Import/-Export funktionieren ohne Opt-in; Import schaltet Speichern nicht ein. Letzten Import innerhalb der Sitzung rückgängig machen.

Format 3 übernimmt geprüfte Sicherungen der Formate 1 und 2. Neue Leerstands-/Vergleichsfelder starten mit 0 bzw. leer. Frühere Werte bleiben inhaltlich erhalten; mehrdeutige alte Dezimalpunkte werden bei Bedarf wertgleich als Dezimalkomma dargestellt. Ergebnisse/Tarife werden nicht importiert, sondern neu berechnet. Unlesbare/unbekannte/fremde Jahresstände bleiben geschützt und herunterladbar. [Speicherformat](docs/STORAGE.md).

Die App überträgt Formulareingaben nicht an einen Server. Die freiwillige lokale Kopie und exportierte Dateien enthalten persönliche Angaben unverschlüsselt. Speicherung gilt für diesen Browser und diese Herkunft; kein Geräteabgleich. Persönliche Sicherungen, echte Gehaltszahlen, Adressen und Originaldokumente gehören nicht ins öffentliche Repo.

## Weiterarbeiten

[HANDOVER.md](HANDOVER.md) · [ROADMAP.md](ROADMAP.md) · [Projektplan](docs/PROJECT_PLAN.md) · [Recherche](docs/RESEARCH.md) · [Review-Follow-up](docs/REVIEW_FOLLOWUP.md)

GitHub Pages veröffentlicht statisch aus `main` und `/ (root)` mit relativen Asset-Pfaden.
