// Ohio employer withholding: 2026 rate schedule selection and safe calculation.
// Official source: https://tax.ohio.gov/business/employer-withholding
// 2026-08-01 introduced revised employer withholding tables.
// Do not confuse Ohio individual income tax brackets with payroll withholding tables.
const CENTS = value => Math.round((value + Number.EPSILON) * 100) / 100;
const SCHEDULES = Object.freeze([
  {version:"OH-2025-10-01",from:"2025-10-01",until:"2026-07-31"},
  {version:"OH-2026-08-01",from:"2026-08-01",until:null}
]);
export function ohioWithholdingSchedule(payDate) {
  if(typeof payDate!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(payDate) ||
    Number.isNaN(Date.parse(payDate+"T00:00:00Z")))
    throw new Error("A valid pay date (YYYY-MM-DD) is required.");
  const schedule=SCHEDULES.find(s=>payDate>=s.from && (!s.until || payDate<=s.until));
  if(!schedule) throw new Error("No supported Ohio withholding schedule for this date.");
  return schedule;
}
export function calculateOhioWithholding2026({
  payDate, taxableWages, method="regular", verifiedTable, payFrequency, exemptions
}){
  const schedule=ohioWithholdingSchedule(payDate);
  const wages=Number(taxableWages);
  if(!Number.isFinite(wages)||wages<0) throw new Error("Taxable wages must be nonnegative.");
  if(method==="supplemental"){
    // Ohio's published flat rate on supplemental compensation is 2.75%.
    return {employeeOhioWithholding:CENTS(wages*0.0275),version:schedule.version,
      source:"Ohio Department of Taxation — Employer Withholding",method};
  }
  if(method!=="regular") throw new Error("Unknown Ohio withholding method.");
  if(!verifiedTable || verifiedTable.version!==schedule.version ||
      verifiedTable.verified!==true || verifiedTable.source!=="OHIO-ODT" ||
      typeof verifiedTable.calculate!=="function")
    throw new Error("Verified Ohio withholding table matching the pay date is required.");
  if(!payFrequency || !Number.isInteger(exemptions) || exemptions<0)
    throw new Error("Pay frequency and IT 4 exemption count are required.");
  const result=Number(verifiedTable.calculate({taxableWages:wages,payFrequency,exemptions}));
  if(!Number.isFinite(result)||result<0) throw new Error("Invalid Ohio table calculation.");
  return {employeeOhioWithholding:CENTS(result),version:schedule.version,
    source:"Ohio Department of Taxation — Employer Withholding",method};
}
