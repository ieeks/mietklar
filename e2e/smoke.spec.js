import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { ACTIVE_TARIFF_URL } from '../src/tariff.js';
const currentTariff = JSON.parse(await readFile(ACTIVE_TARIFF_URL, 'utf8'));
const field = (page, key) => page.locator('[data-key="' + key + '"]');
const key = 'mietklar:saved-inputs';
const release = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version;
async function openSection(page, name) {
  const details = page.locator('[data-section="' + name + '"]');
  if (!await details.evaluate(node => node.open)) await details.locator(':scope > summary').click();
  await expect(details).toHaveAttribute('open', '');
}
async function openStorage(page) {
  const details = page.locator('[data-storage-panel]');
  if (!await details.evaluate(node => node.open)) await details.locator(':scope > summary').click();
}
function displayed(text) { return Number(text.replace(/[^0-9,.-]/g, '').replaceAll('.', '').replace(',', '.')); }
async function value(page, name) { return displayed(await page.locator('[data-out="' + name + '"]').first().textContent()); }
async function exportBackup(page) {
  await openStorage(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-export-backup]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^mietklar-sicherung-\d{4}-\d{2}-\d{2}\.json$/);
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}
async function importBackup(page, snapshot) {
  await openStorage(page);
  await page.locator('[data-import-file]').setInputFiles({ name: 'mietklar-test.json', mimeType: 'application/json', buffer: Buffer.from(typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot)) });
}

test.beforeEach(async ({ page }) => {
  page.testErrors = [];
  page.testAssets = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (/\/src\/.*\.js$|\/style\.css$|\/data\/tarif-\d{4}\.json$/.test(url.pathname)) page.testAssets.push(url.searchParams.get('v'));
  });
  page.on('pageerror', error => page.testErrors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-error]')).toBeHidden();
});
test.afterEach(async ({ page }) => {
  expect(page.testErrors).toEqual([]);
  expect(page.testAssets.length).toBeGreaterThan(5);
  expect(page.testAssets.every(version => version === release)).toBe(true);
});

test('live result, both directions, decimal comma/point and keyboard slider', async ({ page }) => {
  await expect(page.locator('[data-result-content]')).toBeVisible();
  await expect(page.locator('[data-panel]')).toHaveCount(0);
  await page.locator('[data-calc-mode="rent"]').click();
  await field(page, 'monthlyRent').fill('1400');
  await expect(page.locator('[data-out="headline"]')).toContainText('505,00');
  await field(page, 'monthlyRent').fill('1400,50');
  await expect(page.locator('[data-out="headline"]')).toContainText('505,30');
  await field(page, 'monthlyRent').fill('1400.50');
  await expect(page.locator('[data-out="headline"]')).toContainText('505,30');
  await page.locator('[data-calc-mode="target"]').click();
  await field(page, 'target').fill('1000,50');
  await expect.poll(() => value(page, 'cash')).toBeGreaterThanOrEqual(1000.5);
  expect(await value(page, 'cash')).toBeLessThan(1000.52);
  await page.locator('[data-slider]').focus();
  await page.locator('[data-slider]').press('End');
  await expect(field(page, 'target')).toHaveValue('2.500,00');
  await expect.poll(() => value(page, 'cash')).toBeGreaterThanOrEqual(2500);
  await page.locator('[data-calc-mode="rent"]').click();
  await expect(field(page, 'monthlyRent')).toHaveValue('1.400,50');
});

test('rule-year vacancy and calendar-year arithmetic, with invalid-state suppression', async ({ page }) => {
  await page.locator('[data-calc-mode="rent"]').click();
  await openSection(page, 'period');
  await field(page, 'expectedVacantMonths').fill('1');
  await expect(page.locator('[data-summary="period"]')).toContainText('11 Mietmonate');
  await expect.poll(() => value(page, 'annualRent')).toBe(15400);
  await expect.poll(() => value(page, 'headline')).toBe(435);
  await openSection(page, 'costs');
  await page.locator('[data-cost-payer]').first().selectOption('tenant');
  await expect.poll(() => value(page, 'annualReimbursement')).toBe(1870);
  await expect.poll(() => value(page, 'annualPayments')).toBe(4020);
  await page.locator('[data-cost-payer]').first().selectOption('unknown');
  await field(page, 'periodMode').selectOption('year');
  await field(page, 'startMonth').selectOption('7');
  await expect.poll(() => value(page, 'annualRent')).toBe(8400);
  await expect.poll(() => value(page, 'headline')).toBe(85);
  await openSection(page, 'afa');
  await field(page, 'afaMode').selectOption('known'); await field(page, 'afa').fill('2400,00');
  await expect(page.locator('[data-afa-pending-note]')).toContainText('Planjahr noch offen');
  await field(page, 'yearAfaMode').selectOption('regular'); await field(page, 'yearAfaMonths').selectOption('6');
  await expect.poll(() => value(page, 'headline')).toBe(125);
  await expect(page.locator('[data-afa-pending-note]')).toBeHidden();
  await field(page, 'yearAfaMonths').selectOption('7'); await expect.poll(() => value(page, 'headline')).toBe(165);
  await field(page, 'yearAfaMonths').selectOption('0');
  await expect.poll(() => value(page, 'annualAfa')).toBe(0);
  await expect(page.locator('[data-afa-pending-note]')).toBeHidden();
  await field(page, 'yearAfaMode').selectOption('unknown'); await field(page, 'afaMode').selectOption('unknown');
  await expect.poll(() => value(page, 'headline')).toBe(85);
  await field(page, 'vacantMonths').fill('1');
  await expect.poll(() => value(page, 'headline')).toBe(15);
  await field(page, 'vacantMonths').fill('7');
  await expect(page.locator('[data-error]')).toBeVisible();
  await expect(page.locator('[data-result-content]')).toBeHidden();
  await expect(page.locator('[data-print]')).toBeDisabled();
  await expect(page.locator('[data-print-sheet]')).toContainText('Kein gültiges Ergebnisblatt');
  await field(page, 'vacantMonths').fill('0');
  await expect(page.locator('[data-error]')).toBeHidden();
  await field(page, 'periodMode').selectOption('full');
  await expect.poll(() => value(page, 'headline')).toBe(435);
  await field(page, 'expectedVacantMonths').fill('12');
  await expect.poll(() => value(page, 'headline')).toBe(335);
  await expect(page.locator('[data-result-title]')).toContainText('zuzahlen');
  await page.locator('[data-calc-mode="target"]').click();
  await expect(page.locator('[data-error]')).toContainText('Ohne Mietmonate');
});

test('flow conserves receipts and represents a cash shortfall without a false surplus', async ({ page }) => {
  const widths = await page.locator('[data-flow-bar] > span').evaluateAll(nodes => nodes.map(n => parseFloat(n.style.width)));
  // Browsers serialize CSS percentages with fewer digits than the pure model.
  expect(widths.reduce((a,b) => a+b, 0)).toBeCloseTo(100, 3);
  const amounts = await page.locator('[data-flow-value]').allTextContents();
  expect(amounts.map(displayed).reduce((a,b) => a+b, 0)).toBeCloseTo(await value(page, 'total'), 2);
  await page.locator('[data-calc-mode="rent"]').click(); await field(page, 'monthlyRent').fill('0');
  await expect(page.locator('[data-flow-title]')).toContainText('Ausgaben');
  await expect(page.locator('[data-flow-note]')).toContainText('Zuschuss');
  await expect(page.locator('[data-flow-value="cash"]')).toContainText('0,00');
  await expect.poll(() => value(page, 'cash')).toBe(-335);
});

test('optional m² comparison and purchase errors do not corrupt the rental result', async ({ page }) => {
  await page.locator('[data-calc-mode="rent"]').click();
  await openSection(page, 'reference');
  await field(page, 'area').fill('55'); await field(page, 'referenceRent').fill('20,00');
  await expect(page.locator('[data-reference-note]')).toContainText('Über deinem Vergleichswert');
  await expect(page.locator('[data-per-area]')).toContainText('25,45');
  await field(page, 'referenceRent').fill('30'); await expect(page.locator('[data-reference-note]')).toBeHidden();
  await field(page, 'area').fill('0'); await expect(page.locator('[data-per-area]')).toContainText('größer als 0');
  await expect(page.locator('[data-out="headline"]')).toContainText('505,00');
  await openSection(page, 'purchase'); await field(page, 'purchase').fill('1001');
  await expect(page.locator('[data-investment-result]')).toBeHidden();
  await expect(page.locator('[data-out="headline"]')).toContainText('505,00');
  await openSection(page, 'afa'); await field(page, 'vat').selectOption('unknown');
  await expect(page.locator('[data-result-content]')).toBeHidden(); await expect(page.locator('[data-print]')).toBeDisabled();
  await field(page, 'vat').selectOption('exempt'); await expect(page.locator('[data-result-content]')).toBeVisible();
});

test('opt-in, reload, export/import/undo and scoped deletion with comma drafts', async ({ page }) => {
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await page.locator('[data-calc-mode="rent"]').click();
  await field(page, 'monthlyRent').fill('1500,25'); await openStorage(page);
  await page.locator('[data-remember]').check();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.state.fields.monthlyRent, key)).toBe('1500,25');
  await page.reload(); await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  await expect(field(page, 'monthlyRent')).toHaveValue('1.500,25');
  const exported = await exportBackup(page); expect(exported.schemaVersion).toBe(4);
  expect(exported.state.fields.monthlyRent).toBe('1500,25');
  const imported = structuredClone(exported); imported.state.fields.monthlyRent = '1600';
  await importBackup(page, imported); await expect(field(page, 'monthlyRent')).toHaveValue('1.600,00');
  await page.locator('[data-undo-import]').click(); await expect(field(page, 'monthlyRent')).toHaveValue('1.500,25');
  await importBackup(page, { ...exported, tariffYear: 2025 });
  await expect(page.locator('[data-storage-status]')).toContainText('Import nicht übernommen');
  await expect(field(page, 'monthlyRent')).toHaveValue('1.500,25');
  await page.evaluate(() => localStorage.setItem('unrelated', 'keep'));
  await page.locator('[data-delete-saved]').click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('unrelated'))).toBe('keep');
  await expect(field(page, 'monthlyRent')).toHaveValue('1.500,25');
  await page.reload(); await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-calc-mode="target"]')).toHaveAttribute('aria-pressed','true');
});

test('legacy formats 1, 2 and 3 imports preserve financial values and do not enable saving', async ({ page }) => {
  await page.locator('[data-calc-mode="rent"]').click();
  const exported = await exportBackup(page);
  const v3 = structuredClone(exported); v3.schemaVersion = 3;
  v3.state.costs.forEach(row => ['composition','agreement'].forEach(k => delete row[k]));
  await importBackup(page, v3); await expect(page.locator('[data-storage-status]')).toContainText('Ältere Sicherung');
  expect((await exportBackup(page)).state.costs[0].agreement).toBe('unknown');
  const v2 = structuredClone(v3); v2.schemaVersion = 2;
  ['expectedVacantMonths','area','referenceRent'].forEach(k => delete v2.state.fields[k]);
  v2.state.fields.monthlyRent = '1410';
  await importBackup(page, v2); await expect(page.locator('[data-storage-status]')).toContainText('Ältere Sicherung');
  await expect(page.locator('[data-out="headline"]')).toContainText('511,00');
  const v1 = structuredClone(v2); v1.schemaVersion = 1;
  ['periodMode','startMonth','vacantMonths','yearAfaMode','yearAfa','yearAfaMonths'].forEach(k => delete v1.state.fields[k]);
  v1.state.costs.forEach(row => ['paymentMonths','yearTaxStatus','yearTaxAnnual'].forEach(k => delete row[k]));
  v1.state.fields.monthlyRent = '1420';
  await importBackup(page, v1); await expect(page.locator('[data-storage-status]')).toContainText('Ältere Sicherung');
  await expect(page.locator('[data-out="headline"]')).toContainText('517,00');
  await expect(page.locator('[data-remember]')).not.toBeChecked();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
});

test('print sheet uses the current result and hides app controls in print media', async ({ page }, testInfo) => {
  await expect(page.locator('[data-tariff-info]')).toContainText('Tarif ' + currentTariff.year);
  await expect(page.locator('[data-tariff-source]')).toHaveText(currentTariff.sourceLabel);
  await expect(page.locator('[data-tariff-source]')).toHaveAttribute('href', currentTariff.source);
  await expect(page.locator('[data-tariff-checked]')).toHaveText(currentTariff.checkedAt.split('-').reverse().join('.'));
  await page.locator('[data-calc-mode="rent"]').click();
  await expect(page.locator('[data-print-sheet]')).toContainText('505,00');
  await expect(page.locator('[data-print-sheet]')).toContainText('Tarif ' + currentTariff.year);
  await expect(page.locator('[data-print-sheet]')).toContainText('geprüft am ' + currentTariff.checkedAt.split('-').reverse().join('.'));
  await expect(page.locator('[data-print-sheet] a').first()).toHaveAttribute('href', currentTariff.source);
  await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
  await page.locator('[data-print]').click(); expect(await page.evaluate(() => window.__printed)).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-print-sheet]')).toBeVisible();
  await expect(page.locator('.mr-main')).toBeHidden();
  await expect(page.locator('[data-print-sheet] table tbody tr')).toHaveCount(9);
  if (testInfo.project.name === 'chromium') await page.pdf({ path: testInfo.outputPath('ergebnis.pdf'), format: 'A4', printBackground: true });
});

test('responsive layout at 320px, mobile and desktop; preserved focus and safe text', async ({ page }, testInfo) => {
  for (const width of [320,390,1280]) {
    await page.setViewportSize({width,height:844});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:true});
  await openSection(page, 'costs'); await page.locator('[data-add-cost]').click();
  const name = page.locator('[data-cost-list="custom"] [data-cost-name]').last();
  await expect(name).toBeFocused(); await name.fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('[data-assumptions] img')).toHaveCount(0);
  await page.locator('[data-home]').click(); await expect(page.locator('[data-result-title]')).toBeFocused();
  await expect(name).toHaveValue('<img src=x onerror=alert(1)>');
  await openSection(page, 'income');
  await page.locator('[data-section="costs"] .mr-tax-details').first().evaluate(node => { node.open = true; });
  await openStorage(page);
  const beforeCollapse = await exportBackup(page);
  const headline = await page.locator('[data-out="headline"]').first().textContent();
  const collapse = page.getByRole('button', { name: 'Alles zuklappen', exact: true });
  await page.locator('[data-storage-panel] > summary').scrollIntoViewIfNeeded();
  const bounds = await collapse.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0); expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  await collapse.click();
  await expect(page.locator('#mietklar-app details[open]')).toHaveCount(0);
  await expect(collapse).toBeFocused();
  await expect(page.locator('[data-out="headline"]').first()).toHaveText(headline);
  await openSection(page, 'costs');
  await expect(page.locator('[data-section="costs"] details[open]')).toHaveCount(0);
  await expect(name).toHaveValue('<img src=x onerror=alert(1)>');
  expect((await exportBackup(page)).state).toEqual(beforeCollapse.state);

});


test('money fields group on blur, replace zero and preserve exact backup precision', async ({ page }) => {
  await page.locator('[data-calc-mode="rent"]').click();
  const rent = field(page, 'monthlyRent');
  await rent.fill('1234,56789');
  const exactResult = await page.locator('[data-out="headline"]').first().textContent();
  await openSection(page, 'afa');
  await expect(rent).toHaveValue('1.234,56789');
  await expect(page.locator('[data-out="headline"]').first()).toHaveText(exactResult);
  await field(page, 'afaMode').selectOption('purchase');
  await field(page, 'afaPurchaseYear').fill('2015');
  await page.locator('[data-afa-section="purchase"] details > summary').first().click();
  const legal = field(page, 'afaLegal');
  await expect(legal).toHaveValue('0,00');
  await legal.click(); await legal.pressSequentially('28,75');
  await expect(legal).toHaveValue('28,75');
  const price = field(page, 'afaPrice');
  await price.fill('123456,7');
  const broker = field(page, 'afaBroker');
  await broker.click(); await expect(price).toHaveValue('123.456,70');
  // Cover a mobile keyboard that leaves the caret after the existing zero.
  await broker.press('ArrowRight'); await broker.pressSequentially('49,5');
  await expect(broker).toHaveValue('49,5');
  await expect(page.locator('[data-afa-pending-note]')).toContainText('Grundanteil noch nicht eingeordnet');
  await expect(page.locator('[data-afa-effective-label]')).toContainText('noch offen');
  await field(page, 'afaLandPercent').fill('30');
  await expect(page.locator('[data-afa-pending-note]')).toBeVisible();
  await field(page, 'afaLandStatus').selectOption('estimate');
  await expect(page.locator('[data-afa-pending-note]')).toBeHidden();
  await expect.poll(() => value(page, 'annualAfa')).toBeGreaterThan(0);
  await field(page, 'afaLandPercent').fill('100');
  await expect.poll(() => value(page, 'annualAfa')).toBe(0);
  await expect(page.locator('[data-afa-pending-note]')).toBeHidden();
  await openSection(page, 'costs'); await page.locator('[data-add-cost]').click();
  const amount = page.locator('[data-cost-list="custom"] [data-cost-amount]').last();
  await amount.click(); await amount.pressSequentially('12,5');
  await expect(amount).toHaveValue('12,5');
  const backup = await exportBackup(page);
  await expect(amount).toHaveValue('12,50');
  expect(backup.state.fields.monthlyRent).toBe('1234,56789');
  expect(backup.state.fields.afaPrice).toBe('123456,7');
  expect(backup.state.fields.afaLegal).toBe('28,75');
  expect(backup.state.fields.afaBroker).toBe('49,5');
  expect(backup.state.costs.at(-1).amount).toBe('12,5');
  await page.locator('[data-home]').click(); await rent.fill('45.000');
  await rent.press('Tab'); await expect(rent).toHaveValue('45.000');
  await expect(page.locator('[data-error]')).toContainText('Mehrdeutiger Punkt');
  await rent.fill('-'); await rent.press('Tab'); await expect(rent).toHaveValue('-');
});

test('guided costs inherit context, preserve review data and keep legal and tax decisions separate', async ({ page }, testInfo) => {
  await openSection(page, 'costs');
  const context = page.locator('.mr-context');
  await context.locator(':scope > summary').click();
  await field(page, 'rentalLaw').selectOption('partial');
  const row = page.locator('[data-cost-row]').first();
  await row.locator('.mr-cost-review > summary').click();
  await row.locator('[data-cost-kind]').selectOption('garage');
  await row.locator('[data-cost-composition]').fill('<b>Fiktive gemeinsame Garage</b>');
  await row.locator('[data-cost-agreement]').selectOption('planned');
  await row.locator('[data-cost-payer]').selectOption('tenant');
  await expect(row.locator('[data-cost-next]')).toContainText('Grundlage ist noch offen');
  await expect(row.locator('[data-review-context]')).toContainText('Teilanwendung');
  await expect(row.locator('[data-review-tax-status]')).toContainText('offen');
  await expect(row.locator('[data-review-sources] a').first()).toHaveAttribute('href', /ris.bka.gv.at/);
  await expect(page.locator('[data-print-sheet]')).toContainText('Grundlage ist noch offen');
  await expect(row.locator('textarea b')).toHaveCount(0);
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await row.screenshot({ path: testInfo.outputPath('cost-review.png') });
  const saved = await exportBackup(page);
  expect(saved.state.costs[0].composition).toBe('<b>Fiktive gemeinsame Garage</b>');
  expect(saved.state.costs[0].agreement).toBe('planned');
  await row.locator('[data-cost-kind]').selectOption('reserve');
  await expect(row.locator('[data-cost-payer]')).toBeDisabled();
  await expect(row.locator('[data-cost-tax]')).toHaveValue('none');
  await row.locator('[data-cost-kind]').selectOption('water');
  await expect(row.locator('[data-cost-payer]')).toBeEnabled();
  await expect(row.locator('[data-cost-payer]')).toHaveValue('unknown');
  await expect(row.locator('[data-cost-tax]')).toHaveValue('unknown');
  await importBackup(page, saved);
  const restored = page.locator('[data-cost-row]').first();
  await restored.locator('.mr-cost-review > summary').click();
  await expect(restored.locator('[data-cost-kind]')).toHaveValue('garage');
  await expect(restored.locator('[data-cost-composition]')).toHaveValue('<b>Fiktive gemeinsame Garage</b>');
  await expect(restored.locator('[data-cost-agreement]')).toHaveValue('planned');
  await page.locator('[data-collapse-all]').click();
  await expect(page.locator('details[open]')).toHaveCount(0);
  const again = await exportBackup(page); expect(again.state).toEqual(saved.state);
});


test('one selected tariff controls labels, purchase-year limit, print and backup-year protection', async ({ page }) => {
  const previous = await exportBackup(page), rawPrevious = JSON.stringify(previous);
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key, raw: rawPrevious });
  const nextYear = currentTariff.year + 1;
  // Fictitious year with unchanged brackets: tests configuration, not future tax law.
  const synthetic = { ...currentTariff, year: nextYear, sourceLabel: 'Fiktive Testquelle', checkedAt: nextYear + '-01-02' };
  await page.route(/\/src\/tariff\.js(?:\?|$)/, async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('tarif-' + currentTariff.year + '.json', 'tarif-' + nextYear + '.json') });
  });
  await page.route(new RegExp('/data/tarif-' + nextYear + '\\.json(?:\\?|$)'), route => route.fulfill({ json: synthetic }));
  await page.reload();
  await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  for (const node of await page.locator('[data-tariff-year]').all()) await expect(node).toHaveText(String(nextYear));
  await expect(field(page, 'afaPurchaseYear')).toHaveAttribute('max', String(nextYear));
  await expect(page.locator('[data-tariff-source]')).toHaveText('Fiktive Testquelle');
  await expect(page.locator('[data-tariff-checked]')).toHaveText('02.01.' + nextYear);
  await expect(page.locator('[data-storage-status]')).toContainText(String(currentTariff.year));
  await expect(page.locator('[data-storage-status]')).toContainText(String(nextYear));
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(rawPrevious);
  await openSection(page, 'period');
  await field(page, 'periodMode').selectOption('year');
  await expect(field(page, 'periodMode').locator('option:checked')).toContainText(String(nextYear));
  await expect(page.locator('[data-year-summary]')).toContainText('Mietmonate in ' + nextYear);
  await expect(page.locator('[data-summary="period"]')).toContainText(String(nextYear));
  const current = await exportBackup(page);
  expect(current.tariffYear).toBe(nextYear);
  await importBackup(page, previous);
  await expect(page.locator('[data-storage-status]')).toContainText('Import nicht übernommen');
  await expect(page.locator('[data-storage-status]')).toContainText(String(currentTariff.year));
  await expect(page.locator('[data-storage-status]')).toContainText(String(nextYear));
  expect((await exportBackup(page)).state).toEqual(current.state);
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(rawPrevious);
  await expect(page.locator('[data-print-sheet]')).toContainText('Tarif ' + nextYear);
  await expect(page.locator('[data-print-sheet]')).toContainText('Kalenderjahr ' + nextYear);
  await expect(page.locator('[data-print-sheet]')).toContainText('Quelle: Fiktive Testquelle · geprüft am 02.01.' + nextYear);
});

test('wrong year or invalid source metadata prevents startup and printing', async ({ page }) => {
  for (const patch of [{ year: currentTariff.year + 1 }, { source: 'javascript:alert(1)' }, { checkedAt: '2026-02-30' }]) {
    await page.route(/\/data\/tarif-\d{4}\.json(?:\?|$)/, route => route.fulfill({ json: { ...currentTariff, ...patch } }));
    await page.reload();
    await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'error');
    await expect(page.locator('[data-error]')).toContainText('Start nicht möglich');
    await expect(page.locator('[data-result-content]')).toBeHidden();
    await expect(page.locator('[data-print]')).toBeDisabled();
    await expect(page.locator('[data-tariff-info]')).toBeHidden();
    await page.unroute(/\/data\/tarif-\d{4}\.json(?:\?|$)/);
  }
});
