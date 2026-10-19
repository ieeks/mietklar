import { nonnegative } from './calc.js';

const pending = message => ({
  status: 'open', annualAfa: 0, buildingBasis: null, landValue: null,
  totalAcquisition: null, firstYearAfa: null, notes: [message + ' Vorerst sind 0 € Gebäude-AfA angesetzt.']
});
const percent = (value, label) => {
  nonnegative(value, label);
  if (value > 100) throw new RangeError(label + ': höchstens 100 % möglich.');
  return value;
};

/** Suggestion only. A separate action is required to adopt it in the UI. */
export function suggestLandShare({ municipality, priceBand, units, exception }) {
  if (!['unknown', 'small', 'large'].includes(municipality)
    || !['unknown', 'low', 'high'].includes(priceBand)
    || !['unknown', 'upTo10', 'over10'].includes(units)
    || !['unknown', 'none', 'proof', 'deviation'].includes(exception)) {
    throw new RangeError('Ungültige Angaben zur Grundanteil-Hilfe.');
  }
  if (exception !== 'none') return {
    percent: null, message: exception === 'unknown'
      ? 'Bitte klären, ob ein gesonderter Nachweis oder eine offenkundig erhebliche Abweichung vorliegt.'
      : 'Individuelle Bewertung prüfen; der Pauschalvorschlag wird nicht angewendet.'
  };
  if (municipality === 'small' && priceBand === 'low') return {
    percent: 20, message: 'Pauschalansatz 20 % Grundanteil: Gemeinde unter 100.000 Einwohnern und durchschnittliches baureifes Land unter 400 €/m².'
  };
  if (municipality === 'large' || priceBand === 'high') {
    if (units === 'unknown') return { percent: null, message: 'Für diesen Fall fehlt noch die Anzahl der Wohn-/Geschäftseinheiten.' };
    const share = units === 'over10' ? 30 : 40;
    return { percent: share, message: 'Pauschalansatz ' + share + ' % Grundanteil bei ' + (units === 'over10' ? 'mehr als 10' : 'bis zu 10') + ' Wohn-/Geschäftseinheiten.' };
  }
  return { percent: null, message: 'Gemeindegröße und/oder durchschnittlichen Baulandpreis noch klären.' };
}

export function regularFirstYearAfa(annualAfa, months) {
  nonnegative(annualAfa, 'Jahres-AfA');
  if (months === null || months === undefined) return null;
  if (!Number.isInteger(months) || months < 0 || months > 12) throw new RangeError('AfA-Nutzungsmonate: ganze Zahl von 0 bis 12 erforderlich.');
  return annualAfa * (months > 6 ? 1 : months > 0 ? .5 : 0);
}

/** Full regular-year planning. This is not a property valuation or tax assessment. */
export function resolveAfa(input, calculationYear = 2026) {
  if (!Number.isInteger(calculationYear)) throw new RangeError('Ungültiges Rechenjahr.');
  if (input.mode === 'unknown') return pending('Gebäude-AfA noch nicht ermittelt.');
  if (input.mode === 'known') {
    if (input.annualAfa === null) return pending('Bitte den bekannten vollen Jahreswert eingeben.');
    const annualAfa = nonnegative(input.annualAfa, 'Jahres-AfA');
    return {
      status: 'provided', annualAfa, buildingBasis: null, landValue: null,
      totalAcquisition: null, firstYearAfa: null,
      notes: input.evidence?.trim() ? [] : ['Jahres-AfA von dir angegeben; Quelle / Begründung noch ergänzen.']
    };
  }
  if (input.mode === 'basis') {
    if (!['unknown', 'estimate', 'provided'].includes(input.basisStatus)) throw new RangeError('Ungültiger Basisstatus.');
    if (input.basisStatus === 'unknown' || input.buildingBasis === null || input.rate === null) {
      return pending('Gebäudebasis oder jährlicher Satz noch nicht geklärt.');
    }
    const buildingBasis = nonnegative(input.buildingBasis, 'Gebäude-Basis');
    const rate = percent(input.rate, 'AfA-Satz');
    if (rate === 0 && buildingBasis > 0) throw new RangeError('AfA-Satz muss größer als 0 sein.');
    const annualAfa = nonnegative(buildingBasis * rate / 100, 'Jahres-AfA');
    return {
      status: input.basisStatus, annualAfa, buildingBasis, landValue: null,
      totalAcquisition: null, firstYearAfa: null,
      notes: input.basisStatus === 'estimate'
        ? ['Gebäude-AfA aus einer von dir geschätzten Basis und einem eingegebenen Satz; Grundlage noch bestätigen.']
        : input.evidence?.trim() ? [] : ['Gebäudebasis und Satz von dir als geklärt angegeben; Quelle / Begründung noch ergänzen.']
    };
  }
  if (input.mode !== 'purchase') throw new RangeError('Ungültiger AfA-Eingabeweg.');
  if (input.acquisition !== 'purchase') return pending('Erbe, Schenkung, Herstellung oder andere Erwerbsarten benötigen eine eigene AfA-Prüfung. Einen bestätigten Jahreswert oder eine bestätigte Gebäudebasis verwenden.');
  if (input.previousUse !== 'private') return pending('Bei früherer Vermietung ist eine bestehende AfA zu prüfen; bei unklarer Nutzung zuerst die Vorgeschichte klären.');
  if (input.purchaseYear === null) return pending('Bitte das Kaufjahr eingeben.');
  if (!Number.isInteger(input.purchaseYear) || input.purchaseYear < 1900 || input.purchaseYear > calculationYear) {
    throw new RangeError('Kaufjahr: ganze Jahreszahl zwischen 1900 und dem Rechenjahr erforderlich.');
  }
  // Restrict the assistant to unambiguous new-asset cases; no classification of 2002 or older assets.
  if (input.purchaseYear < 2003) return pending('Dieser Kauf-Assistent deckt Käufe ab 2003 ab. Ältere Käufe und Altvermögen individuell prüfen und einen geklärten Wert übernehmen.');
  if (input.price === null) return pending('Bitte den Immobilien-Kaufpreis ohne gesondertes Inventar eingeben.');
  nonnegative(input.price, 'Kaufpreis');
  if (input.price === 0) throw new RangeError('Für die Kaufherleitung ist ein Kaufpreis größer als 0 erforderlich.');
  if (!['unknown', 'estimate', 'provided'].includes(input.landStatus)) throw new RangeError('Ungültiger Grundanteilstatus.');
  if (input.landStatus === 'unknown' || input.landPercent === null) return pending('Grundanteil noch nicht eingeordnet. Einen Schätzwert bewusst wählen oder einen belegten Anteil übernehmen.');
  const landPercent = percent(input.landPercent, 'Grundanteil');
  const ancillary = ['transferTax', 'registration', 'legal', 'broker', 'other'].reduce((sum, key) => {
    return sum + nonnegative(input[key] ?? 0, 'Kaufnebenkosten');
  }, 0);
  const totalAcquisition = nonnegative(input.price + ancillary, 'Anschaffungskosten');
  const landValue = totalAcquisition * (landPercent / 100);
  const buildingBasis = Math.max(0, totalAcquisition - landValue);
  const annualAfa = nonnegative(buildingBasis * .015, 'Jahres-AfA');
  return {
    status: 'estimate', annualAfa, buildingBasis, landValue, totalAcquisition,
    firstYearAfa: regularFirstYearAfa(annualAfa, input.firstYearMonths),
    notes: [
      'Gebäude-AfA aus Kaufpreis, eingegebenen Nebenkosten und Grundanteil hergeleitet; Vollständigkeit und Zuordnung noch prüfen.',
      ...(input.landStatus === 'estimate' ? ['Grundanteil ist eine Planungsannahme, keine bestätigte Bewertung.'] : []),
      ...(!input.evidence?.trim() ? ['Quelle / Begründung der Kauf- und Grundanteilswerte noch ergänzen.'] : [])
    ]
  };
}
