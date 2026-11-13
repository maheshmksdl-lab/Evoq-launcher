import { count, eq } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { getAppSettings } from "@/lib/apps-service"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"
import { catalogApps } from "@/lib/data/apps"
import { installStatusSchema } from "@/lib/schemas/app"

// Applications with organisation subscription status and how many users can open each.
export const GET = () =>
  handle(async () => {
    const s = await requireAdmin()
    if (!s.permissions.includes("apps.manage") && !s.permissions.includes("access.manage")) throw new HttpError(403, "You don't have permission to do this.")
    const [settings, grants] = await Promise.all([
      getAppSettings(),
      getDb().select({ appId: schema.userAppAccess.appId, n: count() }).from(schema.userAppAccess).groupBy(schema.userAppAccess.appId),
    ])
    const users = new Map(grants.map((g) => [g.appId, Number(g.n)]))
    return Response.json({
      apps: catalogApps.map((a) => {
        const st = settings.get(a.id)
        return {
          id: a.id,
          name: a.name,
          icon: a.icon,
          category: a.category,
          defaultUrl: a.productUrl,
          url: st?.url ?? null,
          status: st?.status ?? "available",
          enabled: st?.enabled ?? true,
          users: users.get(a.id) ?? 0,
        }
      }),
    })
  })

const patchSchema = z.object({
  appId: z.string(),
  status: installStatusSchema.optional(),
  enabled: z.boolean().optional(),
  url: z.union([z.url(), z.literal(""), z.null()]).optional(),
})

export const PATCH = (request: Request) =>
  handle(async () => {
    const s = await requireAdmin("apps.manage")
    const body = await parseBody(request, patchSchema)
    if (!catalogApps.some((a) => a.id === body.appId)) throw new HttpError(404, "Unknown app.")
    const db = getDb()
    const [before] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.appId, body.appId))
    const set = {
      ...(body.status && { status: body.status }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.url !== undefined && { url: body.url || null }),
      updatedAt: new Date(),
    }
    await db
      .insert(schema.appSettings)
      .values({ appId: body.appId, status: body.status ?? before?.status ?? "available", enabled: body.enabled ?? true, url: body.url || null })
      .onConflictDoUpdate({ target: schema.appSettings.appId, set })
    await audit({
      actor: actorOf(s),
      action: "app.update",
      targetType: "app",
      targetId: body.appId,
      before: before ? { status: before.status, enabled: before.enabled, url: before.url } : null,
      after: { status: body.status, enabled: body.enabled, url: body.url },
      ipAddress: await clientIp(),
    })
    return Response.json({ ok: true })
  })
