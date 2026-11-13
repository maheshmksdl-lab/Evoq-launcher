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

const catalog: Omit<LauncherApp, "status" | "access">[] = [
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

  // Solutions: industry bundles across the product suite, rather than single products.
  { id: "healthcare", name: "Unified Healthcare Platform", tagline: "Clinical & patient operations", description: "Patient records, scheduling, admissions and care coordination in one platform.", category: "Solutions", industry: "healthcare", version: "1.0.0", sizeMb: 92, updatedAt: "2026-11-12", icon: "/logos/healthcare.svg", color: { primary: "#0E7490", logo: "#0E7490" }, productUrl: "https://healthcare-unified-platform.vercel.app/" },
  { id: "healthcare-pms", name: "Healthcare PMS", tagline: "Practice management", description: "Front desk, appointments, billing and claims for healthcare practices.", category: "Solutions", industry: "healthcare", version: "1.0.0", sizeMb: 64, updatedAt: "2026-11-12", icon: "/logos/healthcare-pms.svg", color: { primary: "#0E7490", logo: "#0E7490" }, productUrl: "https://healthcare-pms.vercel.app/" },
  { id: "manufacturing", name: "Manufacturing", tagline: "Production & shop floor", description: "Production orders, shop-floor tracking and quality control, built for manufacturers.", category: "Solutions", industry: "manufacturing", version: "0.1.0", sizeMb: 58, updatedAt: "2026-10-01", icon: "/logos/manufacturing.svg", color: { primary: "#C2410C", logo: "#C2410C" }, productUrl: "https://evoq.one/solutions/manufacturing" },
  // Industry solutions from the evoq.one Solutions menu. Colours are each industry's brand colour there.
  { id: "construction", name: "Construction, Engineering & Real Estate", tagline: "Projects, technical work and property", description: "Site progress, client commitments and billing milestones in one view.", category: "Solutions", industry: "construction", version: "0.1.0", sizeMb: 44, updatedAt: "2026-10-01", icon: "/logos/construction.svg", color: { primary: "#B5532F", logo: "#B5532F" }, productUrl: "https://evoq.one/solutions/construction-engineering-real-estate" },
  { id: "field-service", name: "Field Service, Facilities & Maintenance", tagline: "Dispatch, assets and upkeep", description: "Every request logged, every visit tracked, every asset maintained on schedule.", category: "Solutions", industry: "field-service", version: "0.1.0", sizeMb: 52, updatedAt: "2026-10-01", icon: "/logos/field-service.svg", color: { primary: "#1F5FE0", logo: "#1F5FE0" }, productUrl: "https://evoq.one/solutions/field-service-facilities-maintenance" },
  { id: "hospitality", name: "Hospitality, Travel & F&B", tagline: "Guests, bookings and service", description: "Reservations confirmed, guest requests tracked and every stay billed correctly.", category: "Solutions", industry: "hospitality", version: "0.1.0", sizeMb: 47, updatedAt: "2026-10-01", icon: "/logos/hospitality.svg", color: { primary: "#1F4D3A", logo: "#1F4D3A" }, productUrl: "https://evoq.one/solutions/hospitality-travel-food-and-beverage" },
  { id: "financial-services", name: "Financial Services", tagline: "Clients, follow-ups and service", description: "Client enquiries answered, service requests tracked, relationships kept current.", category: "Solutions", industry: "financial-services", version: "0.1.0", sizeMb: 39, updatedAt: "2026-10-01", icon: "/logos/financial-services.svg", color: { primary: "#0B2D4F", logo: "#0B2D4F" }, productUrl: "https://evoq.one/solutions/financial-services" },
  { id: "all-industries", name: "All Industries", tagline: "One suite, every industry", description: "Browse every EVOQ industry solution and the products that fit your industry's needs.", category: "Solutions", version: "0.1.0", sizeMb: 12, updatedAt: "2026-10-01", icon: "/logos/all-industries.svg", color: { primary: "#1E40AF", logo: "#1E40AF" }, productUrl: "https://evoq.one/industries" },
]

/*
 * Default subscription status per app, written to the database on first start
 * (table app_setting). After that, admins change status in the Admin Portal.
 */
const initialStatus: Record<string, InstallStatus> = {
  crm: "installed",
  billing: "update",
  ai: "installed",
  configx: "coming-soon",
  skillberry: "coming-soon",
  // Both healthcare apps are live, so their cards open the app directly.
  healthcare: "installed",
  "healthcare-pms": "installed",
  manufacturing: "coming-soon",
  construction: "coming-soon",
  "field-service": "coming-soon",
  hospitality: "coming-soon",
  "financial-services": "coming-soon",
  "all-industries": "coming-soon",
}

export type CatalogApp = Omit<LauncherApp, "status" | "access">

/** Descriptive catalog data (names, logos, copy). Operational state lives in the database. */
export const catalogApps: CatalogApp[] = catalog

export const findCatalogApp = (id: string) => catalog.find((a) => a.id === id)

export function catalogDefaults(): { id: string; status: InstallStatus }[] {
  return catalog.map((a) => ({ id: a.id, status: initialStatus[a.id] ?? "available" }))
}
