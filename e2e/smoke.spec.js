import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const field = (page, key) => page.locator('[data-key="' + key + '"]');
const key = 'mietklar:saved-inputs';
async function openSection(page, name) {
  const details = page.locator('[data-section="' + name + '"]');
  if (!await details.evaluate(node => node.open)) await details.locator(':scope > summary').click();
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
  page.on('pageerror', error => page.testErrors.push(error.message));
  await page.goto('./');
  await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-error]')).toBeHidden();
});
test.afterEach(async ({ page }) => { expect(page.testErrors).toEqual([]); });

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
  await expect(field(page, 'target')).toHaveValue('2500');
  await expect.poll(() => value(page, 'cash')).toBeGreaterThanOrEqual(2500);
  await page.locator('[data-calc-mode="rent"]').click();
  await expect(field(page, 'monthlyRent')).toHaveValue('1400.50');
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
  expect(widths.reduce((a,b) => a+b, 0)).toBeCloseTo(100, 6);
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
});

test('opt-in, reload, export/import/undo and scoped deletion with comma drafts', async ({ page }) => {
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await page.locator('[data-calc-mode="rent"]').click();
  await field(page, 'monthlyRent').fill('1500,25'); await openStorage(page);
  await page.locator('[data-remember]').check();
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.state.fields.monthlyRent, key)).toBe('1500,25');
  await page.reload(); await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  await expect(field(page, 'monthlyRent')).toHaveValue('1500,25');
  const exported = await exportBackup(page); expect(exported.schemaVersion).toBe(3);
  expect(exported.state.fields.monthlyRent).toBe('1500,25');
  const imported = structuredClone(exported); imported.state.fields.monthlyRent = '1600';
  await importBackup(page, imported); await expect(field(page, 'monthlyRent')).toHaveValue('1600');
  await page.locator('[data-undo-import]').click(); await expect(field(page, 'monthlyRent')).toHaveValue('1500,25');
  await importBackup(page, { ...exported, tariffYear: 2025 });
  await expect(page.locator('[data-storage-status]')).toContainText('Import nicht übernommen');
  await expect(field(page, 'monthlyRent')).toHaveValue('1500,25');
  await page.evaluate(() => localStorage.setItem('unrelated', 'keep'));
  await page.locator('[data-delete-saved]').click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('unrelated'))).toBe('keep');
  await expect(field(page, 'monthlyRent')).toHaveValue('1500,25');
  await page.reload(); await expect(page.locator('#mietklar-app')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('[data-calc-mode="target"]')).toHaveAttribute('aria-pressed','true');
});

test('legacy format 1 and 2 imports preserve financial values and do not enable saving', async ({ page }) => {
  await page.locator('[data-calc-mode="rent"]').click();
  const exported = await exportBackup(page);
  const v2 = structuredClone(exported); v2.schemaVersion = 2;
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
  await page.locator('[data-calc-mode="rent"]').click();
  await expect(page.locator('[data-print-sheet]')).toContainText('505,00');
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
});
