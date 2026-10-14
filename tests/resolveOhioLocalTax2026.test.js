import test from "node:test";import assert from "node:assert/strict";
import {resolveOhioLocalTax2026} from "../src/resolveOhioLocalTax2026.js";
const employee={work_municipality:"WORK",residence_municipality:"HOME",school_district_code:"1234",ohio_it4_exemptions:0};
const args={employee,payDate:"2026-10-14",taxableWages:1000};
test("blocks missing local verification",()=>assert.throws(()=>resolveOhioLocalTax2026(args),/municipal applicability is not verified/));
test("accepts sourced effective-dated explicit non-applicability",()=>{
 const municipalNonApplicability={verified:true,sourceUrl:"https://example.org/official",code:"WORK",effectiveFrom:"2026-01-01"};
 const schoolDistrictNonApplicability={verified:true,sourceUrl:"https://example.org/official",code:"1234",effectiveFrom:"2026-01-01"};
 const r=resolveOhioLocalTax2026({...args,municipalNonApplicability,schoolDistrictNonApplicability});
 assert.equal(r.municipal.applies,false);assert.equal(r.schoolDistrict.verifiedNonApplicability,true);
});
test("rejects mismatched municipality rule",()=>{
 const municipalRule={verified:true,jurisdiction:"municipal",code:"WRONG",rate:0.02,sourceUrl:"https://example.org",version:"v1",effectiveFrom:"2026-01-01"};
 assert.throws(()=>resolveOhioLocalTax2026({...args,municipalRule}),/does not match/);
});
