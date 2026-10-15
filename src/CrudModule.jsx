import DocumentsModule from "./DocumentsModule.jsx";
import React, { useEffect, useState } from "react";

export default function CrudModule({ supabase, table, config, initialRows = [], loadError = "" }) {
  const empty = Object.fromEntries(config.fields.map(f => [f.key, f.type === "checkbox" ? false : ""]));
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [busy,setBusy]=useState(false);
  const [documentAction,setDocumentAction]=useState(null);
  const [clientOptions,setClientOptions]=useState([]);
  const [projectOptions,setProjectOptions]=useState([]);
  const [invoiceOptions,setInvoiceOptions]=useState([]);
  const [estimateItems,setEstimateItems]=useState([{description:"",quantity:1,price:""}]);
  const invoiceItemsTotal=estimateItems.reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.price)||0),0);
  const estimateTotal=estimateItems.reduce((sum,item)=>sum+(Number(item.quantity)||0)*(Number(item.price)||0),0);
  const updateItem=(index,key,value)=>setEstimateItems(items=>items.map((item,i)=>i===index?{...item,[key]:value}:item));
  useEffect(()=>{if(table!=="estimates"&&table!=="invoices")return;let active=true;Promise.all([supabase.from("clients").select("id,name,client_sequence").limit(500),supabase.from("projects").select("id,name,project_sequence,client_id").limit(500)]).then(([c,p])=>{if(active){setClientOptions(c.data||[]);setProjectOptions(p.data||[]);}});return()=>{active=false};},[supabase,table]);
  const isFinancialDocument=table==="invoices"||table==="estimates";
  const isClients=table==="clients";
  const isProjects=table==="projects";
  const isEstimates=table==="estimates";
  const isInvoices=table==="invoices";
  const isPayments=table==="payments";
  useEffect(()=>{if(!isPayments)return;let active=true;supabase.from("invoices").select("id,invoice_number,total,amount,status").limit(500).then(({data,error})=>{if(active){if(error)setMessage(error.message);else setInvoiceOptions(data||[]);}});return()=>{active=false};},[supabase,isPayments]);
  const invoicePaymentSummary=invoiceOptions.map(inv=>{const received=rows.filter(p=>String(p.invoice_id)===String(inv.id)).reduce((sum,p)=>sum+Number(p.amount||0),0);const total=Number(inv.total??inv.amount??0);return {...inv,received,total,balance:Math.max(0,total-received),paymentState:total>0&&received>=total-0.005?"Paid":received>0?"Partially Paid":"Pending Payment"};});
  const estimateLabel=(key,value)=>{const choices=key==="client_id"?clientOptions:projectOptions;const item=choices.find(x=>String(x.id)===String(value));return item?(key==="client_id"?"CLI-":"PRJ-")+String(key==="client_id"?item.client_sequence:item.project_sequence).padStart(5,"0")+" — "+item.name:(value||"");};
  const projectCode=row=>row.project_sequence!=null?"PRJ-"+String(row.project_sequence).padStart(5,"0"):"Pending assignment";
  const clientCode=row=>row.client_sequence!=null?"CLI-"+String(row.client_sequence).padStart(5,"0"):"Pending assignment";

  useEffect(() => setRows(initialRows), [initialRows]);
  const estimateValidity=(days)=>{const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+days);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;};
  function updateField(field,value){setForm(current=>{const next={...current,[field.key]:value};if((table==="estimates"||table==="invoices")&&field.key==="client_id")next.project_id="";if(table==="estimates"&&field.key==="service_type"){const days=field.options.find(o=>o.value===value)?.days;if(days)next.valid_until=estimateValidity(days);}return next;});}

  async function reload() {
    const { data, error } = await supabase.from(table).select("*").limit(100);
    if (error) throw error;
    setRows(data || []);
  }

  async function save(e) {
    e.preventDefault();
    setMessage("");
    if(busy)return;
    setBusy(true);
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
    if(isEstimates){if(!payload.client_id){setMessage("Select a registered client.");setBusy(false);return;}if(!estimateItems.some(item=>item.description.trim()&&Number(item.quantity)>0&&Number(item.price)>=0&&item.price!=="")){setMessage("Add at least one service with description, quantity and price.");setBusy(false);return;}payload.line_items=estimateItems.filter(item=>item.description.trim()).map(item=>({description:item.description.trim(),quantity:Number(item.quantity),price:Number(item.price)}));payload.amount=estimateTotal;delete payload.estimate_number;delete payload.project_id;if(form.project_id)payload.project_id=form.project_id;else payload.project_id=null;}
    if(isInvoices&&!editingId&&!payload.invoice_number){
      const year=new Date().getFullYear();
      const highest=rows.reduce((max,row)=>{const match=String(row.invoice_number||"").match(new RegExp("^INV-"+year+"-([0-9]+)$"));return match?Math.max(max,Number(match[1])):max;},0);
      payload.invoice_number="INV-"+year+"-"+String(highest+1).padStart(5,"0");
    }
    if(isInvoices&&payload.status==="Paid"&&(!editingId||String(rows.find(r=>r.id===editingId)?.status||"").toLowerCase()!=="paid")){setMessage("Save the invoice first, then use its status selector to confirm receipt of payment.");setBusy(false);return;}\n    if(isInvoices){if(!payload.client_id){setMessage("Select a registered client.");setBusy(false);return;}payload.line_items=estimateItems.filter(item=>item.description.trim()).map(item=>({description:item.description.trim(),quantity:Number(item.quantity),price:Number(item.price)}));if(payload.line_items.length){payload.amount=invoiceItemsTotal;}payload.total=Number(payload.amount)||0;payload.project_id=payload.project_id||null;}
    for(const field of config.fields){
      if(field.type==="number" && payload[field.key]!==undefined){
        const value=Number(payload[field.key]);
        if(!Number.isFinite(value)|| (field.min!==undefined&&value<field.min)){setMessage(`Invalid value for ${field.label}.`);setBusy(false);return;}
        payload[field.key]=value;
      }
    }
    try {
    if (!editingId) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user?.id) throw new Error("Authentication required to save records.");
      payload.user_id = authData.user.id;
    }
    const query = editingId
      ? supabase.from(table).update(payload).eq("id", editingId)
      : supabase.from(table).insert(payload);
    const { error } = await query;
    if (error) throw error;
    await reload();
    setForm(empty);
    if(isEstimates||isInvoices)setEstimateItems([{description:"",quantity:1,price:""}]);
    setEditingId(null);
    setMessage(editingId ? "Record updated." : "Record created.");
    } catch(err){setMessage(err.message||"Unable to save record.");}
    finally{setBusy(false);}
  }

  function edit(row) {
    setEditingId(row.id);
    if(isInvoices)setEstimateItems(Array.isArray(row.line_items)&&row.line_items.length?row.line_items:[{description:"",quantity:1,price:""}]);
    if(isEstimates)setEstimateItems(Array.isArray(row.line_items)&&row.line_items.length?row.line_items:[{description:row.description||"",quantity:1,price:row.amount??""}]);
    setForm(Object.fromEntries(config.fields.map(f => [f.key, f.type === "checkbox" ? Boolean(row[f.key]) : (row[f.key] ?? "")])));
  }

  async function changeProjectStatus(row, status) {
    if (busy || status === row.status) return;
    setMessage("");
    setBusy(true);
    try {
      const { data, error } = await supabase.from("projects").update({ status }).eq("id", row.id).select("id,status").single();
      if (error) throw error;
      if (!data || data.status !== status) throw new Error("Project status could not be confirmed as saved.");
      setRows(current => current.map(item => item.id === row.id ? { ...item, status: data.status } : item));
      setMessage("Project status updated.");
    } catch (err) {
      setMessage(err.message || "Unable to update project status.");
    } finally {
      setBusy(false);
    }
  }

  async function changeInvoiceStatus(row, status) {
    if (busy || status === row.status) return;
    setMessage("");
    setBusy(true);
    try {
      if(status==="Paid"){
        const q=await supabase.from("payments").select("amount").eq("invoice_id",row.id);
        if(q.error)throw q.error;
        const paid=(q.data||[]).reduce((sum,p)=>sum+Number(p.amount||0),0);
        const remaining=Math.max(0,Number(row.total??row.amount??0)-paid);
        if(remaining>0&&!window.confirm(`Confirm payment actually received for ${row.invoice_number}?\n\nAmount to register: ${remaining.toFixed(2)}\n\nThis will create a payment record automatically.`))return;
        const result=await supabase.rpc("confirm_invoice_paid",{p_invoice_id:row.id,p_method:"Not specified"});
        if(result.error)throw result.error;
        await reload();
        setMessage(`Invoice ${row.invoice_number} marked Paid. Payment recorded: ${Number(result.data?.[0]?.payment_recorded||0).toFixed(2)}. Open Payments to review.`);
        return;
      }
      const status_date = new Date().toISOString().slice(0,10);
      const { data, error } = await supabase.from("invoices").update({status,status_date}).eq("id",row.id).select("id,status,status_date").single();
      if (error) throw error;
      if (!data || data.status !== status) throw new Error("Invoice status could not be confirmed.");
      setRows(current=>current.map(item=>item.id===row.id?{...item,status:data.status,status_date:data.status_date}:item));
      setMessage("Invoice payment stamp updated. Open the invoice to review.");
    } catch(err) {
      setMessage(err.message||"Unable to update invoice status.");
    } finally {setBusy(false);}
  }

  async function remove(id) {
    const row=rows.find(r=>String(r.id)===String(id));
    const ref=row?.invoice_number||row?.estimate_number||String(id);
    if (!window.confirm(`Permanently delete ${ref}? This cannot be undone. Linked payments or other records may prevent deletion.`)) return;
    if(busy)return;
    setBusy(true);
    let deletion;
    try{deletion=await supabase.from(table).delete().eq("id", id);}catch(e){setMessage(e.message);setBusy(false);return;}
    const { error } = deletion;
    setBusy(false);
    if (error) return setMessage(error.message);
    setRows(current => current.filter(row => row.id !== id));
    setMessage("Record deleted.");
  }

  if(documentAction&&isFinancialDocument)return <DocumentsModule supabase={supabase} key={String(documentAction.id)} initialType={table==="invoices"?"invoice":"estimate"} initialRecordId={documentAction.id} autoPrint={documentAction.print} initialEmailMode={Boolean(documentAction.email)} onClose={()=>setDocumentAction(null)}/>;

  return <section>
    <div className="toolbar"><div><strong>{config.title}</strong><div className="muted">{rows.length} RECORDS{isClients&&" · Automatic client numbering"}</div></div></div>
    <form className="formgrid" onSubmit={save}>
      {isInvoices&&<label>Invoice number<input readOnly value={editingId?(rows.find(r=>r.id===editingId)?.invoice_number||""):"Automatically assigned on save"}/></label>}
      {isEstimates&&<label>Estimate number<input readOnly value={editingId?(rows.find(r=>r.id===editingId)?.estimate_number||""):"Automatically assigned on save"} /></label>}
      {config.fields.filter(field=>!((isEstimates&&["estimate_number","amount"].includes(field.key))||(isInvoices&&field.key==="invoice_number"))).map(field => <label key={field.key}>{field.label}
        {isPayments&&field.key==="invoice_id"?<select value={form.invoice_id||""} onChange={e=>updateField(field,e.target.value)} required><option value="">Select invoice…</option>{invoiceOptions.map(inv=><option key={inv.id} value={inv.id}>{inv.invoice_number} — ${Number(inv.total??inv.amount??0).toFixed(2)}</option>)}</select>:isInvoices&&field.key==="amount"&&estimateItems.some(item=>item.description.trim()&&item.price!=="")?<input type="number" readOnly aria-label="Automatically calculated invoice total" value={invoiceItemsTotal.toFixed(2)}/>:((isEstimates||isInvoices)&&(field.key==="client_id"||field.key==="project_id"))?<select value={form[field.key]} onChange={e=>updateField(field,e.target.value)}><option value="">{field.key==="client_id"?"Select registered client…":"N/A — No linked project"}</option>{(field.key==="client_id"?clientOptions:projectOptions.filter(p=>!form.client_id||!p.client_id||String(p.client_id)===String(form.client_id))).map(item=><option key={item.id} value={item.id}>{estimateLabel(field.key,item.id)}</option>)}</select>:field.type==="select"?<select value={form[field.key]} required={field.required} onChange={e=>updateField(field,e.target.value)}><option value="">Select status…</option>{field.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:<input type={field.type || "text"} required={field.required} min={field.min} step={field.step} {...(field.type === "checkbox" ? {checked:Boolean(form[field.key]),onChange:e=>setForm(v=>({...v,[field.key]:e.target.checked}))} : {value:form[field.key],onChange:e=>setForm(v=>({...v,[field.key]:e.target.value}))})}/>}
      </label>)}
      {(isEstimates||isInvoices)&&<div className="wide"><strong>Services and pricing</strong><div className="muted">Describe each service. The total is calculated automatically.</div>{estimateItems.map((item,index)=><div key={index} className="formgrid"><label className="wide">Service description<textarea rows={2} value={item.description} onChange={e=>updateItem(index,"description",e.target.value)} placeholder="Describe the work to be performed"/></label><label>Quantity<input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e=>updateItem(index,"quantity",e.target.value)}/></label><label>Unit price ($)<input type="number" min="0" step="0.01" value={item.price} onChange={e=>updateItem(index,"price",e.target.value)}/></label><label>Line total<input readOnly value={((Number(item.quantity)||0)*(Number(item.price)||0)).toFixed(2)}/></label><button type="button" disabled={estimateItems.length===1} onClick={()=>setEstimateItems(items=>items.filter((_,i)=>i!==index))}>Remove line</button></div>)}<button type="button" onClick={()=>setEstimateItems(items=>[...items,{description:"",quantity:1,price:""}])}>+ Add service</button><p><strong>{isInvoices?"Invoice subtotal":"Estimated total"}: ${(isInvoices?invoiceItemsTotal:estimateTotal).toFixed(2)}</strong></p></div>}
      <div className="formactions"><button className="primary" disabled={busy}>{busy?"Saving…":editingId ? "Update" : "Add"}</button>
        {editingId && <button type="button" onClick={() => {setEditingId(null);setForm(empty)}}>Cancel</button>}
      </div>
    </form>
    {isPayments&&<div className="wide" style={{margin:"14px 0 20px"}}><strong>Invoice Payment Status</strong><p className="muted">All registered invoices appear here, including unpaid invoices. Pending balances are not counted as received payments.</p><div className="tablewrap"><table><thead><tr><th>Invoice</th><th>Invoice Total</th><th>Payments Received</th><th>Balance Due</th><th>Status</th></tr></thead><tbody>{invoicePaymentSummary.map(inv=><tr key={inv.id}><td>{inv.invoice_number}</td><td>${inv.total.toFixed(2)}</td><td>${inv.received.toFixed(2)}</td><td>${inv.balance.toFixed(2)}</td><td><strong>{inv.paymentState}</strong></td></tr>)}</tbody></table></div></div>}
    {message && <div className="notice">{message}</div>}
    {loadError ? <div className="alert">{loadError}</div> : <div className="tablewrap">
      {!rows.length ? <div className="empty">No records found.</div> : <table><thead><tr>
        {isClients&&<th>Client #</th>}{isProjects&&<th>Project #</th>}{config.fields.map(f => <th key={f.key}>{f.label}</th>)}<th>Actions</th>
      </tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        {isClients&&<td><strong>{clientCode(row)}</strong></td>}{isProjects&&<td><strong>{projectCode(row)}</strong></td>}{config.fields.map(f => <td key={f.key}>{isInvoices&&f.key==="status"?<select aria-label={"Payment status for "+(row.invoice_number||row.id)} value={String(row.status||"").toLowerCase()==="paid"?"Paid":"Pending Payment"} disabled={busy} onChange={e=>changeInvoiceStatus(row,e.target.value)}><option value="Pending Payment">Pending Payment</option><option value="Paid">Paid</option></select>:isProjects&&f.key==="status"?<select aria-label={`Status for ${projectCode(row)}`} value={row.status||""} disabled={busy} onChange={e=>changeProjectStatus(row,e.target.value)}><option value="" disabled>Select status…</option>{f.options.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:(isEstimates||isInvoices)&&(f.key==="client_id"||f.key==="project_id")?estimateLabel(f.key,row[f.key]):f.type==="select"?(f.options.find(option=>option.value===row[f.key])?.label||String(row[f.key]??"")):String(row[f.key] ?? "")}</td>)}
        <td>{isFinancialDocument&&<><button type="button" onClick={()=>setDocumentAction({id:row.id,print:false})}>View</button> <button type="button" onClick={()=>setDocumentAction({id:row.id,print:true})}>Print</button> </>}{isFinancialDocument&&<button type="button" onClick={()=>setDocumentAction({id:row.id,print:false,email:true})}>Send Email</button>}<button type="button" disabled={busy} onClick={() => edit(row)}>Edit</button> <button type="button" disabled={busy} onClick={() => remove(row.id)}>Delete</button></td>
      </tr>)}</tbody></table>}
    </div>}
  </section>;
}
