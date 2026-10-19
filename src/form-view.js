import { suggestLandShare } from './afa.js';
import { resolveYear } from './year.js';
import { numeric, money } from './numbers.js';

export function landSuggestion(fields) {
  return suggestLandShare({ municipality: fields.afaMunicipality, priceBand: fields.afaLandPriceBand,
    units: fields.afaUnits, exception: fields.afaLandException });
}

export function renderForm(root, state) {
  const q = s => root.querySelector(s), all = s => [...root.querySelectorAll(s)];
  const f = state.fields, forward = state.calculationMode === 'rent', yearMode = f.periodMode === 'year';
  all('[data-calc-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.calcMode === state.calculationMode)));
  all('[data-calc-field]').forEach(node => node.hidden = node.dataset.calcField !== state.calculationMode);
  all('[data-income-section]').forEach(node => node.hidden = node.dataset.incomeSection !== f.incomeMode);
  q('[data-deduction-custom]').hidden = f.deductionMode !== 'custom';
  all('[data-year-only]').forEach(node => node.hidden = !yearMode);
  all('[data-full-only]').forEach(node => node.hidden = yearMode);
  all('[data-afa-section]').forEach(node => node.hidden = node.dataset.afaSection !== f.afaMode);
  all('[data-year-afa-section]').forEach(node => node.hidden = node.dataset.yearAfaSection !== f.yearAfaMode);
  q('[data-afa-evidence-wrap]').hidden = f.afaMode === 'unknown';
  q('[data-purchase-afa]').hidden = f.treatment !== 'afa';
  q('[data-target-label]').textContent = 'Wunschüberschuss · Ø / Monat (€)';
  q('[data-year-result]').hidden = false;
  all('[data-total-label]').forEach(node => node.textContent = 'Mietereinnahmen · Durchschnitt / Monat');
  all('[data-tenant-label]').forEach(node => node.textContent = 'Kostenersatz · Durchschnitt / Monat');
  q('[data-slider-label]').textContent = forward ? 'Hauptmiete je Mietmonat anpassen' : 'Wunschüberschuss anpassen';
  const slider = q('[data-slider]'), value = numeric(f[forward ? 'monthlyRent' : 'target']);
  slider.max = String(Math.max(forward ? 5000 : 2500, Number.isFinite(value) ? Math.ceil(value / 500) * 500 : 0));
  if (Number.isFinite(value) && value >= 0) slider.value = String(value);
  slider.setAttribute('aria-label', forward ? 'Hauptmiete anpassen' : 'Wunschüberschuss anpassen');
  slider.setAttribute('aria-valuetext', money(value));
  q('[data-slider-max]').textContent = money(Number(slider.max));
  try {
    const period = resolveYear({ mode: f.periodMode, startMonth: numeric(f.startMonth), vacantMonths: numeric(f.vacantMonths), expectedVacantMonths: numeric(f.expectedVacantMonths) });
    q('[data-year-summary]').textContent = period.rentMonths + ' Mietmonate in 2026. Wunschbetrag = Durchschnitt über zwölf Kalendermonate; 1.000 €/Monat bedeuten 12.000 € Jahresziel.';
    q('[data-summary="period"]').textContent = period.rentMonths + ' Mietmonate' + (yearMode ? ' · 2026' : ' · Regeljahr');
  } catch { q('[data-summary="period"]').textContent = 'Bitte prüfen'; q('[data-year-summary]').textContent = 'Bitte Startmonat und Leerstand prüfen.'; }
  const suggestion = landSuggestion(f);
  q('[data-land-suggestion]').textContent = suggestion.message;
  q('[data-apply-land]').disabled = suggestion.percent === null;
  const law = f.rentalLaw;
  q('[data-contract-hint]').textContent = (law === 'full'
    ? 'Bei MRG-Vollanwendung gelten die gesetzlichen Betriebskostenregeln. Ein Betrag in deiner WEG-Vorschreibung ist dadurch nicht automatisch Mieter-BK.'
    : law === 'partial' ? 'Bei MRG-Teilanwendung ist für zusätzliche Kosten eine wirksame Vereinbarung maßgeblich. Die App bewertet keine Vertragsklauseln.'
      : 'Die mietrechtliche Einordnung ist offen oder benötigt eine eigene Prüfung. Kosten werden nicht automatisch zur Weiterverrechnung freigegeben.')
    + (f.contract === 'none' ? ' Ohne Mietvertrag ist eine Erstattung zunächst eine Planungsannahme für einen späteren Vertrag.' : ' Prüfe Kostenvereinbarung und Verteilungsschlüssel im Vertrag.');
}

export function renderAfa(root, result) {
  const q = s => root.querySelector(s);
  q('[data-afa-status]').textContent = result.status === 'open' ? result.notes[0] || 'Volljahresbasis derzeit offen; die separate Jahresauswahl gilt.'
    : 'Volljahreswert als Grundlage: ' + money(result.annualAfa) + '. Deine Angaben sind nicht durch die App geprüft.';
  q('[data-afa-purchase-breakdown]').hidden = result.totalAcquisition === null;
  q('[data-afa-total]').textContent = money(result.totalAcquisition);
  q('[data-afa-land]').textContent = money(result.landValue);
  q('[data-afa-building]').textContent = money(result.buildingBasis);
  q('[data-afa-first-wrap]').hidden = result.firstYearAfa === null;
  q('[data-afa-first]').textContent = money(result.firstYearAfa);
}
