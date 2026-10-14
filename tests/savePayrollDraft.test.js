import test from "node:test";
import assert from "node:assert/strict";
import { savePayrollDraft } from "../src/savePayrollDraft.js";
test("rejects non-draft payroll before database write",async()=>{
 const supabase={auth:{getUser:async()=>({data:{user:{id:"u1"}}})}};
 await assert.rejects(()=>savePayrollDraft({supabase,draft:{calculation_status:"finalized"}}),/Only draft/);
});
test("adds authenticated owner and inserts draft",async()=>{
 let inserted;
 const supabase={
  auth:{getUser:async()=>({data:{user:{id:"u1"}},error:null})},
  from:()=>({insert:async p=>{inserted=p;return {error:null}}})
 };
 await savePayrollDraft({supabase,draft:{calculation_status:"draft",employee_id:"e1"}});
 assert.equal(inserted.user_id,"u1");
 assert.equal(inserted.calculation_status,"draft");
});
