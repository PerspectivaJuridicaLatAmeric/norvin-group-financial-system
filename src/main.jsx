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

function BrandLogo({compact=false}){return <div className={compact?"company-logo compact":"company-logo"} aria-label="NORVIN GROUP LLC"><img src="/norvin-logo-web.jpg" alt="NORVIN GROUP LLC — Solidity and Trust in Every Project"/></div>}

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
      <BrandLogo/><div className="muted">FINANCIAL SYSTEM</div>
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
  return <div className="login"><form className="panel" onSubmit={submit}><BrandLogo/><h1>Welcome to NORVIN GROUP LLC</h1><p>Construction · Electrical · General Services</p>
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
  const [data,setData]=useState({payments:[],invoices:[],expenses:[],contractor_payments:[],projects:[]});
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    async function loadAll(table){
      const result=[];
      for(let offset=0;;offset+=500){
        const {data:page,error}=await supabase.from(table).select("*").order("id",{ascending:true}).range(offset,offset+499);
        if(error)throw error;
        result.push(...(page||[]));
        if(!page||page.length<500)break;
      }
      return result;
    }
    (async()=>{
      setLoading(true);setError("");
      try{
        const [payments,invoices,expenses,contractor_payments,projects]=await Promise.all(["payments","invoices","expenses","contractor_payments","projects"].map(loadAll));
        if(active)setData({payments,invoices,expenses,contractor_payments,projects});
      }catch(e){if(active)setError(e.message||"Unable to load dashboard data.");}
      finally{if(active)setLoading(false);}
    })();
    return()=>{active=false};
  },[]);
  const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
  const sum=rows=>rows.reduce((n,r)=>n+Number(r.amount||0),0);
  const income=sum(data.payments),expenses=sum(data.expenses)+sum(data.contractor_payments);
  const receivedByInvoice=new Map();
  for(const p of data.payments)receivedByInvoice.set(String(p.invoice_id),(receivedByInvoice.get(String(p.invoice_id))||0)+Number(p.amount||0));
  const outstanding=data.invoices.filter(i=>String(i.status||"").toLowerCase()!=="cancelled").reduce((n,i)=>n+Math.max(0,Number(i.total??i.amount??0)-(receivedByInvoice.get(String(i.id))||0)),0);
  const metrics=[["Total Income",money(income),"Payments received"],["Total Expenses",money(expenses),"Expenses and contractor payments"],["Net Profit",money(income-expenses),"Operating balance before payroll and taxes"],["Pending Invoices",money(outstanding),"Open receivables"]];
  const recentInvoices=[...data.invoices].sort((a,b)=>String(b.created_at||b.issue_date||"").localeCompare(String(a.created_at||a.issue_date||""))).slice(0,5);
  const recentProjects=[...data.projects].slice(-5).reverse();
  const docs=[["Invoice","Customer billing"],["Estimate","Project proposal"],["Purchase Order","Vendor purchasing"],["Payroll Statement","Employee payroll"],["Expense Report","Business expenses"]];
  return <section className="dashboard-home">
    <div className="dashboard-welcome"><div><div className="eyebrow">NORVIN GROUP LLC</div><h2>Welcome to your Business Dashboard</h2><p>Construction · Electrical · General Services</p></div><BrandLogo/></div>
    {loading&&<div className="notice">Loading financial data…</div>}
    {error&&<div className="alert">Dashboard totals unavailable: {error}</div>}
    {!loading&&!error&&<>
    <div className="metric-grid">{metrics.map(([label,value,desc])=><div className="metric-card" key={label}><span>{label}</span><strong>{value}</strong><small>{desc}</small></div>)}</div>
    <div className="dashboard-visual-grid">
      <div className="dash-panel"><div className="dash-panel-head"><h3>Income vs Expenses</h3><span>Recorded totals</span></div><div className="chart-bars"><div className="chart-line income"><i style={{height:income||expenses?`${Math.max(4,100*income/Math.max(income,expenses))}%`:"0%"}}></i></div><div className="chart-line expense"><i style={{height:income||expenses?`${Math.max(4,100*expenses/Math.max(income,expenses))}%`:"0%"}}></i></div></div><div className="chart-legend"><span><b className="legend-income"></b>Income {money(income)}</span><span><b className="legend-expense"></b>Expenses {money(expenses)}</span></div></div>
      <div className="dash-panel"><div className="dash-panel-head"><h3>Project Status</h3><span>Current workload</span></div><div className="status-ring"><div><strong>{data.projects.length}</strong><span>Projects</span></div></div><div className="status-list">{["Active","Pending","Completed"].map(status=><span key={status}><b></b>{status} <strong>{data.projects.filter(p=>String(p.status||"").toLowerCase()===status.toLowerCase()).length}</strong></span>)}</div></div>
    </div>
    <div className="dashboard-visual-grid">
      <div className="dash-panel"><div className="dash-panel-head"><h3>Recent Invoices</h3><button onClick={()=>setSection("invoices")}>View all</button></div><div className="dash-list">{recentInvoices.length?recentInvoices.map(r=>{const due=Math.max(0,Number(r.total??r.amount??0)-(receivedByInvoice.get(String(r.id))||0));return <div className="dash-row" key={r.id}><div><strong>{r.invoice_number}</strong><small>{money(Number(r.total??r.amount??0))} total</small></div><span>{money(due)} due</span><em>{String(r.status||"")}</em></div>}):<div className="muted">No invoices yet.</div>}</div></div>
      <div className="dash-panel"><div className="dash-panel-head"><h3>Recent Projects</h3><button onClick={()=>setSection("projects")}>View all</button></div><div className="dash-list">{recentProjects.length?recentProjects.map(r=><div className="dash-row project-row" key={r.id}><div><strong>{r.name||r.project_name||"Project"}</strong><small>{r.description||""}</small></div><em>{r.status||"—"}</em></div>):<div className="muted">No projects yet.</div>}</div></div>
    </div></>}
    <div className="documents-strip"><div className="section-heading"><div><div className="eyebrow">Business documents</div><h3>Document Center</h3></div><button onClick={()=>setSection("documents")}>Open Documents →</button></div><div className="document-preview-grid">{docs.map(([name,desc])=><button className="document-preview" key={name} onClick={()=>setSection("documents")}><div className="doc-sheet"><BrandLogo compact/><span>{name}</span><i></i><i></i><i></i></div><strong>{name}</strong><small>{desc}</small></button>)}</div></div>
  </section>;
}

function DataModule({title,rows,error,loading}){
  const columns=rows.length?Object.keys(rows[0]):[];
  if(loading && !["Documents","Reports"].includes(title)) return <div className="notice">Loading {title.toLowerCase()} records…</div>;
  if(title==="Payroll") return <PayrollModule rows={rows} error={error}/>;
  if(title==="Documents") return <DocumentsModule supabase={supabase}/>;
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
