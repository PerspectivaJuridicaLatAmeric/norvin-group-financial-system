// Server-side prerequisite validator. This is NOT authorization to finalize.
// Only a trusted server may recompute tax from official effective-dated rules.
export function assertPayrollFinalizationReady2026({entry,employee,verifiedRules}){
 if(!entry||entry.calculation_status!=="draft")throw new Error("Only payroll drafts can be reviewed.");
 if(!employee||entry.employee_id!==employee.id)throw new Error("Employee mismatch.");
 if(!/^2026-[0-9]{2}-[0-9]{2}$/.test(String(entry.pay_date||"")))throw new Error("2026 pay date required.");
 if(!employee.work_municipality||!employee.residence_municipality||!employee.school_district_code)throw new Error("Employee local jurisdictions required.");
 if(!verifiedRules || typeof verifiedRules!=="object") throw new Error("Server-verified rules required.");
 for(const [name,rule] of Object.entries(verifiedRules)){
  if(rule===true || !rule || rule.verified!==true || !rule.sourceUrl || !rule.version || !rule.effectiveFrom || rule.effectiveFrom>entry.pay_date || (rule.effectiveTo && rule.effectiveTo<entry.pay_date))
    throw new Error(name+" must have server-verified, effective-dated source evidence.");
 }
 if(!verifiedRules?.federal||!verifiedRules?.fica||!verifiedRules?.ohio||!verifiedRules?.municipal||!verifiedRules?.schoolDistrict)throw new Error("All tax rules must be independently verified on the server.");
 const m=entry.calculation_snapshot?.municipalApplicability;
 const s=entry.calculation_snapshot?.schoolDistrictApplicability;
 for(const [label,r] of [["municipal",m],["schoolDistrict",s]]){
  if(!r||!r.sourceUrl||(r.applies!==true&&r.applies!==false))throw new Error(label+" applicability evidence required.");
  if(r.applies===false&&r.verifiedNonApplicability!==true)throw new Error(label+" non-applicability evidence required.");
  if(r.applies===true&&(!r.ruleVersion||!r.code))throw new Error(label+" verified rule required.");
 }
 if(entry.federal_taxable_wages==null||entry.social_security_taxable_wages==null||entry.medicare_taxable_wages==null)throw new Error("Separate taxable wage bases required.");
 return true;
}
