import { nonnegative } from './calc.js';

/** Cash, reimbursements and deductions are independent annual amounts. */
export function normalizeCost(line) {
  const name = String(line.name ?? '').trim();
  if (!name) throw new RangeError('Bitte eine Bezeichnung für die Kostenposition eingeben.');
  const fail = message => { throw new RangeError(`${name}: ${message}`); };
  if (!['month', 'year'].includes(line.period)) fail('Zeitraum Monat oder Jahr erforderlich.');
  if (!['unknown', 'tenant', 'partial', 'owner'].includes(line.payer)) fail('Weiterverrechnung ungültig.');
  if (!['unknown', 'full', 'annual', 'none'].includes(line.taxStatus)) fail('Steuerstatus ungültig.');
  const factor = line.period === 'month' ? 12 : 1;
  const annualPayment = nonnegative(line.amount, name) * factor;
  let reimbursement = 0;
  if (line.payer === 'tenant') reimbursement = line.amount;
  if (line.payer === 'partial') reimbursement = nonnegative(line.forward, name);
  if (reimbursement > line.amount) fail('Erstattung darf den Zahlbetrag nicht überschreiten.');
  const annualReimbursement = reimbursement * factor;
  let annualDeduction = 0;
  if (line.taxStatus === 'full') annualDeduction = annualPayment;
  if (line.taxStatus === 'annual') annualDeduction = nonnegative(line.taxAnnual, name);
  if (['reserve', 'buffer'].includes(line.kind) && (line.payer !== 'owner' || line.taxStatus !== 'none')) {
    fail('Bloße Rücklageneinzahlungen und Puffer bleiben hier ohne Erstattung und Steuerabzug.');
  }
  [annualPayment, annualReimbursement, annualDeduction].forEach(value => nonnegative(value, name));
  return {
    name, annualPayment, annualReimbursement, annualDeduction,
    forwardUnknown: line.amount > 0 && line.payer === 'unknown',
    taxUnknown: line.amount > 0 && line.taxStatus === 'unknown',
    evidence: String(line.evidence ?? '').trim()
  };
}

export function aggregateCosts(lines) {
  const rows = lines.map(normalizeCost);
  const sum = key => nonnegative(rows.reduce((total, row) => total + row[key], 0), key);
  return {
    rows,
    annualCashCosts: sum('annualPayment'),
    annualReimbursements: sum('annualReimbursement'),
    annualTaxCosts: sum('annualDeduction'),
    unknownForward: rows.filter(row => row.forwardUnknown),
    unknownTax: rows.filter(row => row.taxUnknown)
  };
}
