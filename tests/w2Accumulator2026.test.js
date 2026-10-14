import test from "node:test";import assert from "node:assert/strict";import {buildW2YearToDate2026}from"../src/w2Accumulator2026.js";
test("accumulates finalized 2026 payroll only",()=>{
 const rows=[
 {pay_date:"2026-10-01",calculation_status:"finalized",gross_pay:1000,federal_withholding:80,social_security:62,medicare:14.5,additional_medicare:0,state_withholding:23,municipal_withholding:20,school_district_withholding:5},
 {pay_date:"2026-10-08",calculation_status:"draft",gross_pay:9999,federal_withholding:999},
 {pay_date:"2025-12-31",calculation_status:"finalized",gross_pay:500}
 ];
 const y=buildW2YearToDate2026(rows);
 assert.equal(y.wages,1000);assert.equal(y.federalIncomeTax,80);assert.equal(y.socialSecurityTax,62);
 assert.equal(y.medicareTax,14.5);assert.equal(y.ohioStateIncomeTax,23);assert.equal(y.localIncomeTax,25);
});
test("returns zero totals with no finalized 2026 payroll",()=>assert.equal(buildW2YearToDate2026([]).wages,0));
