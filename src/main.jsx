import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./style.css";

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
  return <section><div className="toolbar"><div><strong>{title}</strong><div className="muted">{rows.length} RECORDS</div></div></div>
    {error?<div className="alert">Unable to load this module: {error}</div>:
    <div className="tablewrap">{!rows.length?<div className="empty">No records found.</div>:
      <table><thead><tr>{columns.map(c=><th key={c}>{c.replaceAll("_"," ")}</th>)}</tr></thead>
      <tbody>{rows.map((r,i)=><tr key={r.id??i}>{columns.map(c=><td key={c}>{r[c]===null?"":typeof r[c]==="object"?JSON.stringify(r[c]):String(r[c])}</td>)}</tr>)}</tbody></table>}</div>}
  </section>
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
