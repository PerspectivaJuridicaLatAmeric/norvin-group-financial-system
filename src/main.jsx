import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";
import { calculateFica2026 } from "./payrollTax2026.js";

const modules = [
  ["dashboard","Dashboard"],["clients","Clients"],["projects","Projects"],
  ["invoices","Invoices"],["payments","Payments"],["expenses","Expenses"],
  ["employees","Employees"],["payroll_entries","Payroll"],["contractors","Contractors"],
  ["contractor_payments","Contractor Payments"]
];

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key) : null;

function App(){
  const [section,setSection]=useState("dashboard");
  const [session,setSession]=useState(null);
  const [loading,setLoading]=useState(Boolean(supabase));
  const [rows,setRows]=useState([]);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!supabase){ setLoading(false); return; }
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!supabase || !session || section==="dashboard"){setRows([]);return;}
    setError("");
    supabase.from(section).select("*").limit(100).then(({data,error})=>{
      if(error){setError(error.message);setRows([])} else setRows(data||[]);
    });
  },[section,session]);

  const title=useMemo(()=>modules.find(([id])=>id===section)?.[1]||"Dashboard",[section]);

  if(loading) return <div className="login"><div className="panel"><h1>NORVIN GROUP LLC</h1><p>Loading financial system…</p></div></div>;

  if(!supabase) return <div className="login"><div className="panel">
    <div className="brand">NG</div><h1>NORVIN GROUP LLC</h1>
    <p>Financial Management System</p>
    <div className="notice">Supabase environment variables are not configured on this deployment. Add the project URL and publishable key to enable secure sign-in and company data.</div>
  </div></div>;

  if(!session) return <Login />;

  return <div className="layout">
    <aside>
      <div className="brand">NG</div><h2>NORVIN GROUP<br/>LLC</h2><div className="muted">FINANCIAL SYSTEM</div>
      {modules.map(([id,label])=><button key={id} className={"nav "+(section===id?"active":"")} onClick={()=>setSection(id)}>{label}</button>)}
      <button className="nav logout" onClick={()=>supabase.auth.signOut()}>Sign out</button>
    </aside>
    <main className="content">
      <header><div><div className="muted">NORVIN GROUP LLC</div><h1>{title}</h1></div><div className="email">{session.user.email}</div></header>
      {section==="dashboard" ? <Dashboard setSection={setSection}/> : <DataModule title={title} rows={rows} error={error}/>}
      <p className="footnote">Company financial records are loaded from Supabase under the authenticated user. Payroll and tax calculations require professional review before production use.</p>
    </main>
  </div>;
}

function Login(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState("");
  async function submit(e){e.preventDefault();setMessage("");const {error}=await supabase.auth.signInWithPassword({email,password});if(error)setMessage(error.message)}
  return <div className="login"><form className="panel" onSubmit={submit}><div className="brand">NG</div><h1>NORVIN GROUP LLC</h1><p>Financial Management System</p>
    <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
    <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    {message&&<div className="alert">{message}</div>}<button className="primary">Sign in</button>
    <small>Access is controlled by Supabase Authentication. Do not share credentials.</small>
  </form></div>
}

function Dashboard({setSection}){
  return <section className="welcome"><h2>Financial operations</h2><p>Choose a module to review company records.</p>
    <div className="grid">{modules.filter(([id])=>id!=="dashboard").map(([id,label])=><button className="tile" key={id} onClick={()=>setSection(id)}><strong>{label}</strong><span>Open module →</span></button>)}</div>
  </section>
}

function DataModule({title,rows,error}){
  const columns=rows.length?Object.keys(rows[0]):[];
  if(title==="Payroll") return <PayrollModule rows={rows} error={error}/>;
  return <section><div className="toolbar"><div><strong>{title}</strong><div className="muted">{rows.length} RECORDS</div></div></div>
    {error?<div className="alert">Unable to load this module: {error}</div>:
    <div className="tablewrap">{!rows.length?<div className="empty">No records found.</div>:
      <table><thead><tr>{columns.map(c=><th key={c}>{c.replaceAll("_"," ")}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={r.id??i}>{columns.map(c=><td key={c}>{r[c]===null?"":typeof r[c]==="object"?JSON.stringify(r[c]):String(r[c])}</td>)}</tr>)}</tbody></table>}</div>}
  </section>
}

function PayrollModule({rows,error}){
  const [gross,setGross]=useState("");
  const [ssYtd,setSsYtd]=useState("0");
  const [medYtd,setMedYtd]=useState("0");
  let result=null, calcError="";
  if(gross!==""){
    try{result=calculateFica2026({grossPay:gross,socialSecurityYtd:ssYtd,medicareYtd:medYtd});}
    catch(e){calcError=e.message;}
  }
  const money=n=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
  return <section>
    <div className="toolbar"><div><strong>Payroll</strong><div className="muted">{rows.length} PAYROLL RECORDS</div></div></div>
    <div className="welcome">
      <h2>2026 FICA withholding calculator</h2>
      <p>Enter current gross pay and prior year-to-date Social Security and Medicare taxable wages for this employee. This is a calculation preview, not a payroll payment or saved record.</p>
      <div className="formgrid">
        <label>Gross pay ($)<input type="number" min="0" step="0.01" value={gross} onChange={e=>setGross(e.target.value)}/></label>
        <label>Prior Social Security wages YTD ($)<input type="number" min="0" step="0.01" value={ssYtd} onChange={e=>setSsYtd(e.target.value)}/></label>
        <label>Prior Medicare wages YTD ($)<input type="number" min="0" step="0.01" value={medYtd} onChange={e=>setMedYtd(e.target.value)}/></label>
      </div>
      {calcError&&<div className="alert">{calcError}</div>}
      {result&&<div className="tablewrap"><table><tbody>
        <tr><th>Gross Pay</th><td>{money(result.grossPay)}</td></tr>
        <tr><th>Employee Social Security</th><td>{money(result.employeeSocialSecurity)}</td></tr>
        <tr><th>Employee Medicare</th><td>{money(result.employeeMedicare)}</td></tr>
        <tr><th>Employee Additional Medicare</th><td>{money(result.employeeAdditionalMedicare)}</td></tr>
        <tr><th>Total Employee FICA</th><td>{money(result.employeeFicaTotal)}</td></tr>
        <tr><th>Employer FICA (separate expense)</th><td>{money(result.employerFicaTotal)}</td></tr>
        <tr><th>Remaining After FICA — NOT FINAL NET PAY</th><td>{money(result.remainingAfterFica)}</td></tr>
      </tbody></table></div>}
      <div className="notice">Not ready for live payroll: federal income tax, Ohio income tax, applicable local and school district tax, and other deductions are not calculated yet. Do not use remaining-after-FICA as net pay.</div>
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
