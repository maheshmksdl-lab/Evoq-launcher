import { z } from "zod"

export const appStatusSchema = z.enum(["active", "beta", "coming-soon"])

export const launcherAppSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  url: z.url().or(z.string().startsWith("/")),
  status: appStatusSchema,
})

export const launcherAppListSchema = z.array(launcherAppSchema)

export type LauncherApp = z.infer<typeof launcherAppSchema>
export type AppStatus = z.infer<typeof appStatusSchema>

export const appRequestSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  appName: z.string().trim().min(2, "Tell us which app you need"),
})

export type AppRequest = z.infer<typeof appRequestSchema>
