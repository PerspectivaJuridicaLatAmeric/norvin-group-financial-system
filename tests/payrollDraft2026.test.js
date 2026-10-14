import test from "node:test";
import assert from "node:assert/strict";
import {createPayrollDraft2026} from "../src/payrollDraft2026.js";
const base={
 employeeId:"example-employee",payDate:"2026-10-14",grossPay:1000,
 federal:{tableVersion:"IRS-2026",federalIncomeWithheld:78.08,source:"IRS"},
 ohio:{version:"OH-2026",employeeOhioWithholding:20,source:"Ohio"},
 fica:{employeeSocialSecurity:62,employeeMedicare:14.5,employeeAdditionalMedicare:0,employerFicaTotal:76.5},
 municipal:{applies:false,verifiedNonApplicability:true},
 schoolDistrict:{applies:false,verifiedNonApplicability:true}
};
test("creates draft with auditable totals and no automatic finalization",()=>{
 const d=createPayrollDraft2026(base);
 assert.equal(d.net_pay,825.42);
 assert.equal(d.calculation_status,"draft");
 assert.equal(d.calculation_snapshot.employerFica,76.5);
});
test("blocks unknown local tax applicability",()=>{
 assert.throws(()=>createPayrollDraft2026({...base,municipal:null}),/Local tax/);
});
test("blocks unsupported unverified local exemptions",()=>{
 assert.throws(()=>createPayrollDraft2026({...base,schoolDistrict:{applies:false}}),/non-applicability/);
});
test("blocks deductions exceeding gross",()=>{
 assert.throws(()=>createPayrollDraft2026({...base,otherDeductions:1000}),/exceed/);
});
