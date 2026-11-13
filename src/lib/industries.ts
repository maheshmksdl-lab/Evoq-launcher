import { z } from "zod"

/**
 * Industry solutions, in the order of the Solutions menu on evoq.one. Used by the
 * Industry solutions dropdown (to filter cards) and by the solution cards in the
 * catalog (each tagged with the industry it belongs to).
 */
export const industries = [
  { id: "healthcare", name: "Healthcare", sub: "Connected care workflows" },
  { id: "manufacturing", name: "Manufacturing", sub: "From enquiry to the field" },
  { id: "construction", name: "Construction, Engineering & Real Estate", sub: "Projects, technical work and property" },
  { id: "field-service", name: "Field Service, Facilities & Maintenance", sub: "Dispatch, assets and upkeep" },
  { id: "hospitality", name: "Hospitality, Travel & F&B", sub: "Guests, bookings and service" },
  { id: "financial-services", name: "Financial Services", sub: "Clients, follow-ups and service" },
] as const

export const industrySchema = z.enum(["healthcare", "manufacturing", "construction", "field-service", "hospitality", "financial-services"])
export type Industry = z.infer<typeof industrySchema>

/** Dropdown selection: one industry, or every industry card ("all"). */
export type IndustryFilter = Industry | "all"

export const industryLabel = (f: IndustryFilter) =>
  f === "all" ? "All industries" : industries.find((i) => i.id === f)?.name ?? f
