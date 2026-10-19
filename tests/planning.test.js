import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveIncomeBase, calculateScenario } from '../src/planning.js';
import { comparePurchase } from '../src/calc.js';
const tariff=JSON.parse(readFileSync(new URL('../data/tarif-2026.json',import.meta.url)));
const model={base:45000,annualCashCosts:3600,annualTaxCosts:3600,annualAfa:2400};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);

test('KZ245 minus one flat deduction equals an already adjusted salary base',()=>{
  const a=resolveIncomeBase({mode:'payslip',salary:45132,deductionMode:'flat'});
  const b=resolveIncomeBase({mode:'provided',base:45000,salary:NaN,deduction:9999,deductionMode:'custom'});
  assert.equal(a.base,45000);assert.equal(a.appliedDeduction,132);
  assert.equal(b.base,45000);assert.equal(b.appliedDeduction,0);
  assert.deepEqual(calculateScenario({mode:'target',target:1000},{...model,base:a.base},tariff),
    calculateScenario({mode:'target',target:1000},{...model,base:b.base},tariff));
});
test('higher deductible costs replace the flat deduction rather than add to it',()=>{
  const result=resolveIncomeBase({mode:'payslip',salary:45132,deductionMode:'custom',deduction:1200});
  assert.equal(result.base,43932);assert.equal(result.appliedDeduction,1200);
});
test('smaller entered costs retain the flat deduction and explain the assumption',()=>{
  const result=resolveIncomeBase({mode:'payslip',salary:45132,deductionMode:'custom',deduction:50});
  assert.equal(result.base,45000);assert.ok(result.notes.length);
});
test('negative salary income is not silently treated as an offset against rental income',()=>{
  const result=resolveIncomeBase({mode:'payslip',salary:100,deductionMode:'custom',deduction:1000});
  assert.equal(result.base,0);assert.ok(result.notes.some(note=>note.includes('Verlustausgleich')));
});
test('only active income fields are validated and malformed income modes fail',()=>{
  assert.equal(resolveIncomeBase({mode:'provided',base:0,salary:-1,deduction:NaN}).base,0);
  assert.equal(resolveIncomeBase({mode:'payslip',salary:45132,deductionMode:'flat',deduction:NaN}).base,45000);
  for(const input of [
    {mode:'provided',base:-1},{mode:'provided',base:Infinity},
    {mode:'payslip',salary:-1,deductionMode:'flat'},
    {mode:'payslip',salary:1000,deductionMode:'custom',deduction:NaN},
    {mode:'payslip',salary:1000,deductionMode:'invalid'},{mode:'invalid'}
  ])assert.throws(()=>resolveIncomeBase(input));
});
test('fixed 1400 rent yields 740 cash from independent annual expense and tax arithmetic',()=>{
  const a=calculateScenario({mode:'rent',rent:1400,target:NaN},model,tariff);
  assert.equal(a.rent,1400);assert.equal(a.rentalIncome,10800);
  close(a.annualTax,4320);close(a.monthlyCash,740);
  const example=calculateScenario({mode:'rent',rent:1400},{base:45000,annualCashCosts:4020,annualTaxCosts:0,annualAfa:0},tariff);
  close(example.monthlyCash,505);
});
test('fixed zero or low rent can show a cash deficit without fabricating a loss tax credit',()=>{
  const a=calculateScenario({mode:'rent',rent:100},model,tariff);
  assert.equal(a.rent,100);assert.equal(a.annualTax,0);assert.equal(a.monthlyCash,-200);
  const zero=calculateScenario({mode:'rent',rent:0},model,tariff);
  assert.equal(zero.monthlyCash,-300);assert.equal(zero.annualTax,0);
});
test('both directions agree for the same rent, income basis and reimbursement model',()=>{
  for(const base of [0,45000,70000])for(const target of [0,1000]){
    const m={...model,base,annualReimbursements:1200,annualTaxCosts:4800};
    const reverse=calculateScenario({mode:'target',target,rent:NaN},m,tariff);
    const forward=calculateScenario({mode:'rent',rent:reverse.rent,target:-1},m,tariff);
    assert.deepEqual(forward,reverse);assert.ok(forward.monthlyCash>=target-1e-8);
  }
});
test('purchase comparison keeps the rent and baseline annual scenario unchanged',()=>{
  const before=calculateScenario({mode:'rent',rent:1400},model,tariff);
  const purchase=comparePurchase({base:model.base,rentalIncome:before.rentalIncome,monthlyCash:before.monthlyCash,purchase:500,deduction:500},tariff);
  close(purchase.saving,200);close(purchase.afterPurchase,715);
  const after=calculateScenario({mode:'rent',rent:1400},model,tariff);
  assert.deepEqual(before,after);assert.equal(after.rent,1400);
});
test('scenario rejects invalid active rent, target, direction and model values',()=>{
  assert.throws(()=>calculateScenario({mode:'rent',rent:-1},model,tariff));
  assert.throws(()=>calculateScenario({mode:'rent',rent:Infinity},model,tariff));
  assert.throws(()=>calculateScenario({mode:'target',target:-1},model,tariff));
  assert.throws(()=>calculateScenario({mode:'invalid'},model,tariff));
  assert.throws(()=>calculateScenario({mode:'rent',rent:1000},{...model,annualCashCosts:NaN},tariff));
  assert.throws(()=>calculateScenario({mode:'rent',rent:1000},{...model,annualReimbursements:-1},tariff));
});

