# mietklar.

**Alpha 0.6 · Stand 19.10.2026**

Welche Hauptmiete brauchst du für deinen Wunschüberschuss – und was bleibt bei einer vorgegebenen Hauptmiete nach Kosten, Rücklage und zusätzlicher Einkommensteuer?

Diese Alpha enthält den gemeinsam abgestimmten geführten Entwurf und einen separat geprüften Rechenkern. Sie ist eine **Bedienungs- und Modellvorschau**, keine vollständige Steuerveranlagung und keine automatische Mietrechtsprüfung. Alle vorausgefüllten Werte sind fiktiv.

## Starten

Voraussetzung: Python 3 für den lokalen Webserver; Node.js ab 22 für Prüfungen. Keine npm-Abhängigkeiten.

```sh
python3 -m http.server 8080
```

Danach `http://localhost:8080` öffnen. HTML nicht direkt als lokale Datei öffnen: Die Tarifdatei wird vom gleichen Webserver geladen.

```sh
npm run check
npm test
```

## Enthalten

- Zwei Rechenrichtungen im geführten Ablauf: Wunschüberschuss → benötigte Hauptmiete oder Hauptmiete → verbleibender Überschuss.
- Negative Ergebnisse im Vorwärtsmodus als notwendiger monatlicher Zuschuss; Rechenrichtung wechseln ohne Eingaben zu löschen.
- Weiterhin fünf Schritte: Ziel/Miete und Einkommen → Wohnungskosten → AfA und Steuerannahmen → Ergebnis → Anschaffung.
- Wortmarke **mietklar.** mit farbigem Punkt; responsive, helle Darstellung mit Terrakotta-Akzent und Home-Button.
- Monatliche Vorschreibung: Betriebskosten, Wasser/Abwasser, Heizung, Warmwasser und separate WEG-Rücklage.
- Pro Position getrennt: Zahlbetrag, erwartete Mietererstattung und angegebener steuerlicher Jahresabzug. Monat/Jahr, volle/teilweise/keine Erstattung, offene Prüfung und optionale Quelle.
- Eigene Positionen hinzufügen/entfernen; eigene Kosten und Garage in einer zusätzlichen Gruppe.
- Mietrechtsszenario und Vertragsstatus mit bedingten Hinweisen; keine automatische Vertragsprüfung.
- Offene Erstattungen und Steuerabzüge werden im Ergebnis einzeln aufgelistet.
- Fiktive Jahresabrechnung als Detailansicht; wird nicht zusätzlich in die laufenden Kosten eingerechnet.
- Einkommensbasis wahlweise KZ 245 mit einmaliger 132-€-Pauschale bzw. höheren darauf anzurechnenden Werbungskosten oder bereits bereinigte Tarifbasis ohne diese Vermietung.
- Bereinigte Tarifbasis wird direkt übernommen; keine weitere Pauschale und keine erneuten Abzüge aus dem anderen Eingabeweg.
- AfA: offen (0 €), bekannter Volljahreswert, eigene Gebäude-Basis/Satz oder Kaufherleitung für erstmalige Vermietung nach Privatnutzung.
- Kaufherleitung ab Kaufjahr 2003: Kaufpreis und Nebenkosten, Grundanteil, reguläre 1,5 % Jahres-AfA. Bedingte Grundanteil-Hilfe mit bewusster Übernahme als Planungsannahme.
- Zwei Zeiträume: volles Vermietungsjahr oder Kalenderjahr 2026 mit Startmonat und ganzen Leerstandsmonaten.
- Kalenderjahr: Hauptmiete und monatliche Erstattungen nur für Mietmonate; monatliche Kosten mit eigenen Zahlungsmonaten, Jahresbeträge unverändert.
- Steuerabzüge im Kalenderjahr separat angeben; keine automatische Übernahme des Volljahresabzugs oder Kürzung nach Belegung.
- Gebäude-AfA im Kalenderjahr offen, eigener Jahresbetrag oder reguläre erste Halb-/Ganzjahres-AfA mit separat angegebenen AfA-Nutzungsmonaten.
- Jahresaufschlüsselung und Kalender-Monatsdurchschnitt; Ziel 1.000 €/Monat bedeutet auch beim Start im Juli 12.000 € Jahresziel.
- Tarif 2026, progressive Zusatzsteuer, vereinfachter Veranlagungsfreibetrag und Rückwärtssuche auf volle Cent.
- Anschaffungsvergleich bei **unveränderter Hauptmiete**, inklusive Jahres-Steuerwirkung und tatsächlichem Geldverbrauch.
- Freiwillige Speicherung in diesem Browser, einschließlich unvollständiger Entwürfe, Rechenrichtung und aktuellem Schritt. Anfangs ausgeschaltet.
- Lokalen Speicherstand löschen, ohne die aktuelle Sitzung zu leeren; versionierte JSON-Sicherung exportieren/importieren und letzten Import rückgängig machen.
- Unlesbare oder nicht unterstützte Speicherstände werden unverändert aufbewahrt und können heruntergeladen werden. Import anderer Steuerjahre wird abgewiesen.
- Separate reine Rechenfunktionen und 68 automatisierte Rechen-/Kostenmodell-/Speichertests.

Details zur Jahresplanung: [Jahresmodell](docs/YEAR_MODEL.md).

## Grenzen dieser Alpha

- **Kein Kredit, ein Eigentümer mit 100 % Anteil.** Kalenderjahr nur als Planmodell ganzer Monate mit gleicher Miete je Mietmonat und Zahlung im selben Jahr. Keine Teilmonate, Mietausfälle, Nachzahlungen oder automatische Abgrenzung am Jahreswechsel.
- **Nur ohne Umsatzsteuer.** Bei unbekanntem oder steuerpflichtigem Status wird kein Ergebnis ausgegeben.
- **Ungeklärter Steuerabzug = vorerst 0 € Abzug**, unabhängig von einer Mietererstattung. Abzüge werden vom Nutzer als geklärt angegeben, nicht von der App geprüft. Akontozahlungen ersetzen keine tatsächliche steuerliche Jahresermittlung.
- Geplanter Kostenersatz wird vollständig als Einnahme erfasst; nur separat eingegebene Abzüge mindern die Steuerbasis. Kein pauschales Neutralisieren von Nebenkosten.
- Bestätigte Jahresabzüge können von den Jahreszahlungen abweichen (z. B. Verteilungsbeträge). Keine automatische Einordnung solcher Beträge, keine Verlustgutschrift.
- KZ-245-Weg ist das einfache aktive Arbeitnehmer-Modell. Höhere Werbungskosten mit Anrechnung auf die Pauschale ersetzen diese; zusätzlich zur Pauschale abziehbare Beträge und andere persönliche Abzüge über eine passend bereinigte Basis berücksichtigen. Negative Gehaltsbasis wird auf 0 begrenzt und als offene Modellgrenze angezeigt.
- Kein vollständiger Lohn-/Steuerbescheid: unter anderem keine einkommensabhängigen Absetzbeträge, Sonderausgaben-Automatik, Familienbonus-Ausschöpfung oder Progressionsvorbehalte. Keine weiteren nicht lohnsteuerpflichtigen Einkünfte im Freibetragsmodell.
- Keine automatische Verlustverwertung; negative Vermietungseinkünfte erzeugen keine Steuererstattung.
- **Offene Gebäude-AfA = 0 €**, kein vorbelegter fiktiver Jahresabzug. Kaufpreis, Grundanteil und Sonderfälle werden nicht aus Dokumenten automatisch bestätigt. Käufe bis 2002, Erbe/Schenkung und frühere Vermietung benötigen einen separat geklärten Jahreswert oder eine Basis.
- Kaufherleitung nur reguläre Gebäude-AfA; keine automatisch beschleunigte AfA oder individuelle Bewertung. Leerstand bestimmt nicht automatisch die AfA-Nutzung. Laufende Fälle/Sonderfälle über einen passend geklärten Jahresbetrag führen.
- Mietrechtliche Hinweise berücksichtigen die gewählte Einordnung und den Vertragsstatus. Ein detaillierter Kostenkatalog, Prüfung der Einordnung und rechtliche Vertragsfreigaben fehlen.
- Speicherung gilt nur für diesen Browser und diese Website-Adresse. Kein automatischer Geräteabgleich, kein PDF-Upload/OCR, keine fertige Druckansicht.
- Speicher-/Importprüfung bestätigt Dateiaufbau und zulässige Feldtypen, keine fachliche Richtigkeit. Leere oder negative Entwurfswerte bleiben erhalten; die normale Rechenprüfung entscheidet über das Ergebnis.
- Manueller iPhone-/Safari-Bedienungstest der Alpha 0.1 vom Nutzer am 19.10.2026 bestätigt. Speichern/Sicherung wurde vom Nutzer am 19.10.2026 abgenommen. Die neue Jahresplanung benötigt noch einen eigenen Safari-Durchgang; die übrigen Detailprüfungen stehen in docs/TESTING.md. Kein automatisierter Browser-End-to-End-Test in dieser Arbeitsumgebung.

## Eingaben behalten

Sicherungen aus Alpha 0.5 werden geprüft übernommen; alle alten Werte bleiben erhalten und starten weiter in der Volljahresplanung. Neue Jahresfelder werden ergänzt.

Oben **Speichern & Sicherung** aufklappen. „Eingaben in diesem Browser merken“ schaltet die lokale Speicherung ein. Nach Änderungen wird der Stand kurz verzögert gespeichert und beim nächsten Öffnen wiederhergestellt. Ausschalten oder „Lokale Speicherung löschen“ entfernt diese Kopie; die gerade sichtbaren Eingaben bleiben bestehen.

Export und Import funktionieren auch bei ausgeschalteter Speicherung. Eine Sicherungsdatei enthält persönliche Eingaben wie Gehalt, Kosten und AfA im lesbaren JSON-Format. Ein Import schaltet die Speicherung nicht von selbst ein. Ergebnisse und Tarifsätze werden nicht aus der Datei übernommen, sondern neu berechnet. Einzelheiten und Wiederherstellung: [Speicherformat](docs/STORAGE.md).

Die App überträgt Formulareingaben nicht an einen Server. Freiwillig gespeicherte Daten sind unverschlüsselt in den Website-Daten dieses Browsers abgelegt. Sicherungsdateien entsprechend aufbewahren. Website-Daten löschen, privates Surfen oder Browserwechsel können die lokale Kopie entfernen bzw. unzugänglich machen; für einen übertragbaren Stand eine Datei exportieren.

## GitHub Pages

Live-Alpha: https://ieeks.github.io/mietklar/

GitHub Pages ist aktiviert: Deploy from a branch → `main` → `/ (root)`. Die Dateien sind statisch und verwenden relative Pfade. Änderungen auf `main` werden automatisch veröffentlicht.

## Beim nächsten Mal weiterlesen

1. [HANDOVER.md](HANDOVER.md) – Wiederaufnahme, Entscheidungen, Implementierungsstand.
2. [ROADMAP.md](ROADMAP.md) – Reihenfolge bis zur belastbaren ersten Version.
3. [Projektplan](docs/PROJECT_PLAN.md) – Gesamtumfang und fachliches Modell.
4. [Recherche](docs/RESEARCH.md) – Quellen, bedingte Kostenregeln, offene Rechtsfragen.
5. [Prüfungen](docs/TESTING.md) – Nachweise und noch offene Abnahme.

Private Rechnungen, Verträge, Grundbuchauszüge, Adressen, Kontodaten, tatsächliche Gehaltszahlen und persönliche Sicherungsdateien gehören nicht in dieses öffentliche Repository.




