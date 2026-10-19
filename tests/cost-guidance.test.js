import test from 'node:test';
import assert from 'node:assert/strict';
import { costGuidance, COST_KIND_IDS } from '../src/cost-guidance.js';
import { normalizeCost } from '../src/costs.js';
const row = overrides => ({ kind: 'water', amount: '100', period: 'month', payer: 'tenant', forward: '0', taxStatus: 'unknown', yearTaxStatus: 'unknown', agreement: 'unknown', composition: '', ...overrides });

test('no contract and partial MRG give concrete contractual steps, never a legal approval', () => {
  const line = row(), before = structuredClone(line);
  const guide = costGuidance(line, { rentalLaw: 'partial', contract: 'none' });
  assert.match(guide.basis, /wirksame, konkrete Vereinbarung/);
  assert.ok(guide.steps.some(text => /Vor Vermietung/.test(text)));
  assert.ok(guide.steps.some(text => /Steuerlichen Jahresabzug/.test(text)));
  assert.ok(guide.warnings.some(text => /Grundlage ist noch offen/.test(text)));
  assert.deepEqual(line, before);
});
test('statutory full-MRG water guidance does not demand an individual contractual cost clause', () => {
  const guide = costGuidance(row(), { rentalLaw: 'full', contract: 'existing' });
  assert.match(guide.basis, /Katalog/); assert.equal(guide.warnings.length, 0);
  assert.ok(!guide.steps.some(text => /wirksame Vereinbarung/.test(text)));
});
test('documented planning contradicts no contract and excluded recovery contradicts tenant payment', () => {
  assert.ok(costGuidance(row({ agreement: 'documented' }), { rentalLaw: 'partial', contract: 'none' }).warnings.some(text => /noch kein Mietvertrag/.test(text)));
  assert.ok(costGuidance(row({ agreement: 'excluded' }), { rentalLaw: 'full', contract: 'existing' }).warnings.some(text => /keine Überwälzung/.test(text)));
});
test('repair and adviser remain outside additional full-MRG operating costs even with a claimed agreement', () => {
  for (const kind of ['repair', 'adviser']) assert.ok(costGuidance(row({ kind, agreement: 'documented' }), { rentalLaw: 'full', contract: 'existing' }).warnings.some(text => /keine zusätzliche MRG/.test(text)));
});
test('zero partial recovery does not report an entered payment; numeric scenario values also warn', () => {
  assert.equal(costGuidance(row({ payer: 'partial', forward: '0' }), { rentalLaw: 'partial', contract: 'none' }).warnings.length, 0);
  assert.ok(costGuidance(row({ amount: 100, payer: 'partial', forward: 25 }), { rentalLaw: 'partial', contract: 'none' }).warnings.length > 0);
});
test('mixed amounts require composition; insurance, garage and plant costs require their own evidence', () => {
  assert.ok(costGuidance(row({ kind: 'bk' })).steps.some(text => /Langfassung/.test(text)));
  assert.ok(!costGuidance(row({ kind: 'bk', composition: 'Wasser und Müll separat belegt' })).steps.some(text => /Langfassung/.test(text)));
  assert.match(costGuidance(row({ kind: 'insurance' }), { rentalLaw: 'full' }).basis, /Hauptmietermehrheit/);
  assert.match(costGuidance(row({ kind: 'garage' })).taxText, /auch ohne geplante Mietererstattung/);
  assert.match(costGuidance(row({ kind: 'phone' })).contents, /Aufzugsnotruf/);
});
test('reserve contributions stay separate from actual fund-paid repair deductions and cash is not counted twice', () => {
  const reserve = costGuidance(row({ kind: 'reserve', payer: 'owner', taxStatus: 'none' }));
  assert.match(reserve.tax, /kein Steuerabzug/); assert.match(reserve.taxText, /Verwendung/);
  const repair = normalizeCost({ ...row({ kind: 'repair', payer: 'owner', amount: 0, taxStatus: 'annual' }), name: 'Belegte Fondsarbeit', taxAnnual: 300 });
  assert.equal(repair.annualPayment, 0); assert.equal(repair.annualDeduction, 300);
});
test('calendar-year tax status is independent from full-year and reimbursement status', () => {
  const guide = costGuidance(row({ taxStatus: 'full', yearTaxStatus: 'unknown', agreement: 'documented' }), { rentalLaw: 'partial', contract: 'existing', periodMode: 'year' });
  assert.equal(guide.warnings.length, 0); assert.match(guide.tax, /offen/);
});
test('every category returns dated primary-source links and a concrete next step', () => {
  assert.equal(COST_KIND_IDS.length, 18);
  for (const kind of COST_KIND_IDS) {
    const guide = costGuidance(row({ kind }));
    assert.equal(guide.checked, '19.10.2026'); assert.ok(guide.steps.length > 0);
    assert.ok(guide.sources.every(source => /^https:\/\//.test(source.url) && source.label));
  }
});
