import test from "node:test";
import assert from "node:assert/strict";
import { calculateFederalWithholding2026 } from "../src/federalWithholding2026.js";

const exampleTable={
  year:2026,source:"IRS-PUB-15T",verified:true,version:"test-only",
  brackets:[{filingStatus:"single",multipleJobs:false,from:0,to:null,base:0,rate:0.1}]
};
test("rejects withholding without a verified 2026 table",()=>{
  assert.throws(()=>calculateFederalWithholding2026({
    taxableWages:1000,frequency:"weekly",filingStatus:"single"
  }),/verified 2026/);
});
test("calculates Worksheet 1A mechanics with a synthetic test-only bracket",()=>{
  const result=calculateFederalWithholding2026({
    taxableWages:1000,frequency:"weekly",filingStatus:"single",
    w4Step3:520,w4Step4c:5,verifiedTable:exampleTable
  });
  assert.equal(result.adjustedAnnualWages,43400);
  assert.equal(result.federalIncomeWithheld,78.46);
  assert.equal(result.productionReady,false);
});
test("rejects invalid pay frequency",()=>{
  assert.throws(()=>calculateFederalWithholding2026({
    taxableWages:1000,frequency:"random",filingStatus:"single",verifiedTable:exampleTable
  }),/Unsupported/);
});
