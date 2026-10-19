import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, MAX_BACKUP_BYTES, MAX_COST_ROWS, validateState, makeSnapshot,
  parseSnapshot, readSavedSnapshot, writeSavedSnapshot, removeSavedSnapshot
} from '../src/persistence.js';

const date = '2026-10-19T12:30:00.000Z';
function state() {
  return {
    fields: {
      target: '1000', monthlyRent: '1400', incomeMode: 'payslip', salary: '45132',
      deductionMode: 'flat', salaryDeduction: '132', salaryBase: '45000',
      rentalLaw: 'unknown', contract: 'none', buffer: '0',
      afaMode: 'unknown', afa: '', building: '', rate: '1.5', afaBasisStatus: 'unknown',
      afaAcquisition: 'purchase', afaPreviousUse: 'private', afaPurchaseYear: '', afaPrice: '',
      afaTransferTax: '0', afaRegistration: '0', afaLegal: '0', afaBroker: '0', afaOther: '0',
      afaLandPercent: '', afaLandStatus: 'unknown', afaMunicipality: 'unknown',
      afaLandPriceBand: 'unknown', afaUnits: 'unknown', afaLandException: 'unknown',
      afaFirstMonths: 'unknown', afaEvidence: '', vat: 'exempt', item: 'Kühlschrank',
      purchase: '500', treatment: 'instant', purchaseAfa: '100',
      expectedVacantMonths: '0', area: '', referenceRent: '',
      periodMode: 'full', startMonth: '1', vacantMonths: '0', yearAfaMode: 'unknown', yearAfa: '0', yearAfaMonths: 'unknown'
    },
    costs: [{
      name: 'Betriebskosten', amount: '170', period: 'month', payer: 'unknown', forward: '0',
      taxStatus: 'unknown', taxAnnual: '0', evidence: '', kind: 'bk', group: 'house',
      paymentMonths: '12', yearTaxStatus: 'unknown', yearTaxAnnual: '0', composition: '', agreement: 'unknown'
    }],
    calculationMode: 'target', step: 1, adoptedLandSuggestion: false
  };
}
function memory() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
const raw = value => JSON.stringify(value);

test('snapshot roundtrip preserves raw inputs, selected direction and step without derived results', () => {
  const input = state(); input.calculationMode = 'rent'; input.step = 4;
  const snapshot = makeSnapshot(input, 2026, date);
  assert.deepEqual(parseSnapshot(raw(snapshot), 2026), snapshot);
  assert.deepEqual(Object.keys(snapshot).sort(), ['app', 'savedAt', 'schemaVersion', 'state', 'tariffYear']);
  assert.equal(snapshot.state.fields.salary, '45132');
  snapshot.state.costs[0].amount = '999';
  snapshot.state.fields.target = '888';
  assert.equal(input.costs[0].amount, '170');
  assert.equal(input.fields.target, '1000', 'returned snapshot cannot mutate the live inputs');
});

test('unfinished financial drafts survive storage validation for later domain validation', () => {
  const input = state(); input.fields.target = ''; input.fields.salary = '-12';
  input.costs[0].amount = ''; input.costs[0].payer = 'partial'; input.costs[0].forward = '999';
  assert.deepEqual(parseSnapshot(raw(makeSnapshot(input, 2026, date)), 2026).state, input);
});

test('invalid JSON, foreign files, unsupported versions and other years are rejected', () => {
  assert.throws(() => parseSnapshot('{', 2026), /JSON/);
  for (const value of [null, [], 'text', 7]) assert.throws(() => parseSnapshot(raw(value), 2026));
  for (const [key, value] of [['app', 'other'], ['schemaVersion', 99], ['schemaVersion', '1'], ['tariffYear', 2025], ['tariffYear', '2026']]) {
    const snapshot = makeSnapshot(state(), 2026, date); snapshot[key] = value;
    assert.throws(() => parseSnapshot(raw(snapshot), 2026));
  }
});

test('unknown or missing envelope, state, field and cost keys cannot enter a snapshot', () => {
  for (const locate of [v => v, v => v.state, v => v.state.fields, v => v.state.costs[0]]) {
    const extra = makeSnapshot(state(), 2026, date); locate(extra).unexpected = 'value';
    assert.throws(() => parseSnapshot(raw(extra), 2026));
    const missing = makeSnapshot(state(), 2026, date); delete locate(missing)[Object.keys(locate(missing))[0]];
    assert.throws(() => parseSnapshot(raw(missing), 2026));
  }
  const extra = raw(makeSnapshot(state(), 2026, date)).replace('"app":"mietklar"', '"app":"mietklar","__proto__":{"polluted":true}');
  assert.throws(() => parseSnapshot(extra, 2026));
  assert.equal({}.polluted, undefined);
});

test('numeric text is bounded and finite, while text fields are data rather than markup', () => {
  for (const value of ['NaN', 'Infinity', '0x10', ' ', '1e999', '1000000000001', '1'.repeat(65), 20, null, {}]) {
    const input = state(); input.fields.target = value;
    assert.throws(() => validateState(input));
  }
  for (const value of ['0', '0.01', '1,25', '1.234,56', '.5', '-1', '1e3', '1000000000000']) {
    const input = state(); input.fields.target = value;
    assert.equal(validateState(input).fields.target, value);
  }
  const input = state(); input.costs[0].name = '<img src=x onerror=alert(1)>';
  assert.equal(validateState(input).costs[0].name, input.costs[0].name);
});

test('field types, enums, text lengths and step bounds are checked', () => {
  for (const [key, value] of [['incomeMode', 'gross'], ['vat', 'free'], ['afaFirstMonths', '13'], ['item', 'x'.repeat(201)], ['afaEvidence', 'x'.repeat(301)]]) {
    const input = state(); input.fields[key] = value;
    assert.throws(() => validateState(input));
  }
  for (const [key, value] of [['step', -1], ['step', 5], ['step', 0.5], ['step', '1'], ['calculationMode', 'auto'], ['adoptedLandSuggestion', 1]]) {
    const input = state(); input[key] = value;
    assert.throws(() => validateState(input));
  }
});

test('cost rows reject unexpected categories, oversized texts and reserve manipulation', () => {
  for (const [key, value] of [['period', 'week'], ['payer', 'both'], ['taxStatus', 'yes'], ['group', 'injected'], ['kind', 'buffer'], ['name', 'x'.repeat(101)], ['evidence', 'x'.repeat(251)], ['amount', 170]]) {
    const input = state(); input.costs[0][key] = value;
    assert.throws(() => validateState(input));
  }
  const input = state(); input.costs[0].kind = 'reserve';
  assert.throws(() => validateState(input));
  input.costs[0].payer = 'owner'; input.costs[0].taxStatus = 'none'; input.costs[0].yearTaxStatus = 'none';
  assert.doesNotThrow(() => validateState(input));
  input.costs[0].taxStatus = 'full';
  assert.throws(() => validateState(input), /Rücklagen/);
});

test('row and UTF-8 file size limits are enforced before import', () => {
  const input = state(); input.costs = Array.from({ length: MAX_COST_ROWS }, () => ({ ...input.costs[0] }));
  assert.equal(validateState(input).costs.length, 100);
  input.costs.push({ ...input.costs[0] });
  assert.throws(() => validateState(input), /100/);
  input.costs = []; assert.deepEqual(validateState(input).costs, []);
  assert.throws(() => parseSnapshot(' '.repeat(MAX_BACKUP_BYTES + 1), 2026), /256 KB/);
  assert.throws(() => parseSnapshot('é'.repeat(MAX_BACKUP_BYTES / 2 + 1), 2026), /256 KB/);
});

test('adopted ground-share provenance must match current guide inputs after reload', () => {
  const input = state(); input.adoptedLandSuggestion = true;
  assert.throws(() => validateState(input), /Grundanteil/);
  Object.assign(input.fields, { afaMunicipality: 'large', afaUnits: 'over10', afaLandException: 'none', afaLandPercent: '30', afaLandStatus: 'estimate' });
  assert.equal(validateState(input).adoptedLandSuggestion, true);
  input.fields.afaLandPercent = '20'; assert.throws(() => validateState(input), /Grundanteil/);
  input.fields.afaLandPercent = '30'; input.fields.afaLandStatus = 'provided';
  assert.throws(() => validateState(input), /Grundanteil/);
});

test('timestamps are canonical and a malformed stored draft remains untouched', () => {
  for (const value of ['not a date', '2026-10-19', '2026-02-30T12:30:00.000Z', '2026-10-19T12:30:00Z', 0]) {
    assert.throws(() => makeSnapshot(state(), 2026, value));
  }
  const storage = memory(); storage.values.set(STORAGE_KEY, '{broken');
  assert.throws(() => readSavedSnapshot(storage, 2026));
  assert.equal(storage.getItem(STORAGE_KEY), '{broken');
});

test('writing validates first, reading roundtrips, deleting removes only mietklar data', () => {
  const storage = memory(); storage.values.set('unrelated', 'keep');
  assert.equal(readSavedSnapshot(storage, 2026), null);
  const saved = writeSavedSnapshot(storage, state(), 2026, date);
  assert.deepEqual(readSavedSnapshot(storage, 2026), saved);
  const bad = state(); bad.fields.vat = 'invalid';
  assert.throws(() => writeSavedSnapshot(storage, bad, 2026, date));
  assert.deepEqual(readSavedSnapshot(storage, 2026), saved);
  removeSavedSnapshot(storage);
  assert.equal(readSavedSnapshot(storage, 2026), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
});

test('storage security, quota and deletion errors propagate without claiming success', () => {
  const storage = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); }
  };
  assert.throws(() => readSavedSnapshot(storage, 2026), /SecurityError/);
  assert.throws(() => writeSavedSnapshot(storage, state(), 2026, date), /QuotaExceededError/);
  assert.throws(() => removeSavedSnapshot(storage), /SecurityError/);
});

function legacySnapshot() {
  const input = state();
  for (const key of ['periodMode', 'startMonth', 'vacantMonths', 'yearAfaMode', 'yearAfa', 'yearAfaMonths', 'expectedVacantMonths', 'area', 'referenceRent']) delete input.fields[key];
  input.costs.forEach(row => { delete row.composition; delete row.agreement; delete row.paymentMonths; delete row.yearTaxStatus; delete row.yearTaxAnnual; });
  return { app: 'mietklar', schemaVersion: 1, tariffYear: 2026, savedAt: date, state: input };
}

test('Alpha 0.5 backups migrate every existing value while defaulting to identical full-year planning', () => {
  const old = legacySnapshot(); old.state.fields.target = ''; old.state.fields.salary = '50000';
  old.state.costs[0].taxStatus = 'full'; old.state.calculationMode = 'rent'; old.state.step = 3;
  const original = raw(old), storage = memory(); storage.values.set(STORAGE_KEY, original);
  const migrated = readSavedSnapshot(storage, 2026);
  assert.equal(migrated.schemaVersion, 4); assert.equal(migrated.savedAt, date);
  for (const [key, value] of Object.entries(old.state.fields)) assert.equal(migrated.state.fields[key], value);
  for (const [key, value] of Object.entries(old.state.costs[0])) assert.equal(migrated.state.costs[0][key], value);
  assert.equal(migrated.state.calculationMode, 'rent'); assert.equal(migrated.state.step, 3);
  assert.equal(migrated.state.fields.periodMode, 'full'); assert.equal(migrated.state.fields.yearAfaMode, 'unknown');
  assert.equal(migrated.state.costs[0].yearTaxStatus, 'unknown'); assert.equal(migrated.state.costs[0].paymentMonths, '12');
  assert.equal(storage.getItem(STORAGE_KEY), original, 'reading migration never overwrites the original');
  assert.deepEqual(parseSnapshot(raw(migrated), 2026), migrated, 'new export format roundtrips');
});

test('legacy reserves migrate cash-only and malformed or mixed versions are never repaired silently', () => {
  const old = legacySnapshot(); Object.assign(old.state.costs[0], { kind: 'reserve', payer: 'owner', taxStatus: 'none' });
  assert.equal(parseSnapshot(raw(old), 2026).state.costs[0].yearTaxStatus, 'none');
  old.state.fields.periodMode = 'year'; assert.throws(() => parseSnapshot(raw(old), 2026));
  delete old.state.fields.periodMode; old.state.fields.salary = 'invalid'; assert.throws(() => parseSnapshot(raw(old), 2026));
  const current = makeSnapshot(state(), 2026, date); delete current.state.fields.periodMode;
  assert.throws(() => parseSnapshot(raw(current), 2026));
});

test('year fields and separate year tax data survive current-schema draft roundtrips', () => {
  const input = state(); Object.assign(input.fields, { periodMode: 'year', startMonth: '7', vacantMonths: '', yearAfaMode: 'provided', yearAfa: '1200' });
  Object.assign(input.costs[0], { paymentMonths: '8', yearTaxStatus: 'provided', yearTaxAnnual: '600' });
  assert.deepEqual(parseSnapshot(raw(makeSnapshot(input, 2026, date)), 2026).state, input);
  input.fields.startMonth = '13'; assert.throws(() => validateState(input));
});

test('format 3 migrates review fields without inferring agreements or changing raw money', () => {
  const snapshot = makeSnapshot(state(), 2026, date); snapshot.schemaVersion = 3;
  delete snapshot.state.costs[0].composition; delete snapshot.state.costs[0].agreement;
  snapshot.state.costs[0].amount = '170,1234'; snapshot.state.costs[0].payer = 'tenant';
  const original = raw(snapshot), migrated = parseSnapshot(original, 2026);
  assert.equal(migrated.schemaVersion, 4); assert.equal(migrated.state.costs[0].amount, '170,1234');
  assert.equal(migrated.state.costs[0].payer, 'tenant'); assert.equal(migrated.state.costs[0].agreement, 'unknown');
  assert.equal(migrated.state.costs[0].composition, ''); assert.equal(raw(snapshot), original);
  snapshot.state.costs[0].kind = 'garage'; assert.throws(() => parseSnapshot(raw(snapshot), 2026));
});
test('new review data roundtrips as text with strict sizes and choices', () => {
  const input = state(); Object.assign(input.costs[0], { kind: 'garage', composition: '<b>Nur Text</b>', agreement: 'planned' });
  assert.deepEqual(parseSnapshot(raw(makeSnapshot(input, 2026, date)), 2026).state, input);
  input.costs[0].composition = 'x'.repeat(401); assert.throws(() => validateState(input));
  input.costs[0].composition = ''; input.costs[0].agreement = 'approved-by-app'; assert.throws(() => validateState(input));
});
