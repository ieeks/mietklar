/** Alpha tariff model. Deliberately not a full Austrian income-tax assessment. */
export function nonnegative(value, label = 'Betrag') {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label}: endlicher Betrag ab 0 erforderlich`);
  return value;
}
export function validateTariff(tariff) {
  if (!tariff || !Number.isInteger(tariff.year) || !Array.isArray(tariff.brackets) || !tariff.brackets.length) throw new TypeError('Ungültige Tarifdatei');
  let previous = 0;
  tariff.brackets.forEach((b, i) => {
    if (!Number.isFinite(b.rate) || b.rate < 0 || b.rate >= 1) throw new RangeError('Ungültiger Tarifsatz');
    if (b.upTo === null) { if (i !== tariff.brackets.length - 1) throw new RangeError('Offene Tarifstufe muss die letzte sein'); }
    else { if (!Number.isFinite(b.upTo) || b.upTo <= previous) throw new RangeError('Tarifgrenzen müssen steigen'); previous = b.upTo; }
  });
  if (tariff.brackets.at(-1).upTo !== null) throw new RangeError('Offene letzte Tarifstufe fehlt');
  return tariff;
}
export function tariffTax(income, tariff) {
  nonnegative(income, 'Tarifbasis'); validateTariff(tariff);
  let total = 0, previous = 0;
  for (const b of tariff.brackets) {
    const upper = b.upTo ?? Infinity;
    total += Math.max(0, Math.min(income, upper) - previous) * b.rate;
    if (income <= upper) break;
    previous = upper;
  }
  return total;
}
export function assessmentAllowance(otherIncome) {
  nonnegative(otherIncome, 'Andere Einkünfte');
  return otherIncome === 0 ? 0 : Math.max(0, Math.min(730, 1460 - otherIncome));
}
export function additionalTax(base, rentalIncome, tariff) {
  nonnegative(base, 'Tarifbasis');
  if (!Number.isFinite(rentalIncome)) throw new RangeError('Ungültige Vermietungseinkünfte');
  // Alpha: salary + one rental; no other non-payroll income; no tax credit for losses.
  const positive = Math.max(0, rentalIncome);
  const taxable = Math.max(0, base + positive - assessmentAllowance(positive));
  return Math.max(0, tariffTax(taxable, tariff) - tariffTax(base, tariff));
}
export function cashAtRent(monthlyRent, model, tariff) {
  nonnegative(monthlyRent, 'Miete');
  const reimbursements = nonnegative(model.annualReimbursements ?? 0, 'Mietererstattungen');
  const rentalIncome = monthlyRent * 12 + reimbursements - model.annualTaxCosts - model.annualAfa;
  const annualTax = additionalTax(model.base, rentalIncome, tariff);
  return { rentalIncome, annualTax, monthlyCash: (monthlyRent * 12 + reimbursements - model.annualCashCosts - annualTax) / 12 };
}
export function solveRent(model, tariff) {
  for (const key of ['base', 'annualTaxCosts', 'annualAfa', 'annualCashCosts', 'target']) nonnegative(model[key], key);
  nonnegative(model.annualReimbursements ?? 0, 'Mietererstattungen');
  validateTariff(tariff);
  let lo = 0, hi = 1000;
  while (cashAtRent(hi, model, tariff).monthlyCash < model.target) {
    hi *= 2;
    if (hi > 1e9) throw new RangeError('Zielmiete außerhalb des Alpha-Rechenbereichs');
  }
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (cashAtRent(mid, model, tariff).monthlyCash < model.target) lo = mid; else hi = mid;
  }
  let cents = Math.ceil(lo * 100);
  // Verify after cent rounding; no target undershoot from floating-point boundaries.
  while (cashAtRent(cents / 100, model, tariff).monthlyCash < model.target - 1e-9) cents++;
  while (cents > 0 && cashAtRent((cents - 1) / 100, model, tariff).monthlyCash >= model.target - 1e-9) cents--;
  const rent = cents / 100;
  return { rent, ...cashAtRent(rent, model, tariff) };
}
export function comparePurchase({ base, rentalIncome, monthlyCash, purchase, deduction }, tariff) {
  nonnegative(base); if (!Number.isFinite(monthlyCash)) throw new RangeError('Ungültiger Cashflow'); nonnegative(purchase); nonnegative(deduction);
  if (deduction > purchase) throw new RangeError('Jahresabzug übersteigt den Kaufpreis');
  const saving = additionalTax(base, rentalIncome, tariff) - additionalTax(base, rentalIncome - deduction, tariff);
  const burden = purchase - saving;
  return { saving, burden, afterPurchase: monthlyCash - burden / 12 };
}

