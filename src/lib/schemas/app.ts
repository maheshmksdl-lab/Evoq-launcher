import { z } from "zod"

export const appCategorySchema = z.enum(["Growth", "Operations", "People", "Finance", "Platform", "AI", "Solutions"])

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
  color: z.object({ primary: z.string(), logo: z.string() }),
  productUrl: z.url(),
  status: installStatusSchema,
  agent: agentSchema.optional(),
  /** Extra apps reachable from the same card (e.g. Healthcare's PMS alongside its platform). */
  extraLinks: z.array(z.object({ label: z.string(), href: z.url() })).optional(),
})

export const launcherAppListSchema = z.array(launcherAppSchema)

export type AppCategory = z.infer<typeof appCategorySchema>
export type InstallStatus = z.infer<typeof installStatusSchema>
export type LauncherApp = z.infer<typeof launcherAppSchema>

/* ---------- App details (popup) ---------- */

const windowRowSchema = z.object({
  title: z.string(),
  meta: z.string(),
  value: z.string().optional(),
  tag: z.string().optional(),
  flag: z.boolean().optional(),
})

/** A product screen drawn in the UI (used where no real screenshot exists). */
export const productWindowSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  action: z.string(),
  nav: z.array(z.string()).min(3),
  layout: z.enum(["list", "board"]),
  rows: z.array(windowRowSchema).default([]),
  columns: z.array(z.object({ name: z.string(), items: z.array(windowRowSchema) })).default([]),
})

export const eviSceneSchema = z.object({
  question: z.string(),
  answer: z.string(),
  steps: z.array(z.object({ text: z.string(), done: z.boolean() })),
})

export const gallerySlideSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("image"), src: z.string(), caption: z.string() }),
  z.object({ kind: z.literal("window"), caption: z.string() }),
  z.object({ kind: z.literal("overview"), caption: z.string() }),
  z.object({ kind: z.literal("evi"), caption: z.string() }),
])

export const appDetailsSchema = z.object({
  id: z.string(),
  headline: z.string(),
  about: z.string(),
  features: z.array(z.object({ title: z.string(), body: z.string() })).min(3).max(6),
  links: z.array(z.object({ label: z.string(), href: z.url() })).min(1),
  gallery: z.array(gallerySlideSchema).min(1),
  window: productWindowSchema,
  stats: z.array(z.object({ label: z.string(), value: z.string() })).length(4),
  scene: eviSceneSchema,
  release: z.object({
    platforms: z.array(z.string()).min(1),
    changes: z.array(z.string()).min(1),
    changelogUrl: z.url(),
  }),
})

export const appDetailsResponseSchema = z.object({
  app: launcherAppSchema,
  details: appDetailsSchema,
})

export type ProductWindow = z.infer<typeof productWindowSchema>
export type AppDetails = z.infer<typeof appDetailsSchema>
export type GallerySlide = z.infer<typeof gallerySlideSchema>

export const sortOptions = [
  { value: "name-asc", label: "Name (A–Z)" },
  { value: "name-desc", label: "Name (Z–A)" },
  { value: "updated", label: "Recently updated" },
  { value: "size", label: "Download size" },
  { value: "category", label: "Category" },
] as const

export const sortSchema = z.enum(["name-asc", "name-desc", "updated", "size", "category"])
export type SortKey = z.infer<typeof sortSchema>
