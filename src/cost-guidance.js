import { numeric } from './numbers.js?v=0.8.0-alpha.1';

export const COST_GUIDANCE_CHECKED = '19.10.2026';
const ris = (law, paragraph) => 'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=' + law + '&Paragraf=' + paragraph;
export const COST_SOURCES = Object.freeze({
  scope: { label: 'MRG § 1 · Anwendungsbereich', url: ris('10002531', '1') },
  contract: { label: 'Sozialministerium · Betriebskosten und Vertrag', url: 'https://www.konsumentenfragen.at/konsumentenfragen/Bauen__Wohnen_und_Versorgungsleistungen/Wohnen/Rund_um_die_Miete/Betriebskosten.html' },
  bk: { label: 'MRG § 21 · Betriebskosten', url: ris('10002531', '21') },
  admin: { label: 'MRG § 22 · Verwaltung', url: ris('10002531', '22') },
  plant: { label: 'MRG § 24 · Gemeinschaftsanlagen', url: ris('10002531', '24') },
  heat: { label: 'HeizKG · Anwendungsbereich und Abrechnung', url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10007277' },
  tax: { label: 'EStG § 16 · Werbungskosten', url: ris('10004570', '16') },
  repair: { label: 'EStG § 28 · Erhaltung und Verteilung', url: ris('10004570', '28') },
  reserve: { label: 'BMF EStR · Rz 6419, Instandhaltungsfonds', url: 'https://findok.bmf.gv.at/findok/volltext?segmentId=54c121ef-a7f2-464c-bf00-a452b801c149' }
});
// Conditional guidance, never an automatic reimbursement or tax decision.
export const COST_TYPES = Object.freeze({
  bk: { label: 'Betriebskosten · Sammelposten / Akonto',
    contents: 'Einzelpositionen aus der Langfassung zuordnen. In einer WEG-Vorschreibung können auch Eigentümerkosten stecken.',
    full: 'Jede Teilposition am gesetzlichen Katalog prüfen. Das Akonto allein belegt keine vollständige Umlagefähigkeit.',
    tax: 'Akonto und Jahresabrechnung abstimmen. Bereits erfasste Zahlungen und tatsächliche Jahreskosten nicht doppelt abziehen.', sources: ['bk'] },
  water: { label: 'Wasser / Abwasser',
    contents: 'Wasser, Kanal und Messkosten unterscheiden; Verbrauch, Zeitraum und Abrechnungsschlüssel belegen.',
    full: 'Wasser und einschlägige Kanal-/Messkosten können zum Katalog gehören. Abrechnung und richtigen Schlüssel prüfen.',
    tax: 'Den belegten Vermietungsanteil und den passenden Jahresabzug ermitteln; private Verbräuche abgrenzen.', sources: ['bk'] },
  heat: { label: 'Heizung / Warmwasser',
    contents: 'Heizung und Warmwasser getrennt erfassen. Energie, laufenden Betrieb und Anlagenarbeiten unterscheiden.',
    full: 'HeizKG-Anwendung und Verbrauchsabrechnung gesondert prüfen. Das ist keine pauschale Betriebskostenfreigabe.',
    tax: 'Abrechnung, Vermietungszeitraum und eigene Zahlungen abstimmen; private Anteile abgrenzen.', sources: ['heat', 'plant'] },
  reserve: { label: 'I-Fonds / WEG-Rücklage · Einzahlung',
    contents: 'Einzahlung in die Rücklage von tatsächlich aus dem Fonds bezahlten Arbeiten unterscheiden.',
    full: 'Die bloße Rücklageneinzahlung ist keine zusätzlich umlagefähige MRG-Betriebskostenposition.',
    tax: 'Die Einzahlung allein ist kein Werbungskostenabzug. Verwendung, Maßnahme und Zeitpunkt anhand der Fondsabrechnung prüfen. Bereits im Cash berücksichtigte Rücklagenzahlungen nicht nochmals als neue Zahlung erfassen.', sources: ['bk', 'reserve', 'repair'] },
  admin: { label: 'Verwaltung',
    contents: 'WEG-Verwaltungshonorar, eigene Vermietungsverwaltung und zusätzliche Gebühren trennen.',
    full: 'Es gilt die gesetzliche Verwaltungskostenpauschale nach § 22 MRG. Das tatsächliche WEG-Honorar ist nicht automatisch in voller Höhe verrechenbar; gesonderte Buchungs-/EDV-Gebühren prüfen.',
    tax: 'Nur belegten Vermietungsaufwand ansetzen; dieselbe Verwaltung nicht nochmals über Sammel-BK abziehen.', sources: ['admin', 'bk'] },
  repair: { label: 'Reparatur / Instandhaltung / Sanierung',
    contents: 'Arbeit, Rechnung, Zahlungsweg und Finanzierung aus einer Rücklage beschreiben.',
    full: 'Reparatur und Erhaltung sind keine zusätzlich verrechenbaren MRG-Betriebskosten.',
    tax: 'Instandhaltung, Instandsetzung und Herstellung sowie mögliche Verteilung unterscheiden. Bei Zahlung aus dem I-Fonds keine zweite Cash-Zahlung erzeugen: gegebenenfalls eigene Position mit 0 € neuer Zahlung und separat geklärtem Jahresabzug nutzen. Keine automatische Abzugsfreigabe.', sources: ['contract', 'repair', 'reserve'] },
  adviser: { label: 'Steuerberatung / Beratung',
    contents: 'Rechnung und Leistungsanteil für diese Vermietung von privaten oder anderen Leistungen trennen.',
    full: 'Eigene Steuerberatung ist keine Betriebskostenposition des MRG-Katalogs.',
    tax: 'Zuordnung und Abzugsweg fachlich klären; nicht zusätzlich in mehreren Einkunftsarten oder als Sonderausgabe abziehen.', sources: ['bk'] },
  insurance: { label: 'Gebäudeversicherung',
    contents: 'Versicherte Risiken und Prämien aufschlüsseln; Haushalts-/Privatversicherung getrennt halten.',
    full: 'Angemessene Feuer-, Gebäudehaftpflicht- und Leitungswasserversicherung prüfen. Weitere Risiken können die Zustimmung der Hauptmietermehrheit erfordern.',
    tax: 'Nur den belegten Vermietungsanteil der passenden Versicherungen ansetzen.', sources: ['bk'] },
  lighting: { label: 'Allgemeinstrom / Hausbeleuchtung',
    contents: 'Hausbeleuchtung von Wohnungsstrom und Strom für einzelne Anlagen trennen.',
    full: 'Die Beleuchtung allgemein zugänglicher Teile ist im Katalog genannt. Anlagenstrom nach Anlage und Nutzungsberechtigung prüfen.',
    tax: 'Zähler, Rechnung und Zuordnung zur Vermietung dokumentieren; keine privaten Stromkosten einbeziehen.', sources: ['bk', 'plant'] },
  waste: { label: 'Müll / Kanalräumung / Rauchfangkehrung',
    contents: 'Leistungsart, laufenden Umfang und enthaltene Arbeiten belegen.',
    full: 'Regelmäßige Kehrung, Kanalräumung und Unratabfuhr am gesetzlichen Katalog prüfen; Reparaturen abgrenzen.',
    tax: 'Belegten Vermietungsanteil und Zahlung im maßgeblichen Jahr abstimmen.', sources: ['bk'] },
  cleaning: { label: 'Reinigung / Hausbetreuung / Winterdienst',
    contents: 'Leistungsverzeichnis, Material und angemessenen Umfang von Einzelarbeiten abgrenzen.',
    full: 'Zulässige Hausbetreuung und angemessenen Leistungsumfang prüfen; Reparatur- oder Erneuerungsanteile herauslösen.',
    tax: 'Rechnung und Vermietungsanteil prüfen; bereits in Sammel-BK enthaltene Leistungen nicht doppelt erfassen.', sources: ['bk'] },
  pest: { label: 'Schädlingsbekämpfung',
    contents: 'Leistung, Hausbezug und Kostenbeleg ermitteln.',
    full: 'Schädlingsbekämpfung ist im gesetzlichen Katalog genannt; Umfang, Zuordnung und Betrag prüfen.',
    tax: 'Belegten Aufwand und Bezug zur vermieteten Immobilie prüfen.', sources: ['bk'] },
  services: { label: 'Service / Wartung / Gemeinschaftsanlage',
    contents: 'Welche Anlage und Leistung? Laufenden Betrieb, Wartung und Reparatur/Erneuerung auseinanderhalten.',
    full: 'Bei Gemeinschaftsanlagen Benützungsberechtigung und Betriebskosten nach § 24 MRG prüfen. Reparaturen nicht als laufenden Betrieb behandeln.',
    tax: 'Laufenden Aufwand von zu verteilenden oder abzuschreibenden Maßnahmen abgrenzen.', sources: ['plant', 'repair'] },
  security: { label: 'Bewachung / Sicherheitsdienst',
    contents: 'Zweck, Leistungsumfang und Zuordnung belegen; der Kontoname allein reicht nicht.',
    full: 'Keine pauschale Katalogfreigabe für Bewachung. Konkrete Leistung und Rechtsgrundlage gesondert prüfen.',
    tax: 'Vermietungsbezug, Rechnung und maßgebliches Jahr prüfen.', sources: ['bk'] },
  phone: { label: 'Telefon / Notruf einer Anlage',
    contents: 'Anlage und Zweck ermitteln, etwa Aufzugsnotruf; private Telefonkosten trennen.',
    full: 'Anlagenbezug und Benützungsberechtigung prüfen. Ein Anlagen-Notruf ist anders einzuordnen als ein beliebiger Telefonposten.',
    tax: 'Nur den belegten, dieser Vermietung zugeordneten Aufwand berücksichtigen.', sources: ['plant'] },
  garage: { label: 'Garage / Stellplatz / Garagenanlage',
    contents: 'Gemeinschaftliche Garagenkosten in der Wohnungsabrechnung oder eigener Stellplatz? Zuordnung und Benützungsrecht klären.',
    full: 'Mitvermietung, rechtliche Einheit, Nutzungsberechtigung und Kostenbestandteile prüfen. Strom/Betrieb von Reparatur und Rücklage trennen.',
    tax: 'Wohnung, mitvermieteten oder separat vermieteten Stellplatz und private Nutzung abgrenzen. Eigene Kosten bleiben auch ohne geplante Mietererstattung Cash-Kosten.', sources: ['scope', 'plant'] },
  taxes: { label: 'Laufende öffentliche Abgaben',
    contents: 'Art und Zeitraum der Abgabe prüfen; Erwerbsabgaben gehören in einen anderen Berechnungsweg.',
    full: 'Laufende öffentliche Abgaben nach § 21 Abs. 2 MRG prüfen; gesetzlich nicht überwälzbare Abgaben ausnehmen.',
    tax: 'Bezug zur Einkunftsquelle und tatsächlichen Jahresaufwand belegen; Kaufnebenkosten nicht nochmals als laufende Ausgabe abziehen.', sources: ['bk'] },
  other: { label: 'Sonstige / noch nicht zugeordnet',
    contents: 'Leistung und Beleg zuerst klären; Sammelposten gegebenenfalls aufschlüsseln.',
    full: 'Ohne passende Zuordnung zum gesetzlichen Katalog oder zu einer Gemeinschaftsanlage keine pauschale Freigabe.',
    tax: 'Vermietungsbezug, Zahlungszeitpunkt und Art des Aufwands ermitteln; ein Akonto allein bestimmt keinen Jahresabzug.', sources: ['bk'] }
});
export const COST_KIND_IDS = Object.freeze(Object.keys(COST_TYPES));

export function costGuidance(line, context = {}) {
  const value = raw => typeof raw === 'number' ? raw : numeric(raw);
  const type = COST_TYPES[line.kind] || COST_TYPES.other;
  const law = context.rentalLaw || 'unknown', contract = context.contract || 'unknown';
  const agreement = line.agreement || 'unknown';
  const reserve = line.kind === 'reserve', full = law === 'full';
  const planned = (line.payer === 'tenant' || (line.payer === 'partial' && value(line.forward) > 0)) && value(line.amount) > 0;
  const taxStatus = context.periodMode === 'year' ? line.yearTaxStatus : line.taxStatus;
  const steps = [], warnings = [];
  if (['bk', 'other'].includes(line.kind) && !line.composition?.trim()) steps.push('Langfassung und Belege besorgen; enthaltene Leistungen dieser Position beschreiben oder einzeln erfassen.');
  if (['insurance', 'services', 'security', 'phone', 'garage'].includes(line.kind)) steps.push(type.contents);
  if (reserve) steps.push('Fondsabrechnung auf tatsächlich bezahlte Arbeiten prüfen; Einzahlung und Verwendung getrennt behandeln.');
  else {
    if (law === 'unknown' || law === 'other') steps.push('Mietrechtliche Einordnung und etwaige Sonderregeln anhand der Objektunterlagen prüfen.');
    if (full && ['repair', 'adviser'].includes(line.kind)) {
      steps.push('Diese Zahlung nicht als zusätzliche MRG-Betriebskosten behandeln; geplante Erstattung prüfen.');
      if (planned) warnings.push('Kostenersatz eingeplant, obwohl diese Kostenart keine zusätzliche MRG-Betriebskostenposition ist.');
    }
    if (contract === 'none') {
      steps.push('Vor Vermietung Vertrag, Zahlungsweise und erforderliche Kostenvereinbarungen konkret festlegen.');
      if (agreement === 'documented') warnings.push('Die Position ist als geprüft markiert, obwohl allgemein noch kein Mietvertrag angegeben ist.');
    } else if (contract === 'unknown') steps.push('Vertragsstatus und zugehörige Unterlagen klären.');
    if (!full && agreement !== 'documented' && agreement !== 'excluded') steps.push('Prüfen, ob eine wirksame Vereinbarung genau diese Kostenart, Abrechnung und Verteilung erfasst.');
    if (planned && agreement === 'excluded') warnings.push('Kostenersatz eingeplant, aber für diese Position ist keine Überwälzung vorgesehen.');
    else if (planned && (law === 'unknown' || contract !== 'existing' || (!full && agreement !== 'documented'))) warnings.push('Kostenersatz eingeplant; die rechtliche oder vertragliche Grundlage ist noch offen.');
    if (taxStatus === 'unknown') steps.push('Steuerlichen Jahresabzug nach Belegen, Vermietungsanteil und Art der Ausgabe gesondert klären.');
    if (line.kind === 'repair') steps.push('Finanzierung aus dem I-Fonds und eine mögliche Verteilung prüfen; denselben Geldabfluss nicht nochmals erfassen.');
  }
  if (!steps.length) steps.push('Belege, Rechtsgrundlage und Verteilungsschlüssel zur Position aufbewahren; Angaben bei Änderungen erneut prüfen.');
  const lawLabel = { full: 'MRG-Vollanwendung · deine Einordnung', partial: 'MRG-Teilanwendung · deine Einordnung', other: 'Andere / Ausnahme · gesondert prüfen', unknown: 'Mietrecht noch zu klären' }[law];
  const basis = full ? type.full : law === 'partial'
    ? 'Für die geplante Weiterverrechnung ist eine wirksame, konkrete Vereinbarung zu prüfen. Der MRG-Katalog gilt hier nicht automatisch.'
    : 'Anwendbare Regeln und Vereinbarung zuerst klären; keine automatische Zuordnung allein aus der WEG-Vorschreibung.';
  const tenant = reserve ? 'Eigentümer-Rücklage · hier ohne Erstattung' : line.payer === 'owner' ? 'Keine Mietererstattung eingeplant'
    : line.payer === 'unknown' ? 'Erstattung offen · vorerst 0 €'
      : warnings.length ? 'Erstattung eingeplant · Grundlage prüfen' : 'Erstattung nach deiner Angabe eingeplant';
  const tax = reserve ? 'Einzahlung · hier kein Steuerabzug' : taxStatus === 'unknown' ? 'Steuerabzug offen · vorerst 0 €' : taxStatus === 'none' ? 'Kein Steuerabzug eingeplant' : 'Steuerabzug von dir angegeben';
  const sourceIds = [...new Set(['scope', ...(full ? [] : ['contract']), ...type.sources, 'tax'])];
  return { label: type.label, contents: type.contents, lawLabel, basis,
    agreementText: contract === 'none' ? 'Noch kein Mietvertrag: eine geplante Regelung ist keine bestehende Vereinbarung.'
      : agreement === 'documented' ? 'Von dir als anhand der Unterlagen geprüft angegeben. Die App prüft keine Klauseln.'
        : agreement === 'planned' ? 'Eine Regelung ist geplant; Wirksamkeit und finalen Vertrag noch prüfen.'
          : agreement === 'excluded' ? 'Für diese Position ist nach deiner Angabe keine Überwälzung vorgesehen.' : 'Vereinbarung / Grundlage dieser Position noch prüfen.',
    tenant, tax, taxText: type.tax, steps: [...new Set(steps)], warnings: [...new Set(warnings)],
    sources: sourceIds.map(id => COST_SOURCES[id]), checked: COST_GUIDANCE_CHECKED };
}
