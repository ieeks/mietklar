import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { aggregateCosts, normalizeCost } from '../src/costs.js';
import { cashAtRent, solveRent } from '../src/calc.js';
const tariff = JSON.parse(readFileSync(new URL('../data/tarif-2026.json', import.meta.url)));
const line = { name: 'Beispiel', kind: 'other', amount: 100, period: 'month', payer: 'unknown', taxStatus: 'unknown' };
const model = costs => ({ base: 45000, annualAfa: 0, target: 1000, ...costs });
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, actual + ' != ' + expected);

test('unknown payment remains cash cost, without assumed reimbursement or deduction', () => {
  const costs = aggregateCosts([line]);
  assert.equal(costs.annualCashCosts, 1200);
  assert.equal(costs.annualReimbursements, 0);
  assert.equal(costs.annualTaxCosts, 0);
  assert.equal(costs.unknownForward.length, 1);
  assert.equal(costs.unknownTax.length, 1);
  const result = cashAtRent(2000, model(costs), tariff);
  close(result.rentalIncome, 24000);
  close(result.annualTax, 9600);
  close(result.monthlyCash, 1100);
});
test('tenant reimbursement is taxable income even without matching deduction', () => {
  const result = cashAtRent(2000, model(aggregateCosts([{ ...line, payer: 'tenant' }])), tariff);
  close(result.rentalIncome, 25200);
  close(result.annualTax, 10080);
  close(result.monthlyCash, 1160);
});
test('matching deductible reimbursed expense cancels in cash and tax', () => {
  const paid = model(aggregateCosts([{ ...line, payer: 'tenant', taxStatus: 'full' }]));
  const empty = model(aggregateCosts([]));
  assert.deepEqual(cashAtRent(2000, paid, tariff), cashAtRent(2000, empty, tariff));
  assert.equal(solveRent(paid, tariff).rent, solveRent(empty, tariff).rent);
});
test('deduction changes tax without changing payment or reimbursement', () => {
  const unknown = aggregateCosts([line]);
  const confirmed = aggregateCosts([{ ...line, taxStatus: 'full', evidence: 'Jahresaufstellung' }]);
  assert.equal(confirmed.annualCashCosts, unknown.annualCashCosts);
  assert.equal(confirmed.annualReimbursements, unknown.annualReimbursements);
  close(cashAtRent(2000, model(confirmed), tariff).monthlyCash, 1140);
  assert.equal(confirmed.rows[0].evidence, 'Jahresaufstellung');
});
test('part reimbursement and independent annual deduction use consistent units', () => {
  const a = aggregateCosts([{ ...line, payer: 'partial', forward: 25, taxStatus: 'annual', taxAnnual: 600 }]);
  const b = aggregateCosts([{ ...line, amount: 1200, period: 'year', payer: 'partial', forward: 300, taxStatus: 'annual', taxAnnual: 600 }]);
  assert.deepEqual(a, b);
  assert.equal(a.annualCashCosts, 1200);
  assert.equal(a.annualReimbursements, 300);
  assert.equal(a.annualTaxCosts, 600);
});
test('reserve and buffer affect cash only; tax-only annual deduction is separate', () => {
  const rows = [
    { ...line, kind: 'reserve', amount: 75, payer: 'owner', taxStatus: 'none' },
    { ...line, kind: 'buffer', amount: 50, payer: 'owner', taxStatus: 'none' },
    { ...line, name: 'Bestätigter Verteilungsbetrag', amount: 0, period: 'year', payer: 'owner', taxStatus: 'annual', taxAnnual: 400 }
  ];
  const costs = aggregateCosts(rows);
  assert.equal(costs.annualCashCosts, 1500);
  assert.equal(costs.annualTaxCosts, 400);
  assert.equal(costs.annualReimbursements, 0);
  assert.equal(costs.unknownForward.length, 0);
  assert.equal(costs.unknownTax.length, 0);
});
test('none and unknown ignore retained inactive deduction and reimbursement fields', () => {
  const row = normalizeCost({ ...line, payer: 'owner', forward: 9999, taxStatus: 'none', taxAnnual: 9999 });
  assert.equal(row.annualReimbursement, 0);
  assert.equal(row.annualDeduction, 0);
  const unknown = normalizeCost({ ...line, forward: NaN, taxAnnual: NaN });
  assert.equal(unknown.annualReimbursement, 0);
  assert.equal(unknown.annualDeduction, 0);
});
test('invalid units, missing names, oversized reimbursement and reserve deductions fail', () => {
  for (const patch of [
    { name: ' ' }, { amount: -1 }, { amount: Infinity }, { amount: Number.MAX_VALUE },
    { period: 'quarter' }, { payer: 'invalid' }, { taxStatus: 'invalid' },
    { payer: 'partial', forward: 101 }, { payer: 'partial', forward: NaN },
    { taxStatus: 'annual', taxAnnual: -1 }, { kind: 'reserve', payer: 'owner', taxStatus: 'full' },
    { kind: 'buffer', payer: 'tenant', taxStatus: 'none' }
  ]) assert.throws(() => aggregateCosts([{ ...line, ...patch }]));
  assert.throws(() => solveRent({ ...model(aggregateCosts([])), annualReimbursements: -1 }, tariff));
});
test('reimbursement and deduction combinations retain minimum-cent reverse solution', () => {
  for (const payer of ['owner', 'unknown', 'partial', 'tenant']) {
    for (const taxStatus of ['none', 'unknown', 'annual', 'full']) {
      const costs = aggregateCosts([{ ...line, payer, forward: 50, taxStatus, taxAnnual: 400 }]);
      const m = model(costs), result = solveRent(m, tariff);
      assert.ok(result.monthlyCash >= 1000 - 1e-8);
      assert.ok(cashAtRent(result.rent - .01, m, tariff).monthlyCash < 1000);
    }
  }
});
