import React,{useEffect,useState} from "react";
export default function EmployeePayrollProfile({supabase,onSelect}){
 const [employees,setEmployees]=useState([]),[id,setId]=useState(""),[error,setError]=useState("");
 useEffect(()=>{let live=true;supabase.from("employees").select("*").order("last_name").then(({data,error})=>{if(!live)return;if(error)setError(error.message);else setEmployees(data||[])});return()=>{live=false}},[supabase]);
 function choose(value){setId(value);const e=employees.find(x=>x.id===value)||null;onSelect(e)}
 return <div className="formgrid"><label>Employee<select value={id} onChange={e=>choose(e.target.value)}><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}</select></label>{error&&<div className="alert">{error}</div>}</div>;
}
