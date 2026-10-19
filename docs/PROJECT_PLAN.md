# Gesamtplan

Stand 19.10.2026. Das ist die textuelle Projektgrundlage; Implementierungsstand und Abweichungen stehen im HANDOVER.

## Produkt

Eine kleine österreichische Mietkalkulation: Betrag X monatlich frei verfügbar nach Ausgaben, Steuern und Puffer. Primär Dauervermietung, Eigentum, ohne Kredit. Alle Zahlen transparent, Ergebnisse auf Jahresbasis mit monatlichem Durchschnitt. Hauptmiete, Zusatzkosten und Gesamtzahlung unterscheiden.

## Zielablauf

1. Ziel und Einkommen: gewünschter Monatsbetrag; KZ 245 mit Abzügen oder bestätigte Tarifbasis. Kein fixer Grenzsteuersatz als verlässlicher Hauptmodus.
2. Wohnung: Monatliche Vorschreibung eingeben; BK, Wasser, Heizung, Warmwasser, Rücklage. Einzelpositionen mit Mietererstattung, eigenem Rest und steuerlicher Behandlung. Jahresabrechnung als zusätzliche Detail-/Prüfquelle.
3. AfA/Steuer: vorhandene Jahres-AfA übernehmen oder bei erstmaliger Vermietung nach Privatnutzung aus passenden Erwerbsdaten herleiten. USt- und Mietrechtsszenario sichtbar.
4. Ergebnis: Zielhauptmiete, Gesamtzahlung, Steuerrücklage und verfügbarer Überschuss. Aufschlüsselung und offene Annahmen. Vorwärtsmodus und Ziel-Szenarien ergänzen.
5. Anschaffungsvergleich: Gegenstand, Gesamtpreis, Vermietungsanteil, Zeitpunkt, steuerlicher Jahresabzug; gleiche Miete für Vorher/Nachher.

## Vollständiges Rechenmodell, schrittweise umzusetzen

Alle Werte konsistent auf Jahres- und USt-Basis normalisieren:

- Erlöse = Hauptmiete für vermietete Monate + tatsächlich vereinnahmte Nebenkosten, ohne abzuführende USt.
- Steuerliche Einkünfte = Erlöse minus tatsächlich abzugsfähige Jahreskosten, AfA und bestätigte Verteilungsbeträge.
- Zusätzliche Steuer = Veranlagungsmodell mit Vermietung minus dasselbe Modell ohne Vermietung. Andere Einkünfte und einschlägige Freibeträge gehören jeweils in beide Vergleichsfälle.
- Verfügbares Geld = Erlöse minus echte Zahlungen (inklusive Rücklageneinzahlungen) minus Zusatzsteuer minus zusätzlicher Puffer.
- AfA ist kein erneuter Zahlungsabfluss. Rücklageneinzahlung ist kein automatischer Steuerabzug. Tatsächliche Verwendung aus einer früher gebildeten Rücklage kann steuerlich relevant sein, ohne dass erneut eine Einzahlung erfolgt.
- Zielmiete über monotone Suche bestimmen, auf Cent aufrunden und Zielerreichung anschließend prüfen.

Jahresabrechnung: Tatsächliche Kosten und Vorschreibungen nicht additiv doppelt erfassen. Abrechnungsjahr und Jahr des Zahlungsausgleichs getrennt führen. Einmalige Gutschriften dürfen den nachhaltigen Monatsüberschuss nicht dauerhaft erhöhen. Der Alpha-Fall ohne USt/Leerstand ist eine engere Implementierung, siehe README.

## Anschaffungsfeature

Der Stufenwechsel betrifft nur den übersteigenden Einkommensteil. Keine Aussage „alles wird höher besteuert“. Beispiel: bestätigte Tarifbasis vor Anschaffung 70.865 €, 500 € sofort abziehbare Kosten, keine USt-/Sondereffekte: 240 € Tarifsteuerersparnis, 260 € tatsächliche zusätzliche Belastung. Reiner Mehrsteuereffekt gegenüber 40 % statt 48 % auf diese 500 €: 40 €.

Kauf nur als ohnehin geplantes Szenario vergleichen. Bei mehrjähriger AfA nur den tatsächlichen Jahresabzug berücksichtigen, bei der Liquidität den ganzen Zahlungsbetrag. Kein automatischer Rückwärtslauf, der im Hintergrund die Hauptmiete erhöht, um den Wunschüberschuss trotz Kauf zu erhalten.

## UX-Entscheidungen und offene Punkte

Geführter Ablauf und Akzentpunkt bestätigt. Flexible Einzelpositionen und freiwilliges Speichern/Export sind implementiert. Noch feinzuplanen: Fragefolge zur mietrechtlichen Einordnung, Begriffe/Beispiele pro Kostenposition, Ergebnisdarstellung auf iPhone und detaillierte Steuerhilfen. Die App soll klein und verständlich bleiben.

## Technische Leitplanken

Statische HTML/CSS/JavaScript-Module, gleiche Herkunft für Tarifdatei, relative Pfade für Pages-Unterverzeichnis. Reine Rechenfunktionen, aussagekräftige fachliche Tests, kein Backend für Grundfunktionen. Persönliche Eingaben bleiben lokal; Speicherung erst mit bewusster Auswahl. Kein automatischer Geräteabgleich im ersten Umfang.


Alpha-0.2-Stand: Zahlungsbetrag, erwartete Erstattung und angegebener Jahresabzug sind jetzt unabhängig implementiert. Kosten sind flexibel mit Monat/Jahr erfassbar. Quellen/Status und offene Annahmen werden angezeigt. Der vollständige Jahres-/AfA-/Rechtsassistent bleibt geplant.


Alpha-0.3-Stand: AfA-Hilfe mit vier Eingabewegen, einfacher Kaufherleitung nach Privatnutzung, bedingter Grundanteil-Hilfe und separater regulärer Startjahr-Information. Der Hauptrechner bleibt auf ein volles Vermietungsjahr beschränkt. Weitere Erwerbsarten/Sonder-AfA und die tatsächliche Startjahr-Rechnung sind offen.


Alpha-0.4-Stand: Beide Rechenrichtungen und getrennte Einkommenswege sind implementiert. Fixe Hauptmiete liefert Überschuss oder Zuschuss; bereits bereinigte Gehaltsbasis bleibt ohne erneuten Werbungskostenabzug. Alle weiteren Modellgrenzen gelten in beiden Richtungen identisch.

Alpha-0.5-Stand: Freiwillige lokale Speicherung, Löschen sowie versionierter JSON-Export/-Import mit Rückgängig sind implementiert. Entwürfe bleiben erhalten; Dateiprüfung ersetzt keine fachliche Prüfung. Keine Übernahme gespeicherter Ergebnisse/Tarife und kein automatischer Geräteabgleich. Der nächste größere Rechenblock bleibt Vermietungsbeginn/Leerstand.

