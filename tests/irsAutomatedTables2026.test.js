import test from "node:test";
import assert from "node:assert/strict";
import {IRS_AUTOMATED_2026} from "../src/irsAutomatedTables2026.js";
import {calculateFederalWithholding2026} from "../src/federalWithholding2026.js";
test("2026 IRS automated tables have 48 continuous brackets",()=>{
 assert.equal(IRS_AUTOMATED_2026.brackets.length,48);
 for(const status of ["single","married","headOfHousehold"])
  for(const jobs of [false,true]){
   const rows=IRS_AUTOMATED_2026.brackets.filter(b=>b.filingStatus===status&&b.multipleJobs===jobs);
   assert.equal(rows.length,8);assert.equal(rows[0].from,0);
   assert.equal(rows.at(-1).to,null);
   for(let i=0;i<7;i++)assert.equal(rows[i].to,rows[i+1].from);
  }
});
test("2026 IRS single weekly $1,000 no W-4 adjustments",()=>{
 const r=calculateFederalWithholding2026({taxableWages:1000,frequency:"weekly",
 filingStatus:"single",verifiedTable:IRS_AUTOMATED_2026});
 // Adjusted annual $43,400; bracket $19,900 + 12% of $23,500.
 assert.equal(r.adjustedAnnualWages,43400);
 assert.equal(r.federalIncomeWithheld,78.08);
 assert.equal(r.productionReady,false);
});
