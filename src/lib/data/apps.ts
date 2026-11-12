import type { LauncherApp } from "@/lib/schemas/app"

// Placeholder catalog. Replace with a real data source (API, DB, CMS) later.
export const launcherApps: LauncherApp[] = [
  { id: "crm", name: "CRM", description: "Leads, contacts, deals and pipelines.", category: "Sales", url: "/crm", status: "active" },
  { id: "billing", name: "Billing", description: "Invoices, payments and subscriptions.", category: "Finance", url: "/billing", status: "active" },
  { id: "campaign", name: "Campaigns", description: "Plan and track marketing campaigns.", category: "Marketing", url: "/campaign", status: "active" },
  { id: "desk", name: "Desk", description: "Customer support tickets and SLAs.", category: "Support", url: "/desk", status: "active" },
  { id: "booking", name: "Booking", description: "Appointments and resource scheduling.", category: "Operations", url: "/booking", status: "beta" },
  { id: "hrms", name: "HRMS", description: "Employees, leave, attendance and payroll.", category: "People", url: "/hrms", status: "active" },
  { id: "inventory", name: "Inventory", description: "Stock, warehouses and purchase orders.", category: "Operations", url: "/inventory", status: "active" },
  { id: "projects", name: "Projects", description: "Tasks, milestones and timesheets.", category: "Operations", url: "/projects", status: "active" },
  { id: "serviceops", name: "ServiceOps", description: "Field service and work orders.", category: "Support", url: "/serviceops", status: "beta" },
  { id: "ai", name: "Evoq AI", description: "AI assistants across your workspace.", category: "Platform", url: "/ai", status: "coming-soon" },
]
