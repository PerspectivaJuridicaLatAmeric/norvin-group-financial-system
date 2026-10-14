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
  }
};
