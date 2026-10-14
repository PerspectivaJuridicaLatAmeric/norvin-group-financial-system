// 2026 FICA calculation. Federal income, Ohio and local income tax withholding
// require separate current tables and employee elections; never treat this as full payroll.
export const FICA_2026 = Object.freeze({
  year: 2026, socialSecurityRate: 0.062, medicareRate: 0.0145,
  socialSecurityWageBase: 184500, additionalMedicareRate: 0.009,
  additionalMedicareThreshold: 200000
});
const cents = n => Math.round((n + Number.EPSILON) * 100) / 100;
export function calculateFica2026({grossPay, socialSecurityYtd=0, medicareYtd=0}){
  const gross=Number(grossPay), ssYtd=Number(socialSecurityYtd), medYtd=Number(medicareYtd);
  if(![gross,ssYtd,medYtd].every(Number.isFinite)||[gross,ssYtd,medYtd].some(v=>v<0))
    throw new Error("Gross pay and year-to-date wages must be nonnegative numbers.");
  const ssTaxable=Math.min(gross,Math.max(0,FICA_2026.socialSecurityWageBase-ssYtd));
  const ss=cents(ssTaxable*FICA_2026.socialSecurityRate);
  const medicare=cents(gross*FICA_2026.medicareRate);
  const additionalTaxable=Math.max(0,medYtd+gross-FICA_2026.additionalMedicareThreshold)
    -Math.max(0,medYtd-FICA_2026.additionalMedicareThreshold);
  const additionalMedicare=cents(additionalTaxable*FICA_2026.additionalMedicareRate);
  return {
    grossPay:cents(gross),employeeSocialSecurity:ss,employeeMedicare:medicare,
    employeeAdditionalMedicare:additionalMedicare,
    employerSocialSecurity:ss,employerMedicare:medicare,
    employeeFicaTotal:cents(ss+medicare+additionalMedicare),
    employerFicaTotal:cents(ss+medicare),
    remainingAfterFica:cents(gross-ss-medicare-additionalMedicare),
    fullNetPayAvailable:false,
    missingWithholdings:["Federal income tax (Form W-4 / Pub. 15-T)","Ohio income tax (IT 4)","Applicable city and school district tax","Other legally required or authorized deductions"]
  };
}
