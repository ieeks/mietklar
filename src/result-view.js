import { buildFlow, comparePerSquareMetre } from './scenario.js?v=0.7.0-alpha.3';
import { money, numeric, decimal } from './numbers.js?v=0.7.0-alpha.3';
import { renderAfa } from './form-view.js?v=0.7.0-alpha.3';

function assumptionsFor(result) {
  const { fields: f, income, period, afaResult, yearAfa, costs } = result;
  const basisNotes = period.mode === 'full' || f.yearAfaMode === 'regular' ? afaResult.notes : [];
  const notes = [...income.notes, ...basisNotes, ...yearAfa.notes];
  costs.unknownForward.forEach(row => notes.push(row.name + ': Erstattung offen; vorerst 0 €.'));
  costs.unknownTax.forEach(row => notes.push(row.name + ': Steuerabzug offen; vorerst 0 €.'));
  costs.rows.filter(row => row.annualDeduction > 0 && !row.evidence).forEach(row => notes.push(row.name + ': Abzug von dir angegeben; Quelle / Begründung fehlt noch.'));
  if (costs.annualReimbursements > 0) notes.push(f.contract === 'none'
    ? 'Geplanter Kostenersatz ohne bestehenden Mietvertrag. Wirksame Vereinbarung vor Vermietung klären.'
    : 'Kostenersatz: Vertrag und Verteilungsschlüssel sind nicht durch die App geprüft.');
  if (f.rentalLaw === 'unknown') notes.push('Mietrechtliche Einordnung noch offen.');
  notes.push(period.rentMonths + ' volle Mietmonate. Gleiche Miete je Mietmonat und Zahlungen im selben Jahr angenommen. Teilmonate, Ausfälle und Nachzahlungen fehlen.');
  notes.push('Keine vollständige persönliche Veranlagung; insbesondere keine automatische Verlustgutschrift oder einkommensabhängigen Absetzbeträge.');
  return notes;
}

function renderFlow(root, result) {
  const q = s => root.querySelector(s), doc = root.ownerDocument;
  const flow = buildFlow(result);
  q('[data-flow-title]').textContent = flow.shortfall > 0 ? 'Diese Ausgaben musst du decken' : 'Aufteilung der Einnahmen';
  const bar = q('[data-flow-bar]'), legend = q('[data-flow-legend]');
  bar.replaceChildren(); legend.replaceChildren();
  flow.segments.forEach(segment => {
    const block = doc.createElement('span'); block.className = 'mr-segment mr-segment-' + segment.key;
    block.style.width = segment.percent + '%'; block.setAttribute('aria-hidden', 'true'); bar.append(block);
    const row = doc.createElement('div'); row.className = 'mr-legend-item';
    const label = doc.createElement('dt'), swatch = doc.createElement('span');
    swatch.className = 'mr-swatch mr-segment-' + segment.key; swatch.setAttribute('aria-hidden', 'true');
    label.append(swatch, doc.createTextNode(segment.label));
    const value = doc.createElement('dd'); value.textContent = money(segment.displayValue);
    value.dataset.flowValue = segment.key; row.append(label, value); legend.append(row);
  });
  bar.setAttribute('aria-label', flow.segments.map(row => row.label + ': ' + money(row.displayValue)).join('; '));
  q('[data-flow-note]').textContent = flow.shortfall > 0
    ? 'Mietereinnahmen ' + money(flow.income) + ' + nötiger Zuschuss ' + money(flow.shortfall) + ' = Ausgaben ' + money(flow.total) + ' im Monatsdurchschnitt. Kein positiver Überschuss.'
    : money(flow.income) + ' Mietereinnahmen inkl. Kostenersatz · Ø/Monat. AfA ist keine zusätzliche Zahlung.';
}

function renderPrint(root, result, notes, reference) {
  const doc = root.ownerDocument, sheet = root.querySelector('[data-print-sheet]');
  const node = (tag, text, className) => { const n = doc.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; };
  const { fields: f, solved, costs, model, period, income } = result;
  const fragment = doc.createDocumentFragment();
  fragment.append(node('h1', 'mietklar. · Ergebnisblatt'), node('p', 'Alpha 0.7 · Tarif 2026 · Berechnet am ' + new Date().toLocaleDateString('de-AT')));
  fragment.append(node('h2', 'Hauptmiete ' + money(solved.rent) + ' je Mietmonat'), node('p', 'Jahressaldo ' + money(solved.annualCash) + ' · Durchschnitt ' + money(solved.monthlyCash) + ' je Kalendermonat'));
  const list = node('dl');
  const entries = [
    ['Rechenrichtung', result.input.mode === 'target' ? 'Wunschüberschuss ' + money(result.input.target) + '/Monat im Jahresdurchschnitt' : 'Vorgegebene Hauptmiete'],
    ['Zeitraum', period.mode === 'full' ? 'Typisches Vermietungsjahr' : 'Kalenderjahr 2026 · erster möglicher Mietmonat ' + f.startMonth],
    ['Mietmonate / Leerstand', period.rentMonths + ' / ' + period.vacantMonths],
    ['Gehaltsbasis vor Vermietung', money(income.base) + '/Jahr · ' + (f.incomeMode === 'provided' ? 'bereinigt angegeben' : 'KZ 245 ' + money(numeric(f.salary)) + ' minus Werbungskosten ' + money(income.appliedDeduction))],
    ['Hauptmiete / Jahr', money(solved.annualRent)], ['Kostenersatz / Jahr', money(costs.annualReimbursements)],
    ['Zahlungen inkl. Rücklage/Puffer / Jahr', money(costs.annualCashCosts)], ['Kostenabzug / Jahr', money(costs.annualTaxCosts)],
    ['Gebäude-AfA im Planjahr', money(model.annualAfa)], ['Vermietungseinkünfte / Jahr', money(solved.rentalIncome)],
    ['Zusätzliche Einkommensteuer / Jahr', money(solved.annualTax)], ['Umsatzsteuer', 'Kleinunternehmerbefreiung als Planungsannahme; keine Statusprüfung'],
    ['Wohnfläche / Vergleich', reference.value === null ? reference.message : decimal(numeric(f.area)) + ' m² · ' + money(reference.value) + '/m²' + (reference.reference === null ? '' : ' · eigener Vergleich ' + money(reference.reference) + '/m²' + (reference.above ? ' (überschritten)' : ''))]
  ];
  entries.forEach(([label, value]) => { list.append(node('dt', label), node('dd', value)); }); fragment.append(list);
  fragment.append(node('h2', 'Kostenannahmen für das Jahr'));
  const table = node('table'), head = node('thead'), header = node('tr');
  ['Position', 'Zahlung', 'Erstattung', 'Steuerabzug'].forEach(text => header.append(node('th', text))); head.append(header); table.append(head);
  const body = node('tbody');
  costs.rows.forEach(row => {
    const tr = node('tr');
    [row.name + (row.evidence ? ' · ' + row.evidence : ''), money(row.annualPayment), money(row.annualReimbursement) + (row.forwardUnknown ? ' (offen)' : ''), money(row.annualDeduction) + (row.taxUnknown ? ' (offen)' : '')].forEach(text => tr.append(node('td', text)));
    body.append(tr);
  }); table.append(body); fragment.append(table, node('h2', 'Annahmen und offene Punkte'));
  const ul = node('ul'); notes.forEach(text => ul.append(node('li', text)));
  const notesSection = node('section', undefined, 'mr-print-notes');
  notesSection.append(fragment.lastChild, ul);
  notesSection.append(node('p', 'Planungsmodell mit deinen Angaben, keine vollständige Steuer- oder Mietrechtsprüfung. Rücklage/Puffer sind Zahlungen ohne automatischen Abzug. AfA nicht nochmals als Zahlung erfasst. Der Vergleich pro m² ist keine gesetzliche Mietpreisgrenze.'));
  fragment.append(notesSection);
  sheet.replaceChildren(fragment);
}

export function renderResult(root, result, tariff) {
  const q = s => root.querySelector(s), all = s => [...root.querySelectorAll(s)], doc = root.ownerDocument;
  const { fields: f, solved, costs, income, model, afaResult, purchase, period, lines } = result;
  const cash = Math.round(solved.monthlyCash * 100) / 100 || 0, shortfall = cash < 0;
  const allowed = f.vat === 'exempt';
  const outputs = {
    prescription: lines.filter(row => row.group === 'house').reduce((sum, row) => sum + row.amount * (row.period === 'month' ? 1 : 1 / 12), 0),
    tenant: costs.annualReimbursements / 12, payments: costs.annualCashCosts / 12, ownCosts: (costs.annualCashCosts - costs.annualReimbursements) / 12,
    taxCosts: costs.annualTaxCosts, rent: solved.rent, total: (solved.annualRent + costs.annualReimbursements) / 12, cash,
    tax: solved.annualTax / 12, headline: result.input.mode === 'target' ? solved.rent : Math.abs(cash),
    salaryBase: income.base, salaryAppliedDeduction: income.appliedDeduction, annualAfa: model.annualAfa,
    purchase: purchase?.price, saving: purchase?.saving, burden: purchase?.burden, afterPurchase: purchase?.afterPurchase,
    annualRent: solved.annualRent, annualCash: solved.annualCash, annualReimbursement: costs.annualReimbursements,
    annualPayments: costs.annualCashCosts, annualTax: solved.annualTax
  };
  all('[data-out]').forEach(node => node.textContent = money(outputs[node.dataset.out]));
  q('[data-result-title]').textContent = result.input.mode === 'target' ? 'Diese Hauptmiete brauchst du.' : shortfall ? 'Hier musst du noch zuzahlen.' : 'Das bleibt dir von der Miete.';
  q('[data-result-label]').textContent = result.input.mode === 'target' ? 'Ohne Kostenersatz · je vermietetem Monat' : shortfall ? 'Nötiger Zuschuss · Monatsdurchschnitt' : 'Nach Kosten und zusätzlicher Steuer · Monatsdurchschnitt';
  q('[data-result-content]').hidden = !allowed; q('[data-result-details]').hidden = !allowed;
  q('[data-print]').disabled = !allowed;
  q('[data-caveat]').textContent = allowed
    ? period.rentMonths + ' Mietmonate · Saldo = Jahresergebnis ÷ 12. Offene Abzüge: 0 €. Ohne USt (Annahme).'
    : 'Für diesen Umsatzsteuerstatus gibt es kein Ergebnis. Bitte unter „Gebäude-AfA & Umsatzsteuer“ den Status prüfen.';
  q('[data-shortfall-note]').hidden = !shortfall || !allowed;
  q('[data-shortfall-note]').textContent = 'Im Jahresdurchschnitt fehlen dir ' + money(Math.abs(cash)) + ' pro Monat. Ein möglicher steuerlicher Verlustausgleich ist nicht berücksichtigt.';
  q('[data-income-explain]').textContent = f.incomeMode === 'provided' ? 'Bereinigte Basis direkt übernommen; kein weiterer Werbungskostenabzug.'
    : money(numeric(f.salary)) + ' KZ 245 minus einmal ' + money(income.appliedDeduction) + ' Werbungskosten.';
  renderAfa(root, afaResult);
  const notes = assumptionsFor(result);
  q('[data-assumptions]').replaceChildren(...notes.map(text => { const li = doc.createElement('li'); li.textContent = text; return li; }));
  q('[data-assumption-count]').textContent = notes.length; q('[data-assumptions-wrap]').hidden = notes.length === 0;
  q('[data-open-cost]').textContent = costs.unknownForward.length + ' offene Erstattungen, ' + costs.unknownTax.length + ' offene Steuerabzüge. Jeweils vorerst 0 €.';
  const cutoff = tariff.brackets.find(b => b.upTo === null || income.base + Math.max(0, solved.rentalIncome) <= b.upTo);
  q('[data-tax-explain]').textContent = 'Gehalts-Tarifbasis ' + money(income.base) + '/Jahr. Vermietungseinkünfte ' + money(solved.rentalIncome) + '/Jahr, einschließlich Kostenersatz und abzüglich separat angegebener Kosten/AfA. Oberster betroffener Tarifteil: ' + Math.round(cutoff.rate * 100) + ' %. Nur der jeweilige Einkommensteil wird so besteuert. Persönliche Sonderfälle fehlen.';
  q('[data-summary="income"]').textContent = money(income.base) + ' / Jahr';
  q('[data-summary="costs"]').textContent = money(costs.annualCashCosts / 12) + ' / Monat · ' + costs.rows.filter(row => row.forwardUnknown || row.taxUnknown).length + ' offen';
  q('[data-summary="afa"]').textContent = model.annualAfa === 0 && (period.mode === 'year' ? f.yearAfaMode === 'unknown' : afaResult.status === 'open') ? 'AfA offen' : money(model.annualAfa) + ' / Jahr';
  q('[data-summary="result"]').textContent = notes.length + ' Hinweise';
  q('[data-investment-result]').hidden = !purchase || !allowed;
  q('[data-investment-note]').textContent = !allowed ? 'Vergleich nur ohne Umsatzsteuer verfügbar.' : result.purchaseError || 'Nach der Anschaffung bleiben im Kaufjahr ' + money(purchase.burden) + ' weniger frei verfügbar.' + (solved.rentalIncome - purchase.deduction < 0 ? ' Ein Verlustausgleich ist nicht berücksichtigt.' : '');
  q('[data-summary="purchase"]').textContent = result.purchaseError ? 'Bitte prüfen' : money(purchase.price) + ' · optional';
  const reference = comparePerSquareMetre(solved.rent, f.area, f.referenceRent);
  q('[data-per-area]').textContent = reference.value === null ? reference.message : money(reference.value) + ' / m² bei ' + decimal(numeric(f.area)) + ' m²';
  q('[data-per-area]').hidden = f.area === '' && f.referenceRent === '';
  q('[data-reference-note]').hidden = !reference.above;
  q('[data-reference-note]').textContent = reference.above ? 'Über deinem Vergleichswert von ' + money(reference.reference) + '/m². Eigene Orientierung, keine gesetzliche Mietpreisgrenze.' : '';
  q('[data-summary="reference"]').textContent = reference.value === null ? 'Optional' : money(reference.value) + ' / m²';
  renderFlow(root, result);
  if (allowed) renderPrint(root, result, notes, reference);
  else q('[data-print-sheet]').textContent = 'Kein Ergebnisblatt: Umsatzsteuerstatus noch zu prüfen.';
}

export function renderError(root, error) {
  const q = s => root.querySelector(s);
  q('[data-error]').hidden = false; q('[data-error]').textContent = error.message;
  q('[data-result-content]').hidden = true; q('[data-result-details]').hidden = true;
  q('[data-investment-result]').hidden = true; q('[data-print]').disabled = true;
  q('[data-print-sheet]').textContent = 'Kein gültiges Ergebnisblatt. Eingaben prüfen: ' + error.message;
  root.querySelectorAll('[data-out]').forEach(node => node.textContent = '–');
  ['income', 'costs', 'afa', 'purchase'].forEach(key => q('[data-summary="' + key + '"]').textContent = 'Bitte prüfen');
  q('[data-open-cost]').textContent = 'Bitte die Eingaben prüfen.';
}
