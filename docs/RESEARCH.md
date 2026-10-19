# Recherche und fachliche Annahmen

Stand: 19.10.2026. Quellen sind Ausgangspunkte; ein Kontoname und ein Baujahr ersetzen keine Einzelfallprüfung. Zuordnungsvorschläge später mit Bedingung, Quelle und Prüfdatum speichern.

## Einkommensteuer und KZ 245

- [BMF: Steuertarif](https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html): 2026-Grenzen und Sätze in `data/tarif-2026.json`. Einkommensteile werden stufenweise besteuert.
- [FinanzOnline: Lohnzettel](https://finanzonline.bmf.gv.at/html/demo/Lohnzettel.html): KZ 245 = steuerpflichtige Bezüge. Nicht Jahresbrutto/Netto; SV und begünstigte Sonderzahlungen nicht nochmals pauschal herausrechnen oder addieren.
- [BMF: Werbungskosten](https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/was-kann-ich-geltend-machen/werbungskosten/werbungskosten-ueberblick.html): grundsätzlich 132 € Arbeitnehmer-Werbungskostenpauschale; weitere Abzüge nicht doppelt berücksichtigen.
- [BMF: LStR-Wartungserlass 2024](https://findok.bmf.gv.at/findok/volltext?dokumentId=dca4ae0e-a5f3-4dac-9770-5e6dced9dfa5): Veranlagungsfreibetrag für einschlägige andere Einkünfte bei nichtselbständigen Einkünften. Bei positivem Betrag O: max(0, min(730, 1460 - O)). In der Alpha nur Arbeitnehmer + eine Vermietung; keine weiteren Einkünfte.
- [BMF: AfA bei Vermietung](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/absetzung-fuer-abnutzung-bei-vuv.html): Gebäude-AfA grundsätzlich 1,5 %, individuelle Sonderfälle möglich. Bestehende Berechnung übernehmen; Grundanteil nicht abschreiben.
- [BMF: EStR, Rücklagen](https://findok.bmf.gv.at/findok/volltext?segmentId=54c121ef-a7f2-464c-bf00-a452b801c149): Einzahlung in einen Instandhaltungsfonds allein ist noch kein Werbungskostenabzug. Tatsächliche Verwendung und Art der Maßnahme gesondert prüfen.

### Einkommensbasis seit Alpha 0.4

Am 19.10.2026 erneut gegen FinanzOnline-Lohnzettel und BMF-Werbungskostenüberblick geprüft (Links oben). Der KZ-245-Weg setzt eine aktive Arbeitnehmertätigkeit voraus. Das einfache Modell zieht einmal 132 € oder höhere **auf diese Pauschale anzurechnende** Werbungskosten ab. Höhere Beträge werden nicht zusätzlich zur Pauschale gerechnet.

Nicht jede Werbungskostenart wird auf die Pauschale angerechnet: [BMF LStR-Wartungserlass 2024](https://findok.bmf.gv.at/volltext?dokumentId=dca4ae0e-a5f3-4dac-9770-5e6dced9dfa5) nennt auch ohne Anrechnung zu berücksichtigende Arten. Eine vollständige Werbungskostenklassifikation wird hier nicht implementiert. Solche weiteren Anpassungen sind über eine passend bereinigte Tarifbasis abzubilden.

Direkte Eingabe = jährliche Gehalts-Tarifbasis **vor Hinzurechnung dieser Vermietung**, nach den passenden Abzügen. Keine automatische 132-€-Pauschale und keine Abzüge aus dem inaktiven KZ-245-Weg. Kein Bescheid-Gesamteinkommen mit bereits enthaltenem Vermietungsüberschuss ungeprüft erneut verwenden. Beide Wege ersetzen keine vollständige persönliche Veranlagung.

Das Jahresmodell erlaubt keine negative Gehaltsbasis. Bei rechnerisch negativem Betrag wird die Basis mit sichtbarem Hinweis auf 0 begrenzt; ein möglicher einkunftsübergreifender Verlustausgleich ist nicht berechnet. Diese Begrenzung ist eine Modellgrenze, keine steuerliche Aussage zur individuellen Abzugsfähigkeit.

### Erstmalige Vermietung nach Privatnutzung

Nach [BMF: AfA bei Vermietung](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/absetzung-fuer-abnutzung-bei-vuv.html), geprüft am 19.10.2026: Ein bisheriger Vermietungs-AfA-Wert muss bei erstmaliger Vermietung nicht vorhanden sein. Bei seit 2013 erstmaliger Vermietung sind fiktive Anschaffungskosten nur im entsprechenden Altvermögensfall möglich; für Neuvermögen sind die tatsächlichen Anschaffungs-/Herstellungskosten maßgeblich. Grund und Boden sind nicht abschreibbar. Erwerbszeitpunkt/-art, anrechenbare Nebenkosten und Vermietungsbeginn prüfen; keinen heutigen Marktwert pauschal ansetzen. Grundsätzlich 1,5 % Jahres-AfA, Halb-/Ganzjahres-AfA und Sonderfälle getrennt behandeln. Ein einfacher Assistent für Käufe ab 2003 nach Privatnutzung ist seit Alpha 0.3 implementiert; Sonderfälle und eine steuerliche Freigabe nicht.

### AfA-Implementierung Alpha 0.3

Zusätzlich am 19.10.2026 anhand der aktuellen Primärquellen geprüft:

- [RIS § 16 Abs. 1 Z 8 EStG, Fassung 2026](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=16&FassungVom=2026-10-19): tatsächliche Anschaffungs-/Herstellungskosten, Fortführung beim unentgeltlichen Erwerb, Antragsregelung für fiktive Kosten im einschlägigen Altvermögensfall, reguläre 1,5 % und Grundanteilsabzug. Nicht jede Erstvermietung rechtfertigt eine Neubewertung.
- [RIS GrundanteilV 2016](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=20009521): 20 % bei Gemeinde unter 100.000 Einwohnern und durchschnittlichem baureifem Land unter 400 €/m²; bei mindestens 100.000 Einwohnern oder mindestens 400 €/m² je nach mehr als 10 bzw. bis zu 10 Wohn-/Geschäftseinheiten 30 bzw. 40 %. Maßgebliches Volkszählungsergebnis und Regeln für Geschäftseinheiten beachten. Nachweis und offenkundig erhebliche Abweichung separat prüfen (§ 3).
- [BMF EStR, Anschaffungsnebenkosten](https://findok.bmf.gv.at/findok/volltext?segmentId=356eb374-13af-4468-b0dc-ba361b38efec): Anschaffungskosten umfassen passende Nebenkosten, etwa GrESt und gerichtliche Eintragungsgebühr. Finanzierungskosten nicht pauschal in die Gebäude-Kaufbasis nehmen.
- [BMF AfA bei Vermietung](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/absetzung-fuer-abnutzung-bei-vuv.html): reguläre Halb-/Ganzjahres-AfA und gesonderte Regeln für beschleunigte AfA.

Die Kaufherleitung beschränkt sich bewusst auf Käufe ab 2003 nach ausschließlich privater Nutzung, aktuelle erstmalige Vermietung und reguläre Gebäude-AfA. Das ist eine technische Umfangsgrenze, keine Behauptung, dass jeder Kauf bis 2002 zwingend Altvermögen wäre. Andere Konstellationen benötigen einen separat geklärten Wert. Eingegebene Kaufnebenkosten werden vor der Grund-/Gebäudeaufteilung addiert; separat bewertete Einrichtung und andere Kaufbestandteile abgrenzen. Keine geschätzten Prozentsätze auf Kaufnebenkosten automatisch anwenden.

Grundanteil-Vorschlag ist nur nach bekannten Bedingungen und Ausschluss besonderer Bewertungsfälle verfügbar, wird nicht automatisch angewendet und bleibt nach Übernahme als Planungsannahme gekennzeichnet. Nach einer Änderung der Hilfsbedingungen wird ein übernommener Vorschlag ungültig. Individuell eingegebene Werte sind Angaben des Nutzers, keine Bestätigung der App.

Der Volljahresmodus nutzt weiterhin einen vollen Jahres-AfA-Wert für zwölf Mietmonate. Die Startjahr-Vorschau bei regulärer AfA dient nur der Information. Kein stillschweigender Wechsel auf Halbjahres-AfA in einer Ganzjahres-Mietkalkulation. Sonder-/beschleunigte Abschreibung bleibt nicht automatisiert. Die gesonderte Kalenderjahresplanung ab Alpha 0.6 steht unten; sie ersetzt keine vollständige Zu-/Abflussrechnung.

## Kostenmodell seit Alpha 0.2

Mietererstattung und Abzug unabhängig erfassen. Betriebskosten ohne entsprechende Werbungskosten sind als Einnahmen zu berücksichtigen; nicht ungeprüft als durchlaufende Posten neutralisieren. Quellen, geprüft am 19.10.2026:

- [BMF EStR, Einnahmen/Werbungskosten](https://findok.bmf.gv.at/findok/volltext?segmentId=54c121ef-a7f2-464c-bf00-a452b801c149): Eine Durchlaufbehandlung kommt unter Bedingungen für entsprechende mietengeschützte Objekte in Betracht. Stehen den BK keine entsprechenden Werbungskosten gegenüber, als Einnahme erfassen.
- [BFG: Nichtabzugsfähige Werbungskosten und Vorsteuern bei Vermietung](https://findok.bmf.gv.at/findok/volltext?dokumentId=94116553-73be-4477-80b9-1cca1670dfe5): bestätigt die notwendige Trennung von Betriebskosteneinnahmen und tatsächlich abzugsfähigem Aufwand.

Implementierung im Volljahresmodus: Jahreserlös = Hauptmiete × 12 + erwarteter Kostenersatz; Steuerbasis = Jahreserlös minus angegebener Jahresabzug minus Gebäude-AfA. Cash = Jahreserlös minus Zahlungen/Puffer minus Zusatzsteuer. Unbekannt ist keine steuerliche Freigabe: 0 € Erstattung und 0 € Abzug als getrennte vorläufige Modellannahmen. Akonti sind Zahlungswerte und ersetzen keine steuerliche Jahresermittlung. Eigenständige Jahresabzüge können von Zahlungen abweichen; die App prüft deren rechtliche Zuordnung und Höhe nicht. Keine pauschale Behauptung einer abschließend richtigen Steuerhöhe.

## Mietrecht vor Kostenfreigabe

- [Sozialministerium: MRG-Anwendungsbereich](https://www.konsumentenfragen.at/konsumentenfragen/Bauen__Wohnen_und_Versorgungsleistungen/Wohnen/Rund_um_die_Miete/Anwendungsbereich_des_Mietrechtsgesetzes.html): Neubau-Eigentumswohnungen mit Baubewilligung nach 8.5.1945 grundsätzlich Teilanwendung; Ausnahme-/Förder-/WGG-Konstellationen nicht unterschlagen.
- [Sozialministerium: Betriebskosten](https://www.konsumentenfragen.at/konsumentenfragen/Bauen__Wohnen_und_Versorgungsleistungen/Wohnen/Rund_um_die_Miete/Betriebskosten.html): Vollanwendungs-Katalog gegenüber vertraglicher Regelung unterscheiden. Außerhalb des gesetzlichen BK-Katalogs ist eine wirksame Vereinbarung maßgeblich. Unklare Vertragsklauseln können unwirksam sein.
- [RIS: MRG](https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10002531): §§ 1, 17, 21–24.
- [Stadt Wien: MRG-Anwendung](https://www.wien.gv.at/wohnen/mietrecht-anwendung).
- [AK: Eigentümerkosten](https://wien.arbeiterkammer.at/beratung/Wohnen/eigentum/wohnung/Laufende-Kosten.html): WEG-Kosten sind nicht automatisch Mieter-BK. Nutzwert- und Nutzflächenschlüssel können abweichen.

### Bedingte Einordnung im MRG-Vollanwendungsfall (nicht pauschal auf Teilanwendung übertragen)

| Kostenart | Prüfansatz |
| --- | --- |
| Wasser, Kanal, Müll, Allgemeinbeleuchtung, zulässige öffentliche Abgaben | Grundsätzlich gesetzliche Positionen; Schlüssel, Umfang und Betrag prüfen |
| Reinigung, Winterdienst, Schädlingsbekämpfung | Gesetzliche Grundlagen und angemessenen Leistungsumfang prüfen |
| Feuer-, gesetzliche Gebäudehaftpflicht-, Leitungswasserversicherung | Angemessenen Umfang prüfen; weitere Versicherungen können Zustimmung der Mietermehrheit voraussetzen |
| Verwaltung | Gesetzliche Pauschale/Höchstgrenze, nicht unbesehen tatsächliches WEG-Verwaltungshonorar |
| Service/Wartung gemeinsamer Anlagen | Betriebsleistung gegen Reparatur/Erneuerung abgrenzen; Benützungsberechtigung beachten |
| Heizung/Warmwasser | Heizkostenabrechnung/Verbrauchsregeln separat prüfen |
| Bewachung, Anlagen-Telefon, Sammelpositionen | Zweck und Belege fehlen: keine automatische Freigabe |
| Garage | Mitvermietung, Anlagenzuordnung, Vertrag und Schlüssel prüfen |
| Reparaturrücklage, Reparatur/Sanierung | Keine zusätzlich verrechenbaren BK nach dem MRG-Katalog |

Die Alpha hat bislang nur allgemeine, von Mietrechtsszenario und Vertragsstatus abhängige Hinweise; keinen detaillierten Freigabeassistenten. Ein Dropdown mit „an Mieter“ ist eine Eingabeannahme, keine Rechtsfreigabe. Ein zukünftiger Vertrag kann den MRG-Katalog freiwillig heranziehen; das muss aus dem Vertrag erkennbar sein. Rücklage im Ausgangsmodell beim Eigentümer belassen.

## Umsatzsteuer – Kleinunternehmerbefreiung als Planungsannahme

- [USP: Kleinunternehmen seit 2025](https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/weitere-steuertatbestaende-und-befreiungen/kleinunternehmen.html): Grenze 55.000 € relevante unternehmerische Umsätze, Vorjahr/laufendes Jahr und Toleranz beachten; nicht das Arbeitsgehalt.
- [BMF: Vermietung in der USt](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/vermietung-und-verpachtung-in-der-umsatzsteuer.html): Wohnraum, Heizung, Garage und Vorsteuer nicht pauschal gleich behandeln. Keine automatische Statusableitung aus einem historischen Kaufvertrag.

Gewünschtes Entwicklungsszenario seit 19.10.2026: vorerst Kleinunternehmerbefreiung, keine Ausgangs-USt und kein Vorsteuerabzug. Die Alpha hat bereits einen entsprechenden Beispielmodus. Eine tatsächliche Befreiung wurde nicht festgestellt. Laut oben verlinktem USP (geprüft am 19.10.2026) ist der relevante Gesamtumsatz desselben Unternehmers maßgeblich, nicht nur die einzelne Wohnung; weitere Vermietungs-/unternehmerische Tätigkeiten können mitzählen. Arbeitslohn zählt nicht zum unternehmerischen Umsatz. Vorjahr/laufendes Jahr sowie bestehende Option zur Steuerpflicht mit mindestens fünfjähriger Bindung prüfen. Bei Anwendung der Befreiung sind Kosten ohne Vorsteuerabzug zu modellieren. Keine Prüfung dieser Voraussetzungen allein anhand des Wohnungsumsatzes.

## Anschaffungen

- [BMF: Geringwertige Wirtschaftsgüter](https://findok.bmf.gv.at/findok/volltext?segmentId=82635c96-c216-41ce-a45c-ed88b4bcd843): 1.000-€-Grenze; maßgebliche Anschaffungskosten, wirtschaftliche Einheit und Nutzungsanteil prüfen.
- [BMF: Vorsteuer und GWG-Basis](https://findok.bmf.gv.at/findok/volltext?segmentId=08dc4c9a-529c-4a56-a0df-f89558ac561f): abziehbare Vorsteuer nicht als Anschaffungskosten behandeln.

## Jahresplanung ab Alpha 0.6

Am 19.10.2026 erneut geprüft: [BMF: AfA bei Vermietung](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/absetzung-fuer-abnutzung-bei-vuv.html), insbesondere reguläre Halb-/Ganzjahresregel und Ausnahme bei beschleunigter AfA. AfA-Nutzungsmonate nicht ungeprüft mit tatsächlich bezahlten Mietmonaten gleichsetzen. Der neue Kalenderjahresweg verlangt dafür eine gesonderte Auswahl; fortgesetzte Vermietung/Sonderfälle über eigenen Jahresbetrag führen.

[RIS § 19 EStG](https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=19): zeitliche Zuordnung grundsätzlich nach Zu-/Abfluss, einschließlich besonderer Regeln für regelmäßig wiederkehrende Zahlungen und bestimmter Vorauszahlungen. Eine bloße Multiplikation mit Mietmonaten ist keine vollständige Jahresveranlagung. Die Alpha nimmt im Monatsmodell Zahlung im selben Jahr an; abweichende Zeitpunkte und Teilmonate bleiben ausdrücklich offen. Jahreskosten/-erstattungen sind eingegebene Jahressummen und werden nicht nochmals gekürzt.

Vorweggenommene Kosten und Leerstand: keine automatische Abzugsfreigabe. Ernsthafte Vermietungsabsicht und frühere Privatnutzung separat prüfen; der Kalenderjahres-Abzug startet unabhängig von der Volljahreswahl mit 0 € und wird als eigener Jahresbetrag angegeben. Dazu als primärer Rechercheansatz [BFG 26.02.2026: Nachweis der Vermietungsabsicht nach außen](https://findok.bmf.gv.at/findok/volltext?dokumentId=2ba75538-b736-4419-b728-cfaff71fa37c). Abruf war nur als Suchauszug lesbar; keine detaillierten Fallregeln daraus implementiert.

## Private Quellen

Es wurden eine aktuelle Eigentümer-Vorschreibung, eine Vorjahresabrechnung, ein Grundbuchauszug und ein Kaufvertrag als Struktur-/Szenariobeispiele gelesen. Keine Originale, OCR-Texte, persönlichen Identifikatoren oder tatsächlichen Einzelbeträge sind Bestandteil dieses Repos. Bei einer späteren individuellen Berechnung gezielt privat auf aktuelle Dokumente zugreifen; nicht aus fiktiven Fixtures auf reale Verhältnisse schließen.




