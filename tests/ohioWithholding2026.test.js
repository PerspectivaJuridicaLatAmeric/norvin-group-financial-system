import test from "node:test";
import assert from "node:assert/strict";
import {ohioWithholdingSchedule,calculateOhioWithholding2026} from "../src/ohioWithholding2026.js";

test("Ohio schedule changes on August 1 2026",()=>{
 assert.equal(ohioWithholdingSchedule("2026-07-31").version,"OH-2025-10-01");
 assert.equal(ohioWithholdingSchedule("2026-08-01").version,"OH-2026-08-01");
});
test("Ohio supplemental withholding uses official 2.75 percent",()=>{
 assert.equal(calculateOhioWithholding2026({payDate:"2026-10-14",taxableWages:1000,method:"supplemental"}).employeeOhioWithholding,27.5);
});
test("Ohio regular payroll rejects absent or outdated tables",()=>{
 assert.throws(()=>calculateOhioWithholding2026({payDate:"2026-10-14",taxableWages:1000,payFrequency:"weekly",exemptions:0}),/Verified Ohio/);
 assert.throws(()=>calculateOhioWithholding2026({payDate:"2026-10-14",taxableWages:1000,payFrequency:"weekly",exemptions:0,verifiedTable:{version:"OH-2025-10-01",verified:true,source:"OHIO-ODT",calculate:()=>0}}),/Verified Ohio/);
});
