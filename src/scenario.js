import { aggregateCosts } from './costs.js?v=0.7.0-alpha.2';
import { resolveAfa } from './afa.js?v=0.7.0-alpha.2';
import { resolveIncomeBase, calculateScenario } from './planning.js?v=0.7.0-alpha.2';
import { resolveYear, resolveYearAfa } from './year.js?v=0.7.0-alpha.2';
import { comparePurchase } from './calc.js?v=0.7.0-alpha.2';
import { parseAmount, numeric } from './numbers.js?v=0.7.0-alpha.2';

function amount(raw, label, field) {
  try {
    const value = parseAmount(raw);
    if (value === null || value < 0) throw new RangeError('Betrag ab 0 erforderlich; das Feld darf nicht leer sein.');
    return value;
  } catch (error) { error.message = label + ': ' + error.message; error.field = field; throw error; }
}

export function resolveAfaFields(f, year) {
  return resolveAfa({
    mode: f.afaMode, annualAfa: numeric(f.afa), evidence: f.afaEvidence,
    buildingBasis: numeric(f.building), rate: numeric(f.rate), basisStatus: f.afaBasisStatus,
    acquisition: f.afaAcquisition, previousUse: f.afaPreviousUse, purchaseYear: numeric(f.afaPurchaseYear),
    price: numeric(f.afaPrice), landPercent: numeric(f.afaLandPercent), landStatus: f.afaLandStatus,
    transferTax: numeric(f.afaTransferTax), registration: numeric(f.afaRegistration), legal: numeric(f.afaLegal),
    broker: numeric(f.afaBroker), other: numeric(f.afaOther),
    firstYearMonths: f.afaFirstMonths === 'unknown' ? null : numeric(f.afaFirstMonths)
  }, year);
}

/** Build the complete annual model from raw form values, without touching the DOM. */
export function buildScenarioInput(state, tariffYear) {
  const f = state.fields;
  const read = (key, label) => amount(f[key], label, key);
  const direction = state.calculationMode;
  if (!['target', 'rent'].includes(direction)) throw new RangeError('Ungültige Rechenrichtung.');
  const period = resolveYear({ mode: f.periodMode,
    startMonth: f.periodMode === 'year' ? read('startMonth', 'Startmonat') : 1,
    vacantMonths: f.periodMode === 'year' ? read('vacantMonths', 'Leerstand') : 0,
    expectedVacantMonths: f.periodMode === 'full' ? read('expectedVacantMonths', 'Erwarteter Leerstand') : 0
  });
  const income = resolveIncomeBase({ mode: f.incomeMode,
    salary: f.incomeMode === 'payslip' ? read('salary', 'KZ 245') : NaN,
    base: f.incomeMode === 'provided' ? read('salaryBase', 'Bereinigte Tarifbasis') : NaN,
    deductionMode: f.deductionMode,
    deduction: f.incomeMode === 'payslip' && f.deductionMode === 'custom' ? read('salaryDeduction', 'Werbungskosten') : NaN
  });
  let afaResult;
  try { afaResult = resolveAfaFields(f, tariffYear); }
  catch (error) {
    if (period.mode !== 'year' || f.yearAfaMode === 'regular') throw error;
    afaResult = { status: 'open', annualAfa: 0, notes: [], buildingBasis: null, landValue: null, totalAcquisition: null, firstYearAfa: null };
  }
  const yearAfa = resolveYearAfa({ period: period.mode, mode: f.yearAfaMode,
    amount: period.mode === 'year' && f.yearAfaMode === 'provided' ? read('yearAfa', 'AfA im Planjahr') : NaN,
    months: f.yearAfaMonths === 'unknown' ? null : numeric(f.yearAfaMonths)
  }, afaResult);
  const lines = state.costs.map((row, index) => {
    const get = (key, label) => amount(row[key], (row.name || 'Kostenposition') + ' – ' + label, 'cost:' + index + ':' + key);
    return { ...row, amount: get('amount', 'Zahlbetrag'),
      forward: row.payer === 'partial' ? get('forward', 'Erstattung') : NaN,
      taxAnnual: period.mode === 'full' && row.taxStatus === 'annual' ? get('taxAnnual', 'Jahresabzug') : NaN,
      paymentMonths: period.mode === 'year' && row.period === 'month' ? get('paymentMonths', 'Zahlungsmonate') : NaN,
      yearTaxAnnual: period.mode === 'year' && row.yearTaxStatus === 'provided' ? get('yearTaxAnnual', 'Abzug im Planjahr') : NaN
    };
  });
  const buffer = read('buffer', 'Persönlicher Puffer');
  const allLines = [...lines, { name: 'Persönlicher Puffer', amount: buffer, period: 'month', kind: 'buffer',
    payer: 'owner', taxStatus: 'none', yearTaxStatus: 'none', paymentMonths: 12 }];
  const costs = aggregateCosts(allLines, period);
  const reserve = costs.rows.reduce((sum, row, index) => sum + (['reserve', 'buffer'].includes(allLines[index].kind) ? row.annualPayment : 0), 0);
  return { fields: f, period, income, afaResult, yearAfa, costs, lines, reserve,
    input: { mode: direction, target: direction === 'target' ? read('target', 'Wunschüberschuss') : NaN,
      rent: direction === 'rent' ? read('monthlyRent', 'Hauptmiete') : NaN },
    model: { base: income.base, annualCashCosts: costs.annualCashCosts, annualReimbursements: costs.annualReimbursements,
      annualTaxCosts: costs.annualTaxCosts, annualAfa: yearAfa.annualAfa, rentMonths: period.rentMonths }
  };
}

export function evaluateScenario(state, tariff) {
  const built = buildScenarioInput(state, tariff.year);
  const solved = calculateScenario(built.input, built.model, tariff);
  let purchase = null, purchaseError = null;
  try {
    const price = amount(state.fields.purchase, 'Kaufpreis', 'purchase');
    const deduction = state.fields.treatment === 'instant' ? price : amount(state.fields.purchaseAfa, 'Anschaffungs-AfA', 'purchaseAfa');
    if (!['instant', 'afa'].includes(state.fields.treatment)) throw new RangeError('Ungültige steuerliche Behandlung.');
    if (state.fields.treatment === 'instant' && price > 1000) throw new RangeError('Sofortabzug über 1.000 € bitte separat prüfen; gegebenenfalls Abschreibung wählen.');
    purchase = { price, deduction, ...comparePurchase({ base: built.model.base, rentalIncome: solved.rentalIncome,
      monthlyCash: solved.monthlyCash, purchase: price, deduction }, tariff) };
  } catch (error) { purchaseError = error.message; }
  return { ...built, solved, purchase, purchaseError };
}

export function comparePerSquareMetre(rent, areaRaw, referenceRaw) {
  if (areaRaw === '' && referenceRaw === '') return { value: null, above: false, message: 'Optional: Fläche und eigenen Vergleichswert eintragen.' };
  try {
    const area = amount(areaRaw, 'Wohnfläche', 'area');
    if (area === 0) throw new RangeError('Wohnfläche muss größer als 0 sein.');
    const reference = referenceRaw === '' ? null : amount(referenceRaw, 'Vergleichswert', 'referenceRent');
    const value = rent / area;
    return { value, above: reference !== null && value > reference, reference, message: null };
  } catch (error) { return { value: null, above: false, message: error.message }; }
}

/** One common time basis for every segment; a deficit is an additional funding need. */
export function buildFlow(result) {
  const { costs, reserve, solved } = result;
  const income = (solved.annualRent + costs.annualReimbursements) / 12;
  const shortfall = Math.max(0, -solved.monthlyCash);
  const segments = [
    { key: 'costs', label: 'Kosten', value: (costs.annualCashCosts - reserve) / 12 },
    { key: 'reserve', label: 'Rücklage/Puffer', value: reserve / 12 },
    { key: 'tax', label: 'Steuer', value: solved.annualTax / 12 },
    { key: 'cash', label: 'Überschuss', value: Math.max(0, solved.monthlyCash) }
  ];
  const total = segments.reduce((sum, row) => sum + row.value, 0);
  // Allocate display cents once so legend values add up to the displayed total.
  const cents = segments.map(row => Math.floor(Math.max(0, row.value) * 100));
  cents[3] = Math.round(segments[3].value * 100); // Keep cash identical to the headline.
  let remainder = Math.round(total * 100) - cents.reduce((a, b) => a + b, 0);
  const order = segments.slice(0, 3).map((row, i) => ({ i, fraction: row.value * 100 - cents[i] })).sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < remainder; i++) cents[order[i % order.length].i]++;
  return { income, shortfall, total, segments: segments.map((row, i) => ({ ...row, displayValue: cents[i] / 100,
    percent: total > 0 ? Math.max(0, row.value) / total * 100 : 0 })) };
}
