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
  }
};