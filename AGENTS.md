# Projektanweisungen

Vor Änderungen README.md, HANDOVER.md und ROADMAP.md lesen. Bei Steuer-/Mietrechtsänderungen zusätzlich docs/RESEARCH.md lesen und primäre Quellen prüfen.

- Kleine statische App, separate reine Rechenlogik; keine unnötigen Frameworks/Backend-Dienste.
- Deutschsprachige UX, geführter Ablauf, Wortmarke mietklar. mit Akzentpunkt erhalten.
- Keine privaten Dokumente/Finanzdaten in dieses öffentliche Repo übernehmen. Nur fiktive Fixtures.
- Cashflow, Mietererstattung und steuerlichen Abzug unabhängig behandeln. „Noch prüfen“ ist keine rechtliche oder steuerliche Freigabe.
- Alpha-Annahmen sichtbar halten. Keine vollständige Steuer-/Rechtsprüfung oder erfolgreichen Browser-/Deployment-Test behaupten, wenn diese nicht durchgeführt wurden.
- Fachliche Änderungen anhand unabhängiger Grenz-/Gegenbeispiele prüfen: npm run check und npm test.
- HANDOVER und ROADMAP nach relevanten Änderungen auf den tatsächlichen Stand aktualisieren.
- Speicherformatänderungen zusätzlich mit docs/STORAGE.md abgleichen. Alte/unlesbare Stände nie stillschweigend löschen oder überschreiben; Migration explizit und geprüft durchführen. Persönliche JSON-Sicherungen nicht ins Repo übernehmen.
- Bei einer Versionsänderung `npm run assets:stamp` ausführen. Browser-Einstieg, Module und Tarifabruf müssen zusammen versioniert werden, damit Pages kein neues HTML mit alten JavaScript-Modulen mischt. `npm run check` prüft diese Zuordnung.

