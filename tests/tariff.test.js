import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACTIVE_TARIFF_URL, ACTIVE_TARIFF_YEAR, loadActiveTariff, validateTariffDocument, tariffCheckedDate } from '../src/tariff.js';
import { makeSnapshot, parseSnapshot } from '../src/persistence.js';
const tariff = JSON.parse(readFileSync(ACTIVE_TARIFF_URL, 'utf8'));
const state = JSON.parse(readFileSync(new URL('./fixtures/form-state.json', import.meta.url), 'utf8'));

test('active tariff loads the selected asset and retains its reviewed provenance', async () => {
  let requested;
  const loaded = await loadActiveTariff(async url => { requested = url; return { ok: true, json: async () => structuredClone(tariff) }; });
  assert.equal(requested, ACTIVE_TARIFF_URL);
  assert.equal(loaded.year, ACTIVE_TARIFF_YEAR);
  assert.deepEqual(loaded, tariff);
  assert.equal(tariffCheckedDate(loaded), '18.10.2026');
});

test('missing, unsafe or malformed tariff provenance never reaches the interface', () => {
  for (const source of [undefined, '', 'javascript:alert(1)', 'http://example.test', 'https://user:secret@example.test']) {
    assert.throws(() => validateTariffDocument({ ...tariff, source }), /Tarifquelle/);
  }
  for (const sourceLabel of [undefined, '', ' ', 3, 'x'.repeat(101)]) {
    assert.throws(() => validateTariffDocument({ ...tariff, sourceLabel }), /Tarifquelle/);
  }
  for (const checkedAt of [undefined, '', '2026-02-30', '2026-2-3', '2026-10-18T00:00:00Z']) {
    assert.throws(() => validateTariffDocument({ ...tariff, checkedAt }), /Prüfdatum/);
  }
});

test('unavailable or wrong-year tariff fails instead of silently changing the calculation year', async () => {
  await assert.rejects(loadActiveTariff(async () => ({ ok: false })), /nicht erreichbar/);
  await assert.rejects(loadActiveTariff(async () => ({ ok: true, json: async () => ({ ...tariff, year: ACTIVE_TARIFF_YEAR + 1 }) })), /Tarifjahr/);
  assert.throws(() => validateTariffDocument({ ...tariff, brackets: [] }), /Tarifdatei/);
});

test('reviewed document year and backup year remain separate from historical fixtures', () => {
  const nextYear = ACTIVE_TARIFF_YEAR + 1;
  // Synthetic year only: these unchanged brackets are not a real future tariff.
  assert.equal(validateTariffDocument({ ...tariff, year: nextYear }, nextYear).year, nextYear);
  const raw = JSON.stringify(makeSnapshot(state, ACTIVE_TARIFF_YEAR));
  assert.deepEqual(parseSnapshot(raw, ACTIVE_TARIFF_YEAR).state, state);
  assert.throws(() => parseSnapshot(raw, nextYear), error => error.message.includes(String(ACTIVE_TARIFF_YEAR)) && error.message.includes(String(nextYear)));
});
