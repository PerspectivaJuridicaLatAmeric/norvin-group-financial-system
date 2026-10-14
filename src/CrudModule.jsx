import React, { useEffect, useState } from "react";

export default function CrudModule({ supabase, table, config, initialRows = [], loadError = "" }) {
  const empty = Object.fromEntries(config.fields.map(f => [f.key, ""]));
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => setRows(initialRows), [initialRows]);

  async function reload() {
    const { data, error } = await supabase.from(table).select("*").limit(100);
    if (error) throw error;
    setRows(data || []);
  }

  async function save(e) {
    e.preventDefault();
    setMessage("");
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
    const query = editingId
      ? supabase.from(table).update(payload).eq("id", editingId)
      : supabase.from(table).insert(payload);
    const { error } = await query;
    if (error) return setMessage(error.message);
    try {
      await reload();
      setForm(empty);
      setEditingId(null);
      setMessage(editingId ? "Record updated." : "Record created.");
    } catch (err) { setMessage(err.message); }
  }

  function edit(row) {
    setEditingId(row.id);
    setForm(Object.fromEntries(config.fields.map(f => [f.key, row[f.key] ?? ""])));
  }

  async function remove(id) {
    if (!window.confirm("Delete this record?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return setMessage(error.message);
    setRows(current => current.filter(row => row.id !== id));
    setMessage("Record deleted.");
  }

  return <section>
    <div className="toolbar"><div><strong>{config.title}</strong><div className="muted">{rows.length} RECORDS</div></div></div>
    <form className="formgrid" onSubmit={save}>
      {config.fields.map(field => <label key={field.key}>{field.label}
        <input type={field.type || "text"} required={field.required} value={form[field.key]} onChange={e => setForm(v => ({...v, [field.key]: e.target.value}))}/>
      </label>)}
      <div className="formactions"><button className="primary">{editingId ? "Update" : "Add"}</button>
        {editingId && <button type="button" onClick={() => {setEditingId(null);setForm(empty)}}>Cancel</button>}
      </div>
    </form>
    {message && <div className="notice">{message}</div>}
    {loadError ? <div className="alert">{loadError}</div> : <div className="tablewrap">
      {!rows.length ? <div className="empty">No records found.</div> : <table><thead><tr>
        {config.fields.map(f => <th key={f.key}>{f.label}</th>)}<th>Actions</th>
      </tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        {config.fields.map(f => <td key={f.key}>{String(row[f.key] ?? "")}</td>)}
        <td><button onClick={() => edit(row)}>Edit</button> <button onClick={() => remove(row.id)}>Delete</button></td>
      </tr>)}</tbody></table>}
    </div>}
  </section>;
}
