const cents=n=>Math.round((Number(n||0)+Number.EPSILON)*100)/100;
export function buildW2YearToDate2026(entries){
 const finalized=(entries||[]).filter(e=>e.calculation_status==="finalized"&&String(e.pay_date||"").startsWith("2026-"));
 return finalized.reduce((a,e)=>{
  a.wages=cents(a.wages+Number(e.federal_taxable_wages ?? e.gross_pay ?? 0));
  a.federalIncomeTax=cents(a.federalIncomeTax+Number(e.federal_withholding||0));
  a.socialSecurityWages=cents(a.socialSecurityWages+Number(e.social_security_taxable_wages ?? e.gross_pay ?? 0));
  a.socialSecurityTax=cents(a.socialSecurityTax+Number(e.social_security||0));
  a.medicareWagesAndTips=cents(a.medicareWagesAndTips+Number(e.medicare_taxable_wages ?? e.gross_pay ?? 0));
  a.medicareTax=cents(a.medicareTax+Number(e.medicare||0)+Number(e.additional_medicare||0));
  a.ohioStateIncomeTax=cents(a.ohioStateIncomeTax+Number(e.state_withholding||0));
  a.localIncomeTax=cents(a.localIncomeTax+Number(e.municipal_withholding||0)+Number(e.school_district_withholding||0));
  return a;
 },{taxYear:2026,wages:0,federalIncomeTax:0,socialSecurityWages:0,socialSecurityTax:0,medicareWagesAndTips:0,medicareTax:0,ohioStateIncomeTax:0,localIncomeTax:0});
}
