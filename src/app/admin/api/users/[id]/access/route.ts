import { and, eq, inArray } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"
import { catalogApps } from "@/lib/data/apps"

// Replace the set of apps a user may open. Pending requests for granted apps are approved.
export const PUT = (request: NextRequest, ctx: RouteContext<"/admin/api/users/[id]/access">) =>
  handle(async () => {
    const s = await requireAdmin("access.manage")
    const { id } = await ctx.params
    const { apps } = await parseBody(request, z.object({ apps: z.array(z.string()) }))
    const db = getDb()
    const [user] = await db.select({ id: schema.userAccountUser.id }).from(schema.userAccountUser).where(eq(schema.userAccountUser.id, id))
    if (!user) throw new HttpError(404, "User not found.")

    const known = new Set(catalogApps.map((a) => a.id))
    const next = [...new Set(apps.filter((a) => known.has(a)))]
    const current = (await db.select({ appId: schema.userAppAccess.appId }).from(schema.userAppAccess).where(eq(schema.userAppAccess.userId, id))).map((r) => r.appId)
    const add = next.filter((a) => !current.includes(a))
    const remove = current.filter((a) => !next.includes(a))

    if (remove.length) await db.delete(schema.userAppAccess).where(and(eq(schema.userAppAccess.userId, id), inArray(schema.userAppAccess.appId, remove)))
    if (add.length) {
      await db.insert(schema.userAppAccess).values(add.map((appId) => ({ userId: id, appId, grantedBy: s.admin.id })))
      await db
        .update(schema.accessRequests)
        .set({ status: "approved", decidedBy: s.admin.id, decidedAt: new Date() })
        .where(and(eq(schema.accessRequests.userId, id), eq(schema.accessRequests.status, "pending"), inArray(schema.accessRequests.appId, add)))
    }
    if (add.length || remove.length) {
      await audit({ actor: actorOf(s), action: "user.access", targetType: "user", targetId: id, before: { apps: current }, after: { apps: next }, ipAddress: await clientIp() })
    }
    return Response.json({ apps: next })
  })
