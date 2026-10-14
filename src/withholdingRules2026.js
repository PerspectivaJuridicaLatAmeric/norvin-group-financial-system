// Verified source registry for payroll withholding rules.
// A rule is usable for live payroll only when all required jurisdictions
// have validated calculations and employee elections.
export const WITHHOLDING_SOURCES_2026 = Object.freeze({
  federalIncome: {
    jurisdiction: "US", year: 2026, status: "verified-production",
    source: "https://www.irs.gov/publications/p15t",
    version: "IRS-PUB-15T-2026-SECTION-1",
    requiredInputs: ["payFrequency", "formW4", "federalTaxableWages"]
  },
  fica: {
    jurisdiction: "US", year: 2026, status: "implemented-preview",
    source: "https://www.irs.gov/taxtopics/tc751",
    socialSecurityWageBaseSource: "https://www.ssa.gov/oact/cola/cbb.html",
    requiredInputs: ["grossPay", "socialSecurityYtd", "medicareYtd"]
  },
  ohioIncome: {
    jurisdiction: "OH", year: 2026, status: "pending-implementation",
    source: "https://tax.ohio.gov/business/employer-withholding",
    effectiveFrom: "2026-08-01",
    requiredInputs: ["ohioIT4", "payFrequency", "ohioTaxableWages"]
  },
  ohioSchoolDistrict: {
    jurisdiction: "OH", year: 2026, status: "pending-location-and-rules",
    source: "https://tax.ohio.gov/business/employer-withholding",
    requiredInputs: ["schoolDistrict", "districtTaxBase"]
  },
  municipalIncome: {
    jurisdiction: "OH", year: 2026, status: "pending-location-and-rules",
    requiredInputs: ["workMunicipality", "residenceMunicipality"]
  }
});

export function validatePayrollReadiness({ employee, rules = WITHHOLDING_SOURCES_2026 } = {}) {
  const missing = [];
  if (!employee?.formW4) missing.push("Employee Form W-4");
  if (!employee?.ohioIT4) missing.push("Employee Ohio IT 4");
  if (!employee?.payFrequency) missing.push("Pay frequency");
  if (!employee?.workMunicipality) missing.push("Work municipality");
  if (!employee?.residenceMunicipality) missing.push("Residence municipality");
  if (!employee?.schoolDistrict) missing.push("School district verification");
  for (const [name, rule] of Object.entries(rules)) {
    if (rule.status !== "verified-production") missing.push(name + " tax rule not verified for production");
  }
  return { ready: missing.length === 0, missing, taxYear: 2026 };
}
