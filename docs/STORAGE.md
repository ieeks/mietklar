# Eingaben speichern und übertragen

Stand: Alpha 0.6, 19.10.2026. Speichern/Sicherung der Alpha 0.5 wurde vom Nutzer am 19.10.2026 abgenommen. Die neue Jahresplanung verwendet zusätzliche Eingabefelder.

## Bedienung

1. Oben „Speichern & Sicherung“ öffnen und „Eingaben in diesem Browser merken“ bewusst einschalten. Anfangs ist es aus. Ein vorhandener gültiger Speicherstand stellt beim nächsten Öffnen die frühere Auswahl wieder her.
2. Änderungen werden nach 400 ms gespeichert. Ein noch ausstehender Speichervorgang wird beim Verlassen bzw. Verbergen der Seite angestoßen. Das ersetzt keine separate Sicherungsdatei bei Browser-/Geräteverlust.
3. Ausschalten oder „Lokale Speicherung löschen“ entfernt die gespeicherte Kopie und beendet weitere automatische Speicherung. Die laufende Sitzung bleibt erhalten. Nur die eigene App-Kennung wird entfernt.
4. Export lädt eine JSON-Datei mit dem aktuellen Eingabestand herunter. Import liest eine solche Datei und berechnet Ergebnisse neu. Beides funktioniert bei ausgeschalteter Speicherung; Import erteilt keine neue Speicherzustimmung.
5. „Letzten Import rückgängig machen“ stellt den Stand unmittelbar vor dem letzten erfolgreichen Import wieder her. Bei eingeschalteter Speicherung wird auch dieser Stand gespeichert. Rückgängig steht nur in der aktuellen Sitzung zur Verfügung.

Die Dateien enthalten Gehalt, Kosten, AfA und Freitextangaben im Klartext. Auch der Browserstand ist unverschlüsselt. Keine persönlichen Sicherungen ins öffentliche Repository laden. Die App sendet die Formulareingaben nicht an einen Server und synchronisiert keine Geräte. Lokale Website-Daten sind an Browser und Herkunft gebunden; GitHub Pages teilt eine Herkunft mit anderen Seiten desselben `ieeks.github.io`-Hosts. Die App nutzt keine fremden Laufzeitskripte. Für stärkere Isolation später eine eigene Herkunft prüfen.

## Format 2 und Übernahme von Format 1

Lokale Kennung: `mietklar:saved-inputs`. Eine stabile Kennung ermöglicht es, einen unbekannten älteren/neuen Stand zu erkennen, statt ihn durch neue Defaults zu ersetzen.

| Schlüssel | Inhalt |
| --- | --- |
| `app` | Exakt `mietklar` |
| `schemaVersion` | Ganzzahl `2`; vorhandenes Format `1` wird geprüft migriert |
| `tariffYear` | Gleich dem Tarifjahr der geöffneten App, derzeit `2026` |
| `savedAt` | Kanonischer UTC-Zeitstempel mit Millisekunden |
| `state.fields` | Vollständige erlaubte `data-key`-Felder als rohe Zeichenketten, jetzt auch `periodMode`, `startMonth`, `vacantMonths`, `yearAfaMode`, `yearAfa`, `yearAfaMonths` |
| `state.costs` | Kostenkarten mit Name, Zahlbetrag, Zeitraum, Erstattung, Steuerwahl/-betrag, Quelle, Art und Gruppe; zusätzlich `paymentMonths`, `yearTaxStatus`, `yearTaxAnnual` |
| `state.calculationMode` | `target` oder `rent` |
| `state.step` | Ganzzahl von `0` bis `4` |
| `state.adoptedLandSuggestion` | Wahrheitswert zur Herkunft des bewusst übernommenen Grundanteils |

Kein gespeicherter Tarif, Ergebniswert, HTML oder ausführbarer Code. Die Feldliste und Auswahlen sind in `src/persistence.js` pro Version festgelegt. Unbekannte/fehlende Schlüssel werden auf jeder Ebene abgewiesen; nur neue erlaubte Objekte werden aufgebaut. Texte werden durch die UI als Text bzw. Feldwert verwendet.

Gültiges Format 1: zunächst vollständig gegen die damalige Feldliste prüfen, dann unverändert alle alten Werte kopieren und Defaults ergänzen: Volljahresmodus, Start Jänner, Leerstand 0, Jahres-AfA offen/0, AfA-Nutzungsmonate offen. Pro Position Zahlungsmonate 12 und Jahresabzug offen/0; Rücklage zwingend ohne Jahresabzug. Übernahmehinweis wird angezeigt. Laden allein schreibt die alte lokale Kopie nicht um. Die nächste bewusste Änderung mit eingeschalteter Speicherung sowie neuer Export verwenden Format 2. Ältere Dateien können weiterhin importiert werden; fehlerhafte oder gemischte Versionsformate werden nicht still repariert. Werte und Ergebnis der bisherigen Volljahresplanung bleiben erhalten.

Maximal 256 KiB UTF-8 und 100 Kostenpositionen. Texte sind feldweise begrenzt; numerische Rohwerte maximal 64 Zeichen, endlich und im Betrag höchstens 10¹². Auswahlwerte, Schritt und Rücklagenstatus müssen passen. Ein als übernommen markierter Grundanteil muss den zugehörigen Hilfsangaben entsprechen, damit die spätere Invalidierung weiter funktioniert.

**Entwürfe sind erlaubt.** Leere Felder, negative Zahlen oder fachlich unpassende Teilbeträge dürfen gespeichert sein. Die Strukturprüfung verhindert eine unbrauchbare Datei, bestätigt jedoch keine Steuer-/Mietrechtsangabe. Nach dem Laden prüft die normale aktive Rechenroute die Werte; bei ungültigen aktiven Eingaben wird kein Rechenergebnis gezeigt. Offene AfA/USt folgen weiterhin den bestehenden Alpha-Regeln.

## Fehler, andere Tabs und Wiederherstellung

- Datei vollständig lesen und prüfen, bevor Felder ersetzt werden. Fehlerhafte Importe verändern den aktuellen Stand nicht. Bei unerwartetem Fehler während der Übernahme vorherige Eingaben zurücksetzen.
- Speicherzugriff kann gesperrt oder voll sein. Dann klare Fehlermeldung; aktuelle Sitzung bleibt erhalten und Dateiexport ist weiterhin möglich. Letzten erfolgreichen Speicherzeitpunkt anzeigen, wenn bekannt.
- Unbekannte Schemaversion, anderes Steuerjahr oder beschädigten Browserstand unverändert behalten. Automatisches Überschreiben sperren. Original über „Nicht geladenen Speicherstand herunterladen“ retten; erst danach bei Bedarf bewusst lokal löschen.
- Bei einer Speicheränderung in einem anderen Tab hier automatische Schreibvorgänge stoppen. Aktuelle Sitzung behalten. Zum Laden neu öffnen, zum bewussten Ersetzen erneut einschalten. Ein unlesbarer anderer Stand bleibt ebenfalls geschützt. Keine vollständige Mehrtab-Synchronisierung oder Transaktionssperre.
- Lokales Löschen entfernt keine bereits exportierten Dateien. Umgekehrt aktiviert eine importierte Datei keine automatische Speicherung.

## Künftige Änderungen

Schema bei inkompatiblen Änderungen erhöhen. Eine Migration muss alte Werte explizit zuordnen und mit echten Grenzfällen getestet werden. Kein stilles Entfernen unbekannter Felder, kein Löschen unbekannter Versionen, kein Übernehmen fremder Tarife. Bei einer späteren anderen Steuerjahres-App Daten nur mit ausdrücklicher Jahreszuordnung übertragen.
