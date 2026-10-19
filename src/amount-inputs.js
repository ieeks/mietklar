import { formatMoneyInput, numeric } from './numbers.js?v=0.7.0-alpha.3';

// Keep the exact draft separate from the grouped display: formatting must not
// round calculation inputs, rewrite backups, or cause a second blur render.
export function createAmountInputs(root) {
  const rawValues = new WeakMap();
  const isMoney = input => input.matches?.('input[data-money]');
  const readValue = input => rawValues.has(input) ? rawValues.get(input) : input.value;
  function writeValue(input, raw) {
    if (!isMoney(input)) { input.value = raw; return; }
    rawValues.set(input, raw);
    input.value = root.ownerDocument.activeElement === input ? raw : formatMoneyInput(raw);
  }
  function refresh() {
    root.querySelectorAll('input[data-money]').forEach(input => {
      if (!rawValues.has(input)) writeValue(input, input.value);
    });
  }
  root.addEventListener('focusin', event => {
    const input = event.target;
    if (!isMoney(input)) return;
    rawValues.set(input, readValue(input));
    // Let the browser finish its native focus/select operation first. Rewriting
    // value inside focusin can cancel Chromium's pending select-all operation.
    queueMicrotask(() => {
      if (root.ownerDocument.activeElement !== input) return;
      const raw = readValue(input);
      const selectedAll = input.selectionStart === 0 && input.selectionEnd === input.value.length;
      const editing = raw.includes(',') && Number.isFinite(numeric(raw)) ? raw.replaceAll('.', '') : raw;
      if (input.value !== editing) input.value = editing;
      if (selectedAll || (input.value !== '' && numeric(input.value) === 0)) input.select();
    });
  });
  root.addEventListener('click', event => {
    const input = event.target;
    // A pointer can place the caret after focusin. Select zero again after it.
    if (isMoney(input) && input.value !== '' && numeric(input.value) === 0) input.select();
  });
  root.addEventListener('input', event => {
    const input = event.target;
    if (!isMoney(input)) return;
    const raw = input.value, trimmed = raw.replace(/^(-?)0+(?=\d)/, '$1');
    // Also handle keyboards that leave a caret after the initial zero.
    if (trimmed !== raw && Number.isFinite(numeric(raw)) && numeric(trimmed) === numeric(raw)) {
      const start = input.selectionStart, end = input.selectionEnd, removed = raw.length - trimmed.length;
      input.value = trimmed;
      if (start !== null) input.setSelectionRange(Math.max(0, start - removed), Math.max(0, end - removed));
    }
    rawValues.set(input, input.value);
  });
  root.addEventListener('focusout', event => {
    if (isMoney(event.target)) event.target.value = formatMoneyInput(readValue(event.target));
  });
  refresh();
  return { readValue, writeValue, refresh };
}
