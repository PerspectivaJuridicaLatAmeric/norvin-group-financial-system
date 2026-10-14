import {resolveOhioLocalTax2026} from "./resolveOhioLocalTax2026.js";
import {createPayrollDraft2026} from "./payrollDraft2026.js";
export function assembleVerifiedPayrollDraft2026({employee,payDate,grossPay,federal,ohio,fica,municipalRule,schoolDistrictRule,municipalNonApplicability,schoolDistrictNonApplicability,otherDeductions=0}){
 if(!employee?.id) throw new Error("Employee is required.");
 const local=resolveOhioLocalTax2026({employee,payDate,taxableWages:Number(grossPay),municipalRule,schoolDistrictRule,municipalNonApplicability,schoolDistrictNonApplicability});
 return createPayrollDraft2026({employeeId:employee.id,payDate,grossPay:Number(grossPay),federal,ohio,fica,municipal:local.municipal,schoolDistrict:local.schoolDistrict,otherDeductions});
}
