import {calculateLocalWithholding2026} from "./localWithholding2026.js";
// Explicit jurisdiction review; never infer zero tax from an empty employee field.
export function resolveOhioLocalTax2026({employee,payDate,taxableWages,municipalRule,schoolDistrictRule,municipalNonApplicability,schoolDistrictNonApplicability}){
 if(!employee?.work_municipality||!employee?.residence_municipality||!employee?.school_district_code)
   throw new Error("Employee work municipality, residence municipality and school district code are required.");
 const resolve=(jurisdiction,rule,nonApplicability)=>{
  if(rule){
   if(jurisdiction==="municipal"&&rule.code!==employee.work_municipality)
     throw new Error("Municipal rule does not match employee work municipality.");
   if(jurisdiction==="schoolDistrict"&&rule.code!==employee.school_district_code)
     throw new Error("School district rule does not match employee residence district.");
   const calculation=calculateLocalWithholding2026({taxableWages,payDate,jurisdiction,taxBase:rule.taxBase,exemptions:employee.ohio_it4_exemptions,verifiedRule:rule});
   return {applies:true,...calculation,sourceUrl:rule.sourceUrl};
  }
  if(nonApplicability?.verified===true&&nonApplicability?.sourceUrl&&nonApplicability?.effectiveFrom<=payDate&&(!nonApplicability.effectiveTo||payDate<=nonApplicability.effectiveTo)&&nonApplicability.code===(jurisdiction==="municipal"?employee.work_municipality:employee.school_district_code))
   return {applies:false,verifiedNonApplicability:true,sourceUrl:nonApplicability.sourceUrl,code:nonApplicability.code};
  throw new Error(jurisdiction+" applicability is not verified; payroll cannot be finalized.");
 };
 return {municipal:resolve("municipal",municipalRule,municipalNonApplicability),schoolDistrict:resolve("schoolDistrict",schoolDistrictRule,schoolDistrictNonApplicability)};
}
