import { COST_TYPES, costGuidance } from './cost-guidance.js?v=0.8.0-alpha.2';
import { numeric, money } from './numbers.js?v=0.8.0-alpha.2';
import { MAX_COST_ROWS } from './persistence.js?v=0.8.0-alpha.2';

export function createCostEditor(root, readValue = input => input.value) {
  const q = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const doc = root.ownerDocument;
  function kindOptions(select, value = 'other') {
    select.replaceChildren(...Object.entries(COST_TYPES).map(([id, type]) => { const option = doc.createElement('option'); option.value = id; option.textContent = type.label; return option; }));
    select.value = value;
  }
  kindOptions(q('[data-new-cost-kind]'));
  const hints = {
    bk: 'Sammelposten: Einzelpositionen und Mietvertrag prüfen. Nicht pauschal vollständig weiterverrechnen.',
    water: 'Wasser und Abwasser: Kostenanteil, Abrechnung und Vereinbarung prüfen.',
    heat: 'Heizung und Warmwasser: Abrechnung und anwendbare Heizkostenregeln gesondert prüfen.',
    reserve: 'Bloße Einzahlung in den I-Fonds: hier Eigentümerzahlung, keine Mietererstattung und kein sofortiger Steuerabzug. Tatsächliche Arbeiten aus der Rücklage separat prüfen.',
    admin: 'Eigenen Vermietungsaufwand von bereits in den BK enthaltenen Verwaltungskosten trennen.',
    repair: 'Nur tatsächliche Zahlungen erfassen. Erhaltung, Herstellung und mehrjährige Verteilung sind gesondert zu prüfen.',
    adviser: 'Nur den Vermietungsanteil erfassen; bereits anders berücksichtigte Kosten nicht doppelt abziehen.',
    other: 'Kostenart, Vermietungsbezug, mögliche Erstattung und steuerlichen Jahresabzug einzeln prüfen.'
  };
  function addCost({ name, amount = 0, period = 'month', kind = 'other', group = 'custom' }) {
    const row = root.ownerDocument.getElementById('mr-cost-template').content.firstElementChild.cloneNode(true);
    row.dataset.kind = kind;
    kindOptions(row.querySelector('[data-cost-kind]'), kind);
    row.dataset.group = group;
    row.querySelector('[data-cost-name]').value = name;
    row.querySelector('[data-cost-amount]').value = amount;
    row.querySelector('[data-cost-period]').value = period;
    row.querySelector('[data-cost-hint]').textContent = hints[kind] || hints.other;
    if (kind === 'reserve') {
      row.querySelector('[data-cost-payer]').value = 'owner';
      row.querySelector('[data-cost-tax]').value = 'none';
      row.querySelector('[data-cost-payer]').disabled = true;
      row.querySelector('[data-cost-tax]').disabled = true;
      row.querySelector('[data-cost-year-tax]').value = 'none';
      row.querySelector('[data-cost-year-tax]').disabled = true;
    }
    q('[data-cost-list="' + group + '"]').append(row);
    return row;
  }
  [
    { name: 'Betriebskostenakonto', amount: 170, kind: 'bk', group: 'house' },
    { name: 'Wasser / Abwasser', amount: 30, kind: 'water', group: 'house' },
    { name: 'Heizkosten', amount: 50, kind: 'heat', group: 'house' },
    { name: 'Warmwasser', amount: 10, kind: 'heat', group: 'house' },
    { name: 'I-Fonds / WEG-Rücklage', amount: 75, kind: 'reserve', group: 'house' },
    { name: 'Eigene Verwaltung', kind: 'admin', group: 'own' },
    { name: 'Reparaturen', period: 'year', kind: 'repair', group: 'own' },
    { name: 'Steuerberatung', period: 'year', kind: 'adviser', group: 'own' }
  ].forEach(addCost);

  const keys = { name: 'name', amount: 'amount', period: 'period', payer: 'payer', forward: 'forward',
    taxStatus: 'tax', taxAnnual: 'tax-annual', evidence: 'evidence', paymentMonths: 'payment-months',
    yearTaxStatus: 'year-tax', yearTaxAnnual: 'year-tax-annual', composition: 'composition', agreement: 'agreement' };
  function capture() {
    return all('[data-cost-row]').map(row => ({ ...Object.fromEntries(Object.entries(keys).map(([key, suffix]) =>
      [key, readValue(row.querySelector('[data-cost-' + suffix + ']'))])), kind: row.dataset.kind, group: row.dataset.group }));
  }
  function restore(costs) {
    all('[data-cost-list]').forEach(list => list.replaceChildren());
    costs.forEach(cost => {
      const row = addCost(cost);
      for (const [key, suffix] of Object.entries(keys)) row.querySelector('[data-cost-' + suffix + ']').value = cost[key];
    });
  }
  function render(context) {
    const yearMode = context.periodMode === 'year';
    const rows = all('[data-cost-row]');
    q('[data-add-cost]').disabled = rows.length >= MAX_COST_ROWS;
    q('[data-add-cost]').title = rows.length >= MAX_COST_ROWS ? 'Höchstens 100 Kostenpositionen möglich' : '';
    rows.forEach(row => {
      const get = suffix => readValue(row.querySelector('[data-cost-' + suffix + ']'));
      const name = get('name') || 'Kostenposition', period = get('period');
      const annual = numeric(get('amount')) * (period === 'month' ? (yearMode ? numeric(get('payment-months')) : 12) : 1);
      row.setAttribute('aria-label', name);
      row.querySelector('[data-remove-cost]').setAttribute('aria-label', name + ' entfernen');
      row.querySelector('[data-forward-wrap]').hidden = get('payer') !== 'partial';
      row.querySelector('[data-forward-period]').textContent = period === 'month' ? 'Erwartete Erstattung / Mietmonat (€)' : 'Erwartete Erstattung / Jahr (€)';
      row.querySelector('[data-tax-annual-wrap]').hidden = get('tax') !== 'annual';
      row.querySelector('[data-payment-months-wrap]').hidden = period !== 'month';
      row.querySelector('[data-year-tax-annual-wrap]').hidden = get('year-tax') !== 'provided';
      row.querySelector('[data-evidence-wrap]').hidden = row.dataset.kind === 'reserve';
      const status = get(yearMode ? 'year-tax' : 'tax');
      const deduction = yearMode ? (status === 'provided' ? numeric(get('year-tax-annual')) : 0)
        : status === 'full' ? annual : status === 'annual' ? numeric(get('tax-annual')) : 0;
      row.querySelector('[data-tax-summary]').textContent = status === 'unknown' ? 'Steuerabzug: noch prüfen · vorerst 0 €'
        : 'Steuerabzug: ' + money(deduction) + ' / Jahr';
      const line = Object.fromEntries(Object.entries(keys).map(([key, suffix]) => [key, get(suffix)]));
      line.kind = row.dataset.kind;
      const guide = costGuidance(line, context);
      const set = (key, text) => { row.querySelector('[data-review-' + key + ']').textContent = text; };
      set('contents', guide.contents); set('context', guide.lawLabel); set('basis', guide.basis);
      set('agreement', guide.agreementText); set('tenant', guide.tenant); set('tax-status', guide.tax); set('tax', guide.taxText);
      set('checked', 'Quellen geprüft: ' + guide.checked + ' · Bedingte Prüfhilfe, keine Prüfung deines Vertrags.');
      const items = guide.steps.map(text => { const li = doc.createElement('li'); li.textContent = text; return li; });
      row.querySelector('[data-review-steps]').replaceChildren(...items);
      row.querySelector('[data-review-sources]').replaceChildren(...guide.sources.map(source => {
        const li = doc.createElement('li'), a = doc.createElement('a'); a.textContent = source.label; a.href = source.url;
        a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); return li;
      }));
      const notice = row.querySelector('[data-cost-next]');
      notice.textContent = guide.warnings.length ? guide.warnings.join(' ') : guide.steps[0];
      notice.dataset.warning = String(guide.warnings.length > 0);
      row.querySelector('[data-cost-hint]').textContent = hints[row.dataset.kind] || guide.contents;
      row.querySelector('[data-cost-equivalent]').textContent = 'Zahlung: ' + money(annual) + ' / Jahr · ' + money(annual / 12) + ' / Monat im Durchschnitt';
    });
  }
  function add() {
    if (all('[data-cost-row]').length >= MAX_COST_ROWS) return null;
    const kind = q('[data-new-cost-kind]').value;
    return addCost({ name: kind === 'other' ? 'Eigene Position' : COST_TYPES[kind].label, kind });
  }
  function changeKind(input) {
    if (!input.matches('[data-cost-kind]')) return;
    const row = input.closest('[data-cost-row]'), previous = row.dataset.kind;
    if (previous === input.value) return;
    row.dataset.kind = input.value;
    const reserve = input.value === 'reserve';
    for (const [suffix, value] of [['payer', 'owner'], ['tax', 'none'], ['year-tax', 'none']]) {
      const control = row.querySelector('[data-cost-' + suffix + ']');
      control.disabled = reserve;
      if (reserve) control.value = value;
      else if (previous === 'reserve') control.value = 'unknown';
    }
  }
  return { capture, restore, render, add, changeKind };
}


