import React from "react";
import html2pdf from "html2pdf.js";

const TYPES = [
  ["estimate","Estimate"],
  ["invoice","Invoice"],
  ["purchase-order","Purchase Order"],
  ["payroll-statement","Payroll Statement (Manual Draft)"],
  ["expense-report","Expense Report"]
];

export default function DocumentsModule({supabase,initialType="estimate",initialRecordId=null,onClose=null,autoPrint=false,initialEmailMode=false}){
  const [type,setType]=React.useState(initialType);
  const [number,setNumber]=React.useState("");
  const [name,setName]=React.useState("");
  const [amount,setAmount]=React.useState("");
  const [date,setDate]=React.useState(new Date().toISOString().slice(0,10));
  const [issueDate,setIssueDate]=React.useState(new Date().toISOString().slice(0,10));
  const [paymentInstructions,setPaymentInstructions]=React.useState("");
  const [notes,setNotes]=React.useState("");
  const [paymentStatus,setPaymentStatus]=React.useState("pending");
  const [contact,setContact]=React.useState("");
  const [terms,setTerms]=React.useState("Payment terms and project conditions as agreed in writing.");
  const [reference,setReference]=React.useState("");
  const [status,setStatus]=React.useState("Draft");
  const [address,setAddress]=React.useState("");
  const [description,setDescription]=React.useState("");
  const [qty,setQty]=React.useState("1");
  const [rate,setRate]=React.useState("");
  const [items,setItems]=React.useState([]);
  const [taxRate,setTaxRate]=React.useState("0");
  const [error,setError]=React.useState("");
  const [sourceRows,setSourceRows]=React.useState([]);
  const [clients,setClients]=React.useState([]);
  const [sourceId,setSourceId]=React.useState("");
  const [sourceLoading,setSourceLoading]=React.useState(false);
  const [payments,setPayments]=React.useState([]);
  const [projects,setProjects]=React.useState([]);
  const [saving,setSaving]=React.useState(false);
  const [emailOpen,setEmailOpen]=React.useState(initialEmailMode);
  const [emailTo,setEmailTo]=React.useState("");
  const [emailSending,setEmailSending]=React.useState(false);
  const [savedMessage,setSavedMessage]=React.useState("");
  React.useEffect(()=>{
    let active=true;
    async function load(){
      if(!supabase)return;
      setSourceLoading(true); setSourceId("");
      const table=type==="invoice"?"invoices":type==="estimate"?"estimates":type==="expense-report"?"expenses":null;
      try{
        const clientReq=supabase.from("clients").select("*").limit(200);
        const projectReq=supabase.from("projects").select("*").limit(200);
        const sourceReq=table?supabase.from(table).select("*").limit(200):Promise.resolve({data:[],error:null});
        const paymentReq=type==="invoice"?supabase.from("payments").select("*").limit(500):Promise.resolve({data:[],error:null});
        const [cr,jr,sr,pr]=await Promise.all([clientReq,projectReq,sourceReq,paymentReq]);
        if(!active)return;
        if(cr.error)throw cr.error;if(sr.error)throw sr.error;if(pr.error)throw pr.error;
        setClients(cr.data||[]);setProjects(jr.data||[]);setSourceRows(sr.data||[]);setPayments(pr.data||[]);
        if(initialRecordId){const rec=(sr.data||[]).find(x=>String(x.id)===String(initialRecordId));if(rec){const client=(cr.data||[]).find(x=>String(x.id)===String(rec.client_id));setSourceId(String(rec.id));setNumber(rec.invoice_number||rec.estimate_number||"");setName(client?.name||"");setAddress(client?.address||"");setAmount(rec.amount??rec.total??"");setIssueDate(String(rec.issue_date||rec.created_at||new Date().toISOString().slice(0,10)).slice(0,10));setPaymentInstructions(rec.payment_instructions||"");setTerms(rec.terms||"");setTaxRate(String(rec.tax_rate??0));setDate(String(rec.due_date||rec.valid_until||new Date().toISOString().slice(0,10)).slice(0,10));setDescription(rec.description||rec.notes||"");setNotes(rec.notes||"");setItems(Array.isArray(rec.line_items)?rec.line_items.map(item=>({description:item.description,qty:Number(item.quantity??item.qty)||1,rate:Number(item.price??item.rate)||0})):[]);setRate("");setStatus(rec.status||"Draft");setReference((jr.data||[]).find(p=>p.id===rec.project_id)?.name||"N/A");if(autoPrint)window.setTimeout(()=>window.print(),350);}}
      }catch(e){if(active)setError(e.message||"Unable to load saved records.");}
      finally{if(active)setSourceLoading(false);}
    } load(); return()=>{active=false};
  },[supabase,type,initialRecordId,autoPrint]);
  function loadSavedRecord(id){
    setSourceId(id); if(!id)return;
    const r=sourceRows.find(x=>String(x.id)===String(id)); if(!r)return;
    const client=clients.find(x=>String(x.id)===String(r.client_id));
    const project=projects.find(x=>String(x.id)===String(r.project_id));
    if(type==="invoice"){setPaymentStatus(String(r.status||"").toLowerCase().includes("cancel")?"cancelled":"pending");setNumber(r.invoice_number||"");setName(client?.name||"");setAddress(client?.address||"");setAmount(r.amount??r.total??"");setIssueDate((r.issue_date||r.created_at||new Date().toISOString().slice(0,10)).slice(0,10));setTaxRate(String(r.tax_rate??0));setTerms(r.terms||"");setPaymentInstructions(r.payment_instructions||"");setItems(Array.isArray(r.line_items)?r.line_items.map(item=>({description:item.description,qty:Number(item.quantity)||1,rate:Number(item.price)||0})):[]);setDate((r.due_date||new Date().toISOString().slice(0,10)).slice(0,10));setDescription(r.description||r.notes||project?.name||"");setRate("");setQty("1");setNotes(r.notes||"");}
    if(type==="estimate"){setNumber(r.estimate_number||"");setName(client?.name||"");setAddress(client?.address||"");setAmount(r.amount??"");setDate((r.valid_until||new Date().toISOString().slice(0,10)).slice(0,10));setDescription("");setItems(Array.isArray(r.line_items)?r.line_items.map(item=>({description:item.description,qty:Number(item.quantity)||1,rate:Number(item.price)||0})):[]);setRate("");setQty("1");setNotes(r.notes||"");setStatus(r.status||"Draft");setReference(project?.name||"N/A");}
    if(type==="expense-report"){setNumber(r.expense_number||String(r.id).slice(0,8));setName(r.vendor||"");setAmount(r.amount??"");setDate((r.expense_date||new Date().toISOString().slice(0,10)).slice(0,10));setDescription(r.description||"");}
  }
  const prefixes={"invoice":"INV","estimate":"EST","purchase-order":"PO","payroll-statement":"PAY","expense-report":"EXP"};
  const prefix=prefixes[type];
  const year=new Date().getFullYear();
  const field=type==="invoice"?"invoice_number":type==="estimate"?"estimate_number":"expense_number";
  const highest=sourceRows.reduce((max,row)=>{const match=String(row[field]||"").match(new RegExp("^"+prefix+"-"+year+"-(\\d+)$"));return match?Math.max(max,Number(match[1])):max;},0);
  const generatedNumber=prefix+"-"+year+"-"+String(highest+1).padStart(5,"0");
  const documentNumber=sourceId?number:generatedNumber;
  const selectedSource=sourceRows.find(x=>String(x.id)===String(sourceId));
  const showLineItems=["invoice","estimate","purchase-order"].includes(type);
  const currentLine=showLineItems&&rate!=="" ? Math.max(0,Number(qty)||0)*Math.max(0,Number(rate)||0) : null;
  const lineTotal=items.length ? items.reduce((sum,item)=>sum+item.qty*item.rate,0)+(currentLine||0) : currentLine;
  const salesTax=showLineItems&&lineTotal!==null?lineTotal*Math.max(0,Number(taxRate)||0)/100:0;
  const displayAmount=lineTotal!==null&&Number.isFinite(lineTotal)?lineTotal+salesTax:(amount!==""&&Number.isFinite(Number(amount))?Number(amount):0);
  const invoicePayments=type==="invoice"&&selectedSource?payments.filter(p=>String(p.invoice_id)===String(selectedSource.id)): [];
  const paidTotal=invoicePayments.reduce((s,p)=>s+(Number(p.amount)||0),0);
  const balanceDue=Math.max(0,displayAmount-paidTotal);
  const resolvedPaymentStatus=type==="invoice"&&selectedSource?(String(selectedSource.status||"").toLowerCase().includes("cancel")?"cancelled":displayAmount>0&&paidTotal>=displayAmount-0.005?"paid":paidTotal>0?"partial":"pending"):"pending";
  const validAmount=amount!==""&&Number.isFinite(Number(amount))&&Number(amount)>=0;
  async function saveDocument(){
    if(!supabase)return;
    const calculatedOk=showLineItems&&(items.length>0||(rate!==""&&Number.isFinite(Number(rate))&&Number(rate)>=0&&Number(qty)>0));
    if(!documentNumber.trim()||!name.trim()||!date||(!validAmount&&!calculatedOk)){setError("Enter a document number, recipient, valid date and amount.");return;}
    const table=type==="invoice"?"invoices":type==="estimate"?"estimates":type==="expense-report"?"expenses":null;
    if(!table){setError("Saving this document type will be enabled with its dedicated register.");return;}
    setSaving(true);setError("");setSavedMessage("");
    try{
      let payload={amount:displayAmount};
      if(type==="invoice")payload={...payload,invoice_number:documentNumber,issue_date:issueDate,due_date:date,description,notes,terms,payment_instructions:paymentInstructions,tax_rate:Number(taxRate)||0,line_items:[...items,...(description.trim()&&currentLine!==null?[{description,qty:Number(qty),rate:Number(rate)}]:[])].map(item=>({description:item.description,quantity:item.qty,price:item.rate})),total:displayAmount};
      if(type==="estimate")payload={...payload,estimate_number:documentNumber,valid_until:date,description,notes};
      if(type==="expense-report")payload={...payload,expense_date:date,vendor:name,description:description||notes};
      if(!sourceId){
        const {data:authData,error:authError}=await supabase.auth.getUser();
        if(authError||!authData?.user?.id)throw new Error("Sign in before saving a document.");
        payload.user_id=authData.user.id;
        if(type==="invoice"){
          const matchingClient=clients.find(c=>c.name?.trim().toLowerCase()===name.trim().toLowerCase());
          if(!matchingClient)throw new Error("Choose a registered client before saving an invoice.");
          payload.client_id=matchingClient.id;
          const matchingProject=projects.find(p=>p.name?.trim().toLowerCase()===reference.trim().toLowerCase());
          if(matchingProject)payload.project_id=matchingProject.id;
        }
      }
      const existing=sourceId?sourceRows.find(x=>String(x.id)===String(sourceId)):null;
      const res=existing?await supabase.from(table).update(payload).eq("id",existing.id).select().single():await supabase.from(table).insert(payload).select().single();
      if(res.error)throw res.error;
      setSourceId(String(res.data.id));setSourceRows(rows=>existing?rows.map(x=>String(x.id)===String(existing.id)?res.data:x):[res.data,...rows]);
      setSavedMessage(label+" registered successfully. You can reopen it later.");
    }catch(e){setError(e.message||"Unable to register document.");}finally{setSaving(false);}
  }
  async function attachInvoiceEmail(){
    if(type!=="invoice")return;
    if(!sourceId){setError("Save the invoice before sending it.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim())){setError("Enter a valid email address.");return;}
    setEmailSending(true);setError("");setSavedMessage("");
    try{
      const sheet=document.querySelector(".norvin-premium-invoice");
      if(!sheet)throw new Error("Invoice preview unavailable.");
      const blob=await html2pdf().set({margin:0,filename:(documentNumber||"invoice")+".pdf",html2canvas:{scale:2,useCORS:true},jsPDF:{unit:"in",format:"letter",orientation:"portrait"}}).from(sheet).outputPdf("blob");
      const bytes=new Uint8Array(await blob.arrayBuffer());
      let binary="";
      for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      const pdf_base64=btoa(binary);
      const {data,error:sendError}=await supabase.functions.invoke("send-invoice-email",{
        body:{invoice_id:String(sourceId),to:emailTo.trim(),pdf_base64}
      });
      if(sendError){
        let serverMessage=data?.error;
        if(!serverMessage&&sendError.context?.json){try{const details=await sendError.context.json();serverMessage=details?.error||details?.message;}catch{}}
        throw new Error(serverMessage||sendError.message||"Email delivery failed.");
      }
      if(!data?.sent)throw new Error(data?.error||"The email service did not confirm the send.");
      setSavedMessage("Invoice sent successfully to "+emailTo.trim()+".");

    }catch(e){if(e?.name!=="AbortError")setError(e.message||"Unable to send invoice. Check email service configuration.");}
    finally{setEmailSending(false);}
  }
  function printDocument(){
    // Printing a draft must not depend on database registration or required fields.
    setError("");
    window.requestAnimationFrame(()=>window.print());
  }
  const label=TYPES.find(([key])=>key===type)?.[1] || "Document";
  const partyLabel=type==="invoice"||type==="estimate"?"Bill To":type==="purchase-order"?"Vendor":type==="payroll-statement"?"Employee":"Payee";
  const amountLabel=type==="invoice"?"Amount Due":type==="estimate"?"Estimated Total":type==="purchase-order"?"Order Total":type==="payroll-statement"?"Gross Amount":"Expense Total";
  return <section className="document-module">
    {onClose&&<div className="no-print"><button type="button" onClick={onClose}>← Back to records</button></div>}
    <div className="toolbar"><div><strong>Documents</strong><div className="muted">Document management and printing</div></div></div>
    {!onClose&&<div className="formgrid no-print">
      {sourceRows.length>0&&<label className="wide">Use saved {type==="invoice"?"invoice":type==="estimate"?"estimate":"expense"}<select value={sourceId} onChange={e=>loadSavedRecord(e.target.value)} disabled={sourceLoading}><option value="">Select a saved record…</option>{sourceRows.map(r=><option key={r.id} value={r.id}>{r.invoice_number||r.estimate_number||r.description||r.id} — {r.amount!=null?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(r.amount)||0):""}</option>)}</select></label>}
      <label>Document type<select value={type} onChange={e=>setType(e.target.value)}>{TYPES.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
      <label>Document number<input value={documentNumber} readOnly title="System-generated reference"/></label>
      <label>{partyLabel}<input value={name} onChange={e=>setName(e.target.value)}/></label>
      <label>Address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Street, city, state, ZIP"/></label>
      {showLineItems&&<><label className="wide">Service / Item<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description of work or service"/></label><label>Quantity<input type="number" min="0" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></label><label>Rate<input type="number" min="0" step="0.01" value={rate} onChange={e=>setRate(e.target.value)}/></label></>}
      {showLineItems&&<><label>Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e=>setTaxRate(e.target.value)}/></label><div className="wide"><button type="button" onClick={()=>{if(!description.trim()||!(Number(qty)>0)||rate===""||!(Number(rate)>=0)){setError("Enter a description, quantity and rate first.");return;}setItems(v=>[...v,{description:description.trim(),qty:Number(qty),rate:Number(rate)}]);setDescription("");setQty("1");setRate("");setError("");}}>+ Add line item</button>{items.length>0&&<div className="document-line-editor">{items.map((item,i)=><div key={i}><span>{item.description} · {item.qty} × {item.rate.toFixed(2)}</span><button type="button" onClick={()=>setItems(v=>v.filter((_,j)=>i!==j))}>Remove</button></div>)}</div>}</div></>}
      <label>Amount<input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={showLineItems?"Fallback total":"0.00"}/></label>
      {type==="invoice"&&<label>Issue date<input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)}/></label>}
      <label>{type==="invoice"?"Due date":"Date"}<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label>Reference / Project<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Project or work order reference"/></label>
      <label>Document status<select value={status} onChange={e=>setStatus(e.target.value)}><option>Draft</option><option>Issued</option><option>Approved</option><option>Paid</option></select></label>
      <label className="wide">Terms / Conditions<textarea rows="2" value={terms} onChange={e=>setTerms(e.target.value)}/></label>
      {type==="invoice"&&<div className="notice wide">Payment status: {resolvedPaymentStatus==="paid"?"PAID":resolvedPaymentStatus==="partial"?"PARTIALLY PAID":resolvedPaymentStatus==="cancelled"?"CANCELLED":"PENDING PAYMENT"}. {selectedSource?"Calculated from registered invoice payments.":"Register the invoice and its payments to update this status automatically."}</div>}
      <label>Project / Reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Project or purchase reference"/></label>
      {type==="invoice"&&<label className="wide">Payment instructions (verified company details only)<textarea rows="2" value={paymentInstructions} onChange={e=>setPaymentInstructions(e.target.value)} placeholder="Enter verified payment instructions; no sample bank account is printed"/></label>}
      <label>Business contact<input value={contact} onChange={e=>setContact(e.target.value)} placeholder="Company phone or email"/></label>
      <label className="wide">Terms / Instructions<textarea rows="2" value={terms} onChange={e=>setTerms(e.target.value)}/></label>
      <label>Notes / Description<textarea rows="3" value={notes} onChange={e=>setNotes(e.target.value)}/></label>
      {showLineItems&&<div className="calculated-total"><span>Total Amount</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(displayAmount)}</strong></div>}
      {savedMessage&&<div className="notice" role="status">{savedMessage}</div>}
      {error&&<div className="alert" role="alert">{error}</div>}
      {type==="payroll-statement"&&<div className="notice" role="status">Manual draft only. This document does not calculate or certify payroll taxes, deductions, or net pay. Do not use it as an official pay stub.</div>}
      <div className="formactions"><button type="button" onClick={saveDocument} disabled={saving}>{saving?"Saving…":sourceId?"Update Record":"Save / Register"}</button><button className="primary" type="button" onClick={printDocument}>Print / Save PDF</button></div>
    </div>}
    {onClose&&<div className="formactions no-print"><button className="primary" type="button" onClick={printDocument}>Print / Save PDF</button>{type==="invoice"&&<button type="button" onClick={()=>setEmailOpen(v=>!v)}>Email Invoice</button>}</div>}
    {type==="invoice"&&emailOpen&&<div className="no-print npi-email-form"><label>Recipient email<input type="email" value={emailTo} onChange={e=>setEmailTo(e.target.value)} placeholder="customer@example.com" autoComplete="email"/></label><button type="button" disabled={emailSending} onClick={attachInvoiceEmail}>{emailSending?"Sending…":"Send"}</button><p>The PDF invoice will be sent to the entered email address when you click Send.</p></div>}
    {savedMessage&&onClose&&<div className="notice no-print" role="status">{savedMessage}</div>}
    {error&&onClose&&<div className="alert no-print" role="alert">{error}</div>}
    <article className={`print-sheet ${type==="estimate"?"norvin-premium-estimate":type==="invoice"?"norvin-premium-invoice":""}`}>
      <header className="document-header">
        <img className="document-logo" src="/norvin-logo-web.jpg" alt="NORVIN GROUP LLC"/>
        <div className="document-title"><h2>{label}</h2>{type==="estimate"&&<small className="estimate-sector-line">RESIDENTIAL  |  COMMERCIAL  |  INDUSTRIAL</small>}</div>
      </header>
      {false&&type==="invoice"&&<div className={"invoice-stamp stamp-"+resolvedPaymentStatus} aria-label={"Invoice status: "+resolvedPaymentStatus}>{resolvedPaymentStatus==="paid"?"PAID":resolvedPaymentStatus==="partial"?"PARTIALLY PAID":resolvedPaymentStatus==="cancelled"?"CANCELLED":"PENDING PAYMENT"}</div>}
      <div className="document-meta">
        <div><small>DOCUMENT #</small><strong>{documentNumber||"—"}</strong></div>
        <div><small>{type==="invoice"?"ISSUED":"DATE"}</small><strong>{type==="invoice"?issueDate:date}</strong></div>
        {type==="invoice"&&<div><small>DUE DATE</small><strong>{date}</strong></div>}
        
      </div>
      {reference&&<div className="document-reference"><small>PROJECT / REFERENCE</small><strong>{reference}</strong></div>}
      <div className="document-party"><small>{partyLabel.toUpperCase()}</small><strong>{name||"—"}</strong>{address&&<span>{address}</span>}</div>
      {showLineItems&&<div className="document-items"><div className="item-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div>{[...items,...(description.trim()&&currentLine!==null?[{description,qty:Number(qty),rate:Number(rate)}]:[])].map((item,i)=><div className="item-row" key={i}><strong>{item.description}</strong><span>{item.qty}</span><span>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(item.rate)}</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(item.qty*item.rate)}</strong></div>)}{items.length===0&&currentLine===null&&<div className="item-row"><strong>{description||"Service / project work"}</strong><span>—</span><span>—</span><strong>—</strong></div>}</div>}
      {showLineItems&&lineTotal!==null&&<div className="document-totals"><div><span>Subtotal</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(lineTotal)}</strong></div><div><span>Tax ({taxRate||0}%)</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(salesTax)}</strong></div></div>}
      {type==="invoice"&&<div className="invoice-summary-line"><span>Payments received</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(paidTotal)}</strong></div>}
      <div className="document-amount"><span>{type==="invoice"?"BALANCE DUE":amountLabel}</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(type==="invoice"?balanceDue:displayAmount)}</strong></div>
      {false&&type==="invoice"&&sourceId&&<div className="invoice-balance"><div><span>Payments Received</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(paidTotal)}</strong></div><div><span>Balance Due</span><strong>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(balanceDue)}</strong></div></div>}
      {notes.trim()&&<div className="document-notes"><strong>Notes / Description</strong><p>{notes}</p></div>}
      {type==="invoice"&&paymentInstructions.trim()&&<div className="document-terms"><strong>PAYMENT INFORMATION</strong><p>{paymentInstructions}</p></div>}
      {terms.trim()&&<div className="document-terms"><strong>TERMS & CONDITIONS</strong><p>{terms}</p></div>}
      {(type==="estimate"||type==="invoice")?<div className="estimate-approval-block"><div className="estimate-approval-signature"><strong>AUTHORIZED SIGNATURE</strong><div className="estimate-signature-line"></div><span>Authorized Representative</span><small>DATE: {date}</small></div><div className="estimate-approval-seal"><img src="/norvin-company-stamp.svg" alt="NORVIN GROUP LLC company seal"/></div></div>:<><div className="document-signatures"><div><span>AUTHORIZED BY</span><i></i><small>Signature / Date</small></div><div><span>ACKNOWLEDGED BY</span><i></i><small>Signature / Date</small></div></div><div className="document-authentication"><img className="corporate-seal-image" src="/norvin-company-stamp.svg" alt="NORVIN GROUP LLC company seal"/></div></>}
      <footer><strong>NORVIN GROUP LLC</strong><span>SOLIDITY AND TRUST IN EVERY PROJECT</span><small>{contact||"Generated by NORVIN GROUP LLC Financial System"}</small></footer>
    </article>
  </section>;
}
