import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateScenario, buildScenarioInput, buildFlow, comparePerSquareMetre } from '../src/scenario.js';
import { parseAmount, numericDraft } from '../src/numbers.js';
import { makeSnapshot, parseSnapshot } from '../src/persistence.js';
import { solveRent, cashAtRent } from '../src/calc.js';
const tariff = JSON.parse(readFileSync(new URL('../data/tarif-2026.json', import.meta.url)));
const fixture = JSON.parse(readFileSync(new URL('./fixtures/form-state.json', import.meta.url)));
const state = () => structuredClone(fixture);

test('actual default form inputs build the independent 1400-rent / 505-cash reference case', () => {
  const result = evaluateScenario(state(), tariff);
  assert.equal(result.solved.rent, 1400); assert.equal(result.solved.monthlyCash, 505);
  assert.equal(result.model.annualCashCosts, 4020); assert.equal(result.model.base, 45000);
  assert.equal(result.model.annualAfa, 0); assert.equal(result.model.annualTaxCosts, 0);
});

test('comma, point, German grouping and scientific legacy values parse consistently without rounding', () => {
  for (const [raw, value] of [['1400,50', 1400.5], ['1400.50', 1400.5], ['1.400,50', 1400.5], ['1.234', 1.234], ['.5', .5], ['1e3', 1000], ['-12,5', -12.5], ['', null]]) assert.equal(parseAmount(raw), value);
  for (const raw of ['1,2,3', '1.23,45', 'NaN', 'Infinity', '0x10', 'abc', ' ', '1e999']) assert.throws(() => parseAmount(raw));
  assert.equal(numericDraft('-'), true); assert.equal(numericDraft('1e-'), true);
  assert.equal(numericDraft('abc'), false); assert.equal(numericDraft('1000000000001'), false);
  const input = state(); input.fields.monthlyRent = '1400,50';
  assert.ok(Math.abs(evaluateScenario(input, tariff).solved.monthlyCash - 505.3) < 1e-9);
});

test('only active salary, year and cost fields affect the scenario builder', () => {
  const input = state(); Object.assign(input.fields, { incomeMode: 'provided', salaryBase: '45000', salary: '-1', salaryDeduction: '', vacantMonths: '-1', yearAfa: '-1' });
  input.costs.forEach(row => { row.forward = ''; row.yearTaxAnnual = ''; row.paymentMonths = ''; });
  assert.equal(evaluateScenario(input, tariff).solved.monthlyCash, 505);
  input.fields.monthlyRent = '';
  assert.throws(() => buildScenarioInput(input, 2026), error => error.field === 'monthlyRent');
});

test('typical-year vacancy preserves twelve payment months and full independently specified AfA', () => {
  const input = state(); input.fields.expectedVacantMonths = '1';
  let result = evaluateScenario(input, tariff);
  assert.equal(result.period.rentMonths, 11); assert.equal(result.model.annualCashCosts, 4020);
  assert.equal(result.solved.annualRent, 15400); assert.equal(result.solved.monthlyCash, 435);
  input.costs[0].payer = 'tenant'; result = evaluateScenario(input, tariff);
  assert.equal(result.costs.annualReimbursements, 1870);
  Object.assign(input.fields, { afaMode: 'known', afa: '2400', expectedVacantMonths: '12' });
  result = evaluateScenario(input, tariff);
  assert.equal(result.model.annualAfa, 2400); assert.equal(result.solved.annualRent, 0); assert.equal(result.costs.annualReimbursements, 0);
  assert.equal(result.solved.monthlyCash, -335);
  input.calculationMode = 'target'; assert.throws(() => evaluateScenario(input, tariff), /Ohne Mietmonate/);
  for (const value of ['-1', '13', '0,5', '']) { input.fields.expectedVacantMonths = value; assert.throws(() => evaluateScenario(input, tariff)); }
});

test('raw calendar-year inputs reproduce six months of rent, separate deductions and 590 average cash', () => {
  const input = state(); input.costs = [input.costs[0]];
  Object.assign(input.costs[0], { amount: '100', payer: 'tenant', taxStatus: 'full', yearTaxStatus: 'provided', yearTaxAnnual: '600', paymentMonths: '12' });
  Object.assign(input.fields, { monthlyRent: '2000', periodMode: 'year', startMonth: '7', yearAfaMode: 'provided', yearAfa: '1200', afaMode: 'known', afa: '-1' });
  const result = evaluateScenario(input, tariff);
  assert.equal(result.solved.annualRent, 12000); assert.equal(result.solved.annualTax, 4320);
  assert.equal(result.solved.annualCash, 7080); assert.equal(result.solved.monthlyCash, 590);
  input.fields.yearAfaMode = 'regular'; assert.throws(() => evaluateScenario(input, tariff));
});

test('purchase errors are isolated from the unchanged rent and cash result', () => {
  for (const purchase of ['1001', '-1', '', 'abc']) {
    const input = state(); input.fields.purchase = purchase;
    const result = evaluateScenario(input, tariff);
    assert.equal(result.solved.monthlyCash, 505); assert.equal(result.purchase, null); assert.ok(result.purchaseError);
  }
  const input = state(); const result = evaluateScenario(input, tariff);
  assert.equal(result.purchase.saving, 200); assert.equal(result.purchase.afterPurchase, 480);
  assert.equal(result.solved.rent, 1400);
});

test('flow uses total annual receipts including reimbursements, with no duplicate AfA payment', () => {
  const input = state(); input.fields.expectedVacantMonths = '1'; input.fields.buffer = '25';
  input.costs[0].payer = 'tenant'; input.fields.afaMode = 'known'; input.fields.afa = '2400';
  const result = evaluateScenario(input, tariff), flow = buildFlow(result);
  assert.equal(flow.income, (15400 + 1870) / 12);
  assert.equal(flow.segments.find(row => row.key === 'reserve').value, 100);
  assert.equal(flow.segments.find(row => row.key === 'costs').value, 260);
  assert.ok(Math.abs(flow.total - flow.income) < 1e-9);
  assert.equal(Math.round(flow.segments.reduce((sum, row) => sum + row.displayValue, 0) * 100), Math.round(flow.total * 100));
  assert.ok(Math.abs(flow.segments.reduce((sum, row) => sum + row.percent, 0) - 100) < 1e-9);
});

test('flow deficit is explicitly extra funding and zero-income charts stay finite', () => {
  const input = state(); input.fields.monthlyRent = '0';
  const flow = buildFlow(evaluateScenario(input, tariff));
  assert.equal(flow.income, 0); assert.equal(flow.shortfall, 335); assert.equal(flow.total, 335);
  assert.equal(flow.segments.find(row => row.key === 'cash').value, 0);
  input.costs = []; const empty = buildFlow(evaluateScenario(input, tariff));
  assert.equal(empty.total, 0); assert.ok(empty.segments.every(row => row.percent === 0));
});

test('optional square-metre comparison has a strict boundary and cannot modify rental arithmetic', () => {
  assert.equal(comparePerSquareMetre(1400, '55', '20').above, true);
  assert.equal(comparePerSquareMetre(1400, '50', '28').above, false);
  assert.equal(comparePerSquareMetre(1400, '50,0', '').value, 28);
  assert.equal(comparePerSquareMetre(1400, '', '').value, null);
  for (const area of ['0', '-1', 'abc', '']) assert.equal(comparePerSquareMetre(1400, area, '20').value, null);
  const input = state(); input.fields.area = '-1'; input.fields.referenceRent = '0';
  assert.equal(evaluateScenario(input, tariff).solved.monthlyCash, 505);
});

test('format 2 migrates with identical cash, new defaults and strict old numeric syntax', () => {
  const input = state(); const old = { app: 'mietklar', schemaVersion: 2, tariffYear: 2026, savedAt: '2026-10-19T12:00:00.000Z', state: input };
  ['expectedVacantMonths', 'area', 'referenceRent'].forEach(key => delete old.state.fields[key]);
  const migrated = parseSnapshot(JSON.stringify(old), 2026);
  assert.equal(migrated.schemaVersion, 3); assert.equal(migrated.state.fields.expectedVacantMonths, '0');
  assert.equal(evaluateScenario(migrated.state, tariff).solved.monthlyCash, 505);
  old.state.fields.monthlyRent = '1400,50'; assert.throws(() => parseSnapshot(JSON.stringify(old), 2026));
  migrated.state.fields.monthlyRent = '1400,50';
  assert.equal(parseSnapshot(JSON.stringify(makeSnapshot(migrated.state, 2026)), 2026).state.fields.monthlyRent, '1400,50');
});

test('3000 seeded rental models meet target and no smaller cent amount suffices', () => {
  let seed = 194731;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let i = 0; i < 3000; i++) {
    const model = { base: random() * 150000, annualCashCosts: random() * 25000, annualTaxCosts: random() * 25000,
      annualAfa: random() * 10000, annualReimbursements: random() * 20000, rentMonths: 1 + Math.floor(random() * 12), target: random() * 2500 };
    const result = solveRent(model, tariff);
    assert.ok(result.monthlyCash >= model.target - 1e-6, 'target case ' + i);
    if (result.rent > 0) assert.ok(cashAtRent(result.rent - .01, model, tariff).monthlyCash < model.target - 1e-9, 'minimal cent case ' + i);
  }
});
