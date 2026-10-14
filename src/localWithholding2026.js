// Ohio local withholding calculator. Rate data must be supplied from a
// verified, effective-dated official municipal or school district source.
// Do not infer jurisdictions from ZIP codes or assume residence = workplace.
const cents = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function calculateLocalWithholding2026({
  taxableWages, payDate, jurisdiction, taxBase, exemptions=0,
  verifiedRule
}) {
  const wages=Number(taxableWages);
  if(!Number.isFinite(wages)||wages<0) throw new Error("Taxable wages must be nonnegative.");
  if(!/^2026-\d{2}-\d{2}$/.test(payDate||"") || Number.isNaN(Date.parse(payDate+"T00:00:00Z")))
    throw new Error("Valid 2026 pay date required.");
  if(!["municipal","schoolDistrict"].includes(jurisdiction))
    throw new Error("Unsupported local tax jurisdiction.");
  if(!verifiedRule || verifiedRule.verified!==true ||
    verifiedRule.jurisdiction!==jurisdiction || !verifiedRule.code ||
    !verifiedRule.sourceUrl || !verifiedRule.version ||
    !verifiedRule.effectiveFrom || payDate<verifiedRule.effectiveFrom ||
    (verifiedRule.effectiveTo && payDate>verifiedRule.effectiveTo))
    throw new Error("A verified, effective-dated local tax rule is required.");
  if(!Number.isFinite(verifiedRule.rate) || verifiedRule.rate<0 || verifiedRule.rate>1)
    throw new Error("Invalid local withholding rate.");
  if(jurisdiction==="schoolDistrict") {
    if(!["traditional","earnedIncome"].includes(verifiedRule.taxBase))
      throw new Error("School district tax base must be verified.");
    if(taxBase!==verifiedRule.taxBase) throw new Error("School district tax base mismatch.");
    if(verifiedRule.taxBase==="traditional") {
      if(!Number.isInteger(exemptions)||exemptions<0 ||
         typeof verifiedRule.calculateTraditional!=="function")
        throw new Error("Verified traditional-base exemption calculation required.");
      const amount=verifiedRule.calculateTraditional({taxableWages:wages,exemptions});
      if(!Number.isFinite(amount)||amount<0) throw new Error("Invalid traditional-base result.");
      return {withheld:cents(amount),ruleVersion:verifiedRule.version,code:verifiedRule.code};
    }
  }
  if(jurisdiction==="municipal" && verifiedRule.requiresResidencyAdjustment)
    throw new Error("Municipal residency credit or special rule must be calculated first.");
  return {withheld:cents(wages*verifiedRule.rate),ruleVersion:verifiedRule.version,code:verifiedRule.code};
}
