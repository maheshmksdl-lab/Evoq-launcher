import { z } from "zod"

export const appCategorySchema = z.enum(["Growth", "Operations", "People", "Finance", "Platform", "AI"])

export const installStatusSchema = z.enum(["installed", "available", "update", "coming-soon"])

export const agentSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatar: z.string(),
})

export const launcherAppSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string(),
  description: z.string(),
  category: appCategorySchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  sizeMb: z.number().positive(),
  updatedAt: z.iso.date(),
  icon: z.string(),
  color: z.object({ primary: z.string(), depth: z.string() }),
  productUrl: z.url(),
  status: installStatusSchema,
  agent: agentSchema.optional(),
})

export const launcherAppListSchema = z.array(launcherAppSchema)

export type AppCategory = z.infer<typeof appCategorySchema>
export type InstallStatus = z.infer<typeof installStatusSchema>
export type LauncherApp = z.infer<typeof launcherAppSchema>

export const sortOptions = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "updated", label: "Recently updated" },
  { value: "size", label: "Download size" },
  { value: "category", label: "Category" },
] as const

export const sortSchema = z.enum(["name-asc", "name-desc", "updated", "size", "category"])
export type SortKey = z.infer<typeof sortSchema>
