# Jahresplanung ab Alpha 0.6

## Zwei getrennte Planungen

**Volles Vermietungsjahr** behält das bisherige Modell: zwölf Mietmonate und voller Jahres-AfA-Wert. Ungenutzte Kalenderjahresfelder beeinflussen diesen Weg nicht.

**Kalenderjahr 2026** verwendet einen ersten möglichen Mietmonat und die Zahl voller Monate ohne Mieter ab diesem Monat. Laufende Mietverhältnisse beginnen für diese Planung im Jänner. Mietmonate = 13 − Startmonat − Leerstandsmonate. Leerstand darf die verfügbaren Monate nicht überschreiten. Die Monate davor erzeugen ebenfalls keine Hauptmiete. Die App entscheidet nicht, ob sie privat genutzt, zur Vermietung vorbereitet oder anderweitig verwendet wurden.

Gleiche Hauptmiete je vollem Mietmonat und Zahlung im selben Kalenderjahr sind Planannahmen. Keine taggenaue Abrechnung, Mietausfälle, verspäteten/zusätzlichen Zahlungseingänge oder automatische Zuordnung rund um den Jahreswechsel. Das ist eine Kalenderjahresplanung, keine vollständige steuerliche Einnahmen-Ausgaben-Rechnung.

## Drei unabhängige Kostenbeträge

| Größe | Monatliche Position | Jährliche Position |
| --- | --- | --- |
| Zahlung | Zahlbetrag × eigene Zahlungsmonate (0–12, anfangs 12) | Eingegebener Betrag für das ganze Planjahr |
| Mietererstattung | Geplanter voller/teilweiser Monatsbetrag × Mietmonate | Geplanter voller/teilweiser Jahresbetrag, ungekürzt |
| Steuerabzug | Separater geklärter Jahresbetrag oder offen/kein Abzug | Ebenfalls separater Jahresbetrag oder offen/kein Abzug |

Jahresbeträge sind bewusst schon die Summen des betreffenden Kalenderjahrs. Nicht erst einen Volljahresbetrag eingeben und eine weitere Kürzung erwarten. Auch bei null Mietmonaten kann ein ausdrücklich geplanter Jahres-Kostenersatz enthalten sein, etwa ein Ausgleich; er wird nicht automatisch gelöscht. Falls kein solcher Eingang erwartet wird, Erstattung auf „Nichts“ setzen. Solche Einzeljahresbeträge müssen selbst sachgerecht abgegrenzt werden.

Die Steuerwahl der Volljahresplanung bleibt gespeichert, wird aber nicht in die Kalenderjahresplanung kopiert. Neue Jahresabzüge sind zunächst offen = 0 €. Private Kostenanteile und Voraussetzungen für Kosten während Leerstand separat klären. Bloße Rücklageneinzahlungen bleiben ohne Abzug; Puffer läuft bewusst über alle zwölf Kalendermonate. Die Zahlungsmonate erlauben eine eigene Abgrenzung, bestätigen aber keine steuerliche Abzugsfähigkeit.

## Gebäude-AfA

Kalenderjahr hat eine eigene Auswahl: offen (= 0 €), selbst angegebener Betrag für dieses Jahr oder reguläres erstes AfA-Jahr. Der letzte Weg braucht einen geklärten/geschätzten Volljahreswert aus dem vorhandenen Assistenten und **separat** angegebene AfA-Nutzungsmonate: null → null, 1–6 → halb, 7–12 → voll. Mietmonate werden dafür nicht eingesetzt. Die Hilfe im Kauf-Assistenten bleibt Information und steuert die Kalenderjahresrechnung nicht selbst.

Für fortgesetzte Vermietung oder Sonderfälle den passenden Jahresbetrag eingeben. Keine automatische beschleunigte AfA, keine Freigabe der Bemessungsgrundlage oder der Nutzung zur Einkünfteerzielung. Ein eigener Jahresbetrag benötigt keine gültige, ungenutzte Volljahresbasis.

## Ergebnis und Ziel

Jahreserlös = Hauptmiete × Mietmonate + Jahreserstattungen. Vermietungseinkünfte = Jahreserlös − angegebene Kostenabzüge − Jahres-AfA. Zusatzsteuer weiterhin über den vollständigen jährlichen Gehaltstarif berechnen; Gehalt oder Steuer nicht nach Mietmonaten kürzen. Eine mögliche Verlustgutschrift bleibt außerhalb des Modells.

Jahres-Cash = Jahreserlös − Zahlungen/Puffer − zusätzliche Steuer. Monatsüberschuss = Jahres-Cash ÷ **12 Kalendermonate**. Die Hauptmiete gilt dagegen je Mietmonat. Die gemittelten Mietereinnahmen im Ergebnis sind daher nicht einfach die Monatsmiete plus gemittelter Kostenersatz.

Ein Ziel von 1.000 €/Monat ist ein Jahresziel von 12.000 €, auch bei späterem Beginn. Die benötigte Hauptmiete kann dadurch deutlich steigen; keine automatische mietrechtliche Zulässigkeitsprüfung. Bei null Mietmonaten zeigt der Vorwärtsmodus weiter Kosten/Zuschuss, die Rückwärtssuche meldet, dass keine Zielmiete bestimmt werden kann.

Fiktiver Gegenfall: Start Juli, kein weiterer Leerstand, Miete 2.000 €, Kosten 100 € × 12, Erstattung 100 € × 6, geklärter Kostenabzug 600 €, Jahres-AfA 1.200 €, Gehaltsbasis 45.000 €. Hauptmiete 12.000 €, Vermietungseinkünfte 10.800 €, Zusatzsteuer 4.320 €, Jahres-Cash 7.080 €, durchschnittlich 590 €/Monat. Die Ausgaben wurden trotz sechs Mietmonaten nicht pauschal halbiert.

## Speicherung

Schema 2 speichert Zeitraum, Startmonat, Leerstand, Jahres-AfA und je Kostenposition Zahlungsmonate/Jahresabzug zusätzlich. Gültige Schema-1-Sicherungen werden strikt geprüft und um sichere Defaults ergänzt. Alle alten Werte bleiben erhalten, Modus bleibt Volljahr. Keine stille Änderung der bisherigen Rechnung. Einzelheiten: [STORAGE.md](STORAGE.md).
