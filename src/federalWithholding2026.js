// IRS Publication 15-T (2026), Worksheet 1A: automated percentage method.
// Brackets are injected from a verified, versioned official tax table;
// this function never silently substitutes a tax bracket or a prior year's rules.
export const PAY_PERIODS = Object.freeze({
  annually:1, semiannually:2, quarterly:4, monthly:12,
  semimonthly:24, biweekly:26, weekly:52, daily:260
});
const roundCents = n => Math.round((n + Number.EPSILON)*100)/100;
const nonnegative = (value,label) => {
  const n=Number(value);
  if(!Number.isFinite(n)||n<0) throw new Error(label+" must be nonnegative.");
  return n;
};
export function calculateFederalWithholding2026({
  taxableWages, frequency, filingStatus, multipleJobs=false,
  w4Step3=0, w4Step4a=0, w4Step4b=0, w4Step4c=0,
  verifiedTable
}){
  const periods=PAY_PERIODS[frequency];
  if(!periods) throw new Error("Unsupported pay frequency.");
  if(!["single","married","headOfHousehold"].includes(filingStatus))
    throw new Error("Valid Form W-4 filing status is required.");
  if(!verifiedTable || verifiedTable.year!==2026 ||
      verifiedTable.source!=="IRS-PUB-15T" ||
      verifiedTable.verified!==true ||
      !Array.isArray(verifiedTable.brackets))
    throw new Error("A verified 2026 IRS Publication 15-T bracket table is required.");
  const gross=nonnegative(taxableWages,"Taxable wages");
  const step3=nonnegative(w4Step3,"W-4 Step 3");
  const step4a=nonnegative(w4Step4a,"W-4 Step 4(a)");
  const step4b=nonnegative(w4Step4b,"W-4 Step 4(b)");
  const step4c=nonnegative(w4Step4c,"W-4 Step 4(c)");
  const adjustment=multipleJobs ? 0 : filingStatus==="married" ? 12900 : 8600;
  const adjustedAnnual=Math.max(0,gross*periods+step4a-step4b-adjustment);
  const matches=verifiedTable.brackets.filter(b =>
    b.filingStatus===filingStatus && Boolean(b.multipleJobs)===Boolean(multipleJobs) &&
    Number.isFinite(b.from) && Number.isFinite(b.base) &&
    Number.isFinite(b.rate) && b.from>=0 && b.base>=0 && b.rate>=0 &&
    adjustedAnnual>=b.from && (b.to===null || adjustedAnnual<b.to));
  if(matches.length!==1) throw new Error("Official 2026 bracket is missing or ambiguous.");
  const bracket=matches[0];
  const tentative=bracket.base+(adjustedAnnual-bracket.from)*bracket.rate;
  return {
    year:2026, adjustedAnnualWages:roundCents(adjustedAnnual),
    federalIncomeWithheld:roundCents(Math.max(0,(tentative-step3)/periods)+step4c),
    source:"IRS Publication 15-T (2026), Worksheet 1A",
    tableVersion:verifiedTable.version,
    productionReady:false // Requires cross-checked official table and employee W-4.
  };
}
