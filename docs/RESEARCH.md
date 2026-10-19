# Recherche und fachliche Annahmen

Stand: 19.10.2026. Quellen sind Ausgangspunkte; ein Kontoname und ein Baujahr ersetzen keine Einzelfallprüfung. Zuordnungsvorschläge später mit Bedingung, Quelle und Prüfdatum speichern.

## Einkommensteuer und KZ 245

- [BMF: Steuertarif](https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/steuertarif-steuerabsetzbetraege.html): 2026-Grenzen und Sätze in `data/tarif-2026.json`. Einkommensteile werden stufenweise besteuert.
- [FinanzOnline: Lohnzettel](https://finanzonline.bmf.gv.at/html/demo/Lohnzettel.html): KZ 245 = steuerpflichtige Bezüge. Nicht Jahresbrutto/Netto; SV und begünstigte Sonderzahlungen nicht nochmals pauschal herausrechnen oder addieren.
- [BMF: Werbungskosten](https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/was-kann-ich-geltend-machen/werbungskosten/werbungskosten-ueberblick.html): grundsätzlich 132 € Arbeitnehmer-Werbungskostenpauschale; weitere Abzüge nicht doppelt berücksichtigen.
- [BMF: LStR-Wartungserlass 2024](https://findok.bmf.gv.at/findok/volltext?dokumentId=dca4ae0e-a5f3-4dac-9770-5e6dced9dfa5): Veranlagungsfreibetrag für einschlägige andere Einkünfte bei nichtselbständigen Einkünften. Bei positivem Betrag O: max(0, min(730, 1460 - O)). In der Alpha nur Arbeitnehmer + eine Vermietung; keine weiteren Einkünfte.
- [BMF: AfA bei Vermietung](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/absetzung-fuer-abnutzung-bei-vuv.html): Gebäude-AfA grundsätzlich 1,5 %, individuelle Sonderfälle möglich. Bestehende Berechnung übernehmen; Grundanteil nicht abschreiben.
- [BMF: EStR, Rücklagen](https://findok.bmf.gv.at/findok/volltext?segmentId=54c121ef-a7f2-464c-bf00-a452b801c149): Einzahlung in einen Instandhaltungsfonds allein ist noch kein Werbungskostenabzug. Tatsächliche Verwendung und Art der Maßnahme gesondert prüfen.

### Erstmalige Vermietung nach Privatnutzung

Nach [BMF: AfA bei Vermietung](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/absetzung-fuer-abnutzung-bei-vuv.html), geprüft am 19.10.2026: Ein bisheriger Vermietungs-AfA-Wert muss bei erstmaliger Vermietung nicht vorhanden sein. Bei seit 2013 erstmaliger Vermietung sind fiktive Anschaffungskosten nur im entsprechenden Altvermögensfall möglich; für Neuvermögen sind die tatsächlichen Anschaffungs-/Herstellungskosten maßgeblich. Grund und Boden sind nicht abschreibbar. Erwerbszeitpunkt/-art, anrechenbare Nebenkosten und Vermietungsbeginn prüfen; keinen heutigen Marktwert pauschal ansetzen. Grundsätzlich 1,5 % Jahres-AfA, Halb-/Ganzjahres-AfA und Sonderfälle getrennt behandeln. Der vollständige Assistent ist noch nicht implementiert.

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

Die Alpha hat noch keinen solchen Regelassistenten. Ein Dropdown mit „an Mieter“ ist eine Eingabeannahme, keine Rechtsfreigabe. Ein zukünftiger Vertrag kann den MRG-Katalog freiwillig heranziehen; das muss aus dem Vertrag erkennbar sein. Rücklage im Ausgangsmodell beim Eigentümer belassen.

## Umsatzsteuer – Kleinunternehmerbefreiung als Planungsannahme

- [USP: Kleinunternehmen seit 2025](https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/weitere-steuertatbestaende-und-befreiungen/kleinunternehmen.html): Grenze 55.000 € relevante unternehmerische Umsätze, Vorjahr/laufendes Jahr und Toleranz beachten; nicht das Arbeitsgehalt.
- [BMF: Vermietung in der USt](https://www.bmf.gv.at/themen/steuern/immobilien-grundstuecke/vermietung-verpachtung/vermietung-und-verpachtung-in-der-umsatzsteuer.html): Wohnraum, Heizung, Garage und Vorsteuer nicht pauschal gleich behandeln. Keine automatische Statusableitung aus einem historischen Kaufvertrag.

Gewünschtes Entwicklungsszenario seit 19.10.2026: vorerst Kleinunternehmerbefreiung, keine Ausgangs-USt und kein Vorsteuerabzug. Die Alpha hat bereits einen entsprechenden Beispielmodus. Eine tatsächliche Befreiung wurde nicht festgestellt. Laut oben verlinktem USP (geprüft am 19.10.2026) ist der relevante Gesamtumsatz desselben Unternehmers maßgeblich, nicht nur die einzelne Wohnung; weitere Vermietungs-/unternehmerische Tätigkeiten können mitzählen. Arbeitslohn zählt nicht zum unternehmerischen Umsatz. Vorjahr/laufendes Jahr sowie bestehende Option zur Steuerpflicht mit mindestens fünfjähriger Bindung prüfen. Bei Anwendung der Befreiung sind Kosten ohne Vorsteuerabzug zu modellieren. Keine Prüfung dieser Voraussetzungen allein anhand des Wohnungsumsatzes.

## Anschaffungen

- [BMF: Geringwertige Wirtschaftsgüter](https://findok.bmf.gv.at/findok/volltext?segmentId=82635c96-c216-41ce-a45c-ed88b4bcd843): 1.000-€-Grenze; maßgebliche Anschaffungskosten, wirtschaftliche Einheit und Nutzungsanteil prüfen.
- [BMF: Vorsteuer und GWG-Basis](https://findok.bmf.gv.at/findok/volltext?segmentId=08dc4c9a-529c-4a56-a0df-f89558ac561f): abziehbare Vorsteuer nicht als Anschaffungskosten behandeln.

## Private Quellen

Es wurden eine aktuelle Eigentümer-Vorschreibung, eine Vorjahresabrechnung, ein Grundbuchauszug und ein Kaufvertrag als Struktur-/Szenariobeispiele gelesen. Keine Originale, OCR-Texte, persönlichen Identifikatoren oder tatsächlichen Einzelbeträge sind Bestandteil dieses Repos. Bei einer späteren individuellen Berechnung gezielt privat auf aktuelle Dokumente zugreifen; nicht aus fiktiven Fixtures auf reale Verhältnisse schließen.
