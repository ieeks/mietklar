# Designrichtung

Stand: 18.10.2026, nach Feedback zur ersten Alpha.

- Bestätigt: Wortmarke **mietklar.** mit farbigem Punkt; geführte Bedienung.
- Feedback: Die grünlichen Flächen wirken zu „military“. Gewünscht sind ein helleres, freundlicheres Erscheinungsbild.
- Erste Anpassung: warmer heller Seitenhintergrund, weiße Eingabeflächen, sanfte Apricot-Hinweise, neutrale grau-violette Texte und Terrakotta für Hauptaktionen und Akzentpunkt.
- Die Alpha startet jetzt bewusst hell statt automatisch den dunklen Systemmodus zu übernehmen. Eine optionale dunkle Gestaltung ist noch zu entwerfen.
- Geändert wurde die Farbgebung, nicht die Rechenlogik. Keine abschließende Designabnahme; Abstände, Typografie und Ergebnisdarstellung sind für die nächste gemeinsame Runde offen.

## Farben

| Rolle | Farbe |
| --- | --- |
| Seitenhintergrund | `#fff6f0` |
| App-Oberfläche | `#fffdfa` |
| Eingaben/Karten | `#ffffff` |
| Haupttext | `#34323b` |
| Sekundärtext | `#6f6974` |
| Linien | `#eee3df` |
| Hinweisflächen | `#fff0e5` |
| Hauptaktion/Akzentpunkt | `#b94c30` |

## Noch prüfen

Gemeinsam am iPhone ansehen: Helligkeit, Wärme des Hintergrunds, Kontrast und Lesbarkeit. Der Browser-/Safari-Test steht weiter aus; kein fertiges visuelles Redesign behaupten.

## Darstellungsfehler in eingebetteter Vorschau

Im iPhone-Screenshot waren dunkle Abschnittsflächen und weiße Überschriften innerhalb der hellen App sichtbar. Das deutet auf übernommene Standardstile der Vorschau hin. Ein lokal begrenzter CSS-Grundstil setzt Flächen und Textvererbung im Produkt explizit; die darüberliegenden Komponenten definieren danach ihre eigenen Farben. Die helle Darstellung verwendet `color-scheme: only light`. Die Korrektur ist implementiert, muss auf dem betroffenen iPhone aber noch visuell bestätigt werden. Kein Browser-/Safari-Test in dieser Arbeitsumgebung verfügbar.
