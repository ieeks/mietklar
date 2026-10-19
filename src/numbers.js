// Accept decimal comma or decimal point. Grouped German input needs a comma
// (1.234,56). Ambiguous dot-only input such as 45.000 must be clarified.
export function parseAmount(raw) {
  if (typeof raw !== 'string') throw new TypeError('Zahlenwert muss als Text vorliegen.');
  if (raw === '') return null;
  const text = raw.trim();
  if (/^-?\d{1,3}\.\d{3}$/.test(text)) throw new RangeError('Mehrdeutiger Punkt: bitte 45000 oder 45.000,00 für fünfundvierzigtausend eingeben; für Dezimalstellen ein Komma verwenden.');
  let normalized = text;
  if (text.includes(',')) {
    if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+),\d*$/.test(text)) throw new RangeError('Bitte eine Zahl mit Dezimalkomma oder Dezimalpunkt eingeben.');
    normalized = text.replaceAll('.', '').replace(',', '.');
  } else if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
    throw new RangeError('Bitte eine gültige Zahl eingeben.');
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) throw new RangeError('Bitte einen endlichen Zahlenwert eingeben.');
  return value;
}

export function numericDraft(raw) {
  if (typeof raw !== 'string' || raw.length > 64 || (raw !== '' && !raw.trim()) || !/^[0-9.,eE+\- ]*$/.test(raw)) return false;
  try { const value = parseAmount(raw); return value === null || Math.abs(value) <= 1e12; }
  catch { return raw === '-' || /^-?\d{1,3}\.\d{3}$/.test(raw) || /^-?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?$/.test(raw); }
}

export const numeric = raw => { try { return parseAmount(raw); } catch { return NaN; } };
export const money = value => Number.isFinite(value)
  ? new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(value) : '–';
export const decimal = value => new Intl.NumberFormat('de-AT', { maximumFractionDigits: 2 }).format(value);

// Group the literal digits without rounding through Intl/Number. Monetary
// drafts with >2 decimal places keep every digit; invalid/ambiguous drafts stay.
export function formatMoneyInput(raw) {
  if (raw === '' || !Number.isFinite(numeric(raw))) return raw;
  const text = raw.trim();
  if (/[eE]/.test(text)) return raw;
  const plain = text.includes(',') ? text.replaceAll('.', '').replace(',', '.') : text;
  const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(plain);
  if (!match) return raw;
  const integer = (match[2] || '0').replace(/^0+(?=\d)/, '');
  const fraction = (match[3] || '').padEnd(2, '0');
  return match[1] + integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + fraction;
}
