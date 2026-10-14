import test from "node:test";
import assert from "node:assert/strict";
import {calculateLocalWithholding2026} from "../src/localWithholding2026.js";
const base={taxableWages:1000,payDate:"2026-10-14",jurisdiction:"schoolDistrict",taxBase:"earnedIncome"};
const rule={verified:true,jurisdiction:"schoolDistrict",code:"TEST-ONLY",sourceUrl:"https://tax.ohio.gov/business/employer-withholding",version:"synthetic-test",effectiveFrom:"2026-01-01",taxBase:"earnedIncome",rate:.01};
test("blocks unverified local rates",()=>{
  assert.throws(()=>calculateLocalWithholding2026(base),/verified/);
});
test("computes flat earned-income school district example",()=>{
  assert.equal(calculateLocalWithholding2026({...base,verifiedRule:rule}).withheld,10);
});
test("rejects mismatched district tax base",()=>{
  assert.throws(()=>calculateLocalWithholding2026({...base,taxBase:"traditional",verifiedRule:rule}),/mismatch/);
});
test("blocks municipal residency adjustments",()=>{
  assert.throws(()=>calculateLocalWithholding2026({
    taxableWages:1000,payDate:"2026-10-14",jurisdiction:"municipal",
    verifiedRule:{...rule,jurisdiction:"municipal",requiresResidencyAdjustment:true}
  }),/residency/);
});
