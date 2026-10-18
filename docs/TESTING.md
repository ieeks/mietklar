# Prüfung des Alpha-Checkpoints

Stand 18.10.2026.

## Erfolgreich lokal ausgeführt

- `npm run check`: Syntax von UI und Rechenkern.
- `npm test`: 11 Tests bestanden.
- HTML-Struktur/IDs/Felder und fiktive Beispieldaten statisch geprüft.
- Vor Upload: keine privaten Dokumente, Namen, Adressen, IBANs oder tatsächlichen Dokumentbeträge in den veröffentlichten Dateien.

## Rechenfälle

1. Jede Tarifgrenze 2026: darunter, genau darauf, darüber; Stetigkeit und jeweiliger Grenzsatz.
2. 65.000 € Basis + 12.000 € Vermietung → 5.330,80 € zusätzliche Tarifsteuer.
3. Veranlagungsfreibetrag bei 730/1.000/1.460 €; negative Vermietung ohne automatische Steuergutschrift.
4. 45.000 € Basis, 3.600 € zahlungswirksame/abzugsfähige Jahreskosten, 2.400 € AfA, 1.000 € Monatsziel → minimale Hauptmiete 1.833,34 €.
5. Rücklagenerhöhung beeinflusst Cashflow, nicht automatisch Steuerabzug.
6. AfA senkt Steuer ohne erneuten Zahlungsabfluss.
7. 500 € abzugsfähiger Kauf an der 48-%-Grenze → 240 € Steuerersparnis und 260 € Belastung.
8. 2.000 € Kauf, nur 200 € Jahresabzug → voller Zahlungsabfluss, nur 80 € Steuerwirkung bei 40 %.
9. Mehrere Ausgaben über Tarifgrenzen gemeinsam neu berechnen.
10. Ungültige Werte und fehlerhafte Tarifdateien abweisen.
11. Zielsuche über mehrere Einkommens-/Zielkombinationen mit Cent-Minimalitätsprüfung.

## Nicht durchgeführt / noch offen

- Kein Browserlauf: das Playwright-Modul war vorhanden, aber kein ausführbarer Chromium-Browser installiert. Keine Aussage über bestandene End-to-End-Tests.
- iPhone/Safari, Tastatur/Fokus, Layout bei 320 px, native deutsche Dezimaleingaben und Fehlermeldungen testen.
- Zeitpunkte/Abfluss, Leerstand, mehrere Eigentümer, USt/Vorsteuer und vollständige steuerliche Veranlagung sind noch nicht implementiert und daher nicht von den Tests abgedeckt.
- Workflow-Datei bereitgestellt; ein lokales Bestehen ist noch kein Nachweis eines erfolgreichen GitHub-Actions-Laufs.
- Pages-Konfiguration/Live-Erreichbarkeit noch nicht geprüft oder aktiviert.
