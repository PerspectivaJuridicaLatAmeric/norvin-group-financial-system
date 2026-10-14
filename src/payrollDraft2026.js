// Assemble a payroll draft only when all required tax calculations are supplied.
// This does not issue payment or mark payroll verified/finalized.
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
const money=(value,name)=>{if(typeof value!=="number"||!Number.isFinite(value)||value<0)throw new Error(name+" must be a nonnegative number");return cents(value)};
export function createPayrollDraft2026({
 employeeId,payDate,grossPay,federalTaxableWages=grossPay,socialSecurityTaxableWages=grossPay,medicareTaxableWages=grossPay,federal,ohio,fica,
 municipal,schoolDistrict,otherDeductions=0
}){
 if(!employeeId||!/^2026-\d{2}-\d{2}$/.test(payDate||""))throw new Error("Employee and 2026 pay date required");
 if(!federal?.tableVersion||!ohio?.version||!fica)throw new Error("Federal, Ohio and FICA calculations required");
 if(!municipal||!schoolDistrict)throw new Error("Local tax applicability must be explicitly verified");
 for(const [name,r] of [["municipal",municipal],["schoolDistrict",schoolDistrict]]){
  if(r.applies!==true&&r.applies!==false)throw new Error(name+" applicability must be explicit");
  if(r.applies&&(!r.ruleVersion||!r.code||typeof r.withheld!=="number"))
   throw new Error(name+" verified rule required");
  if(!r.applies&&!r.verifiedNonApplicability)throw new Error(name+" non-applicability must be verified");
 }
 const gross=money(grossPay,"grossPay");
 const deductions={
  federal_withholding:money(federal.federalIncomeWithheld,"federal"),
  state_withholding:money(ohio.employeeOhioWithholding,"Ohio"),
  social_security:money(fica.employeeSocialSecurity,"Social Security"),
  medicare:money(fica.employeeMedicare,"Medicare"),
  additional_medicare:money(fica.employeeAdditionalMedicare,"Additional Medicare"),
  municipal_withholding:municipal.applies?money(municipal.withheld,"municipal"):0,
  school_district_withholding:schoolDistrict.applies?money(schoolDistrict.withheld,"school district"):0,
  other_deductions:money(otherDeductions,"other deductions")
 };
 const net=cents(gross-Object.values(deductions).reduce((a,b)=>a+b,0));
 if(net<0)throw new Error("Deductions exceed gross pay");
 return {
  employee_id:employeeId,pay_date:payDate,gross_pay:gross,federal_taxable_wages:money(Number(federalTaxableWages),"federal taxable wages"),social_security_taxable_wages:money(Number(socialSecurityTaxableWages),"Social Security taxable wages"),medicare_taxable_wages:money(Number(medicareTaxableWages),"Medicare taxable wages"),...deductions,net_pay:net,
  federal_rule_version:federal.tableVersion,ohio_rule_version:ohio.version,
  municipal_code:municipal.applies?municipal.code:null,
  school_district_code:schoolDistrict.applies?schoolDistrict.code:null,
  municipal_rule_version:municipal.applies?municipal.ruleVersion:null,
  school_district_rule_version:schoolDistrict.applies?schoolDistrict.ruleVersion:null,
  calculation_status:"draft",
  calculation_snapshot:{
   taxYear:2026,createdAt:new Date().toISOString(),
   federalSource:federal.source||null,ohioSource:ohio.source||null,
   municipalApplicability:municipal,schoolDistrictApplicability:schoolDistrict,
   employerFica:fica.employerFicaTotal
  }
 };
}
