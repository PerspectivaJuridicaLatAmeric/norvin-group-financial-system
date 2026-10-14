import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";
import { calculateFica2026 } from "./payrollTax2026.js";
import { calculateFederalWithholding2026 } from "./federalWithholding2026.js";
import { IRS_AUTOMATED_2026 } from "./irsAutomatedTables2026.js";
import { calculateOhioWithholding2026 } from "./ohioWithholding2026.js";
import { OHIO_PERCENTAGE_2026_AUG } from "./ohioPercentageTables2026.js";
import { validatePayrollReadiness, WITHHOLDING_SOURCES_2026 } from "./withholdingRules2026.js";
import CrudModule from "./CrudModule.jsx";
import DocumentsModule from "./DocumentsModule.jsx";
import ReportsModule from "./ReportsModule.jsx";
import { moduleConfigs } from "./moduleConfigs.js";
import EmployeePayrollProfile from "./EmployeePayrollProfile.jsx";
import { createPayrollDraft2026 } from "./payrollDraft2026.js";
import { savePayrollDraft } from "./savePayrollDraft.js";

const modules = [
  ["dashboard","Dashboard"],["clients","Clients"],["projects","Projects"],["estimates","Estimates"],
  ["invoices","Invoices"],["payments","Payments"],["expenses","Expenses"],
  ["employees","Employees"],["payroll_entries","Payroll"],["contractors","Contractors"],
  ["contractor_payments","Contractor Payments"],["documents","Documents"],["reports","Reports"]
];

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const recoveryOnArrival = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
const supabase = url && key ? createClient(url, key) : null;

function BrandLogo({compact=false}){return <div className={compact?"company-logo compact":"company-logo"} aria-label="NORVIN GROUP LLC"><svg viewBox="0 0 92 78" aria-hidden="true"><path className="lg-gold" d="M8 67V42l16-12v25l22-17 22 17V30l16 12v25H68L46 50 24 67z"/><path className="lg-gray" d="M24 55V23l16-12v32z"/><path className="lg-navy" d="M46 38V5l16 12v34z"/><path className="lg-gold2" d="M40 43V12l6-7v33z"/><path className="lg-window" d="M41 58h5v5h-5zm7 0h5v5h-5zm-7 7h5v5h-5zm7 0h5v5h-5z"/></svg><div className="logo-copy"><strong>NORVIN</strong><span>GROUP LLC</span><small>SOLIDITY AND TRUST IN EVERY PROJECT</small></div></div>}

function App(){
  const [recovering,setRecovering]=useState(recoveryOnArrival);
  const [section,setSection]=useState("dashboard");
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(Boolean(supabase));
  const [rows,setRows]=useState([]);
  const [error,setError]=useState("");
  const [recordsLoading,setRecordsLoading]=useState(false);
  const [authError,setAuthError]=useState("");

  useEffect(()=>{
    if(!supabase){ setLoading(false); return; }
    supabase.auth.getSession().then(({data,error})=>{setSession(data?.session||null);if(error)setAuthError(error.message);}).catch(e=>setAuthError(e.message)).finally(()=>setLoading(false));
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthError("");if(_event==="PASSWORD_RECOVERY")setRecovering(true);});
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    let active=true;
    if(!supabase || !session || ["dashboard","documents","reports"].includes(section)){
      setRows([]);setError("");setRecordsLoading(false);
      return ()=>{active=false;};
    }
    setRows([]);setError("");setRecordsLoading(true);
    supabase.from(section).select("*").limit(100).then(({data,error})=>{
      if(!active)return;
      if(error){setError(error.message);setRows([]);}
      else setRows(data||[]);
    }).catch(e=>{if(active){setError(e.message||"Unable to load records");setRows([]);}})
      .finally(()=>{if(active)setRecordsLoading(false);});
    return ()=>{active=false;};
  },[section,session]);

  const title=useMemo(()=>modules.find(([id])=>id===section)?.[1]||"Dashboard",[section]);

  if(loading) return <div className="login"><div className="panel"><h1>NORVIN GROUP LLC</h1><p>Loading financial system…</p></div></div>;

  if(!supabase) return <div className="login"><div className="panel">
    <BrandLogo compact/><h1>NORVIN GROUP LLC</h1>
    <p>Financial Management System</p>
    <div className="notice">Supabase environment variables are not configured on this deployment. Add the project URL and publishable key to enable secure sign-in and company data.</div>
  </div></div>;

  if(session && recovering) return <NewPassword onDone={()=>setRecovering(false)}/>;

  if(!session) return <><Login />{authError&&<div className="alert" role="alert">Authentication initialization error: {authError}</div>}</>;

  return <div className="layout">
    <aside>
      <BrandLogo compact/><h2>NORVIN GROUP<br/>LLC</h2><div className="muted">FINANCIAL SYSTEM</div>
      {modules.map(([id,label])=><button key={id} className={"nav "+(section===id?"active":"")} onClick={()=>setSection(id)}>{label}</button>)}
      <button className="nav" onClick={()=>setRecovering(true)}>Change password</button>
      <button className="nav logout" onClick={()=>supabase.auth.signOut()}>Sign out</button>
    </aside>
    <main className="content">
      <header><div><div className="muted">NORVIN GROUP LLC</div><h1>{title}</h1></div><div className="email">{session.user.email}</div></header>
      {section==="dashboard" ? <Dashboard setSection={setSection}/> : <DataModule title={title} rows={rows} error={error} loading={recordsLoading}/>}
      <p className="footnote">Company financial records are loaded from Supabase under the authenticated user. Payroll and tax calculations require professional review before production use.</p>
    </main>
  </div>;
}

function Login(){
  const [resetMode,setResetMode]=useState(new URLSearchParams(window.location.search).get("recover")==="1");
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [submitting,setSubmitting]=useState(false);
  async function submit(e){
    e.preventDefault();if(submitting)return;
    setMessage("");setSubmitting(true);
    try{
      if(resetMode){
        const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/"});
        if(error)throw error;
        setMessage("If this email is registered, a recovery link has been requested. Check your inbox and spam folder.");
      } else {
        const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
      }
    }
    catch(err){setMessage(err.message||"Unable to sign in. Please try again.");}
    finally{setSubmitting(false);}
  }
  return <div className="login"><form className="panel" onSubmit={submit}><BrandLogo compact/><h1>NORVIN GROUP LLC</h1><p>Financial Management System</p>
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
    <label style={{display:resetMode?"none":undefined}}>Password<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required={!resetMode} disabled={resetMode}/></label>
    {message&&<div className="alert">{message}</div>}<button className="primary" disabled={submitting}>{submitting?"Please wait…":resetMode?"Send recovery email":"Sign in"}</button>
    <button type="button" disabled={submitting} onClick={()=>{setResetMode(!resetMode);setMessage("");setPassword("");}}>{resetMode?"Back to sign in":"Forgot password?"}</button>
    <small>Access is controlled by Supabase Authentication. Do not share credentials.</small>
  </form></div>
}

function NewPassword({onDone}){
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  async function submit(e){
    e.preventDefault();if(busy)return;
    if(password!==confirm){setMessage("Passwords do not match.");return;}
    if(password.length<12){setMessage("Use at least 12 characters.");return;}
    setBusy(true);setMessage("");
    try{
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw error;
      setPassword("");setConfirm("");setDone(true);
      window.history.replaceState(null,"",window.location.pathname);
    }catch(err){setMessage(err.message||"Unable to update password. Request a new recovery link.");}
    finally{setBusy(false);}
  }
  return <div className="login"><form className="panel" onSubmit={submit}>
    <BrandLogo compact/><h1>NORVIN GROUP LLC</h1>
    <h2>{done?"Password updated":"Choose a new password"}</h2>
    {done?<><p>Your new password has been saved.</p><button type="button" className="primary" onClick={onDone}>Continue to dashboard</button></>:<>
      <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
      <p>Use at least 12 characters. Keep this password private.</p>
      {message&&<div className="alert" role="alert">{message}</div>}
      <button className="primary" disabled={busy}>{busy?"Saving…":"Save new password"}</button>
    </>}
  </form></div>;
}

function Dashboard({setSection}){
  const groups=[
    ["Business operations",[["clients","Clients","Customer records"],["projects","Projects","Jobs and project activity"],["estimates","Estimates","Customer estimates"],["invoices","Invoices","Billing and receivables"],["payments","Payments","Customer payments"],["expenses","Expenses","Operating costs"]]],
    ["Workforce",[["employees","Employees","Employee records"],["payroll_entries","Payroll","Payroll calculations"],["contractors","Contractors","Contractor records"],["contractor_payments","Contractor Payments","Contractor compensation"]]],
    ["Control center",[["documents","Documents","Printable business records"],["reports","Reports","Financial summaries"]]]
  ];
  return <section className="dashboard-home">
    <div className="hero"><div><div className="eyebrow">NORVIN GROUP LLC</div><h2>Financial Management System</h2><p>Central workspace for company operations, billing, expenses, workforce records, documents and reporting.</p></div><BrandLogo compact/></div>
    {groups.map(([heading,items])=><div key={heading} className="dashboard-group"><div className="section-heading"><h3>{heading}</h3></div><div className="grid">{items.map(([id,label,desc])=><button className="tile" key={id} onClick={()=>setSection(id)}><strong>{label}</strong><span>{desc}</span><small>Open module →</small></button>)}</div></div>)}
  </section>
}

function DataModule({title,rows,error,loading}){
  const columns=rows.length?Object.keys(rows[0]):[];
  if(loading && !["Documents","Reports"].includes(title)) return <div className="notice">Loading {title.toLowerCase()} records…</div>;
  if(title==="Payroll") return <PayrollModule rows={rows} error={error}/>;
  if(title==="Documents") return <DocumentsModule/>;
  if(title==="Reports") return <ReportsModule supabase={supabase}/>;
  if(title==="Clients") return <CrudModule supabase={supabase} table="clients" config={moduleConfigs.clients} initialRows={rows} loadError={error}/>;
  if(title==="Projects") return <CrudModule supabase={supabase} table="projects" config={moduleConfigs.projects} initialRows={rows} loadError={error}/>;
  if(title==="Estimates") return <CrudModule supabase={supabase} table="estimates" config={moduleConfigs.estimates} initialRows={rows} loadError={error}/>;
  if(title==="Invoices") return <CrudModule supabase={supabase} table="invoices" config={moduleConfigs.invoices} initialRows={rows} loadError={error}/>;
  if(title==="Payments") return <CrudModule supabase={supabase} table="payments" config={moduleConfigs.payments} initialRows={rows} loadError={error}/>;
  if(title==="Expenses") return <CrudModule supabase={supabase} table="expenses" config={moduleConfigs.expenses} initialRows={rows} loadError={error}/>;
  if(title==="Employees") return <CrudModule supabase={supabase} table="employees" config={moduleConfigs.employees} initialRows={rows} loadError={error}/>;
  if(title==="Contractors") return <CrudModule supabase={supabase} table="contractors" config={moduleConfigs.contractors} initialRows={rows} loadError={error}/>;
  if(title==="Contractor Payments") return <CrudModule supabase={supabase} table="contractor_payments" config={moduleConfigs.contractor_payments} initialRows={rows} loadError={error}/>;
  return <section><div className="toolbar"><div><strong>{title}</strong><div className="muted">{rows.length} RECORDS</div></div></div>
    {error?<div className="alert">Unable to load this module: {error}</div>:
    <div className="tablewrap">{!rows.length?<div className="empty">No records found.</div>:
      <table><thead><tr>{columns.map(c=><th key={c}>{c.replaceAll("_"," ")}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={r.id??i}>{columns.map(c=><td key={c}>{r[c]===null?"":typeof r[c]==="object"?JSON.stringify(r[c]):String(r[c])}</td>)}</tr>)}</tbody></table>}</div>}
  </section>
}

function PayrollModule({rows,error}){
  const readiness = validatePayrollReadiness();
  const [gross,setGross]=useState("");
  const [ssYtd,setSsYtd]=useState("0");
  const [medYtd,setMedYtd]=useState("0");
  const [frequency,setFrequency]=useState("weekly");
  const [filingStatus,setFilingStatus]=useState("single");
  const [multipleJobs,setMultipleJobs]=useState(false);
  const [payDate,setPayDate]=useState(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");});
  const [it4Exemptions,setIt4Exemptions]=useState("");
  const [employee,setEmployee]=useState(null);
  const [saveMessage,setSaveMessage]=useState("");
  function selectEmployee(e){
    setEmployee(e);
    if(!e)return;
    if(e.pay_frequency)setFrequency(e.pay_frequency);
    if(e.federal_filing_status)setFilingStatus(e.federal_filing_status);
    setMultipleJobs(Boolean(e.federal_multiple_jobs));
    if(e.ohio_it4_exemptions!==null&&e.ohio_it4_exemptions!==undefined)setIt4Exemptions(String(e.ohio_it4_exemptions));
  }
  let result=null, federalPreview=null, ohioPreview=null, calcError="";
  if(gross!==""){
    try{result=calculateFica2026({grossPay:gross,socialSecurityYtd:ssYtd,medicareYtd:medYtd});
      federalPreview=calculateFederalWithholding2026({taxableWages:Number(gross),frequency,filingStatus,multipleJobs,verifiedTable:IRS_AUTOMATED_2026});
      if(it4Exemptions!=="") ohioPreview=calculateOhioWithholding2026({payDate,taxableWages:Number(gross),payFrequency:frequency,exemptions:Number(it4Exemptions),verifiedTable:OHIO_PERCENTAGE_2026_AUG});}
    catch(e){calcError=e.message;}
  }
  const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
  async function persistDraft(){
    setSaveMessage("");
    try{
      if(!employee) throw new Error("Select an employee first.");
      if(!result||!federalPreview||!ohioPreview) throw new Error("Complete gross pay and required tax inputs.");
      const municipal={applies:false,verifiedNonApplicability:false};
      const schoolDistrict={applies:false,verifiedNonApplicability:false};
      const draft=createPayrollDraft2026({employeeId:employee.id,payDate,grossPay:Number(gross),federal:federalPreview,ohio:ohioPreview,fica:result,municipal,schoolDistrict});
      await savePayrollDraft({supabase,draft});
      setSaveMessage("Payroll draft saved.");
    }catch(e){setSaveMessage(e.message);}
  }
  return <section>
    <div className="toolbar"><div><strong>Payroll</strong><div className="muted">{rows.length} PAYROLL RECORDS</div></div></div>
    <div className="welcome">
      <h2>2026 FICA withholding calculator</h2>
      {!readiness.ready && <div className="alert">Live payroll is blocked: federal, Ohio, school district and municipal withholding are not fully verified. This screen is a preview only.</div>}
      <p className="muted">Rule year: 2026 · Verified sources tracked: {Object.keys(WITHHOLDING_SOURCES_2026).length} · Missing production requirements: {readiness.missing.length}</p>
      <p>Enter current gross pay and prior year-to-date Social Security and Medicare taxable wages for this employee. This is a calculation preview, not a payroll payment or saved record.</p>
      <EmployeePayrollProfile supabase={supabase} onSelect={selectEmployee}/>
      {employee&&<div className="notice">Tax profile loaded for {employee.first_name} {employee.last_name}. Work municipality: {employee.work_municipality||"missing"} · Residence municipality: {employee.residence_municipality||"missing"} · School district: {employee.school_district_code||"missing"}.</div>}
      <div className="formgrid">
        <label>Gross pay ($)<input type="number" min="0" step="0.01" value={gross} onChange={e=>setGross(e.target.value)}/></label>
        <label>Prior Social Security wages YTD ($)<input type="number" min="0" step="0.01" value={ssYtd} onChange={e=>setSsYtd(e.target.value)}/></label>
        <label>Prior Medicare wages YTD ($)<input type="number" min="0" step="0.01" value={medYtd} onChange={e=>setMedYtd(e.target.value)}/></label>
        <label>Pay frequency<select value={frequency} onChange={e=>setFrequency(e.target.value)}><option value="weekly">Weekly</option><option value="biweekly">Biweekly</option><option value="semimonthly">Semimonthly</option><option value="monthly">Monthly</option></select></label>
        <label>Federal filing status<select value={filingStatus} onChange={e=>setFilingStatus(e.target.value)}><option value="single">Single</option><option value="married">Married filing jointly</option><option value="headOfHousehold">Head of household</option></select></label>
        <label>W-4 Step 2 multiple jobs<input type="checkbox" checked={multipleJobs} onChange={e=>setMultipleJobs(e.target.checked)}/></label>
        <label>Pay date<input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)}/></label>
        <label>Ohio IT 4 exemptions (required for Ohio preview)<input type="number" min="0" step="1" value={it4Exemptions} onChange={e=>setIt4Exemptions(e.target.value)}/></label>
      </div>
      {calcError&&<div className="alert">{calcError}</div>}
      {result&&<div className="tablewrap"><table><tbody>
        <tr><th>Gross Pay</th><td>{money(result.grossPay)}</td></tr>
        {federalPreview&&<tr><th>Federal income tax — preview (W-4 Steps 3–4 assumed zero)</th><td>{money(federalPreview.federalIncomeWithheld)}</td></tr>}
        {ohioPreview&&<tr><th>Ohio state withholding — preview</th><td>{money(ohioPreview.employeeOhioWithholding)}</td></tr>}
        <tr><th>Employee Social Security</th><td>{money(result.employeeSocialSecurity)}</td></tr>
        <tr><th>Employee Medicare</th><td>{money(result.employeeMedicare)}</td></tr>
        <tr><th>Employee Additional Medicare</th><td>{money(result.employeeAdditionalMedicare)}</td></tr>
        <tr><th>Total Employee FICA</th><td>{money(result.employeeFicaTotal)}</td></tr>
        <tr><th>Employer FICA (separate expense)</th><td>{money(result.employerFicaTotal)}</td></tr>
        <tr><th>Remaining After FICA — NOT FINAL NET PAY</th><td>{money(result.remainingAfterFica)}</td></tr>
      </tbody></table></div>}
      <button className="primary" type="button" disabled={!employee||!result||!federalPreview||!ohioPreview||!readiness.ready} onClick={persistDraft}>Save payroll draft (requires verified tax setup)</button>
      {saveMessage&&<div className="notice">{saveMessage}</div>}
      <div className="notice">Federal preview assumes W-4 Steps 3 and 4 are zero and gross pay equals federal taxable wages. It is not a complete employee W-4 calculation. Ohio preview requires an IT 4 exemption count and an eligible pay date; local taxes, benefits and other deductions remain uncalculated. Do not use this preview to pay employees.</div>
      <h2>Payroll withholding engine</h2>
      <p>Payroll will calculate employee withholdings from gross pay and employee tax elections. The calculation layer is intentionally separated from the user interface so federal, Social Security, Medicare, Ohio, and applicable local rules can be updated without rewriting payroll records.</p>
      <div className="grid">
        <div className="tile"><strong>Gross Pay</strong><span>Hours, rate or salary</span></div>
        <div className="tile"><strong>Employee Withholdings</strong><span>Federal, Social Security, Medicare, state and applicable local tax</span></div>
        <div className="tile"><strong>Employer Taxes</strong><span>Tracked separately from employee deductions</span></div>
        <div className="tile"><strong>Net Pay</strong><span>Gross pay minus employee deductions</span></div>
      </div>
    </div>
    {error?<div className="alert">Unable to load payroll records: {error}</div>:
      <div className="tablewrap" style={{marginTop:18}}>{!rows.length?<div className="empty">No payroll records found.</div>:<div className="empty">{rows.length} payroll records loaded.</div>}</div>}
    <p className="footnote">Tax rules and employee elections must be validated before payroll is used for live payments. Contractor payments remain separate from employee payroll.</p>
  </section>
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
