import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveYear, resolveYearAfa } from '../src/year.js';
import { normalizeCost, aggregateCosts } from '../src/costs.js';
import { calculateScenario } from '../src/planning.js';
import { cashAtRent, comparePurchase } from '../src/calc.js';
const tariff = JSON.parse(readFileSync(new URL('../data/tarif-2026.json', import.meta.url)));
const cost = extra => ({ name: 'Fiktive Kosten', amount: 100, period: 'month', payer: 'tenant', forward: 50,
  taxStatus: 'full', taxAnnual: 1200, paymentMonths: 12, yearTaxStatus: 'unknown', yearTaxAnnual: 600, ...extra });
const model = { base: 45000, annualCashCosts: 1200, annualReimbursements: 600, annualTaxCosts: 600, annualAfa: 1200, rentMonths: 6 };

test('start month and whole vacant months determine paid months without changing a full-year draft', () => {
  assert.equal(resolveYear({ mode: 'full', startMonth: NaN, vacantMonths: -1 }).rentMonths, 12);
  assert.deepEqual(resolveYear({ mode: 'year', startMonth: 7, vacantMonths: 1 }), { mode: 'year', availableMonths: 6, vacantMonths: 1, rentMonths: 5 });
  assert.equal(resolveYear({ mode: 'year', startMonth: 12, vacantMonths: 1 }).rentMonths, 0);
  assert.equal(resolveYear({ mode: 'year', startMonth: 1, vacantMonths: 0 }).rentMonths, 12);
});

test('impossible months, fractional vacancies and unknown planning modes fail', () => {
  for (const startMonth of [0, 13, 1.5, NaN, '7']) assert.throws(() => resolveYear({ mode: 'year', startMonth, vacantMonths: 0 }));
  for (const vacantMonths of [-1, 7, .5, NaN, '2']) assert.throws(() => resolveYear({ mode: 'year', startMonth: 7, vacantMonths }));
  assert.throws(() => resolveYear({ mode: 'future' }));
});

test('six paid months cut rent and monthly reimbursement while twelve cost payments continue', () => {
  const rows = aggregateCosts([cost({ yearTaxStatus: 'provided' })], { mode: 'year', rentMonths: 6 });
  assert.equal(rows.annualCashCosts, 1200); assert.equal(rows.annualReimbursements, 600); assert.equal(rows.annualTaxCosts, 600);
  const result = calculateScenario({ mode: 'rent', rent: 2000 }, { ...model, ...rows }, tariff);
  // 12,000 rent + 600 reimbursement - 600 costs - 1,200 AfA = 10,800 taxable.
  // Tax 4,320; cash 12,000 + 600 - 1,200 - 4,320 = 7,080, averaged over 12.
  assert.equal(result.annualRent, 12000); assert.equal(result.rentalIncome, 10800);
  assert.equal(result.annualTax, 4320); assert.equal(result.annualCash, 7080); assert.equal(result.monthlyCash, 590);
});

test('unknown year deductions never inherit a full-year tax deduction', () => {
  const row = normalizeCost(cost(), { mode: 'year', rentMonths: 6 });
  assert.equal(row.annualDeduction, 0); assert.equal(row.taxUnknown, true);
  assert.equal(normalizeCost(cost({ yearTaxStatus: 'provided', yearTaxAnnual: 1500 }), { mode: 'year', rentMonths: 6 }).annualDeduction, 1500);
  assert.equal(normalizeCost(cost({ yearTaxStatus: 'none', yearTaxAnnual: NaN }), { mode: 'year', rentMonths: 6 }).annualDeduction, 0);
});

test('payment months are independent of occupancy and annual totals are not fractionally shortened', () => {
  assert.equal(normalizeCost(cost({ paymentMonths: 8 }), { mode: 'year', rentMonths: 3 }).annualPayment, 800);
  const annual = normalizeCost(cost({ amount: 900, period: 'year', paymentMonths: NaN, yearTaxStatus: 'provided', yearTaxAnnual: 300 }), { mode: 'year', rentMonths: 3 });
  assert.equal(annual.annualPayment, 900); assert.equal(annual.annualReimbursement, 900); assert.equal(annual.annualDeduction, 300);
  assert.equal(normalizeCost(cost({ paymentMonths: NaN, yearTaxStatus: 'broken' })).annualDeduction, 1200, 'inactive year fields do not affect full-year results');
});

test('reserve and monthly buffer remain cash-only even during complete vacancy', () => {
  const rows = aggregateCosts([
    cost({ amount: 75, payer: 'owner', kind: 'reserve', taxStatus: 'none', yearTaxStatus: 'none' }),
    cost({ amount: 25, payer: 'owner', kind: 'buffer', taxStatus: 'none', yearTaxStatus: 'none' })
  ], { mode: 'year', rentMonths: 0 });
  assert.equal(rows.annualCashCosts, 1200); assert.equal(rows.annualReimbursements, 0); assert.equal(rows.annualTaxCosts, 0);
  assert.throws(() => normalizeCost(cost({ kind: 'reserve', payer: 'owner', taxStatus: 'none', yearTaxStatus: 'provided' }), { mode: 'year', rentMonths: 0 }));
});

test('invalid payment months and year deduction choices cannot silently turn into zero', () => {
  for (const paymentMonths of [-1, 13, .5, NaN, '6']) assert.throws(() => normalizeCost(cost({ paymentMonths }), { mode: 'year', rentMonths: 6 }));
  assert.throws(() => normalizeCost(cost({ yearTaxStatus: 'full' }), { mode: 'year', rentMonths: 6 }));
  assert.throws(() => normalizeCost(cost({ yearTaxStatus: 'provided', yearTaxAnnual: -1 }), { mode: 'year', rentMonths: 6 }));
  assert.throws(() => normalizeCost(cost(), { mode: 'other' }));
});

test('year target remains twelve times the monthly average and minimum-cent rent is verified', () => {
  const result = calculateScenario({ mode: 'target', target: 1000 }, { ...model, annualReimbursements: 0 }, tariff);
  assert.equal(result.rent, 3466.67);
  assert.ok(result.annualCash >= 12000);
  assert.ok(cashAtRent(result.rent - .01, { ...model, annualReimbursements: 0 }, tariff).annualCash < 12000);
  for (const rentMonths of [1, 3, 6, 9, 12]) {
    const m = { ...model, rentMonths };
    const target = calculateScenario({ mode: 'target', target: 1000 }, m, tariff);
    assert.ok(target.monthlyCash >= 1000 - 1e-9);
    assert.ok(cashAtRent(target.rent - .01, m, tariff).monthlyCash < 1000);
    assert.equal(calculateScenario({ mode: 'rent', rent: target.rent }, m, tariff).annualCash, target.annualCash);
  }
});

test('zero occupancy gives a cash deficit without invented refund; a unique target rent cannot be solved', () => {
  const m = { ...model, rentMonths: 0, annualReimbursements: 0 };
  const result = calculateScenario({ mode: 'rent', rent: 2000 }, m, tariff);
  assert.equal(result.annualRent, 0); assert.equal(result.annualTax, 0); assert.equal(result.monthlyCash, -100);
  assert.throws(() => calculateScenario({ mode: 'target', target: 0 }, m, tariff), /Ohne Mietmonate/);
  for (const rentMonths of [-1, 13, .5, NaN, '6']) assert.throws(() => cashAtRent(2000, { ...model, rentMonths }, tariff));
});

test('twelve-month model equals the established full-year calculation', () => {
  const full = calculateScenario({ mode: 'rent', rent: 2000 }, { ...model, rentMonths: undefined }, tariff);
  assert.deepEqual(calculateScenario({ mode: 'rent', rent: 2000 }, { ...model, rentMonths: 12 }, tariff), full);
});

test('regular first-year AfA uses independent use months and six/seven boundary', () => {
  const full = { status: 'provided', annualAfa: 2400 };
  for (const [months, amount] of [[0, 0], [1, 1200], [6, 1200], [7, 2400], [12, 2400]]) {
    assert.equal(resolveYearAfa({ period: 'year', mode: 'regular', months }, full).annualAfa, amount);
  }
  assert.equal(resolveYearAfa({ period: 'year', mode: 'regular', months: 12 }, full).annualAfa, 2400, 'vacant months are not supplied to this function');
  assert.equal(resolveYearAfa({ period: 'full', mode: 'unknown', months: NaN }, full).annualAfa, 2400);
});

test('year AfA remains open until supplied or derived, with explicit independent amounts for continuing cases', () => {
  const full = { status: 'provided', annualAfa: 2400 };
  assert.equal(resolveYearAfa({ period: 'year', mode: 'unknown', amount: NaN }, full).annualAfa, 0);
  assert.equal(resolveYearAfa({ period: 'year', mode: 'provided', amount: 3000 }, { status: 'open', annualAfa: 0 }).annualAfa, 3000);
  assert.equal(resolveYearAfa({ period: 'year', mode: 'provided', amount: 3000 }, { status: 'provided', annualAfa: NaN }).annualAfa, 3000, 'unused invalid full-year basis cannot change an explicit year amount');
  assert.equal(resolveYearAfa({ period: 'year', mode: 'regular', months: null }, full).annualAfa, 0);
  assert.equal(resolveYearAfa({ period: 'year', mode: 'regular', months: 6 }, { status: 'open', annualAfa: 0 }).annualAfa, 0);
  for (const input of [{ mode: 'provided', amount: -1 }, { mode: 'regular', months: 13 }, { mode: 'other' }]) assert.throws(() => resolveYearAfa({ period: 'year', ...input }, full));
});

test('a purchase changes year cash and tax while leaving contracted monthly rent unchanged', () => {
  const baseline = calculateScenario({ mode: 'rent', rent: 2000 }, model, tariff);
  const purchase = comparePurchase({ base: model.base, rentalIncome: baseline.rentalIncome, monthlyCash: baseline.monthlyCash, purchase: 500, deduction: 500 }, tariff);
  assert.equal(purchase.saving, 200); assert.equal(purchase.burden, 300); assert.equal(purchase.afterPurchase, 565);
  assert.equal(baseline.rent, 2000); assert.equal(baseline.annualRent, 12000);
});
