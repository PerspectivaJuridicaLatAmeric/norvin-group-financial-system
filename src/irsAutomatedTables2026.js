// IRS Publication 15-T (2026), Section 1, annual automated percentage method.
// Source: https://www.irs.gov/publications/p15t
// Each row: lower threshold, tentative annual base, marginal rate.
// Upper bound is the next row's lower threshold.
const rows={
 married:{
  standard:[[0,0,0],[19300,0,.10],[44100,2480,.12],[120100,11600,.22],[230700,35932,.24],[422850,82048,.32],[531750,116896,.35],[788000,206583.50,.37]],
  checkbox:[[0,0,0],[16100,0,.10],[28500,1240,.12],[66500,5800,.22],[121800,17966,.24],[217875,41024,.32],[272325,58448,.35],[400450,103291.75,.37]]
 },
 single:{
  standard:[[0,0,0],[7500,0,.10],[19900,1240,.12],[57900,5800,.22],[113200,17966,.24],[209275,41024,.32],[263725,58448,.35],[648100,192979.25,.37]],
  checkbox:[[0,0,0],[8050,0,.10],[14250,620,.12],[33250,2900,.22],[60900,8983,.24],[108938,20512,.32],[136163,29224,.35],[328350,96489.63,.37]]
 },
 headOfHousehold:{
  standard:[[0,0,0],[15550,0,.10],[33250,1770,.12],[83000,7740,.22],[121250,16155,.24],[217300,39207,.32],[271750,56631,.35],[656150,191171,.37]],
  checkbox:[[0,0,0],[12075,0,.10],[20925,885,.12],[45800,3870,.22],[64925,8077.50,.24],[112950,19603.50,.32],[140175,28315.50,.35],[332375,95585.50,.37]]
 }
};
const brackets=[];
for(const [filingStatus,schedules] of Object.entries(rows))
 for(const [kind,items] of Object.entries(schedules))
  for(let i=0;i<items.length;i++){
   const [from,base,rate]=items[i];
   brackets.push({filingStatus,multipleJobs:kind==="checkbox",from,
    to:i+1<items.length?items[i+1][0]:null,base,rate});
  }
export const IRS_AUTOMATED_2026=Object.freeze({
 year:2026,source:"IRS-PUB-15T",verified:true,
 version:"IRS-PUB-15T-2026-SECTION-1",
 sourceUrl:"https://www.irs.gov/publications/p15t",
 method:"automated-percentage",w4Years:"2020-or-later",brackets
});
