import test from "node:test";import assert from "node:assert/strict";
import {assertPayrollFinalizationReady2026} from "../src/payrollFinalizationReadiness2026.js";
const employee={id:"e1",work_municipality:"WORK",residence_municipality:"HOME",school_district_code:"1234"};
const v={verified:true,sourceUrl:"official-source",version:"2026",effectiveFrom:"2026-01-01"};const rules={federal:v,fica:v,ohio:v,municipal:v,schoolDistrict:v};
const evidence=(code)=>({applies:false,verifiedNonApplicability:true,code,sourceUrl:"official-source"});
const entry={employee_id:"e1",pay_date:"2026-10-14",calculation_status:"draft",federal_taxable_wages:1000,social_security_taxable_wages:1000,medicare_taxable_wages:1000,calculation_snapshot:{municipalApplicability:evidence("WORK"),schoolDistrictApplicability:evidence("1234")}};
test("finalization readiness fails closed without all server rules",()=>assert.throws(()=>assertPayrollFinalizationReady2026({entry,employee,verifiedRules:{federal:true}})));
test("complete prerequisites pass readiness without mutating draft",()=>{assert.equal(assertPayrollFinalizationReady2026({entry,employee,verifiedRules:rules}),true);assert.equal(entry.calculation_status,"draft");});
