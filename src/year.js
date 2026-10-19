import { nonnegative } from './calc.js?v=0.8.0-alpha.1';
import { regularFirstYearAfa } from './afa.js?v=0.8.0-alpha.1';

export function resolveYear(input) {
  if (input.mode === 'full') {
    const vacantMonths = input.expectedVacantMonths ?? 0;
    if (!Number.isInteger(vacantMonths) || vacantMonths < 0 || vacantMonths > 12) throw new RangeError('Erwarteter Leerstand: ganze Zahl von 0 bis 12 erforderlich.');
    return { mode: 'full', rentMonths: 12 - vacantMonths, availableMonths: 12, vacantMonths };
  }
  if (input.mode !== 'year') throw new RangeError('Ungültiger Planungszeitraum.');
  if (!Number.isInteger(input.startMonth) || input.startMonth < 1 || input.startMonth > 12) throw new RangeError('Startmonat: ganze Zahl von 1 bis 12 erforderlich.');
  const availableMonths = 13 - input.startMonth;
  if (!Number.isInteger(input.vacantMonths) || input.vacantMonths < 0 || input.vacantMonths > availableMonths) {
    throw new RangeError('Leerstand darf die Monate ab dem Startmonat nicht überschreiten.');
  }
  return { mode: 'year', availableMonths, vacantMonths: input.vacantMonths, rentMonths: availableMonths - input.vacantMonths };
}

export function resolveYearAfa(input, fullAfa) {
  if (input.period === 'full') return { annualAfa: nonnegative(fullAfa.annualAfa, 'Volljahres-AfA'), notes: [] };
  if (input.period !== 'year') throw new RangeError('Ungültiger AfA-Zeitraum.');
  if (input.mode === 'unknown') return { annualAfa: 0, notes: ['Gebäude-AfA für das Planjahr noch offen; vorerst 0 €.'] };
  if (input.mode === 'provided') return { annualAfa: nonnegative(input.amount, 'AfA im Planjahr'), notes: ['Gebäude-AfA für das Planjahr von dir angegeben; keine automatische Kürzung oder fachliche Freigabe.'] };
  if (input.mode !== 'regular') throw new RangeError('Ungültiger AfA-Weg für das Planjahr.');
  if (fullAfa.status === 'open' || input.months === null) return { annualAfa: 0, notes: ['Für die reguläre erste Jahres-AfA fehlen Volljahreswert oder AfA-Nutzungsmonate; vorerst 0 €.'] };
  return { annualAfa: regularFirstYearAfa(fullAfa.annualAfa, input.months), notes: ['Reguläres erstes AfA-Jahr nach separat eingegebenen Nutzungsmonaten. Leerstand ist nicht automatisch eine AfA-Kürzung; keine beschleunigte AfA.'] };
}
