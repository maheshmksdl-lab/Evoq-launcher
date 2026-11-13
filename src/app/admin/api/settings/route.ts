import { z } from "zod"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { clientIp, handle, requireAdmin } from "@/lib/auth/guards"
import { generalSettingsSchema, getSetting, securitySettingsSchema, SESSION_POLICY, setSetting } from "@/lib/settings"

// Security and general settings (Super Admin only by default).
export const GET = () =>
  handle(async () => {
    await requireAdmin("settings.manage")
    const [security, general] = await Promise.all([getSetting("security"), getSetting("general")])
    return Response.json({ security, general, policy: SESSION_POLICY })
  })

const putSchema = z.object({ security: securitySettingsSchema.optional(), general: generalSettingsSchema.optional() })

export const PUT = (request: Request) =>
  handle(async () => {
    const s = await requireAdmin("settings.manage")
    const body = await parseBody(request, putSchema)
    for (const key of ["security", "general"] as const) {
      const value = body[key]
      if (!value) continue
      const before = await getSetting(key)
      await setSetting(key, value as never, s.admin.id)
      await audit({ actor: actorOf(s), action: `settings.${key}`, targetType: "settings", targetId: key, before, after: value, ipAddress: await clientIp() })
    }
    return Response.json({ ok: true })
  })
