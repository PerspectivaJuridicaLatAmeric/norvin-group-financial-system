export async function savePayrollDraft({supabase,draft}) {
  if (!supabase || !draft) throw new Error("Supabase and payroll draft are required.");
  if (draft.calculation_status !== "draft") throw new Error("Only draft payroll can be saved from the client.");
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data?.user?.id) throw new Error("Authentication required.");
  const payload = { ...draft, user_id: data.user.id };
  const { error } = await supabase.from("payroll_entries").insert(payload);
  if (error) throw error;
  return true;
}
