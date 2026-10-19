
import { comparePurchase, validateTariff } from './calc.js';
import { aggregateCosts } from './costs.js';
import { resolveAfa, suggestLandShare } from './afa.js';
import { resolveIncomeBase, calculateScenario } from './planning.js';
import { setupPersistence } from './storage-ui.js';
import { MAX_COST_ROWS } from './persistence.js';
import { resolveYear, resolveYearAfa } from './year.js';

(async () => {
  const root = document.getElementById('mietklar-app');
  const q = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const el = key => q('[data-key="' + key + '"]');
  const val = key => Number(el(key).value);
  const money = value => new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(value);
  let step = 0, tariff, adoptedLandSuggestion = false, calculationMode = 'target', persistence = null;
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
    const row = document.getElementById('mr-cost-template').content.firstElementChild.cloneNode(true);
    row.dataset.kind = kind;
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

  function captureState() {
    const fields = Object.fromEntries(all('[data-key]').map(node => [node.dataset.key, node.value]));
    const costs = all('[data-cost-row]').map(row => {
      const get = key => row.querySelector('[data-cost-' + key + ']').value;
      return {
        name: get('name'), amount: get('amount'), period: get('period'),
        payer: get('payer'), forward: get('forward'), taxStatus: get('tax'),
        taxAnnual: get('tax-annual'), evidence: get('evidence'), kind: row.dataset.kind, group: row.dataset.group,
        paymentMonths: get('payment-months'), yearTaxStatus: get('year-tax'), yearTaxAnnual: get('year-tax-annual')
      };
    });
    return { fields, costs, calculationMode, step, adoptedLandSuggestion };
  }
  function applyState(state) {
    all('[data-key]').forEach(node => { node.value = state.fields[node.dataset.key]; });
    all('[data-cost-list]').forEach(list => list.replaceChildren());
    for (const cost of state.costs) {
      const row = addCost(cost);
      for (const [selector, value] of [
        ['payer', cost.payer], ['forward', cost.forward], ['tax', cost.taxStatus],
        ['tax-annual', cost.taxAnnual], ['evidence', cost.evidence], ['payment-months', cost.paymentMonths],
        ['year-tax', cost.yearTaxStatus], ['year-tax-annual', cost.yearTaxAnnual]
      ]) row.querySelector('[data-cost-' + selector + ']').value = value;
    }
    calculationMode = state.calculationMode; step = state.step;
    adoptedLandSuggestion = state.adoptedLandSuggestion;
  }

  function readCosts() {
    const yearMode = el('periodMode').value === 'year';
    q('[data-add-cost]').disabled = all('[data-cost-row]').length >= MAX_COST_ROWS;
    q('[data-add-cost]').title = all('[data-cost-row]').length >= MAX_COST_ROWS ? 'Höchstens 100 Kostenpositionen möglich' : '';
    return all('[data-cost-row]').map(row => {
      const get = key => row.querySelector('[data-cost-' + key + ']').value;
      const line = {
        name: get('name'), amount: Number(get('amount')), period: get('period'),
        payer: get('payer'), forward: Number(get('forward')), taxStatus: get('tax'),
        taxAnnual: Number(get('tax-annual')), evidence: get('evidence'), kind: row.dataset.kind,
        paymentMonths: Number(get('payment-months')), yearTaxStatus: get('year-tax'), yearTaxAnnual: Number(get('year-tax-annual'))
      };
      const annual = line.amount * (line.period === 'month' ? (yearMode ? line.paymentMonths : 12) : 1);
      row.setAttribute('aria-label', line.name || 'Kostenposition');
      row.querySelector('[data-remove-cost]').setAttribute('aria-label', (line.name || 'Kostenposition') + ' entfernen');
      row.querySelector('[data-forward-wrap]').hidden = line.payer !== 'partial';
      row.querySelector('[data-forward-period]').textContent = line.period === 'month' ? 'Erwartete Erstattung / Monat (€)' : 'Erwartete Erstattung / Jahr (€)';
      row.querySelector('[data-tax-annual-wrap]').hidden = line.taxStatus !== 'annual';
      row.querySelector('[data-payment-months-wrap]').hidden = line.period !== 'month';
      row.querySelector('[data-year-tax-annual-wrap]').hidden = line.yearTaxStatus !== 'provided';
      row.querySelector('[data-evidence-wrap]').hidden = row.dataset.kind === 'reserve';
      const deduction = yearMode ? (line.yearTaxStatus === 'provided' ? line.yearTaxAnnual : 0)
        : line.taxStatus === 'full' ? annual : line.taxStatus === 'annual' ? line.taxAnnual : 0;
      row.querySelector('[data-tax-summary]').textContent = (yearMode ? line.yearTaxStatus : line.taxStatus) === 'unknown'
        ? 'Steuerabzug: noch prüfen · vorerst 0 €'
        : 'Steuerabzug: ' + money(deduction) + ' / Jahr';
      row.querySelector('[data-cost-equivalent]').textContent = 'Zahlung: ' + money(annual) + ' / Jahr · ' + money(annual / 12) + ' / Monat im Durchschnitt';
      return line;
    });
  }

  function contextHint() {
    const law = el('rentalLaw').value, contract = el('contract').value;
    let hint = law === 'full'
      ? 'Bei MRG-Vollanwendung gelten die gesetzlichen Betriebskostenregeln. Ein Betrag in deiner WEG-Vorschreibung ist dadurch nicht automatisch Mieter-BK.'
      : law === 'partial'
        ? 'Bei MRG-Teilanwendung ist für zusätzliche Kosten eine wirksame Vereinbarung maßgeblich. Die App bewertet keine Vertragsklauseln.'
        : 'Die mietrechtliche Einordnung ist noch offen oder benötigt eine eigene Prüfung. Kosten werden nicht automatisch zur Weiterverrechnung freigegeben.';
    hint += contract === 'none'
      ? ' Ohne Mietvertrag ist eine eingetragene Erstattung zunächst eine Planungsannahme für den späteren Vertrag.'
      : ' Prüfe die konkrete Kostenvereinbarung und den Verteilungsschlüssel im Vertrag.';
    q('[data-contract-hint]').textContent = hint;
  }

  function landSuggestion() {
    const suggestion = suggestLandShare({
      municipality: el('afaMunicipality').value, priceBand: el('afaLandPriceBand').value,
      units: el('afaUnits').value, exception: el('afaLandException').value
    });
    q('[data-land-suggestion]').textContent = suggestion.message;
    q('[data-apply-land]').disabled = suggestion.percent === null;
    return suggestion;
  }

  function readAfa() {
    const number = key => el(key).value === '' ? null : Number(el(key).value);
    const mode = el('afaMode').value;
    all('[data-afa-section]').forEach(section => section.hidden = section.dataset.afaSection !== mode);
    q('[data-afa-evidence-wrap]').hidden = mode === 'unknown';
    landSuggestion();
    const result = resolveAfa({
      mode, annualAfa: number('afa'), evidence: el('afaEvidence').value,
      buildingBasis: number('building'), rate: number('rate'), basisStatus: el('afaBasisStatus').value,
      acquisition: el('afaAcquisition').value, previousUse: el('afaPreviousUse').value,
      purchaseYear: number('afaPurchaseYear'), price: number('afaPrice'),
      landPercent: number('afaLandPercent'), landStatus: el('afaLandStatus').value,
      transferTax: number('afaTransferTax'), registration: number('afaRegistration'),
      legal: number('afaLegal'), broker: number('afaBroker'), other: number('afaOther'),
      firstYearMonths: el('afaFirstMonths').value === 'unknown' ? null : Number(el('afaFirstMonths').value)
    }, 2026);
    q('[data-afa-status]').textContent = result.status === 'open' ? result.notes[0]
      : mode === 'purchase'
        ? 'Vorläufige Kaufherleitung: ' + money(result.annualAfa) + ' reguläre Gebäude-AfA pro vollem Jahr. Deine Angaben sind nicht durch die App geprüft.'
        : 'Volljahreswert als Grundlage: ' + money(result.annualAfa) + ' Gebäude-AfA. '
          + (result.status === 'estimate' ? 'Grundlage ist eine Planungsannahme.' : 'Wert von dir angegeben; keine Prüfung durch die App.');
    q('[data-afa-purchase-breakdown]').hidden = result.totalAcquisition === null;
    q('[data-afa-total]').textContent = result.totalAcquisition === null ? '–' : money(result.totalAcquisition);
    q('[data-afa-land]').textContent = result.landValue === null ? '–' : money(result.landValue);
    q('[data-afa-building]').textContent = result.buildingBasis === null ? '–' : money(result.buildingBasis);
    q('[data-afa-first-wrap]').hidden = result.firstYearAfa === null;
    q('[data-afa-first]').textContent = result.firstYearAfa === null ? '–' : money(result.firstYearAfa);
    return result;
  }

  function renderCalculationMode() {
    const forward = calculationMode === 'rent';
    all('[data-calc-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.calcMode === calculationMode)));
    all('[data-calc-field]').forEach(field => field.hidden = field.dataset.calcField !== calculationMode);
    q('[data-start-eyebrow]').textContent = forward ? 'Miete & Einkommen' : 'Ziel & Einkommen';
    q('[data-start-title]').textContent = forward ? 'Was bleibt dir von der Miete?' : 'Was soll dir bleiben?';
    q('[data-start-intro]').textContent = forward
      ? 'Gib die Hauptmiete vor. Wir berechnen deinen Überschuss nach Kosten und zusätzlicher Einkommensteuer.'
      : 'Dein monatlicher Überschuss nach Kosten und zusätzlicher Einkommensteuer.';
    if (step === 0) q('[data-progress-text]').textContent = 'Schritt 1 von 5 · ' + (forward ? 'Miete & Einkommen' : 'Ziel & Einkommen');
    all('[data-income-section]').forEach(section => section.hidden = section.dataset.incomeSection !== el('incomeMode').value);
    q('[data-deduction-custom]').hidden = el('deductionMode').value !== 'custom';
  }

  function showError(message) {
    q('[data-error]').hidden = false;
    q('[data-error]').textContent = message;
    q('[data-result-content]').hidden = true;
    q('[data-investment-result]').hidden = true;
    all('[data-out]').forEach(node => node.textContent = '–');
    q('[data-open-cost]').textContent = 'Bitte die Eingaben prüfen.';
    q('[data-afa-status]').textContent = 'Berechnung derzeit nicht möglich. Bitte die Eingaben prüfen.';
    q('[data-afa-purchase-breakdown]').hidden = true;
    q('[data-afa-first-wrap]').hidden = true;
    return false;
  }

  function renderPeriod() {
    const yearMode = el('periodMode').value === 'year';
    all('[data-year-only]').forEach(node => node.hidden = !yearMode);
    all('[data-full-only]').forEach(node => node.hidden = yearMode);
    all('[data-year-afa-section]').forEach(node => node.hidden = node.dataset.yearAfaSection !== el('yearAfaMode').value);
    q('[data-target-label]').textContent = yearMode ? 'Wunschüberschuss als Jahresdurchschnitt / Monat (€)' : 'Wunschüberschuss / Monat (€)';
    all('[data-tenant-label]').forEach(node => node.textContent = yearMode ? 'Kostenersatz · Jahresdurchschnitt / Monat' : 'Erwarteter Kostenersatz / Monat');
    all('[data-total-label]').forEach(node => node.textContent = yearMode ? 'Mietereinnahmen · Jahresdurchschnitt / Monat' : 'Gesamtzahlung des Mieters / Monat');
    q('[data-year-result]').hidden = !yearMode;
    if (yearMode) {
      try {
        const year = resolveYear({ mode: 'year', startMonth: val('startMonth'), vacantMonths: el('vacantMonths').value === '' ? NaN : val('vacantMonths') });
        q('[data-year-summary]').textContent = year.rentMonths + ' Mietmonate in 2026. Dein Wunschbetrag gilt im Durchschnitt über alle 12 Kalendermonate. 1.000 € pro Monat bedeuten 12.000 € im Jahr, auch bei einem späten Start.';
      } catch { q('[data-year-summary]').textContent = 'Bitte Startmonat und Leerstand prüfen.'; }
    }
  }

  function compute() {
    if (!tariff) return false;
    renderCalculationMode();
    renderPeriod();
    contextHint();
    q('[data-purchase-afa]').hidden = el('treatment').value !== 'afa';
    const lines = readCosts();
    let invalid = false;
    for (const input of all('input[type="number"]')) {
      // AfA fields are validated by the selected route, with incomplete routes explicitly using 0.
      if (input.closest('[data-afa-section]')) { input.setAttribute('aria-invalid', 'false'); continue; }
      const row = input.closest('[data-cost-row]');
      const yearMode = el('periodMode').value === 'year';
      const inactive = (input.closest('[data-year-only]') && !yearMode)
        || (input.closest('[data-full-only]') && yearMode)
        || (input.closest('[data-year-afa-section]') && input.closest('[data-year-afa-section]').dataset.yearAfaSection !== el('yearAfaMode').value)
        || (input.hasAttribute('data-cost-payment-months') && row.querySelector('[data-cost-period]').value !== 'month')
        || (input.hasAttribute('data-cost-year-tax-annual') && row.querySelector('[data-cost-year-tax]').value !== 'provided')
        || (input.hasAttribute('data-cost-forward') && row.querySelector('[data-cost-payer]').value !== 'partial')
        || (input.hasAttribute('data-cost-tax-annual') && row.querySelector('[data-cost-tax]').value !== 'annual')
        || (input === el('purchaseAfa') && el('treatment').value !== 'afa')
        || (input === el('target') && calculationMode !== 'target')
        || (input === el('monthlyRent') && calculationMode !== 'rent')
        || (input.closest('[data-income-section]') && input.closest('[data-income-section]').dataset.incomeSection !== el('incomeMode').value)
        || (input === el('salaryDeduction') && el('deductionMode').value !== 'custom');
      const bad = !inactive && (input.value === '' || !Number.isFinite(Number(input.value)) || Number(input.value) < 0);
      input.setAttribute('aria-invalid', String(bad));
      invalid ||= bad;
    }
    if (invalid) return showError('Bitte gültige Beträge ab 0 eingeben. Aktive Zahlenfelder dürfen nicht leer sein.');
    let costs, solved, afaResult, income, base, afa, period, yearAfa;
    try {
      income = resolveIncomeBase({
        mode: el('incomeMode').value, salary: val('salary'), base: val('salaryBase'),
        deductionMode: el('deductionMode').value, deduction: val('salaryDeduction')
      });
      base = income.base;
      period = resolveYear({ mode: el('periodMode').value, startMonth: val('startMonth'), vacantMonths: val('vacantMonths') });
      try { afaResult = readAfa(); }
      catch (error) {
        if (period.mode !== 'year' || el('yearAfaMode').value === 'regular') throw error;
        afaResult = { status: 'open', annualAfa: 0, notes: [] };
        q('[data-afa-status]').textContent = 'Volljahresbasis derzeit ungültig. Für dieses Kalenderjahr gilt die separate AfA-Auswahl unten.';
        q('[data-afa-purchase-breakdown]').hidden = true;
        q('[data-afa-first-wrap]').hidden = true;
      }
      yearAfa = resolveYearAfa({ period: period.mode, mode: el('yearAfaMode').value, amount: val('yearAfa'),
        months: el('yearAfaMonths').value === 'unknown' ? null : val('yearAfaMonths') }, afaResult);
      afa = yearAfa.annualAfa;
      costs = aggregateCosts([...lines, {
        name: 'Persönlicher Puffer', amount: val('buffer'), period: 'month',
        kind: 'buffer', payer: 'owner', taxStatus: 'none', paymentMonths: 12, yearTaxStatus: 'none', yearTaxAnnual: 0
      }], period);
      solved = calculateScenario({
        mode: calculationMode, target: val('target'), rent: val('monthlyRent')
      }, {
        base, annualCashCosts: costs.annualCashCosts,
        annualReimbursements: costs.annualReimbursements,
        annualTaxCosts: costs.annualTaxCosts, annualAfa: afa, rentMonths: period.rentMonths
      }, tariff);
    } catch (error) { return showError(error.message); }
    q('[data-error]').hidden = true;
    const rent = solved.rent, e = solved.rentalIncome;
    const tenant = costs.annualReimbursements / 12;
    const payments = costs.annualCashCosts / 12;
    const displayCash = Math.round(solved.monthlyCash * 100) / 100 || 0;
    const shortfall = displayCash < 0;
    const prescription = lines.filter((line, i) => all('[data-cost-row]')[i].dataset.group === 'house')
      .reduce((sum, line) => sum + line.amount * (line.period === 'month' ? 1 : 1 / 12), 0);
    const purchase = val('purchase');
    const deduction = el('treatment').value === 'instant' ? purchase : val('purchaseAfa');
    let saving = 0, burden = purchase, afterPurchase = solved.monthlyCash - purchase / 12;
    if (deduction <= purchase) {
      ({ saving, burden, afterPurchase } = comparePurchase({
        base, rentalIncome: e, monthlyCash: solved.monthlyCash, purchase, deduction
      }, tariff));
    }
    const outputs = {
      prescription, tenant, payments, ownCosts: payments - tenant, taxCosts: costs.annualTaxCosts,
      rent, total: solved.annualRent / 12 + tenant, cash: displayCash, tax: solved.annualTax / 12,
      headline: calculationMode === 'target' ? rent : Math.abs(displayCash),
      salaryBase: base, salaryAppliedDeduction: income.appliedDeduction,
      annualAfa: afa, purchase, saving, burden, afterPurchase,
      annualRent: solved.annualRent, annualCash: solved.annualCash,
      annualReimbursement: costs.annualReimbursements, annualPayments: costs.annualCashCosts, annualTax: solved.annualTax
    };
    all('[data-out]').forEach(node => node.textContent = money(outputs[node.dataset.out]));
    q('[data-income-explain]').textContent = el('incomeMode').value === 'provided'
      ? 'Bereinigte Basis direkt übernommen; kein weiterer Werbungskostenabzug durch die App.'
      : money(val('salary')) + ' KZ 245 minus ' + money(income.appliedDeduction) + ' angesetzte Werbungskosten. '
        + (income.notes.length ? income.notes.join(' ') : '');
    q('[data-result-title]').textContent = calculationMode === 'target'
      ? 'Diese Miete brauchst du.' : shortfall ? 'Hier musst du noch zuzahlen.' : 'Das bleibt dir von der Miete.';
    q('[data-result-label]').textContent = calculationMode === 'target'
      ? 'Benötigte Hauptmiete ohne Kostenersatz'
      : shortfall ? 'Nötiger Zuschuss aus eigener Tasche' : 'Überschuss nach Kosten und zusätzlicher Steuer';
    q('[data-result-rent-row]').hidden = calculationMode !== 'rent';
    q('[data-cash-label]').textContent = shortfall ? 'Monatlicher Saldo' : 'Für dich frei verfügbar';
    q('[data-cash-summary]').dataset.tone = shortfall ? 'negative' : 'normal';
    q('[data-result-content] .mr-result').dataset.tone = calculationMode === 'rent' && shortfall ? 'negative' : 'normal';
    q('[data-shortfall-note]').hidden = !shortfall;
    q('[data-shortfall-note]').textContent = shortfall
      ? 'Bei dieser Hauptmiete fehlen dir im Monatsdurchschnitt ' + money(Math.abs(displayCash))
        + '. Ein möglicher steuerlicher Verlustausgleich ist nicht berücksichtigt.' : '';
    q('[data-open-cost]').textContent = costs.unknownForward.length + ' Position(en) mit offener Erstattung; '
      + costs.unknownTax.length + ' mit offenem Steuerabzug. Ungeklärt heißt jeweils vorerst 0 € Erstattung bzw. 0 € Abzug.';
    const basisNotes = period.mode === 'full' || el('yearAfaMode').value === 'regular' ? afaResult.notes : [];
    const assumptions = [...income.notes, ...basisNotes.map(note => 'Gebäude-AfA-Basis: ' + note), ...yearAfa.notes];
    if (period.mode === 'year') assumptions.push('Kalenderjahr: ' + period.rentMonths + ' volle Mietmonate; Mietzahlungen im selben Jahr angenommen. Jahres-Kostenbeträge und Abzüge selbst abgrenzen. Vorherige Privatkosten nicht automatisch der Vermietung zugerechnet.');
    for (const row of costs.unknownForward) assumptions.push(row.name + ': Erstattung noch prüfen; vorerst von dir getragen.');
    for (const row of costs.unknownTax) assumptions.push(row.name + ': Steuerabzug noch prüfen; vorerst 0 € Abzug.');
    for (const row of costs.rows.filter(row => row.annualDeduction > 0 && !row.evidence)) {
      assumptions.push(row.name + ': Steuerabzug von dir angegeben; Quelle / Begründung noch nicht erfasst.');
    }
    if (tenant > 0) assumptions.push(el('contract').value === 'none'
      ? 'Geplanter Kostenersatz: Noch kein Mietvertrag; wirksame Vereinbarung vor Vermietung klären.'
      : 'Kostenersatz: Vertrag, Betrag und Verteilungsschlüssel sind von der App nicht geprüft.');
    if (el('rentalLaw').value === 'unknown') assumptions.push('Mietrechtliche Einordnung ist noch offen.');
    q('[data-assumptions]').replaceChildren(...assumptions.map(text => {
      const li = document.createElement('li'); li.textContent = text; return li;
    }));
    q('[data-assumption-count]').textContent = assumptions.length;
    q('[data-assumptions-wrap]').hidden = assumptions.length === 0;
    const vat = el('vat').value;
    q('[data-result-content]').hidden = vat !== 'exempt';
    q('[data-investment-result]').hidden = vat !== 'exempt'
      || (el('treatment').value === 'instant' && purchase > 1000)
      || (el('treatment').value === 'afa' && deduction > purchase);
    q('[data-caveat]').textContent = vat !== 'exempt'
      ? 'Für diesen Umsatzsteuerstatus gibt es noch kein Ergebnis. Bitte den Status im vorigen Schritt prüfen.'
      : (period.mode === 'year' ? 'Kalenderjahr 2026 mit ' + period.rentMonths + ' Mietmonaten. Hauptmiete je Mietmonat; alle Überschuss-/Kosten-/Steuer-Monatswerte = Jahresbetrag ÷ 12. ' : 'Planung für 12 vermietete Monate. ')
        + 'Angenommene Kleinunternehmerbefreiung. '
        + (costs.unknownTax.length ? 'Offene Steuerabzüge sind mit 0 € angesetzt. ' : '')
        + ((period.mode === 'full' && afaResult.status === 'open') || (period.mode === 'year' && el('yearAfaMode').value === 'unknown') ? 'Gebäude-AfA ist offen und mit 0 € angesetzt. ' : '')
        + 'Mietererstattungen zählen als Einnahmen; nur die gesondert angegebenen Jahresabzüge mindern die Steuerbasis.';
    const cutoff = tariff.brackets.find(b => b.upTo === null || base + Math.max(0, e) <= b.upTo);
    q('[data-tax-explain]').textContent = 'Tarifbasis vor Vermietung (' + (el('incomeMode').value === 'provided' ? 'direkt eingegeben' : 'aus KZ 245') + '): ' + money(base)
      + ' / Jahr. Vermietungsüberschuss: ' + money(e) + ' / Jahr. Darin enthalten: '
      + money(costs.annualReimbursements) + ' Mietererstattungen als Einnahmen, '
      + money(costs.annualTaxCosts) + ' angegebene Kostenabzüge und ' + money(afa)
      + ' Gebäude-AfA. Der oberste betroffene Tarifteil liegt bei ' + Math.round(cutoff.rate * 100)
      + ' %. Nur der jeweilige Einkommensteil wird so besteuert. Persönliche Sonderfälle fehlen.';
    let note = 'Nach der Anschaffung bleiben dir im Kaufjahr ' + money(burden) + ' weniger frei verfügbar.';
    if (el('treatment').value === 'instant' && purchase > 1000) note = 'Sofortabzug prüfen: Oberhalb der maßgeblichen 1.000-€-Grenze kommt regelmäßig eine Abschreibung in Betracht. Keine bestätigte steuerliche Einstufung.';
    if (el('treatment').value === 'afa' && deduction > purchase) note = 'Bitte den AfA-Betrag prüfen: Der Jahresabzug darf hier den Kaufpreis nicht überschreiten.';
    if (e - deduction < 0) note += ' Ein möglicher steuerlicher Verlustausgleich ist nicht berücksichtigt.';
    if (vat !== 'exempt') note = 'Der Anschaffungsvergleich ist nur für die Rechnung ohne Umsatzsteuer verfügbar.';
    q('[data-investment-note]').textContent = note;
    return true;
  }

  function show() {
    const names = [calculationMode === 'rent' ? 'Miete & Einkommen' : 'Ziel & Einkommen', 'Wohnungskosten', 'AfA & Steuer', 'Ergebnis', 'Anschaffung'];
    all('[data-panel]').forEach(panel => panel.hidden = Number(panel.dataset.panel) !== step);
    q('[data-progress-text]').textContent = 'Schritt ' + (step + 1) + ' von 5 · ' + names[step];
    all('.mr-dot').forEach((dot, i) => dot.dataset.on = String(i <= step));
    q('[data-back]').hidden = step === 0;
    q('[data-next]').hidden = step === 4;
    q('[data-next]').textContent = ['Weiter zu den Kosten →', 'Weiter zur AfA →', 'Ergebnis ansehen →', 'Anschaffung vergleichen →', ''][step];
    const valid = compute();
    root.scrollIntoView({ block: 'start' });
    return valid;
  }
  root.addEventListener('click', event => {
    if (event.target.closest('[data-storage-panel]')) return;
    if (event.target.closest('[data-add-cost]') && all('[data-cost-row]').length < MAX_COST_ROWS) {
      const row = addCost({ name: 'Eigene Position' });
      compute();
      row.querySelector('[data-cost-name]').focus();
      row.querySelector('[data-cost-name]').select();
    }
    const remove = event.target.closest('[data-remove-cost]');
    if (remove) {
      remove.closest('[data-cost-row]').remove();
      compute();
      q('[data-add-cost]').focus();
    }
    persistence?.scheduleSave();
  });
  q('[data-home]').addEventListener('click', () => {
    step = 0; show();
    const heading = q('[data-panel="0"] h2'); heading.tabIndex = -1; heading.focus({ preventScroll: true });
  });
  all('[data-calc-mode]').forEach(button => button.addEventListener('click', () => {
    calculationMode = button.dataset.calcMode;
    show();
  }));
  q('[data-change-calculation]').addEventListener('click', () => {
    step = 0; show();
    el(calculationMode === 'target' ? 'target' : 'monthlyRent').focus();
  });
  q('[data-next]').addEventListener('click', () => { if (compute()) { step = Math.min(4, step + 1); show(); } });
  q('[data-back]').addEventListener('click', () => { step = Math.max(0, step - 1); show(); });
  q('[data-apply-land]').addEventListener('click', () => {
    const suggestion = landSuggestion();
    if (suggestion.percent === null) return;
    el('afaLandPercent').value = suggestion.percent;
    el('afaLandStatus').value = 'estimate';
    adoptedLandSuggestion = true;
    compute();
    el('afaLandPercent').focus();
  });
  function handleInput(event) {
    if (event.target.closest('[data-storage-panel]')) return;
    if (adoptedLandSuggestion && event.target.hasAttribute('data-land-guide')) {
      el('afaLandStatus').value = 'unknown';
      el('afaLandPercent').value = '';
      adoptedLandSuggestion = false;
    }
    if ([el('afaLandPercent'), el('afaLandStatus')].includes(event.target)) adoptedLandSuggestion = false;
    compute();
    persistence?.scheduleSave();
  }
  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleInput);
  try {
    const response = await fetch(new URL('../data/tarif-2026.json', import.meta.url));
    if (!response.ok) throw new Error('Tarifdatei nicht erreichbar');
    tariff = validateTariff(await response.json());
    if (tariff.year !== 2026) throw new Error('Tarifjahr stimmt nicht mit der Oberfläche überein');
  } catch (error) {
    showError('Start nicht möglich: ' + error.message + '. Bitte über einen Webserver oder GitHub Pages öffnen.');
    return;
  }
  q('[data-next]').disabled = false;
  show();
  persistence = setupPersistence({
    root, tariffYear: tariff.year, captureState, applyState, refresh: show,
    isValid: () => q('[data-error]').hidden
  });
})();




