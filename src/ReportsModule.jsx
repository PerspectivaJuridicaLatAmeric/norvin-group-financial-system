import React, { useEffect, useState } from "react";

const money = value => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(value)||0);
const sum = rows => rows.reduce((total,row)=>total + Number(row.amount || 0),0);

export default function ReportsModule({supabase}){
  const [data,setData]=useState({payments:[],expenses:[],contractor_payments:[]});
  const [loading,setLoading]=useState(true);
  const [asOf,setAsOf]=useState(null);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    (async()=>{
      setLoading(true);
      setError("");
      try {
        // Fetch all pages so financial totals do not silently omit records after 500.
        async function loadAll(table){
          const result=[];
          for(let offset=0;;offset+=500){
            const {data:page,error}=await supabase.from(table).select("*").order("id",{ascending:true}).range(offset,offset+499);
            if(error) throw error;
            result.push(...(page||[]));
            if(!page||page.length<500) break;
          }
          return result;
        }
        const [payments,expenses,contractors]=await Promise.all([
          loadAll("payments"),loadAll("expenses"),loadAll("contractor_payments")
        ]);
        if(active){setData({payments,expenses,contractor_payments:contractors});setAsOf(new Date());}
      } catch(e){if(active)setError(e.message||"Unable to load reports");}
      finally{if(active)setLoading(false);}
    })();
    return ()=>{active=false};
  },[supabase]);

  const income=sum(data.payments);
  const expenses=sum(data.expenses);
  const contractors=sum(data.contractor_payments);
  const outflow=expenses+contractors;
  const operatingBalance=income-outflow;
  function exportCsv(){
    const records=[["Category","Records","Total USD"],["Payments received",data.payments.length,income.toFixed(2)],["Business expenses",data.expenses.length,expenses.toFixed(2)],["Contractor payments",data.contractor_payments.length,contractors.toFixed(2)],["Operating balance","",operatingBalance.toFixed(2)]];
    const csv=records.map(row=>row.join(",")).join("\r\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download="norvin-group-financial-summary.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return <section>
    <div className="toolbar"><div><strong>Reports</strong><div className="muted">BUSINESS ACTIVITY SUMMARY</div></div>
      <div className="no-print"><button type="button" disabled={loading||Boolean(error)} onClick={exportCsv}>Export CSV</button> <button className="primary" disabled={loading||Boolean(error)} onClick={()=>window.print()}>Print / Save PDF</button></div>
    </div>
    {asOf&&!loading&&!error&&<p className="muted">Report generated: {asOf.toLocaleString("en-US")}</p>}
    {loading&&<div className="notice">Loading all financial records…</div>}
    {error&&<div className="alert">Report totals are unavailable: {error}</div>}
    {!loading&&!error&&<div className="notice">Totals include all loaded records. Payroll, taxes and outstanding invoices are not included in operating balance.</div>}
    {!loading&&!error&&<><div className="cards">
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
    <p className="muted">Operating balance is a management summary, not taxable income or a tax return.</p></>}
  </section>;
}
