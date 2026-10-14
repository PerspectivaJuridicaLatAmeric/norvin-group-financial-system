import test from "node:test";import assert from "node:assert/strict";
import {assembleVerifiedPayrollDraft2026} from "../src/assembleVerifiedPayrollDraft2026.js";
const employee={id:"e1",work_municipality:"WORK",residence_municipality:"HOME",school_district_code:"1234",ohio_it4_exemptions:0};
const federal={tableVersion:"IRS-2026",federalIncomeWithheld:80,source:"IRS"};
const ohio={version:"OH-2026-08-01",employeeOhioWithholding:23,source:"ODT"};
const fica={employeeSocialSecurity:62,employeeMedicare:14.5,employeeAdditionalMedicare:0,employerFicaTotal:76.5};
const noMun={verified:true,sourceUrl:"https://official.example/mun",code:"WORK",effectiveFrom:"2026-01-01"};
const noSchool={verified:true,sourceUrl:"https://official.example/sd",code:"1234",effectiveFrom:"2026-01-01"};
test("end-to-end assembly blocks unverified local applicability",()=>assert.throws(()=>assembleVerifiedPayrollDraft2026({employee,payDate:"2026-10-14",grossPay:1000,federal,ohio,fica}),/applicability is not verified/));
test("end-to-end assembly creates auditable draft after all tax applicability is verified",()=>{
 const d=assembleVerifiedPayrollDraft2026({employee,payDate:"2026-10-14",grossPay:1000,federal,ohio,fica,municipalNonApplicability:noMun,schoolDistrictNonApplicability:noSchool});
 assert.equal(d.calculation_status,"draft");assert.equal(d.net_pay,820.5);assert.equal(d.employee_id,"e1");
 assert.equal(d.calculation_snapshot.municipalApplicability.verifiedNonApplicability,true);
});
