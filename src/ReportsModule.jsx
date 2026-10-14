import React, { useEffect, useState } from "react";

const money = value => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(value)||0);
const sum = rows => rows.reduce((total,row)=>total + Number(row.amount || 0),0);

export default function ReportsModule({supabase}){
  const [data,setData]=useState({payments:[],expenses:[],contractor_payments:[]});
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    (async()=>{
      const [payments,expenses,contractors]=await Promise.all([
        supabase.from("payments").select("*").limit(500),
        supabase.from("expenses").select("*").limit(500),
        supabase.from("contractor_payments").select("*").limit(500)
      ]);
      const firstError=payments.error||expenses.error||contractors.error;
      if(!active) return;
      if(firstError) setError(firstError.message);
      else setData({
        payments:payments.data||[],
        expenses:expenses.data||[],
        contractor_payments:contractors.data||[]
      });
    })();
    return ()=>{active=false};
  },[supabase]);

  const income=sum(data.payments);
  const expenses=sum(data.expenses);
  const contractors=sum(data.contractor_payments);
  const outflow=expenses+contractors;
  const operatingBalance=income-outflow;

  return <section>
    <div className="toolbar"><div><strong>Reports</strong><div className="muted">BUSINESS ACTIVITY SUMMARY</div></div>
      <button className="primary no-print" onClick={()=>window.print()}>Print / Save PDF</button>
    </div>
    {error&&<div className="alert">{error}</div>}
    <div className="cards">
      <div className="card"><span>Payments received</span><strong>{money(income)}</strong></div>
      <div className="card"><span>Business expenses</span><strong>{money(expenses)}</strong></div>
      <div className="card"><span>Contractor payments</span><strong>{money(contractors)}</strong></div>
      <div className="card"><span>Operating balance</span><strong>{money(operatingBalance)}</strong></div>
    </div>
    <div className="tablewrap">
      <table><thead><tr><th>Category</th><th>Records</th><th>Total</th></tr></thead><tbody>
        <tr><td>Payments received</td><td>{data.payments.length}</td><td>{money(income)}</td></tr>
        <tr><td>Business expenses</td><td>{data.expenses.length}</td><td>{money(expenses)}</td></tr>
        <tr><td>Contractor payments</td><td>{data.contractor_payments.length}</td><td>{money(contractors)}</td></tr>
        <tr><td><strong>Operating balance</strong></td><td>—</td><td><strong>{money(operatingBalance)}</strong></td></tr>
      </tbody></table>
    </div>
    <p className="muted">Operating balance is a management summary, not taxable income or a tax return.</p>
  </section>;
}
