
import { solveRent, comparePurchase, validateTariff } from './calc.js';
(async()=>{
const root=document.getElementById('mietklar-app');let step=0,afaMode='known';let computed=null;
const q=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];const el=k=>q('[data-key="'+k+'"]');const val=k=>Number(el(k).value);
const money=x=>new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(x);
let tariff;
try {
 const response=await fetch(new URL('../data/tarif-2026.json',import.meta.url));
 if(!response.ok)throw new Error('Tarifdatei nicht erreichbar');
 tariff=validateTariff(await response.json());
 if(tariff.year!==2026)throw new Error('Tarifjahr stimmt nicht mit der Oberfläche überein');
}catch(error){q('[data-error]').hidden=false;q('[data-error]').textContent='Start nicht möglich: '+error.message+'. Bitte die App über einen lokalen Webserver oder GitHub Pages öffnen.';return;}
q('[data-next]').disabled=false;
function compute(){
 const nums=all('input[type="number"]');let invalid=false;for(const n of nums){const bad=n.value===''||!Number.isFinite(Number(n.value))||Number(n.value)<0;n.setAttribute('aria-invalid',String(bad));invalid=invalid||bad;}
 if(val('rate')>100)invalid=true;const err=q('[data-error]');err.hidden=!invalid;err.textContent=invalid?'Bitte gültige Beträge eingeben. Negative oder leere Zahlenfelder können wir noch nicht berechnen.':'';if(invalid){computed=null;q('[data-result-content]').hidden=true;q('[data-investment-result]').hidden=true;return false;}
 let tenant=0,unknown=0,ownerHouse=0,prescription=val('reserve');for(const row of all('[data-row]')){const amount=Number(row.querySelector('[data-amount]').value),payer=row.querySelector('[data-payer]').value;prescription+=amount;row.querySelector('[data-partial-wrap]').hidden=payer!=='partial';if(payer==='tenant')tenant+=amount;else if(payer==='owner')ownerHouse+=amount;else if(payer==='partial'){const part=Number(row.querySelector('[data-forward]').value);if(part>amount){err.hidden=false;err.textContent='Der weiterverrechnete Teilbetrag darf den Kostenbetrag nicht überschreiten.';computed=null;q('[data-result-content]').hidden=true;q('[data-investment-result]').hidden=true;return false;}tenant+=part;ownerHouse+=amount-part;}else unknown+=amount;}
 const ownDeductible=ownerHouse+unknown+val('admin')+(val('repair')+val('adviser'))/12,ownCash=ownDeductible+val('reserve')+val('buffer');
 const base=Math.max(0,val('salary')-val('salaryDeduction'));const afa=afaMode==='known'?val('afa'):val('building')*val('rate')/100;
 const model={base,annualCashCosts:ownCash*12,annualTaxCosts:ownDeductible*12,annualAfa:afa,target:val('target')};
 let solved;try{solved=solveRent(model,tariff);}catch(error){err.hidden=false;err.textContent=error.message;computed=null;q('[data-result-content]').hidden=true;q('[data-investment-result]').hidden=true;return false;}
 const rent=solved.rent,e=solved.rentalIncome;
 const purchase=val('purchase'),deduction=el('treatment').value==='instant'?purchase:val('purchaseAfa');
 let saving=0,burden=purchase,afterPurchase=solved.monthlyCash-purchase/12;
 if(deduction<=purchase){const comparison=comparePurchase({base,rentalIncome:e,monthlyCash:solved.monthlyCash,purchase,deduction},tariff);({saving,burden,afterPurchase}=comparison);}
 const outputs={prescription,tenant,ownCosts:ownCash,rent,total:rent+tenant,cash:solved.monthlyCash,tax:solved.annualTax/12,annualAfa:afa,purchase,saving,burden,afterPurchase};all('[data-out]').forEach(n=>n.textContent=money(outputs[n.dataset.out]));
 q('[data-open-cost]').textContent=unknown>0?money(unknown)+' pro Monat noch ungeklärt; vorläufig vollständig bei dir eingerechnet.':'Alle Beispielpositionen sind zugeordnet; rechtliche Prüfung weiterhin erforderlich.';
 const vat=el('vat').value;q('[data-result-content]').hidden=vat!=='exempt';q('[data-investment-result]').hidden=vat!=='exempt'||(el('treatment').value==='instant'&&purchase>1000)||(el('treatment').value==='afa'&&deduction>purchase);
 q('[data-caveat]').textContent=vat!=='exempt'?'Für diesen Umsatzsteuerstatus zeigt die Vorschau noch kein berechnetes Ergebnis. Bitte den Status im vorigen Schritt prüfen.':unknown>0?'Vorläufige Rechnung: '+money(unknown)+' ungeklärte Kosten pro Monat werden von dir getragen. Für die Planung wird die steuerliche Abzugsfähigkeit der laufenden Kosten vorläufig angenommen. Akonti ersetzen keine tatsächliche steuerliche Jahresermittlung.':'Planungsrechnung ohne Umsatzsteuer. Die Zuordnung der Weiterverrechnung und steuerlichen Abzüge ist noch zu bestätigen.';
 const cutoff=tariff.brackets.find(b=>b.upTo===null||base+Math.max(0,e)<=b.upTo);q('[data-tax-explain]').textContent='Tarifbasis aus dem Gehalt: '+money(base)+' pro Jahr. Steuerlicher Vermietungsüberschuss: '+money(e)+' pro Jahr. Der oberste betroffene Tarifteil liegt bei '+Math.round(cutoff.rate*100)+' %. Nur der jeweilige Einkommensteil wird mit seinem Steuersatz besteuert. Persönliche Sonderfälle sind hier nicht enthalten.';
 q('[data-purchase-afa]').hidden=el('treatment').value!=='afa';let note='Nach der Anschaffung bleiben dir im Kaufjahr '+money(burden)+' weniger frei verfügbar.';if(el('treatment').value==='instant'&&purchase>1000)note='Sofortabzug prüfen: Oberhalb der maßgeblichen 1.000-€-Grenze kommt regelmäßig eine Abschreibung in Betracht. Diese Auswahl ist keine bestätigte steuerliche Einstufung.';if(el('treatment').value==='afa'&&deduction>purchase)note='Bitte den AfA-Betrag prüfen: Der Jahresabzug darf hier den Kaufpreis nicht überschreiten.';if(e-deduction<0)note+=' Ein möglicher steuerlicher Verlustausgleich ist nicht berücksichtigt.';if(vat!=='exempt')note='Der Anschaffungsvergleich ist in dieser Vorschau nur für die Rechnung ohne Umsatzsteuer verfügbar.';q('[data-investment-note]').textContent=note;
 computed={...outputs,base,e};return true;
}
function show(){const names=['Ziel & Einkommen','Wohnungskosten','AfA & Steuer','Ergebnis','Anschaffung'];all('[data-panel]').forEach(p=>p.hidden=Number(p.dataset.panel)!==step);q('[data-progress-text]').textContent='Schritt '+(step+1)+' von 5 · '+names[step];all('.mr-dot').forEach((n,i)=>n.dataset.on=String(i<=step));q('[data-back]').hidden=step===0;q('[data-next]').hidden=step===4;q('[data-next]').textContent=['Weiter zu den Kosten →','Weiter zur AfA →','Ergebnis ansehen →','Anschaffung vergleichen →',''][step];compute();root.scrollIntoView({block:'start'});}
q('[data-home]').addEventListener('click',()=>{step=0;show();const heading=q('[data-panel="0"] h2');heading.tabIndex=-1;heading.focus({preventScroll:true});});
q('[data-next]').addEventListener('click',()=>{if(compute()){step=Math.min(4,step+1);show();}});q('[data-back]').addEventListener('click',()=>{step=Math.max(0,step-1);show();});root.addEventListener('input',compute);root.addEventListener('change',compute);all('[data-afa-mode]').forEach(b=>b.addEventListener('click',()=>{afaMode=b.dataset.afaMode;all('[data-afa-mode]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));q('[data-afa-known]').hidden=afaMode!=='known';q('[data-afa-help]').hidden=afaMode!=='help';compute();}));show();
})();
