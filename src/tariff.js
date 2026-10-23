import { validateTariff } from './calc.js?v=0.8.0-alpha.2';

// Select a reviewed tariff here; all displayed years follow this document.
export const ACTIVE_TARIFF_URL = new URL('../data/tarif-2026.json?v=0.8.0-alpha.2', import.meta.url);
export const ACTIVE_TARIFF_YEAR = Number(ACTIVE_TARIFF_URL.pathname.match(/tarif-(\d{4})\.json$/)[1]);

export function validateTariffDocument(document, expectedYear = ACTIVE_TARIFF_YEAR) {
  validateTariff(document);
  if (document.year !== expectedYear) throw new RangeError('Tarifdatei und ausgewähltes Tarifjahr stimmen nicht überein.');
  let source;
  try { source = new URL(document.source); } catch { throw new TypeError('Tarifquelle fehlt oder ist ungültig.'); }
  if (source.protocol !== 'https:' || source.username || source.password) throw new TypeError('Tarifquelle muss eine HTTPS-Adresse sein.');
  if (typeof document.sourceLabel !== 'string' || !document.sourceLabel.trim() || document.sourceLabel.length > 100) throw new TypeError('Bezeichnung der Tarifquelle fehlt oder ist ungültig.');
  const date = document.checkedAt;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new TypeError('Prüfdatum der Tarifdatei fehlt oder ist ungültig.');
  }
  return document;
}

export async function loadActiveTariff(request = fetch) {
  const response = await request(ACTIVE_TARIFF_URL);
  if (!response.ok) throw new Error('Tarifdatei nicht erreichbar.');
  return validateTariffDocument(await response.json());
}

export function tariffCheckedDate(tariff) {
  return tariff.checkedAt.split('-').reverse().join('.');
}
