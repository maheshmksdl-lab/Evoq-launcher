export const industries = [
  { id: "healthcare", name: "Healthcare", sub: "Connected care workflows" },
  { id: "manufacturing", name: "Manufacturing", sub: "From enquiry to the field" },
  { id: "hospitality", name: "Hospitality, Travel & F&B", sub: "Guests, bookings and service" },
  { id: "field-service", name: "Field Service, Facilities & Maintenance", sub: "Dispatch, assets and upkeep" },
  { id: "financial-services", name: "Financial Services", sub: "Clients, follow-ups and service" },
  { id: "construction", name: "Construction, Engineering & Real Estate", sub: "Projects, technical work and property" },
] as const

export type Industry = (typeof industries)[number]["id"]
export type IndustryFilter = Industry | "all"

export const industryLabel = (filter: IndustryFilter) =>
  filter === "all" ? "All Industries" : industries.find((industry) => industry.id === filter)?.name ?? filter

export const INDUSTRY_APPS: Record<Industry, readonly string[]> = {
  healthcare: ["crm", "bookings", "healthcare", "healthcare-pms", "campaigns", "surveys", "loyalty", "billing"],
  manufacturing: ["crm", "configx", "inventory", "projects", "serviceops", "desk", "billing"],
  hospitality: ["crm", "bookings", "desk", "inventory", "billing", "surveys", "loyalty", "campaigns"],
  "field-service": ["desk", "serviceops", "inventory", "skillberry", "billing"],
  "financial-services": ["crm", "desk", "projects", "campaigns", "surveys"],
  construction: ["crm", "projects", "inventory", "hrms", "skillberry", "serviceops", "desk", "billing"],
}
