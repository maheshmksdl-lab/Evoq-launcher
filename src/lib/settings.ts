import "server-only"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"

/* System settings stored in the database, with safe defaults. */

export const securitySettingsSchema = z.object({
  lockoutThreshold: z.number().int().min(3).max(20),
  lockoutMinutes: z.number().int().min(1).max(1440),
  requireUserMfa: z.boolean(),
})

export const generalSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(80),
  supportEmail: z.union([z.email(), z.literal("")]),
  maintenanceBanner: z.string().trim().max(200),
})

const DEFAULTS = {
  security: { lockoutThreshold: 5, lockoutMinutes: 15, requireUserMfa: false },
  general: { companyName: "EVOQ", supportEmail: "", maintenanceBanner: "" },
}

export type SecuritySettings = z.infer<typeof securitySettingsSchema>
export type GeneralSettings = z.infer<typeof generalSettingsSchema>

type Key = keyof typeof DEFAULTS
const schemas = { security: securitySettingsSchema, general: generalSettingsSchema }

export async function getSetting<K extends Key>(key: K): Promise<(typeof DEFAULTS)[K]> {
  const [row] = await getDb().select().from(schema.systemSettings).where(eq(schema.systemSettings.key, key))
  const parsed = schemas[key].safeParse(row?.value)
  return (parsed.success ? parsed.data : DEFAULTS[key]) as (typeof DEFAULTS)[K]
}

export async function setSetting<K extends Key>(key: K, value: (typeof DEFAULTS)[K], updatedBy: string) {
  await getDb()
    .insert(schema.systemSettings)
    .values({ key, value, updatedBy })
    .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value, updatedBy, updatedAt: new Date() } })
}

/* Session policy. Fixed in configuration (shown read-only in the Admin Portal). */
export const SESSION_POLICY = {
  user: { idleSeconds: 12 * 60 * 60, absoluteSeconds: 7 * 24 * 60 * 60 },
  admin: { idleSeconds: 30 * 60, absoluteSeconds: 8 * 60 * 60 },
  minPasswordLength: 12,
} as const
