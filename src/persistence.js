import { COST_KIND_IDS } from './cost-guidance.js?v=0.8.0-alpha.2';
import { suggestLandShare } from './afa.js?v=0.8.0-alpha.2';
import { numericDraft, numeric as parsedNumeric } from './numbers.js?v=0.8.0-alpha.2';

export const STORAGE_KEY = 'mietklar:saved-inputs';
export const SCHEMA_VERSION = 4;
export const MAX_BACKUP_BYTES = 256 * 1024;
export const MAX_COST_ROWS = 100;
const numeric = { type: 'number' };
const choice = (...values) => ({ type: 'choice', values });
const text = max => ({ type: 'text', max });

// Raw form values preserve unfinished drafts. Domain validation remains in the calculators.
const V1_FIELD_RULES = {
  target: numeric, monthlyRent: numeric,
  incomeMode: choice('payslip', 'provided'), salary: numeric,
  deductionMode: choice('flat', 'custom'), salaryDeduction: numeric, salaryBase: numeric,
  rentalLaw: choice('unknown', 'partial', 'full', 'other'),
  contract: choice('none', 'existing', 'unknown'), buffer: numeric,
  afaMode: choice('unknown', 'purchase', 'known', 'basis'), afa: numeric, building: numeric, rate: numeric,
  afaBasisStatus: choice('unknown', 'estimate', 'provided'),
  afaAcquisition: choice('purchase', 'gift', 'other'),
  afaPreviousUse: choice('private', 'rented', 'unknown'),
  afaPurchaseYear: numeric, afaPrice: numeric, afaTransferTax: numeric,
  afaRegistration: numeric, afaLegal: numeric, afaBroker: numeric, afaOther: numeric,
  afaLandPercent: numeric, afaLandStatus: choice('unknown', 'estimate', 'provided'),
  afaMunicipality: choice('unknown', 'large', 'small'),
  afaLandPriceBand: choice('unknown', 'low', 'high'),
  afaUnits: choice('unknown', 'over10', 'upTo10'),
  afaLandException: choice('unknown', 'none', 'proof', 'deviation'),
  afaFirstMonths: choice('unknown', ...Array.from({ length: 13 }, (_, i) => String(i))),
  afaEvidence: text(300), vat: choice('exempt', 'unknown', 'taxable'),
  item: text(200), purchase: numeric, treatment: choice('instant', 'afa'), purchaseAfa: numeric
};
export const YEAR_DEFAULTS = Object.freeze({ periodMode: 'full', startMonth: '1', vacantMonths: '0', yearAfaMode: 'unknown', yearAfa: '0', yearAfaMonths: 'unknown' });
const V2_FIELD_RULES = { ...V1_FIELD_RULES,
  periodMode: choice('full', 'year'), startMonth: choice(...Array.from({ length: 12 }, (_, i) => String(i + 1))),
  vacantMonths: numeric, yearAfaMode: choice('unknown', 'provided', 'regular'), yearAfa: numeric,
  yearAfaMonths: choice('unknown', ...Array.from({ length: 13 }, (_, i) => String(i)))
};
export const COMPACT_DEFAULTS = Object.freeze({ expectedVacantMonths: '0', area: '', referenceRent: '' });
export const FIELD_RULES = Object.freeze({ ...V2_FIELD_RULES, expectedVacantMonths: numeric, area: numeric, referenceRent: numeric });
const V1_COST_RULES = {
  name: text(100), amount: numeric, period: choice('month', 'year'),
  payer: choice('unknown', 'tenant', 'partial', 'owner'), forward: numeric,
  taxStatus: choice('unknown', 'full', 'annual', 'none'), taxAnnual: numeric, evidence: text(250),
  kind: choice('bk', 'water', 'heat', 'reserve', 'admin', 'repair', 'adviser', 'other'),
  group: choice('house', 'own', 'custom')
};
const V3_COST_RULES = { ...V1_COST_RULES, paymentMonths: numeric, yearTaxStatus: choice('unknown', 'provided', 'none'), yearTaxAnnual: numeric };
const COST_RULES = { ...V3_COST_RULES, kind: choice(...COST_KIND_IDS), composition: text(400), agreement: choice('unknown', 'planned', 'documented', 'excluded') };
function exactKeys(value, keys, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== keys.length
    || keys.some(key => !Object.prototype.hasOwnProperty.call(value, key))
    || Object.keys(value).some(key => !keys.includes(key))) {
    throw new TypeError(label + ': unerwartete oder fehlende Angaben.');
  }
}
function validateValues(value, rules, label, version) {
  exactKeys(value, Object.keys(rules), label);
  const result = {};
  for (const [key, rule] of Object.entries(rules)) {
    const raw = value[key];
    if (typeof raw !== 'string') throw new TypeError(label + ': Eingabewerte müssen als Text gespeichert sein.');
    if (rule.type === 'number') {
      const valid = version >= 3 ? numericDraft(raw) : raw.length <= 64 && (raw === '' || (/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw)
        && Number.isFinite(Number(raw)) && Math.abs(Number(raw)) <= 1e12));
      if (!valid) {
        throw new RangeError(label + ': ungültiger oder zu großer Zahlenwert.');
      }
    } else if (rule.type === 'choice') {
      if (!rule.values.includes(raw)) throw new RangeError(label + ': unbekannte Auswahl.');
    } else if (raw.length > rule.max) {
      throw new RangeError(label + ': Text ist zu lang.');
    }
    result[key] = raw;
  }
  return result;
}
export function validateState(state, version = SCHEMA_VERSION) {
  if (![1, 2, 3, SCHEMA_VERSION].includes(version)) throw new RangeError('Unbekannte Sicherungsversion.');
  exactKeys(state, ['fields', 'costs', 'calculationMode', 'step', 'adoptedLandSuggestion'], 'Eingabestand');
  const fields = validateValues(state.fields, version === 1 ? V1_FIELD_RULES : version === 2 ? V2_FIELD_RULES : FIELD_RULES, 'Eingabefelder', version);
  if (!Array.isArray(state.costs) || state.costs.length > MAX_COST_ROWS) throw new RangeError('Sicherung: höchstens 100 Kostenpositionen möglich.');
  const costs = state.costs.map(row => {
    const copy = validateValues(row, version === 1 ? V1_COST_RULES : version <= 3 ? V3_COST_RULES : COST_RULES, 'Kostenposition', version);
    if (copy.kind === 'reserve' && (copy.payer !== 'owner' || copy.taxStatus !== 'none')) {
      throw new RangeError('Rücklageneinzahlung: unzulässige Erstattungs-/Steuerauswahl in der Sicherung.');
    }
    if (version >= 2 && copy.kind === 'reserve' && copy.yearTaxStatus !== 'none') throw new RangeError('Rücklageneinzahlung: kein automatischer Abzug im Planjahr.');
    return copy;
  });
  if (!['target', 'rent'].includes(state.calculationMode)) throw new RangeError('Sicherung: unbekannte Rechenrichtung.');
  if (!Number.isInteger(state.step) || state.step < 0 || state.step > 4) throw new RangeError('Sicherung: ungültiger Rechenschritt.');
  if (typeof state.adoptedLandSuggestion !== 'boolean') throw new TypeError('Sicherung: Grundanteil-Herkunft ungültig.');
  if (state.adoptedLandSuggestion) {
    const suggestion = suggestLandShare({
      municipality: fields.afaMunicipality, priceBand: fields.afaLandPriceBand,
      units: fields.afaUnits, exception: fields.afaLandException
    });
    if (suggestion.percent === null || fields.afaLandStatus !== 'estimate'
      || fields.afaLandPercent === '' || (version >= 3 ? parsedNumeric(fields.afaLandPercent) : Number(fields.afaLandPercent)) !== suggestion.percent) {
      throw new RangeError('Sicherung: übernommener Grundanteil passt nicht zu den Hilfsangaben.');
    }
  }
  return { fields, costs, calculationMode: state.calculationMode, step: state.step, adoptedLandSuggestion: state.adoptedLandSuggestion };
}
export function makeSnapshot(state, tariffYear, savedAt = new Date().toISOString()) {
  if (!Number.isInteger(tariffYear)) throw new TypeError('Ungültiges Tarifjahr.');
  if (typeof savedAt !== 'string' || savedAt.length !== 24 || !Number.isFinite(Date.parse(savedAt))
    || new Date(savedAt).toISOString() !== savedAt) throw new TypeError('Ungültiges Speicherdatum.');
  const snapshot = { app: 'mietklar', schemaVersion: SCHEMA_VERSION, tariffYear, savedAt, state: validateState(state) };
  if (new TextEncoder().encode(JSON.stringify(snapshot)).length > MAX_BACKUP_BYTES) throw new RangeError('Sicherung ist zu groß (maximal 256 KB).');
  return snapshot;
}
export function parseSnapshot(raw, expectedYear) {
  if (typeof raw !== 'string' || new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new RangeError('Sicherung ist zu groß oder nicht lesbar (maximal 256 KB).');
  let value;
  try { value = JSON.parse(raw); } catch { throw new TypeError('Datei ist keine lesbare mietklar-JSON-Sicherung.'); }
  exactKeys(value, ['app', 'schemaVersion', 'tariffYear', 'savedAt', 'state'], 'Sicherung');
  if (value.app !== 'mietklar') throw new TypeError('Diese Datei ist keine mietklar-Sicherung.');
  if (![1, 2, 3, SCHEMA_VERSION].includes(value.schemaVersion)) throw new RangeError('Diese Sicherungsversion wird von der App noch nicht unterstützt.');
  if (!Number.isInteger(value.tariffYear)) throw new RangeError('Sicherung enthält kein gültiges Steuerjahr.');
  if (value.tariffYear !== expectedYear) throw new RangeError('Sicherung gehört zum Steuerjahr ' + value.tariffYear + ', die App rechnet mit ' + expectedYear + '.');
  let state = validateState(value.state, value.schemaVersion);
  if (value.schemaVersion === 1) state = {
    ...state, fields: { ...state.fields, ...YEAR_DEFAULTS },
    costs: state.costs.map(row => ({ ...row, paymentMonths: '12', yearTaxStatus: row.kind === 'reserve' ? 'none' : 'unknown', yearTaxAnnual: '0' }))
  };
  if (value.schemaVersion <= 2) state = { ...state, fields: { ...state.fields, ...COMPACT_DEFAULTS } };
  if (value.schemaVersion <= 2) {
    // Old number inputs unambiguously used a decimal point. Keep their value
    // when a three-digit fraction would be ambiguous in the new text inputs.
    const convert = (values, rules) => Object.fromEntries(Object.entries(values).map(([key, raw]) =>
      [key, rules[key]?.type === 'number' && /^-?\d{1,3}\.\d{3}$/.test(raw) ? raw.replace('.', ',') : raw]));
    state = { ...state, fields: convert(state.fields, FIELD_RULES), costs: state.costs.map(row => convert(row, COST_RULES)) };
  }
  if (value.schemaVersion <= 3) state = { ...state, costs: state.costs.map(row => ({ ...row, composition: '', agreement: 'unknown' })) };
  return makeSnapshot(state, value.tariffYear, value.savedAt);
}
export function readSavedSnapshot(storage, tariffYear) {
  const raw = storage.getItem(STORAGE_KEY);
  return raw === null ? null : parseSnapshot(raw, tariffYear);
}
export function writeSavedSnapshot(storage, state, tariffYear, savedAt) {
  const snapshot = makeSnapshot(state, tariffYear, savedAt);
  storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}
export function removeSavedSnapshot(storage) {
  storage.removeItem(STORAGE_KEY);
}

