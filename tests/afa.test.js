import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveAfa, suggestLandShare, regularFirstYearAfa } from '../src/afa.js';
import { cashAtRent } from '../src/calc.js';
const tariff=JSON.parse(readFileSync(new URL('../data/tarif-2026.json',import.meta.url)));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
const purchase={
  mode:'purchase',acquisition:'purchase',previousUse:'private',purchaseYear:2015,
  price:300000,transferTax:10000,registration:3000,legal:2000,broker:0,other:0,
  landPercent:30,landStatus:'estimate',firstYearMonths:6,evidence:'Fiktives Beispiel'
};
const suggestion={municipality:'large',priceBand:'unknown',units:'over10',exception:'none'};
test('open AfA does not silently use an old example amount',()=>{
  const a=resolveAfa({mode:'unknown'});
  assert.equal(a.annualAfa,0);assert.equal(a.status,'open');assert.equal(a.buildingBasis,null);
  assert.equal(resolveAfa({mode:'known',annualAfa:null}).annualAfa,0);
});
test('known full-year amount and confirmed basis preserve independent input routes',()=>{
  const a=resolveAfa({mode:'known',annualAfa:2400,evidence:'Anlageverzeichnis'});
  assert.equal(a.annualAfa,2400);assert.equal(a.notes.length,0);
  const b=resolveAfa({mode:'basis',buildingBasis:200000,rate:1.5,basisStatus:'provided',evidence:'Gutachten'});
  assert.equal(b.annualAfa,3000);
  const c=resolveAfa({mode:'basis',buildingBasis:200000,rate:2,basisStatus:'estimate'});
  assert.equal(c.annualAfa,4000);assert.ok(c.notes.length);
});
test('purchase plus ancillary costs loses the land share before 1.5% depreciation',()=>{
  const a=resolveAfa(purchase);
  assert.equal(a.totalAcquisition,315000);assert.equal(a.landValue,94500);
  assert.equal(a.buildingBasis,220500);assert.equal(a.annualAfa,3307.5);
  assert.equal(a.firstYearAfa,1653.75);assert.equal(a.status,'estimate');
});
test('all cost components allocate consistently and land extremes are supported',()=>{
  const a=resolveAfa({...purchase,broker:5000,other:1000,landPercent:0});
  assert.equal(a.totalAcquisition,321000);assert.equal(a.annualAfa,4815);
  const b=resolveAfa({...purchase,landPercent:100});
  assert.equal(b.buildingBasis,0);assert.equal(b.annualAfa,0);
});
test('missing or unknown basis and land never grant a provisional tax deduction',()=>{
  for(const patch of [{price:null},{purchaseYear:null},{landPercent:null},{landStatus:'unknown'}]){
    const a=resolveAfa({...purchase,...patch});assert.equal(a.status,'open');assert.equal(a.annualAfa,0);
  }
  for(const patch of [{basisStatus:'unknown'},{buildingBasis:null},{rate:null}]){
    const a=resolveAfa({mode:'basis',basisStatus:'provided',buildingBasis:100000,rate:1.5,...patch});
    assert.equal(a.annualAfa,0);
  }
});
test('older acquisitions, gifts and prior letting require separate review',()=>{
  for(const patch of [{purchaseYear:2002},{purchaseYear:1990},{acquisition:'gift'},{acquisition:'other'},{previousUse:'rented'},{previousUse:'unknown'}]){
    const a=resolveAfa({...purchase,...patch});assert.equal(a.status,'open');assert.equal(a.annualAfa,0);
  }
  assert.equal(resolveAfa({...purchase,purchaseYear:2003}).annualAfa,3307.5);
});
test('land guide gives 20/30/40 only when applicable conditions are known',()=>{
  assert.equal(suggestLandShare(suggestion).percent,30);
  assert.equal(suggestLandShare({...suggestion,units:'upTo10'}).percent,40);
  assert.equal(suggestLandShare({...suggestion,municipality:'small',priceBand:'low',units:'unknown'}).percent,20);
  assert.equal(suggestLandShare({...suggestion,municipality:'small',priceBand:'high'}).percent,30);
  assert.equal(suggestLandShare({...suggestion,municipality:'unknown',priceBand:'high'}).percent,30);
  for(const patch of [{exception:'unknown'},{exception:'proof'},{exception:'deviation'},{units:'unknown'},{municipality:'small',priceBand:'unknown'}]){
    assert.equal(suggestLandShare({...suggestion,...patch}).percent,null);
  }
});
test('regular start-year AfA uses the six-month boundary, not months divided by twelve',()=>{
  assert.equal(regularFirstYearAfa(3000,0),0);
  assert.equal(regularFirstYearAfa(3000,1),1500);
  assert.equal(regularFirstYearAfa(3000,6),1500);
  assert.equal(regularFirstYearAfa(3000,7),3000);
  assert.equal(regularFirstYearAfa(3000,12),3000);
  assert.equal(regularFirstYearAfa(3000,null),null);
  assert.equal(resolveAfa({...purchase,firstYearMonths:1}).annualAfa,3307.5);
});
test('derived AfA changes tax but never adds a repeated property purchase cash payment',()=>{
  const model={base:45000,annualCashCosts:0,annualTaxCosts:0,annualAfa:0};
  const before=cashAtRent(2000,model,tariff);
  const after=cashAtRent(2000,{...model,annualAfa:resolveAfa(purchase).annualAfa},tariff);
  close(before.annualTax-after.annualTax,1323);
  close(after.monthlyCash-before.monthlyCash,110.25);
});
test('invalid active values and unknown enum values are rejected',()=>{
  for(const patch of [{price:-1},{price:0},{price:Infinity},{transferTax:-1},{broker:NaN},{landPercent:101},{landPercent:-1},{landStatus:'bad'},{purchaseYear:2027},{purchaseYear:2015.5}]){
    assert.throws(()=>resolveAfa({...purchase,...patch}));
  }
  assert.throws(()=>resolveAfa({mode:'known',annualAfa:-1}));
  assert.throws(()=>resolveAfa({mode:'basis',buildingBasis:100000,rate:101,basisStatus:'provided'}));
  assert.throws(()=>resolveAfa({mode:'basis',buildingBasis:100000,rate:0,basisStatus:'provided'}));
  assert.throws(()=>resolveAfa({mode:'invalid'}));
  assert.throws(()=>suggestLandShare({...suggestion,units:'bad'}));
  for(const months of [-1,13,6.5])assert.throws(()=>regularFirstYearAfa(3000,months));
});

