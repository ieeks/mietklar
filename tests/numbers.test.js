import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMoneyInput, parseAmount } from '../src/numbers.js';

test('money grouping preserves decimal precision and accepts comma and point', () => {
  const cases = new Map([
    ['1234567,8', '1.234.567,80'], ['123456.78', '123.456,78'],
    ['1234567', '1.234.567,00'], ['00028,75', '28,75'],
    ['-1234,5678901234567890123456789', '-1.234,5678901234567890123456789'],
    ['.25', '0,25'], ['0,001', '0,001'], ['0', '0,00']
  ]);
  for (const [raw, display] of cases) {
    assert.equal(formatMoneyInput(raw), display);
    assert.equal(parseAmount(display), parseAmount(raw));
    assert.equal(formatMoneyInput(display), display);
  }
});
test('formatting leaves empty, invalid, ambiguous and exponent drafts intact', () => {
  for (const raw of ['', '-', '45.000', '1.234', '1,2,3', 'word', '1e', '1e-30', '1e6']) {
    assert.equal(formatMoneyInput(raw), raw);
  }
});
test('grouped monetary displays round trip without changing computed values', () => {
  for (let i = 0; i < 2000; i++) {
    const raw = String((i * 72539 - 25000000) / 1000);
    let parsed; try { parsed = parseAmount(raw); } catch { continue; }
    assert.equal(parseAmount(formatMoneyInput(raw)), parsed);
  }
});
