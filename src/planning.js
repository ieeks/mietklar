import { nonnegative, cashAtRent, solveRent } from './calc.js?v=0.7.0-alpha.3';

/** One salary income only. Already adjusted bases must never receive another deduction. */
export function resolveIncomeBase(input) {
  if (input.mode === 'provided') {
    return { base: nonnegative(input.base, 'Bereinigte Tarifbasis'), appliedDeduction: 0, notes: [] };
  }
  if (input.mode !== 'payslip') throw new RangeError('Ungültiger Einkommensweg.');
  const salary = nonnegative(input.salary, 'KZ 245');
  if (!['flat', 'custom'].includes(input.deductionMode)) throw new RangeError('Ungültige Werbungskostenauswahl.');
  const appliedDeduction = input.deductionMode === 'flat' ? 132
    : Math.max(132, nonnegative(input.deduction, 'Gesamte Werbungskosten'));
  const notes = [];
  if (input.deductionMode === 'custom' && input.deduction < 132) {
    notes.push('Für dieses Arbeitnehmer-Modell werden mindestens 132 € Werbungskostenpauschale angesetzt; keine zusätzliche Pauschale neben höheren Gesamtkosten.');
  }
  if (appliedDeduction > salary) {
    notes.push('Der Werbungskostenabzug übersteigt KZ 245. Die Gehaltsbasis ist hier auf 0 € begrenzt; ein möglicher Verlustausgleich wird nicht berechnet.');
  }
  return { base: Math.max(0, salary - appliedDeduction), appliedDeduction, notes };
}

/** Both directions use exactly the same annual cash and tax model. */
export function calculateScenario(input, model, tariff) {
  for (const key of ['base', 'annualCashCosts', 'annualTaxCosts', 'annualAfa']) nonnegative(model[key], key);
  nonnegative(model.annualReimbursements ?? 0, 'Mietererstattungen');
  if (input.mode === 'target') return solveRent({ ...model, target: input.target }, tariff);
  if (input.mode !== 'rent') throw new RangeError('Ungültige Rechenrichtung.');
  const rent = nonnegative(input.rent, 'Monatliche Hauptmiete');
  return { rent, ...cashAtRent(rent, model, tariff) };
}

