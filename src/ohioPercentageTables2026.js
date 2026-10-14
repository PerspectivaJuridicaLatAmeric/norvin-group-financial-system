// Ohio Department of Taxation percentage-method table effective August 1, 2026.
// Official: https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/employer_withholding/2026%20Withholding%20Tables/WHT_PercentageMethod_2026.pdf
// Each schedule: exemption amount per pay period; [upper taxable wage, base, rate, threshold].
const schedules=Object.freeze({
 weekly:{allowance:12.50,brackets:[[500.96,0,.016,0],[1923.08,8.02,.0299,500.96],[null,50.54,.034,1923.08]]},
 biweekly:{allowance:25,brackets:[[1001.92,0,.016,0],[3846.15,16.03,.0299,1001.92],[null,101.07,.034,3846.15]]},
 semimonthly:{allowance:27.08,brackets:[[1085.42,0,.016,0],[4166.67,17.37,.0299,1085.42],[null,109.50,.034,4166.67]]},
 monthly:{allowance:54.17,brackets:[[2170.83,0,.016,0],[8333.33,34.73,.0299,2170.83],[null,218.99,.034,8333.33]]},
 daily:{allowance:2.50,brackets:[[100.19,0,.016,0],[384.62,1.60,.0299,100.19],[null,10.10,.034,384.62]]}
});
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
export const OHIO_PERCENTAGE_2026_AUG=Object.freeze({
 version:"OH-2026-08-01",source:"OHIO-ODT",verified:true,
 sourceUrl:"https://dam.assets.ohio.gov/image/upload/tax.ohio.gov/employer_withholding/2026%20Withholding%20Tables/WHT_PercentageMethod_2026.pdf",
 calculate({taxableWages,payFrequency,exemptions}){
  if(typeof taxableWages!=="number"||!Number.isFinite(taxableWages)||taxableWages<0)throw new Error("Ohio taxable wages must be nonnegative");
  if(!Number.isInteger(exemptions)||exemptions<0)throw new Error("Ohio IT 4 exemptions must be a nonnegative integer");
  const s=schedules[payFrequency];
  if(!s)throw new Error("Unsupported Ohio percentage-method pay frequency");
  const taxable=Math.max(0,taxableWages-s.allowance*exemptions);
  const b=s.brackets.find(([upper])=>upper===null||taxable<=upper);
  return cents(b[1]+b[2]*(taxable-b[3]));
 }
});
