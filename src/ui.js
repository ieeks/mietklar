
import { solveRent, comparePurchase, validateTariff } from './calc.js';
import { aggregateCosts } from './costs.js';

(async () => {
  const root = document.getElementById('mietklar-app');
  const q = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const el = key => q('[data-key="' + key + '"]');
  const val = key => Number(el(key).value);
  const money = value => new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(value);
  let step = 0, afaMode = 'known', tariff;
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

  function readCosts() {
    return all('[data-cost-row]').map(row => {
      const get = key => row.querySelector('[data-cost-' + key + ']').value;
      const line = {
        name: get('name'), amount: Number(get('amount')), period: get('period'),
        payer: get('payer'), forward: Number(get('forward')), taxStatus: get('tax'),
        taxAnnual: Number(get('tax-annual')), evidence: get('evidence'), kind: row.dataset.kind
      };
      const annual = line.amount * (line.period === 'month' ? 12 : 1);
      row.setAttribute('aria-label', line.name || 'Kostenposition');
      row.querySelector('[data-remove-cost]').setAttribute('aria-label', (line.name || 'Kostenposition') + ' entfernen');
      row.querySelector('[data-forward-wrap]').hidden = line.payer !== 'partial';
      row.querySelector('[data-forward-period]').textContent = line.period === 'month' ? 'Erwartete Erstattung / Monat (€)' : 'Erwartete Erstattung / Jahr (€)';
      row.querySelector('[data-tax-annual-wrap]').hidden = line.taxStatus !== 'annual';
      row.querySelector('[data-evidence-wrap]').hidden = row.dataset.kind === 'reserve';
      const deduction = line.taxStatus === 'full' ? annual : line.taxStatus === 'annual' ? line.taxAnnual : 0;
      row.querySelector('[data-tax-summary]').textContent = line.taxStatus === 'unknown'
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

  function showError(message) {
    q('[data-error]').hidden = false;
    q('[data-error]').textContent = message;
    q('[data-result-content]').hidden = true;
    q('[data-investment-result]').hidden = true;
    all('[data-out]').forEach(node => node.textContent = '–');
    q('[data-open-cost]').textContent = 'Bitte die Eingaben prüfen.';
    return false;
  }

  function compute() {
    if (!tariff) return false;
    contextHint();
    q('[data-purchase-afa]').hidden = el('treatment').value !== 'afa';
    const lines = readCosts();
    let invalid = false;
    for (const input of all('input[type="number"]')) {
      const row = input.closest('[data-cost-row]');
      const inactive = (input.hasAttribute('data-cost-forward') && row.querySelector('[data-cost-payer]').value !== 'partial')
        || (input.hasAttribute('data-cost-tax-annual') && row.querySelector('[data-cost-tax]').value !== 'annual')
        || (input === el('purchaseAfa') && el('treatment').value !== 'afa')
        || ([el('building'), el('rate')].includes(input) && afaMode === 'known')
        || (input === el('afa') && afaMode !== 'known');
      const bad = !inactive && (input.value === '' || !Number.isFinite(Number(input.value)) || Number(input.value) < 0);
      input.setAttribute('aria-invalid', String(bad));
      invalid ||= bad;
    }
    if (afaMode !== 'known' && val('rate') > 100) invalid = true;
    if (invalid) return showError('Bitte gültige Beträge ab 0 eingeben. Aktive Zahlenfelder dürfen nicht leer sein.');
    let costs, solved;
    const base = Math.max(0, val('salary') - val('salaryDeduction'));
    const afa = afaMode === 'known' ? val('afa') : val('building') * val('rate') / 100;
    try {
      costs = aggregateCosts([...lines, {
        name: 'Persönlicher Puffer', amount: val('buffer'), period: 'month',
        kind: 'buffer', payer: 'owner', taxStatus: 'none'
      }]);
      solved = solveRent({
        base, annualCashCosts: costs.annualCashCosts,
        annualReimbursements: costs.annualReimbursements,
        annualTaxCosts: costs.annualTaxCosts, annualAfa: afa, target: val('target')
      }, tariff);
    } catch (error) { return showError(error.message); }
    q('[data-error]').hidden = true;
    const rent = solved.rent, e = solved.rentalIncome;
    const tenant = costs.annualReimbursements / 12;
    const payments = costs.annualCashCosts / 12;
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
      rent, total: rent + tenant, cash: solved.monthlyCash, tax: solved.annualTax / 12,
      annualAfa: afa, purchase, saving, burden, afterPurchase
    };
    all('[data-out]').forEach(node => node.textContent = money(outputs[node.dataset.out]));
    q('[data-open-cost]').textContent = costs.unknownForward.length + ' Position(en) mit offener Erstattung; '
      + costs.unknownTax.length + ' mit offenem Steuerabzug. Ungeklärt heißt jeweils vorerst 0 € Erstattung bzw. 0 € Abzug.';
    const assumptions = [];
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
      : 'Planung für 12 vermietete Monate mit angenommener Kleinunternehmerbefreiung. '
        + (costs.unknownTax.length ? 'Offene Steuerabzüge sind mit 0 € angesetzt. ' : '')
        + 'Mietererstattungen zählen als Einnahmen; nur die gesondert angegebenen Jahresabzüge mindern die Steuerbasis.';
    const cutoff = tariff.brackets.find(b => b.upTo === null || base + Math.max(0, e) <= b.upTo);
    q('[data-tax-explain]').textContent = 'Tarifbasis aus dem Gehalt: ' + money(base)
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
    const names = ['Ziel & Einkommen', 'Wohnungskosten', 'AfA & Steuer', 'Ergebnis', 'Anschaffung'];
    all('[data-panel]').forEach(panel => panel.hidden = Number(panel.dataset.panel) !== step);
    q('[data-progress-text]').textContent = 'Schritt ' + (step + 1) + ' von 5 · ' + names[step];
    all('.mr-dot').forEach((dot, i) => dot.dataset.on = String(i <= step));
    q('[data-back]').hidden = step === 0;
    q('[data-next]').hidden = step === 4;
    q('[data-next]').textContent = ['Weiter zu den Kosten →', 'Weiter zur AfA →', 'Ergebnis ansehen →', 'Anschaffung vergleichen →', ''][step];
    compute();
    root.scrollIntoView({ block: 'start' });
  }
  root.addEventListener('click', event => {
    if (event.target.closest('[data-add-cost]')) {
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
  });
  q('[data-home]').addEventListener('click', () => {
    step = 0; show();
    const heading = q('[data-panel="0"] h2'); heading.tabIndex = -1; heading.focus({ preventScroll: true });
  });
  q('[data-next]').addEventListener('click', () => { if (compute()) { step = Math.min(4, step + 1); show(); } });
  q('[data-back]').addEventListener('click', () => { step = Math.max(0, step - 1); show(); });
  root.addEventListener('input', compute);
  root.addEventListener('change', compute);
  all('[data-afa-mode]').forEach(button => button.addEventListener('click', () => {
    afaMode = button.dataset.afaMode;
    all('[data-afa-mode]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    q('[data-afa-known]').hidden = afaMode !== 'known';
    q('[data-afa-help]').hidden = afaMode === 'known';
    compute();
  }));
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
})();

