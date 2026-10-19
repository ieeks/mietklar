# mietklar.

**Alpha 0.1 · Stand 19.10.2026**

Welche Hauptmiete ist nötig, damit nach laufenden Kosten, Rücklage und zusätzlicher Einkommensteuer ein gewünschter Monatsbetrag bleibt?

Diese erste Alpha sichert den gemeinsam abgestimmten Entwurf und einen lauffähigen Rechenkern. Sie ist eine **Bedienungs- und Modellvorschau**, keine vollständige Steuerveranlagung und keine automatische Mietrechtsprüfung. Alle vorausgefüllten Werte sind fiktiv.

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

- Geführter Ablauf: Ziel und Einkommen → Wohnungskosten → AfA und Steuerannahmen → Ergebnis → Anschaffung.
- Wortmarke **mietklar.** mit farbigem Punkt; responsive, helle Darstellung mit Terrakotta-Akzent und Home-Button.
- Monatliche Vorschreibung: Betriebskosten, Wasser/Abwasser, Heizung, Warmwasser und separate WEG-Rücklage.
- Weiterverrechnung je Position: voller Betrag, Teilbetrag, selbst getragen oder „noch prüfen“.
- Fiktive Jahresabrechnung als Detailansicht; wird nicht zusätzlich in die laufenden Kosten eingerechnet.
- KZ-245-Eingabe mit beispielhafter Werbungskostenpauschale; AfA direkt oder aus bestätigter Gebäude-Basis und Satz.
- Tarif 2026, progressive Zusatzsteuer, vereinfachter Veranlagungsfreibetrag und Rückwärtssuche auf volle Cent.
- Anschaffungsvergleich bei **unveränderter Hauptmiete**, inklusive Jahres-Steuerwirkung und tatsächlichem Geldverbrauch.
- Separate reine Rechenfunktionen und 11 automatisierte Tests.

## Grenzen dieser Alpha

- **Nur 12 vermietete Monate, kein Kredit, ein Eigentümer mit 100 % Anteil.**
- **Nur ohne Umsatzsteuer.** Bei unbekanntem oder steuerpflichtigem Status wird kein Ergebnis ausgegeben.
- Laufende Kosten werden im Modell als sofort steuerlich abzugsfähig angenommen. „Noch prüfen“ verhindert ihre Weiterverrechnung, bestätigt aber **nicht** den Steuerabzug. Diese beiden Entscheidungen müssen in der nächsten Version getrennt werden.
- Kein vollständiger Lohn-/Steuerbescheid: unter anderem keine einkommensabhängigen Absetzbeträge, Sonderausgaben-Automatik, Familienbonus-Ausschöpfung oder Progressionsvorbehalte. Keine weiteren nicht lohnsteuerpflichtigen Einkünfte im Freibetragsmodell.
- Keine automatische Verlustverwertung; negative Vermietungseinkünfte erzeugen keine Steuererstattung.
- Mietrechts- und Vertragsprüfung ist dokumentiert, aber noch nicht als Regelwerk implementiert.
- Keine Speicherung, kein PDF-Upload/OCR, kein Import/Export, keine fertige Druckansicht.
- Manueller iPhone-/Safari-Bedienungstest vom Nutzer am 19.10.2026 bestätigt. Kein automatisierter Browser-End-to-End-Test in dieser Arbeitsumgebung.

## GitHub Pages

Live-Alpha: https://ieeks.github.io/mietklar/

GitHub Pages ist aktiviert: Deploy from a branch → `main` → `/ (root)`. Die Dateien sind statisch und verwenden relative Pfade. Änderungen auf `main` werden automatisch veröffentlicht.

## Beim nächsten Mal weiterlesen

1. [HANDOVER.md](HANDOVER.md) – Wiederaufnahme, Entscheidungen, Implementierungsstand.
2. [ROADMAP.md](ROADMAP.md) – Reihenfolge bis zur belastbaren ersten Version.
3. [Projektplan](docs/PROJECT_PLAN.md) – Gesamtumfang und fachliches Modell.
4. [Recherche](docs/RESEARCH.md) – Quellen, bedingte Kostenregeln, offene Rechtsfragen.
5. [Prüfungen](docs/TESTING.md) – Nachweise und noch offene Abnahme.

Private Rechnungen, Verträge, Grundbuchauszüge, Adressen, Kontodaten und tatsächliche Gehaltszahlen gehören nicht in dieses öffentliche Repository. Eingaben werden aktuell ausschließlich im Arbeitsspeicher des Browsers gehalten.
