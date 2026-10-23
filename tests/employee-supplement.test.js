import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { employeeSupplement, additionalTaxDetails, additionalTax, validateTariff, cashAtRent, solveRent, comparePurchase } from '../src/calc.js';
import { calculateScenario } from '../src/planning.js';
const tariff = JSON.parse(readFileSync(new URL('../data/tarif-2026.json', import.meta.url)));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const model = { base: 25010, annualCashCosts: 4020, annualTaxCosts: 0, annualAfa: 0, annualReimbursements: 0, rentMonths: 12 };

test('2026 supplement is full below the lower bound, half at midpoint and zero above upper bound', () => {
  for (const income of [0, 19000, 19761]) close(employeeSupplement(income, tariff), 804);
  close(employeeSupplement(25010, tariff), 402);
  for (const income of [30259, 45000]) close(employeeSupplement(income, tariff), 0);
  close(employeeSupplement(19762, tariff), 804 - 804 / 10498);
  close(employeeSupplement(30258, tariff), 804 / 10498);
  for (const income of [-1, NaN, Infinity, '25010']) assert.throws(() => employeeSupplement(income, tariff));
});
test('supplement parameters are data-driven and missing or corrupt tariff configuration fails closed', () => {
  const alternate = { ...tariff, employeeSupplement: { maximum: 600, fullUntil: 20000, zeroFrom: 40000 } };
  close(employeeSupplement(30000, alternate), 300);
  for (const params of [undefined, null, {}, { maximum: -1, fullUntil: 19761, zeroFrom: 30259 },
    { maximum: 804, fullUntil: 30259, zeroFrom: 19761 }, { maximum: 804, fullUntil: 19761, zeroFrom: 19761 },
    { maximum: 804, fullUntil: 19761, zeroFrom: Infinity }, { maximum: '804', fullUntil: 19761, zeroFrom: 30259 }]) {
    const broken = { ...tariff, employeeSupplement: params };
    assert.throws(() => validateTariff(broken)); assert.throws(() => additionalTax(25010, 7200, broken));
  }
});
test('additional tax combines independent 30-percent tariff increase with loss of 402-euro supplement', () => {
  const detail = additionalTaxDetails(25010, 7200, tariff);
  close(detail.tariffIncrease, 2160); close(detail.supplementBefore, 402);
  close(detail.supplementAfter, 0); close(detail.supplementLoss, 402); close(detail.annualTax, 2562);
  close(additionalTax(25010, 7200, tariff), 2562);
});
test('allowance uses the same taxable-income basis for tariff and supplement without a jump at 730', () => {
  for (const income of [0, 500, 730, -1, -1200]) {
    close(additionalTax(25010, income, tariff), 0);
    close(additionalTaxDetails(25010, income, tariff).supplementAfter, 402);
  }
  const detail = additionalTaxDetails(25010, 1000, tariff);
  close(detail.taxableIncome, 25550); close(detail.tariffIncrease, 162);
  close(detail.supplementLoss, 804 * 540 / 10498);
  close(additionalTax(25010, 730.01, tariff), .02 * (.3 + 804 / 10498));
});
test('no supplement loss when both incomes remain in the full range or already exceed the upper bound', () => {
  close(additionalTaxDetails(15000, 3000, tariff).supplementLoss, 0);
  close(additionalTax(45000, 7200, tariff), 2880);
  close(additionalTaxDetails(45000, 7200, tariff).supplementLoss, 0);
});
test('forward and inverse share the correction and preserve the minimum-cent target in both year lengths', () => {
  const forward = calculateScenario({ mode: 'rent', rent: 600 }, model, tariff);
  close(forward.annualTax, 2562); close(forward.monthlyCash, 51.5);
  for (const rentMonths of [6, 12]) {
    const m = { ...model, rentMonths, target: 600 };
    const inverse = solveRent(m, tariff);
    assert.deepEqual(calculateScenario({ mode: 'rent', rent: inverse.rent }, m, tariff), inverse);
    assert.ok(inverse.monthlyCash >= 600 - 1e-9);
    assert.ok(cashAtRent(inverse.rent - .01, m, tariff).monthlyCash < 600 - 1e-9);
  }
});
test('reimbursements, deductions and AfA feed the supplement through actual annual rental income', () => {
  const baseline = cashAtRent(600, model, tariff);
  const reimbursed = cashAtRent(500, { ...model, annualReimbursements: 1200 }, tariff);
  close(reimbursed.annualTax, baseline.annualTax);
  for (const change of [{ annualAfa: 7200 }, { annualTaxCosts: 7200 }]) {
    const result = cashAtRent(600, { ...model, ...change }, tariff);
    close(result.annualTax, 0); close(result.taxDetails.supplementLoss, 0);
  }
  const year = cashAtRent(600, { ...model, rentMonths: 6 }, tariff);
  close(year.rentalIncome, 3600); close(year.taxDetails.supplementLoss, 804 * 3600 / 10498);
});
test('purchase at unchanged rent restores part of supplement and no refund beyond baseline is invented', () => {
  const result = comparePurchase({ base: 25010, rentalIncome: 6000, monthlyCash: 600, purchase: 1000, deduction: 1000 }, tariff);
  close(result.saving, 300 + 804 * 249 / 10498);
  close(result.burden, 1000 - result.saving);
  const below = comparePurchase({ base: 25010, rentalIncome: 1000, monthlyCash: 600, purchase: 1000, deduction: 1000 }, tariff);
  close(below.saving, additionalTax(25010, 1000, tariff));
});
