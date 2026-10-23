# mietklar.

**Alpha 0.8.0-alpha.3 · Stand 23.10.2026**

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

Die Syntaxprüfung findet JavaScript-Dateien automatisch und prüft konsistente Asset-Versionen sowie die aktive Tarifdatei. 107 reine Rechen-, Kosten-, AfA-, Jahres-, Speicher-, Tarif- und Szenariotests, einschließlich 3.000 deterministischer Zielmietfälle. Für die zusätzlichen Browserprüfungen ist Playwright ausschließlich als Entwicklungsabhängigkeit enthalten:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

GitHub Actions prüft Syntax und Rechenfälle sowie dreizehn Bedienungsfälle in Chromium und WebKit. Nachweise und verbleibende manuelle Abnahme: [TESTING.md](docs/TESTING.md).

## Tarifjahr und Quelle

`src/tariff.js` wählt einmalig `data/tarif-2026.json`. Tarifjahr, BMF-Link und Prüfdatum stammen aus dieser Datei. Jahresangaben in Oberfläche, Kalenderplanung, AfA-Kaufjahresgrenze, Sicherungen und Druckblatt verwenden dasselbe Jahr. Unter dem Ergebnis und im PDF stehen Tarifjahr, verlinkte Quelle und das dokumentierte Prüfdatum. Der bestehende Quellenstand bleibt 18.10.2026; das Datum des technischen Umbaus ist keine neue fachliche Quellenprüfung.

Für ein neues Jahr zuerst eine fachlich geprüfte `data/tarif-JJJJ.json` mit `year`, `source`, `sourceLabel`, `checkedAt`, `brackets` und den geprüften `employeeSupplement`-Parametern ergänzen. Dann ausschließlich die Tarifdatei in `src/tariff.js` umstellen, Paketversion erhöhen, `npm run assets:stamp`, `npm run check`, `npm test` und Browserprüfungen ausführen. Historische Referenztests behalten ihre geprüften Jahrestarife. Kein automatisches Umschalten nach Systemdatum. Abweichendes Dateijahr oder ungültige Quellenangaben verhindern den Start. Sicherungen anderer Jahre bleiben geschützt; die Fehlermeldung nennt beide Jahre. Speicherformat bleibt 4. Weitere fachliche Regeln und deren Quellen sind vor einer neuen Jahresfreigabe weiterhin zu prüfen.

## Bedienung

- Oben zwischen **Wunschbetrag** und **Miete vorgeben** wechseln. Regler und Zahlenfeld steuern dieselbe Berechnung. Centbeträge im Zahlenfeld möglich; der Regler verändert ganze Euro. Größere Zahlenwerte erweitern den Reglerbereich.
- Kosten, Rücklage/Puffer, zusätzliche Steuer und Überschuss stammen aus dem Rechenkern. Die Grafik verwendet gesamte Mietereinnahmen einschließlich Kostenersatz, durchgehend als Jahresdurchschnitt ÷ 12. Bei einem Defizit zeigt sie Ausgaben und zusätzlichen Finanzierungsbedarf; keinen positiven Überschuss.
- Einkommen, Kosten, Gebäude-AfA/USt, Zeitraum, optionalen m²-Vergleich und Anschaffungen aufklappen. Zusammenfassungen bleiben im eingeklappten Zustand sichtbar. Die Wortmarke springt zum Ergebnis und behält Eingaben. **Alles zuklappen** bleibt beim Scrollen über den Bereichen erreichbar und schließt auch untergeordnete Hilfen und Speichern/Sicherung. Eingaben und Ergebnis bleiben erhalten.
- Geldfelder zeigen außerhalb der Bearbeitung Tausenderpunkte und mindestens zwei Nachkommastellen. Beim Bearbeiten erscheinen die ursprünglichen Stellen ohne Gruppierung; eine vorbelegte Null wird zum Überschreiben markiert. Zusätzliche Dezimalstellen bleiben erhalten. Anzeigeformat und gespeicherter Rohwert sind getrennt.
- Komma oder Punkt als Dezimaltrennzeichen verwenden: `1400,50` oder `1400.50`. Deutsche Gruppierung mit Komma ist möglich: `45.000,00`. Mehrdeutige reine Punktangaben wie `45.000` werden zur Klärung zurückgewiesen, damit daraus nicht still 45 € oder 45.000 € werden.
- Bei noch offener AfA steht der konkrete fehlende Schritt direkt an der Summe. Vorläufige 0 € werden als „AfA noch offen“ bezeichnet; ein tatsächlich eingegebener oder berechneter Nullbetrag erhält keinen Offen-Hinweis.
- Optional Wohnfläche und eigenen Vergleichswert pro m² eingeben. Oberhalb dieses Werts erscheint ein Hinweis. Keine gesetzliche Mietpreisgrenze, keine automatische mietrechtliche Freigabe.
- **Drucken / PDF** öffnet den Browser-Druckdialog. Das Ergebnisblatt enthält aktuellen Jahressaldo, Miete, Einkommensbasis, Kosten-/Steuerbeträge und offene Annahmen. Die App-Bedienelemente werden ausgeblendet. Bei ungültigen Eingaben oder unpassendem USt-Status wird kein veraltetes Ergebnisblatt ausgegeben. Anschaffungen bleiben ein separater Vergleich.

## Kostenpositionen prüfen · Alpha 0.8

Jede Karte hat eine optionale vierteilige Prüfhilfe: enthaltene Leistungen/Kostenart, geerbte Mietrechts-Einordnung, Vereinbarung zur Weiterverrechnung und unabhängiger Steuerabzug. Der nächste Schritt steht bereits auf der geschlossenen Karte. 18 Kostenarten einschließlich Versicherung, Wartung, Bewachung, Anlagen-Notruf und Garage geben bedingte Hinweise mit Primärquellen und Prüfdatum. Kategorien sind keine Rechtsfreigabe.

Bei neuen Positionen zuerst die Kostenart wählen. Beim Aufteilen eines Akontos den Sammelbetrag reduzieren, um Doppelzählung zu vermeiden. Vereinbarungsstatus und Beschreibung werden gespeichert. Geplanter Kostenersatz trotz offener oder widersprüchlicher Grundlage wird auf Karte, im Ergebnis und im Druckblatt ausgewiesen; deine eingegebene Planung bleibt rechnerisch erhalten. Rücklageneinzahlungen bleiben gesperrt für Erstattung/Abzug. Tatsächliche Fondsarbeiten können nach gesonderter Prüfung einen Jahresabzug begründen, ohne denselben Geldabfluss nochmals als neue Zahlung anzusetzen.

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

## Zuschlag zum Verkehrsabsetzbetrag ab 0.8.0-alpha.3

Im Arbeitnehmermodell wird die Minderung des Zuschlags automatisch in der zusätzlichen Steuer berücksichtigt. Der Rechner vergleicht den Zuschlag vor und nach Hinzurechnung der positiven Vermietungseinkünfte, nach Kosten/AfA und begrenztem Veranlagungsfreibetrag. Die Tarifdatei enthält Maximum und beide Einkommensgrenzen. Beide Rechenrichtungen, der Anschaffungsvergleich und das Druckblatt verwenden dieselbe Korrektur. Bei einem Verlust des Zuschlags erscheint eine kurze Erklärung unter dem Ergebnis; der Betrag ist bereits in der Steuer enthalten und wird nicht nochmals abgezogen.

Beide Einkommenswege setzen aktive Arbeitnehmertätigkeit und einen Anspruch auf den Zuschlag im vereinfachten Modell voraus. Eine tatsächlich auszahlbare SV-Rückerstattung einschließlich Begrenzungen wird nicht ermittelt. Ebenso fehlen Familienbonus und weitere persönliche Steuerwirkungen. Deshalb ist das keine vollständige Veranlagung, insbesondere bei niedrigen Einkommen oder weiteren Entlastungen. Kein zusätzliches Eingabefeld; gespeicherte Angaben bleiben im Format 4 und werden mit der ergänzten Formel neu berechnet.

## Grenzen und offene Prüfung

Keine vollständige persönliche Veranlagung: insbesondere keine automatische Verlustgutschrift, sonstigen einkommensabhängigen Absetzbeträge, Sonderausgaben, Familienbonus-Ausschöpfung oder Progressionsvorbehalte; Freibetragsmodell nur Gehalt plus eine Vermietung ohne weitere einschlägige Einkünfte. Kleinunternehmerbefreiung bleibt eine Planungsannahme mit separat zu prüfenden Voraussetzungen.

Ganze Monate, gleiche Miete je Mietmonat, Zahlung im selben Jahr. Keine Teilmonate, Mietausfälle, Nachzahlungen oder automatische Abgrenzung rund um den Jahreswechsel. Abzüge, Vermietungsanteile, private Vorperioden, Verteilung und ernsthafte Vermietungsabsicht sind selbst zu klären. Ein Akonto ersetzt keine steuerliche Jahresermittlung. Gebäude-AfA nicht doppelt als Kostenposition erfassen.

Keine automatische Bewertung oder beschleunigte AfA. Ältere Käufe, Erbe/Schenkung und frühere Vermietung benötigen passende gesonderte Werte. Mietrechtliche Einordnung und Kostenüberwälzung werden nicht automatisch bestätigt; Die bedingte Prüfhilfe ersetzt keine Prüfung des konkreten Vertrags oder einzelner Belege. Die historische Jahresabrechnung ist nur eine fiktive Zusatzansicht und wird nicht ein zweites Mal eingerechnet.

WebKit-Prüfung ersetzt keinen Test des echten iPhone-/Safari-Datei- oder Druckdialogs. Nutzerabnahme von Speichern/Sicherung der Alpha 0.5 bleibt dokumentiert; die neue Oberfläche benötigt eine eigene Abnahme.

## Eingaben behalten

**Speichern & Sicherung** öffnen und bewusst einschalten; anfangs aus. Auch zulässige unvollständige Zahlenentwürfe bleiben erhalten. Ausschalten/Löschen entfernt nur die eigene lokale Kopie und lässt die aktuelle Sitzung stehen. JSON-Import/-Export funktionieren ohne Opt-in; Import schaltet Speichern nicht ein. Letzten Import innerhalb der Sitzung rückgängig machen.

Format 4 übernimmt geprüfte Sicherungen der Formate 1, 2 und 3. Neue Kosten-Prüffelder starten leer bzw. mit „Noch prüfen“; keine frühere Vereinbarung wird automatisch bestätigt. Neue Leerstands-/Vergleichsfelder starten mit 0 bzw. leer. Frühere Werte bleiben inhaltlich erhalten; mehrdeutige alte Dezimalpunkte werden bei Bedarf wertgleich als Dezimalkomma dargestellt. Ergebnisse/Tarife werden nicht importiert, sondern neu berechnet. Unlesbare/unbekannte/fremde Jahresstände bleiben geschützt und herunterladbar. [Speicherformat](docs/STORAGE.md).

Die App überträgt Formulareingaben nicht an einen Server. Die freiwillige lokale Kopie und exportierte Dateien enthalten persönliche Angaben unverschlüsselt. Speicherung gilt für diesen Browser und diese Herkunft; kein Geräteabgleich. Persönliche Sicherungen, echte Gehaltszahlen, Adressen und Originaldokumente gehören nicht ins öffentliche Repo.

## Weiterarbeiten

[HANDOVER.md](HANDOVER.md) · [ROADMAP.md](ROADMAP.md) · [Projektplan](docs/PROJECT_PLAN.md) · [Recherche](docs/RESEARCH.md) · [Review-Follow-up](docs/REVIEW_FOLLOWUP.md)

GitHub Pages veröffentlicht statisch aus `main` und `/ (root)` mit relativen Asset-Pfaden.

Bei einer neuen Paketversion vor Veröffentlichung `npm run assets:stamp` ausführen. Alle Browsermodule, Stylesheet und Tarifabruf werden passend versioniert; die Prüfung verhindert gemischte alte/neue Dateien aus dem Browsercache.


