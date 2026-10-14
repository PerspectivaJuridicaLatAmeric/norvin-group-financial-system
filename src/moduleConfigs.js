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
      { key: "name", label: "Employee name", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "pay_rate", label: "Pay rate", type: "number" },
      { key: "pay_type", label: "Pay type" },
      { key: "status", label: "Status" }
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
  }
};