import test from "node:test";
import assert from "node:assert/strict";
import {calculateFederalWithholding2026} from "../src/federalWithholding2026.js";
// IRS Publication 15-T (2026), Worksheet 1A, line 1g:
// $12,900 married filing jointly, $8,600 otherwise, $0 if W-4 Step 2 checked.
// These are official worksheet inputs, not a verified percentage-method table.
const synthetic=(status,jobs)=>({year:2026,source:"IRS-PUB-15T",verified:true,
 version:"synthetic-test-only",brackets:[{filingStatus:status,multipleJobs:jobs,
 from:0,to:null,base:0,rate:0}]});
for(const [status,jobs,adjustment] of [
 ["single",false,8600],["headOfHousehold",false,8600],
 ["married",false,12900],["single",true,0],["married",true,0]
]){
 test("IRS 2026 Worksheet 1A line 1g: "+status+" multipleJobs="+jobs,()=>{
  const result=calculateFederalWithholding2026({taxableWages:1000,
   frequency:"weekly",filingStatus:status,multipleJobs:jobs,
   verifiedTable:synthetic(status,jobs)});
  assert.equal(result.adjustedAnnualWages,52000-adjustment);
  assert.equal(result.productionReady,false);
 });
}
