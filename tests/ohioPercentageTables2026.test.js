import test from "node:test";
import assert from "node:assert/strict";
import {OHIO_PERCENTAGE_2026_AUG as t} from "../src/ohioPercentageTables2026.js";
import {calculateOhioWithholding2026} from "../src/ohioWithholding2026.js";
test("official weekly 2026 August bracket 1",()=>assert.equal(t.calculate({taxableWages:500,payFrequency:"weekly",exemptions:0}),8));
test("official weekly 2026 August bracket 2",()=>assert.equal(t.calculate({taxableWages:1000,payFrequency:"weekly",exemptions:0}),22.94));
test("official weekly 2026 August bracket 3",()=>assert.equal(t.calculate({taxableWages:2000,payFrequency:"weekly",exemptions:0}),53.16));
test("IT 4 allowance applies before bracket",()=>assert.equal(t.calculate({taxableWages:1000,payFrequency:"weekly",exemptions:2}),22.19));
test("official biweekly threshold",()=>assert.equal(t.calculate({taxableWages:1001.92,payFrequency:"biweekly",exemptions:0}),16.03));
test("official semimonthly threshold",()=>assert.equal(t.calculate({taxableWages:1085.42,payFrequency:"semimonthly",exemptions:0}),17.37));
test("official monthly threshold",()=>assert.equal(t.calculate({taxableWages:2170.83,payFrequency:"monthly",exemptions:0}),34.73));
test("official daily threshold",()=>assert.equal(t.calculate({taxableWages:100.19,payFrequency:"daily",exemptions:0}),1.60));
test("reject unsupported frequency and invalid exemptions",()=>{
 assert.throws(()=>t.calculate({taxableWages:1000,payFrequency:"quarterly",exemptions:0}),/Unsupported/);
 assert.throws(()=>t.calculate({taxableWages:1000,payFrequency:"weekly",exemptions:-1}),/nonnegative/);
});
test("Ohio engine selects August schedule and rejects pre-August version",()=>{
 const args={payDate:"2026-10-14",taxableWages:1000,payFrequency:"weekly",exemptions:0,verifiedTable:t};
 assert.equal(calculateOhioWithholding2026(args).employeeOhioWithholding,22.94);
 assert.throws(()=>calculateOhioWithholding2026({...args,payDate:"2026-07-31"}),/Verified Ohio withholding table/);
});
