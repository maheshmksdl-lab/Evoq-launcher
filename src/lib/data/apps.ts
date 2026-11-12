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
  { id: "crm", name: "CRM", tagline: "Sales pipeline", description: "Accounts, enquiries, opportunities and follow-ups in one pipeline.", category: "Growth", version: "4.2.1", sizeMb: 86, updatedAt: "2026-11-12", icon: "/apps/crm.png", color: { primary: "#1D4ED8", depth: "#0C2472" }, productUrl: `${SITE}/crm`, agent: AGENTS.ava },
  { id: "campaigns", name: "Campaigns", tagline: "Reach and engage", description: "Plan and launch campaigns that reach prospective customers.", category: "Growth", version: "2.8.0", sizeMb: 54, updatedAt: "2026-11-10", icon: "/apps/campaigns.png", color: { primary: "#7C3AED", depth: "#3D1E5C" }, productUrl: `${SITE}/campaigns` },
  { id: "configx", name: "ConfigX", tagline: "Configure, price, quote", description: "Configure products, visualise options and prepare quotes.", category: "Growth", version: "1.6.3", sizeMb: 112, updatedAt: "2026-11-08", icon: "/apps/configx.png", color: { primary: "#B8860B", depth: "#1C1A15" }, productUrl: `${SITE}/configx` },
  { id: "serviceops", name: "ServiceOps", tagline: "Field service", description: "Work orders, technician dispatch and service visits.", category: "Operations", version: "3.1.0", sizeMb: 97, updatedAt: "2026-11-12", icon: "/apps/serviceops.svg", color: { primary: "#EA580C", depth: "#7C2D12" }, productUrl: `${SITE}/serviceops`, agent: AGENTS.kai },
  { id: "projects", name: "Projects", tagline: "Delivery planning", description: "Plan tasks, owners and milestones, and keep delivery on track.", category: "Operations", version: "2.4.2", sizeMb: 71, updatedAt: "2026-11-05", icon: "/apps/projects.png", color: { primary: "#6D28D9", depth: "#5D1E99" }, productUrl: `${SITE}/projects` },
  { id: "desk", name: "Desk", tagline: "Customer support", description: "Track enquiries and service issues through to resolution.", category: "Operations", version: "3.0.4", sizeMb: 63, updatedAt: "2026-11-11", icon: "/apps/desk.png", color: { primary: "#0D9488", depth: "#0F2F3F" }, productUrl: `${SITE}/desk` },
  { id: "bookings", name: "Bookings", tagline: "Appointments and spaces", description: "Appointments, rooms and resources on one schedule.", category: "Operations", version: "1.2.0", sizeMb: 48, updatedAt: "2026-11-06", icon: "/apps/bookings.svg", color: { primary: "#0284C7", depth: "#0B3B5C" }, productUrl: `${SITE}/bookings` },
  { id: "hrms", name: "HRMS", tagline: "People operations", description: "Employee records, leave, attendance and workforce admin.", category: "People", version: "2.9.1", sizeMb: 78, updatedAt: "2026-11-09", icon: "/apps/hrms.png", color: { primary: "#0F7C63", depth: "#003D2E" }, productUrl: `${SITE}/hrms`, agent: AGENTS.sana },
  { id: "skillberry", name: "Skillberry", tagline: "Learning and skills", description: "Employee learning, training and skills development.", category: "People", version: "1.4.0", sizeMb: 41, updatedAt: "2026-10-29", icon: "/apps/skillberry.png", color: { primary: "#E94E77", depth: "#7A1E3A" }, productUrl: `${SITE}/skillberry` },
  { id: "billing", name: "Billing", tagline: "Invoices and payments", description: "Invoicing, payments and revenue, with reminders built in.", category: "Finance", version: "3.5.0", sizeMb: 69, updatedAt: "2026-11-12", icon: "/apps/billing.png", color: { primary: "#00AB88", depth: "#141416" }, productUrl: `${SITE}/billing`, agent: AGENTS.rohan },
  { id: "inventory", name: "Inventory", tagline: "Stock and supply", description: "Stock, warehouses and supply, ready for fulfilment.", category: "Finance", version: "2.7.3", sizeMb: 74, updatedAt: "2026-11-07", icon: "/apps/inventory.png", color: { primary: "#C91F6D", depth: "#242424" }, productUrl: `${SITE}/inventory` },
  { id: "sync", name: "Sync", tagline: "Integrations", description: "Keep EVOQ products and your existing systems in step.", category: "Platform", version: "1.9.2", sizeMb: 36, updatedAt: "2026-11-04", icon: "/apps/sync.png", color: { primary: "#059669", depth: "#064E3B" }, productUrl: `${SITE}/sync`, agent: AGENTS.leo },
  { id: "ai", name: "EVOQ AI", tagline: "AI across the suite", description: "Ask EVI, assign work to agents, or let AI run in the background.", category: "AI", version: "0.9.0", sizeMb: 124, updatedAt: "2026-11-12", icon: "/apps/ai.svg", color: { primary: "#4747E0", depth: "#1A1190" }, productUrl: `${SITE}/ai`, agent: AGENTS.evi },
]

/*
 * In-memory install state. Lives for the lifetime of the server process, which
 * is enough for the UI flow; swap for the real installer / device API later.
 */
const initialStatus: Record<string, InstallStatus> = {
  crm: "installed",
  billing: "update",
  ai: "installed",
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
