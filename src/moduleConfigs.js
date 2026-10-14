export const moduleConfigs = {
  clients: {
    title: "Clients",
    fields: [
      { key: "name", label: "Client name", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "address", label: "Address" }
    ]
  },
  projects: {
    title: "Projects",
    fields: [
      { key: "name", label: "Project name", required: true },
      { key: "status", label: "Status" },
      { key: "address", label: "Project address" }
    ]
  },
  invoices: {
    title: "Invoices",
    fields: [
      { key: "invoice_number", label: "Invoice number", required: true },
      { key: "client_id", label: "Client ID" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "status", label: "Status" },
      { key: "due_date", label: "Due date", type: "date" }
    ]
  },
  payments: {
    title: "Payments",
    fields: [
      { key: "invoice_id", label: "Invoice ID" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "payment_date", label: "Payment date", type: "date" },
      { key: "method", label: "Method" }
    ]
  },
  expenses: {
    title: "Expenses",
    fields: [
      { key: "description", label: "Description", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "expense_date", label: "Expense date", type: "date" },
      { key: "category", label: "Category" },
      { key: "vendor", label: "Vendor" }
    ]
  },
  employees: {
    title: "Employees",
    fields: [
      { key: "first_name", label: "First name", required: true },
      { key: "last_name", label: "Last name", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "employment_status", label: "Employment status" },
      { key: "pay_frequency", label: "Pay frequency" },
      { key: "federal_filing_status", label: "Federal filing status" },
      { key: "w4_step3", label: "W-4 Step 3", type: "number" },
      { key: "w4_step4a", label: "W-4 Step 4(a)", type: "number" },
      { key: "w4_step4b", label: "W-4 Step 4(b)", type: "number" },
      { key: "w4_step4c", label: "W-4 Step 4(c)", type: "number" },
      { key: "ohio_it4_exemptions", label: "Ohio IT 4 exemptions", type: "number" },
      { key: "work_municipality", label: "Work municipality" },
      { key: "residence_municipality", label: "Residence municipality" },
      { key: "school_district_code", label: "School district code" }
    ]
  },
  contractors: {
    title: "Contractors",
    fields: [
      { key: "name", label: "Contractor name", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "business_name", label: "Business name" },
      { key: "status", label: "Status" }
    ]
  },
  contractor_payments: {
    title: "Contractor Payments",
    fields: [
      { key: "contractor_id", label: "Contractor ID", required: true },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "payment_date", label: "Payment date", type: "date" },
      { key: "method", label: "Method" },
      { key: "description", label: "Description" }
    ]
  },
  estimates: {
    title: "Estimates",
    fields: [
      { key: "estimate_number", label: "Estimate number", required: true },
      { key: "client_id", label: "Client ID" },
      { key: "project_id", label: "Project ID" },
      { key: "amount", label: "Amount", type: "number", required: true },
      { key: "status", label: "Status" },
      { key: "valid_until", label: "Valid until", type: "date" }
    ]
  }
};