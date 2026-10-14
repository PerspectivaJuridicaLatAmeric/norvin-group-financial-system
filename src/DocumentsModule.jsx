import React from "react";

const TYPES = [
  ["estimate","Estimate"],
  ["invoice","Invoice"],
  ["purchase-order","Purchase Order"],
  ["payroll-statement","Payroll Statement (Manual Draft)"],
  ["expense-report","Expense Report"]
];

export default function DocumentsModule({supabase}){
  const [type,setType]=React.useState("estimate");
  const [number,setNumber]=React.useState("");
  const [name,setName]=React.useState("");
  const [amount,setAmount]=React.useState("");
  const [date,setDate]=React.useState(new Date().toISOString().slice(0,10));
  const [notes,setNotes]=React.useState("");
  const [address,setAddress]=React.useState("");
  const [description,setDescription]=React.useState("");
  const [qty,setQty]=React.useState("1");
  const [rate,setRate]=React.useState("");
  const [error,setError]=React.useState("");
  const [sourceRows,setSourceRows]=React.useState([]);
  const [clients,setClients]=React.useState([]);
  const [sourceId,setSourceId]=React.useState("");
  const [sourceLoading,setSourceLoading]=React.useState(false);
  React.useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase)return;
      setSourceLoading(true); setSourceId("");
      const table=type==="invoice"?"invoices":type==="estimate"?"estimates":type==="expense-report"?"expenses":null;
      try{
        const clientReq=supabase.from("clients").select("*").limit(200);
        const sourceReq=table?supabase.from(table).select("*").limit(200):Promise.resolve({data:[],error:null});
        const [cr,sr]=await Promise.all([clientReq,sourceReq]);
        if(!active)return;
        if(cr.error)throw cr.error;if(sr.error)throw sr.error;
        setClients(cr.data||[]);setSourceRows(sr.data||[]);
      }catch(e){if(active)setError(e.message||"Unable to load saved records.");}
      finally{if(active)setSourceLoading(false);}
    } load(); return()=>{active=false};
  },[supabase,type]);
  function loadSavedRecord(id){
    setSourceId(id); if(!id)return;
    const r=sourceRows.find(x=>String(x.id)===String(id)); if(!r)return;
    const client=clients.find(x=>String(x.id)===String(r.client_id));
    if(type==="invoice"){setNumber(r.invoice_number||"");setName(client?.name||"");setAddress(client?.address||"");setAmount(r.amount??"");setDate((r.due_date||new Date().toISOString().slice(0,10)).slice(0,10));setDescription(r.description||r.notes||"");}
    if(type==="estimate"){setNumber(r.estimate_number||"");setName(client?.name||"");setAddress(client?.address||"");setAmount(r.amount??"");setDate((r.valid_until||new Date().toISOString().slice(0,10)).slice(0,10));setDescription(r.description||r.notes||"");}
    if(type==="expense-report"){setNumber(r.expense_number||String(r.id).slice(0,8));setName(r.vendor||"");setAmount(r.amount??"");setDate((r.expense_date||new Date().toISOString().slice(0,10)).slice(0,10));setDescription(r.description||"");}
  }
  const validAmount=amount!==""&&Number.isFinite(Number(amount))&&Number(amount)>=0;
  function printDocument(){
    const calculatedOk=["invoice","estimate","purchase-order"].includes(type)&&rate!==""&&Number.isFinite(Number(rate))&&Number(rate)>=0&&Number(qty)>0;
    if(!number.trim()||!name.trim()||!date||(!validAmount&&!calculatedOk)){setError("Enter a document number, recipient, valid date and a valid amount or line-item rate.");return;}
    setError("");window.print();
  }
  const label=TYPES.find(([key])=>key===type)?.[1] || "Document";
  const partyLabel=type==="invoice"||type==="estimate"?"Bill To":type==="purchase-order"?"Vendor":type==="payroll-statement"?"Employee":"Payee";
  const amountLabel=type==="invoice"?"Amount Due":type==="estimate"?"Estimated Total":type==="purchase-order"?"Order Total":type==="payroll-statement"?"Gross Amount":"Expense Total";
  const showLineItems=["invoice","estimate","purchase-order"].includes(type);
  const lineTotal=showLineItems&&rate!=="" ? Math.max(0,Number(qty)||0)*Math.max(0,Number(rate)||0) : null;
  const displayAmount=lineTotal!==null&&Number.isFinite(lineTotal)?lineTotal:(amount!==""&&Number.isFinite(Number(amount))?Number(amount):0);
  return <section className="document-module">
    <div className="toolbar"><div><strong>Documents</strong><div className="muted">PRINTABLE BUSINESS DOCUMENTS</div></div></div>
    <div className="formgrid no-print">
      {sourceRows.length>0&&<label className="wide">Use saved {type==="invoice"?"invoice":type==="estimate"?"estimate":"expense"}<select value={sourceId} onChange={e=>loadSavedRecord(e.target.value)} disabled={sourceLoading}><option value="">Select a saved record…</option>{sourceRows.map(r=><option key={r.id} value={r.id}>{r.invoice_number||r.estimate_number||r.description||r.id} — {r.amount!=null?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(r.amount)||0):""}</option>)}</select></label>}
      <label>Document type<select value={type} onChange={e=>setType(e.target.value)}>{TYPES.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label>Document number<input value={number} onChange={e=>setNumber(e.target.value)}/></label>
      <label>{partyLabel}<input value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Street, city, state, ZIP"/></label>
      {showLineItems&&<><label className="wide">Service / Item<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description of work or service"/></label><label>Quantity<input type="number" min="0" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></label><label>Rate<input type="number" min="0" step="0.01" value={rate} onChange={e=>setRate(e.target.value)}/></label></>}
      <label>Amount<input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={showLineItems?"Fallback total":"0.00"}/></label>
      <label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label>Notes / Description<textarea rows="3" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      {error&&<div className="alert" role="alert">{error}</div>}
      {type==="payroll-statement"&&<div className="notice" role="status">Manual draft only. This document does not calculate or certify payroll taxes, deductions, or net pay. Do not use it as an official pay stub.</div>}
      <div className="formactions"><button className="primary" type="button" onClick={printDocument}>Print / Save PDF</button></div>
    </div>
    <article className="print-sheet">
      <header className="document-header">
        <img className="document-logo" src="/norvin-logo-web.jpg" alt="NORVIN GROUP LLC"/>
        <div className="document-title"><span>BUSINESS DOCUMENT</span><h2>{label}</h2></div>
      </header>
      <div className="document-meta">
        <div><small>DOCUMENT #</small><strong>{number||"—"}</strong></div>
        <div><small>DATE</small><strong>{date}</strong></div>
      </div>
      <div className="document-party"><small>{partyLabel.toUpperCase()}</small><strong>{name||"—"}</strong>{address&&<span>{address}</span>}</div>
      {showLineItems&&<div className="document-items"><div className="item-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div><div className="item-row"><strong>{description||"Service / project work"}</strong><span>{qty||"—"}</span><span>{rate!==""?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(rate)||0):"—"}</span><strong>{lineTotal!==null?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(lineTotal):"—"}</strong></div></div>}
      <div className="document-amount"><span>{amountLabel}</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(displayAmount)}</strong></div>
      {notes.trim()&&<div className="document-notes"><strong>Notes / Description</strong><p>{notes}</p></div>}
      {type==="payroll-statement"&&<div className="alert"><strong>UNVERIFIED PAYROLL DRAFT — NOT AN OFFICIAL PAY STUB</strong></div>}
      <footer><strong>NORVIN GROUP LLC</strong><span>SOLIDITY AND TRUST IN EVERY PROJECT</span><small>Generated by NORVIN GROUP LLC Financial System</small></footer>
    </article>
  </section>;
}
