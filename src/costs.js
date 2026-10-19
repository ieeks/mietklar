import { nonnegative } from './calc.js';

/** Cash, reimbursements and deductions are independent annual amounts. */
export function normalizeCost(line, context = {}) {
  if (context.mode !== undefined && !['full', 'year'].includes(context.mode)) throw new RangeError('Ungültiger Kostenzeitraum.');
  const name = String(line.name ?? '').trim();
  if (!name) throw new RangeError('Bitte eine Bezeichnung für die Kostenposition eingeben.');
  const fail = message => { throw new RangeError(`${name}: ${message}`); };
  if (!['month', 'year'].includes(line.period)) fail('Zeitraum Monat oder Jahr erforderlich.');
  if (!['unknown', 'tenant', 'partial', 'owner'].includes(line.payer)) fail('Weiterverrechnung ungültig.');
  if (!['unknown', 'full', 'annual', 'none'].includes(line.taxStatus)) fail('Steuerstatus ungültig.');
  const yearMode = context.mode === 'year';
  const months = (value, label) => {
    if (!Number.isInteger(value) || value < 0 || value > 12) fail(label + ': ganze Zahl von 0 bis 12 erforderlich.');
    return value;
  };
  const factor = line.period === 'month' ? (yearMode ? months(line.paymentMonths, 'Zahlungsmonate') : 12) : 1;
  const reimbursementFactor = line.period === 'month' ? (yearMode ? months(context.rentMonths, 'Mietmonate') : 12) : 1;
  const annualPayment = nonnegative(line.amount, name) * factor;
  let reimbursement = 0;
  if (line.payer === 'tenant') reimbursement = line.amount;
  if (line.payer === 'partial') reimbursement = nonnegative(line.forward, name);
  if (reimbursement > line.amount) fail('Erstattung darf den Zahlbetrag nicht überschreiten.');
  const annualReimbursement = reimbursement * reimbursementFactor;
  let annualDeduction = 0;
  const taxStatus = yearMode ? line.yearTaxStatus : line.taxStatus;
  if (yearMode && !['unknown', 'provided', 'none'].includes(taxStatus)) fail('Steuerstatus für das Planjahr ungültig.');
  if (!yearMode && taxStatus === 'full') annualDeduction = annualPayment;
  if (!yearMode && taxStatus === 'annual') annualDeduction = nonnegative(line.taxAnnual, name);
  if (yearMode && taxStatus === 'provided') annualDeduction = nonnegative(line.yearTaxAnnual, name);
  if (['reserve', 'buffer'].includes(line.kind) && (line.payer !== 'owner' || taxStatus !== 'none')) {
    fail('Bloße Rücklageneinzahlungen und Puffer bleiben hier ohne Erstattung und Steuerabzug.');
  }
  [annualPayment, annualReimbursement, annualDeduction].forEach(value => nonnegative(value, name));
  return {
    name, annualPayment, annualReimbursement, annualDeduction,
    forwardUnknown: line.amount > 0 && line.payer === 'unknown',
    taxUnknown: line.amount > 0 && taxStatus === 'unknown',
    evidence: String(line.evidence ?? '').trim()
  };
}

export function aggregateCosts(lines, context = {}) {
  const rows = lines.map(line => normalizeCost(line, context));
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

