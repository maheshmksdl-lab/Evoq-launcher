import type { InstallStatus, LauncherApp } from "@/lib/schemas/app"

/*
 * EVOQ product catalog for the launcher. Names, taglines, categories, product
 * colours and the AI cast come from the evoq.one site (ProductsGrid, PALETTE,
 * ai-sections configs). Versions, sizes and dates are placeholders until a real
 * release feed exists.
 */

const SITE = "https://evoq.one/products"

const AGENTS = {
  ava: { name: "Ava", role: "Follow-up agent", avatar: "/characters/ava.webp" },
  kai: { name: "Kai", role: "Dispatch agent", avatar: "/characters/kai.webp" },
  rohan: { name: "Rohan", role: "Collections agent", avatar: "/characters/rohan.webp" },
  leo: { name: "Leo", role: "Sync agent", avatar: "/characters/leo.webp" },
  sana: { name: "Sana", role: "Onboarding agent", avatar: "/characters/sana.webp" },
  evi: { name: "EVI", role: "AI assistant", avatar: "/characters/evi.webp" },
}

const catalog: Omit<LauncherApp, "status">[] = [
  { id: "crm", name: "CRM", tagline: "Sales pipeline", description: "Accounts, enquiries, opportunities and follow-ups in one pipeline.", category: "Growth", version: "4.2.1", sizeMb: 86, updatedAt: "2026-11-12", icon: "/logos/crm.svg", color: { primary: "#1D4ED8", logo: "#1D4ED8" }, productUrl: "https://evoq-crm-v1.vercel.app/", agent: AGENTS.ava },
  { id: "campaigns", name: "Campaigns", tagline: "Reach and engage", description: "Plan and launch campaigns that reach prospective customers.", category: "Growth", version: "2.8.0", sizeMb: 54, updatedAt: "2026-11-10", icon: "/logos/campaigns.svg", color: { primary: "#6B32F1", logo: "#6B32F1" }, productUrl: "https://campaign-app-iota.vercel.app/" },
  { id: "configx", name: "ConfigX", tagline: "Configure, price, quote", description: "Configure products, visualise options and prepare quotes.", category: "Growth", version: "1.6.3", sizeMb: 112, updatedAt: "2026-11-08", icon: "/logos/configx.svg", color: { primary: "#B8860B", logo: "#FDD11F" }, productUrl: `${SITE}/configx` },
  { id: "serviceops", name: "ServiceOps", tagline: "Field service", description: "Work orders, technician dispatch and service visits.", category: "Operations", version: "3.1.0", sizeMb: 97, updatedAt: "2026-11-12", icon: "/logos/serviceops.svg", color: { primary: "#D97706", logo: "#F59E0B" }, productUrl: "https://service-opsv2.vercel.app/", agent: AGENTS.kai },
  { id: "projects", name: "Projects", tagline: "Delivery planning", description: "Plan tasks, owners and milestones, and keep delivery on track.", category: "Operations", version: "2.4.2", sizeMb: 71, updatedAt: "2026-11-05", icon: "/logos/projects.svg", color: { primary: "#7C3AED", logo: "#7C3AED" }, productUrl: "https://project-app-pi-rosy.vercel.app/" },
  { id: "desk", name: "Desk", tagline: "Customer support", description: "Track enquiries and service issues through to resolution.", category: "Operations", version: "3.0.4", sizeMb: 63, updatedAt: "2026-11-11", icon: "/logos/desk.svg", color: { primary: "#0C9488", logo: "#0C9488" }, productUrl: "https://evoq-desk-app.vercel.app/" },
  { id: "bookings", name: "Bookings", tagline: "Appointments and spaces", description: "Appointments, rooms and resources on one schedule.", category: "Operations", version: "1.2.0", sizeMb: 48, updatedAt: "2026-11-06", icon: "/logos/bookings.svg", color: { primary: "#64856D", logo: "#64856D" }, productUrl: "https://evoq-bookings-app.vercel.app/" },
  { id: "hrms", name: "HRMS", tagline: "People operations", description: "Employee records, leave, attendance and workforce admin.", category: "People", version: "2.9.1", sizeMb: 78, updatedAt: "2026-11-09", icon: "/logos/hrms.png", color: { primary: "#004D43", logo: "#004D43" }, productUrl: "https://hrms-app-livid.vercel.app/", agent: AGENTS.sana },
  { id: "skillberry", name: "Skillberry", tagline: "Learning and skills", description: "Employee learning, training and skills development.", category: "People", version: "1.4.0", sizeMb: 41, updatedAt: "2026-10-29", icon: "/logos/skillberry.svg", color: { primary: "#E94E77", logo: "#FFFFFF" }, productUrl: `${SITE}/skillberry` },
  { id: "billing", name: "Billing", tagline: "Invoices and payments", description: "Invoicing, payments and revenue, with reminders built in.", category: "Finance", version: "3.5.0", sizeMb: 69, updatedAt: "2026-11-12", icon: "/logos/billing.svg", color: { primary: "#14A08D", logo: "#E5EEEB" }, productUrl: "https://billing-app-five-bay.vercel.app/", agent: AGENTS.rohan },
  { id: "inventory", name: "Inventory", tagline: "Stock and supply", description: "Stock, warehouses and supply, ready for fulfilment.", category: "Finance", version: "2.7.3", sizeMb: 74, updatedAt: "2026-11-07", icon: "/logos/inventory.svg", color: { primary: "#C91F6D", logo: "#C91F6D" }, productUrl: "https://inventory-app-psi-seven.vercel.app/" },
  { id: "sync", name: "Sync", tagline: "Integrations", description: "Keep EVOQ products and your existing systems in step.", category: "Platform", version: "1.9.2", sizeMb: 36, updatedAt: "2026-11-04", icon: "/logos/sync.svg", color: { primary: "#049669", logo: "#049669" }, productUrl: "https://sync-app-weld.vercel.app/", agent: AGENTS.leo },
  { id: "ai", name: "EVOQ AI", tagline: "AI across the suite", description: "Ask EVI, assign work to agents, or let AI run in the background.", category: "AI", version: "0.9.0", sizeMb: 124, updatedAt: "2026-11-12", icon: "/logos/ai.svg", color: { primary: "#0062FA", logo: "#0062FA" }, productUrl: "https://evoq-ai-app.vercel.app/", agent: AGENTS.evi },

  // Healthcare products are separate cards so each app can be filtered and opened directly.
  { id: "healthcare", name: "Unified Healthcare Platform", tagline: "Clinical & patient operations", description: "Patient records, scheduling, admissions and care coordination in one platform.", category: "Solutions", version: "1.0.0", sizeMb: 92, updatedAt: "2026-11-12", icon: "/logos/healthcare.svg", color: { primary: "#0E7490", logo: "#0E7490" }, productUrl: "https://healthcare-unified-platform.vercel.app/" },
  { id: "healthcare-pms", name: "Healthcare PMS", tagline: "Practice management", description: "Front desk, appointments, billing and claims for healthcare practices.", category: "Solutions", version: "1.0.0", sizeMb: 64, updatedAt: "2026-11-12", icon: "/logos/healthcare.svg", color: { primary: "#0E7490", logo: "#0E7490" }, productUrl: "https://healthcare-pms.vercel.app/" },
]

/*
 * In-memory install state. Lives for the lifetime of the server process, which
 * is enough for the UI flow; swap for the real installer / device API later.
 */
const initialStatus: Record<string, InstallStatus> = {
  crm: "installed",
  billing: "update",
  ai: "installed",
  configx: "coming-soon",
  skillberry: "coming-soon",
  healthcare: "installed",
  "healthcare-pms": "installed",
}

const state = new Map<string, InstallStatus>(
  catalog.map((a) => [a.id, initialStatus[a.id] ?? "available"]),
)

export function listApps(): LauncherApp[] {
  return catalog.map((a) => ({ ...a, status: state.get(a.id) ?? "available" }))
}

export function setStatus(id: string, status: InstallStatus): LauncherApp | undefined {
  const app = catalog.find((a) => a.id === id)
  if (!app) return undefined
  state.set(id, status)
  return { ...app, status }
}

export function getApp(id: string): LauncherApp | undefined {
  return listApps().find((a) => a.id === id)
}
