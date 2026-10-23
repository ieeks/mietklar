import { createAmountInputs } from './amount-inputs.js?v=0.8.0-alpha.3';
import { loadActiveTariff } from './tariff.js?v=0.8.0-alpha.3';
import { setupPersistence } from './storage-ui.js?v=0.8.0-alpha.3';
import { createCostEditor } from './cost-editor.js?v=0.8.0-alpha.3';
import { renderForm, renderTariff, landSuggestion } from './form-view.js?v=0.8.0-alpha.3';
import { evaluateScenario } from './scenario.js?v=0.8.0-alpha.3';
import { renderResult, renderError } from './result-view.js?v=0.8.0-alpha.3';

(async () => {
  const root = document.getElementById('mietklar-app');
  const q = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const field = key => q('[data-key="' + key + '"]');
  const amounts = createAmountInputs(root);
  const editor = createCostEditor(root, amounts.readValue);
  let tariff, persistence, calculationMode = 'target', adoptedLandSuggestion = false, legacyStep = 0;
  let lastFingerprint = null, lastValid = false;

  function captureState() {
    return { fields: Object.fromEntries(all('[data-key]').map(node => [node.dataset.key, amounts.readValue(node)])),
      costs: editor.capture(), calculationMode, step: legacyStep, adoptedLandSuggestion };
  }
  function applyState(state) {
    all('[data-key]').forEach(node => { amounts.writeValue(node, state.fields[node.dataset.key]); });
    editor.restore(state.costs); calculationMode = state.calculationMode;
    legacyStep = state.step; adoptedLandSuggestion = state.adoptedLandSuggestion;
    lastFingerprint = null;
  }
  function locateField(key) {
    if (!key?.startsWith('cost:')) return key ? field(key) : null;
    const [, index, name] = key.split(':');
    const suffix = { taxAnnual: 'tax-annual', paymentMonths: 'payment-months', yearTaxAnnual: 'year-tax-annual' }[name] || name;
    return all('[data-cost-row]')[Number(index)]?.querySelector('[data-cost-' + suffix + ']');
  }
  function compute(light = false, force = false) {
    if (!tariff) return false;
    amounts.refresh();
    const state = captureState();
    const fingerprint = JSON.stringify(state);
    // A native change event often repeats the preceding input on blur. Avoid
    // replacing summary text during the pointer event that opens its details.
    if (!force && fingerprint === lastFingerprint) return lastValid;
    lastFingerprint = fingerprint;
    all('[aria-invalid="true"]').forEach(node => node.setAttribute('aria-invalid', 'false'));
    try {
      renderForm(root, state, tariff.year);
      if (!light) editor.render(state.fields);
      const result = evaluateScenario(state, tariff);
      q('[data-error]').hidden = true;
      renderResult(root, result, tariff);
      lastValid = true; return true;
    } catch (error) {
      renderError(root, error);
      const input = locateField(error.field);
      if (input) input.setAttribute('aria-invalid', 'true');
      lastValid = false; return false;
    }
  }
  function changed(light = false) { compute(light); persistence?.scheduleSave(); }

  root.addEventListener('input', event => {
    if (event.target.closest('[data-storage-panel]')) return;
    editor.changeKind(event.target);
    if (event.target.matches('[data-slider]')) {
      amounts.writeValue(field(calculationMode === 'target' ? 'target' : 'monthlyRent'), event.target.value);
      changed(true); return;
    }
    if (adoptedLandSuggestion && event.target.hasAttribute('data-land-guide')) {
      field('afaLandStatus').value = 'unknown'; field('afaLandPercent').value = ''; adoptedLandSuggestion = false;
    }
    if (['afaLandPercent', 'afaLandStatus'].includes(event.target.dataset.key)) adoptedLandSuggestion = false;
    changed();
  });
  // Select changes and native month controls also work in engines that omit input events.
  root.addEventListener('change', event => {
    if (!event.target.closest('[data-storage-panel]')) {
      editor.changeKind(event.target);
      if (adoptedLandSuggestion && event.target.hasAttribute('data-land-guide')) {
        field('afaLandStatus').value = 'unknown'; field('afaLandPercent').value = ''; adoptedLandSuggestion = false;
      }
      changed();
    }
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.closest('[data-storage-panel]')) return;
    if (button.hasAttribute('data-home')) {
      root.scrollIntoView({ block: 'start' });
      const heading = q('[data-result-title]'); heading.tabIndex = -1; heading.focus({ preventScroll: true });
    } else if (button.hasAttribute('data-collapse-all')) {
      all('details[open]').forEach(details => { details.open = false; });
      button.focus({ preventScroll: true });
      button.scrollIntoView({ block: 'nearest' });
    } else if (button.hasAttribute('data-calc-mode')) {
      calculationMode = button.dataset.calcMode; changed();
    } else if (button.hasAttribute('data-add-cost')) {
      const row = editor.add(); changed();
      if (row) { row.querySelector('[data-cost-name]').focus(); row.querySelector('[data-cost-name]').select(); }
    } else if (button.hasAttribute('data-remove-cost')) {
      button.closest('[data-cost-row]').remove(); changed(); q('[data-add-cost]').focus();
    } else if (button.hasAttribute('data-apply-land')) {
      const suggestion = landSuggestion(captureState().fields);
      if (suggestion.percent === null) return;
      field('afaLandPercent').value = String(suggestion.percent); field('afaLandStatus').value = 'estimate';
      adoptedLandSuggestion = true; changed(); field('afaLandPercent').focus();
    } else if (button.hasAttribute('data-print') && compute(false, true) && field('vat').value === 'exempt') {
      window.print();
    }
  });
  window.addEventListener('beforeprint', () => compute(false, true));

  try {
    tariff = await loadActiveTariff();
    renderTariff(root, tariff);
    compute();
    persistence = setupPersistence({ root, tariffYear: tariff.year, captureState, applyState,
      refresh: () => compute(), isValid: () => q('[data-error]').hidden && field('vat').value === 'exempt' });
    root.dataset.ready = 'true';
  } catch (error) {
    renderError(root, new Error('Start nicht möglich: ' + error.message + '. Bitte über einen Webserver oder GitHub Pages öffnen.'));
    root.dataset.ready = 'error';
  }
})();


