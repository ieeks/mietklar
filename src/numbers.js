// Accept decimal comma or decimal point. Grouped German input needs a comma
// (1.234,56); a single point without a comma always means a decimal point.
export function parseAmount(raw) {
  if (typeof raw !== 'string') throw new TypeError('Zahlenwert muss als Text vorliegen.');
  if (raw === '') return null;
  const text = raw.trim();
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
  catch { return raw === '-' || /^-?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?$/.test(raw); }
}

export const numeric = raw => { try { return parseAmount(raw); } catch { return NaN; } };
export const money = value => Number.isFinite(value)
  ? new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(value) : '–';
export const decimal = value => new Intl.NumberFormat('de-AT', { maximumFractionDigits: 2 }).format(value);
