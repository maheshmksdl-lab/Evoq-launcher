import { and, desc, eq, gt } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { hasPassword } from "@/lib/auth/accounts"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"

type Ctx = RouteContext<"/admin/api/users/[id]">
const u = schema.userAccountUser

async function loadUser(id: string) {
  const [row] = await getDb().select().from(u).where(eq(u.id, id))
  if (!row) throw new HttpError(404, "User not found.")
  return row
}

// One user with their apps, sessions and recent sign-ins.
export const GET = (_req: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const s = await requireAdmin("users.view")
    const { id } = await ctx.params
    const row = await loadUser(id)
    const db = getDb()
    const [apps, sessions, logins, passwordSet] = await Promise.all([
      db.select({ appId: schema.userAppAccess.appId, grantedAt: schema.userAppAccess.grantedAt }).from(schema.userAppAccess).where(eq(schema.userAppAccess.userId, id)),
      s.permissions.includes("sessions.manage")
        ? db
            .select({ id: schema.userSession.id, createdAt: schema.userSession.createdAt, updatedAt: schema.userSession.updatedAt, expiresAt: schema.userSession.expiresAt, ipAddress: schema.userSession.ipAddress, userAgent: schema.userSession.userAgent })
            .from(schema.userSession)
            .where(and(eq(schema.userSession.userId, id), gt(schema.userSession.expiresAt, new Date())))
            .orderBy(desc(schema.userSession.updatedAt))
        : Promise.resolve([]),
      db
        .select({ id: schema.loginEvents.id, success: schema.loginEvents.success, reason: schema.loginEvents.reason, ipAddress: schema.loginEvents.ipAddress, createdAt: schema.loginEvents.createdAt })
        .from(schema.loginEvents)
        .where(and(eq(schema.loginEvents.realm, "user"), eq(schema.loginEvents.email, row.email)))
        .orderBy(desc(schema.loginEvents.createdAt))
        .limit(10),
      hasPassword("user", id),
    ])
    return Response.json({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        title: row.title,
        phone: row.phone,
        status: row.status,
        twoFactorEnabled: Boolean(row.twoFactorEnabled),
        passwordSet,
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt,
      },
      apps: apps.map((a) => a.appId),
      sessions,
      logins,
    })
  })

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

// Edit profile fields or activate / deactivate. Deactivating signs the user out everywhere.
export const PATCH = (request: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const s = await requireAdmin("users.manage")
    const { id } = await ctx.params
    const before = await loadUser(id)
    const body = await parseBody(request, patchSchema)
    await getDb().update(u).set({ ...body, updatedAt: new Date() }).where(eq(u.id, id))
    if (body.status === "inactive") await getDb().delete(schema.userSession).where(eq(schema.userSession.userId, id))
    const action = body.status && body.status !== before.status ? (body.status === "inactive" ? "user.deactivate" : "user.activate") : "user.update"
    const pick = (o: Record<string, unknown>) => Object.fromEntries(Object.keys(body).map((k) => [k, o[k] ?? null]))
    await audit({ actor: actorOf(s), action, targetType: "user", targetId: id, before: pick(before), after: body, ipAddress: await clientIp() })
    return Response.json({ ok: true })
  })

// Permanently delete a user (cascades to sessions, credentials, access and requests).
export const DELETE = (_req: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const s = await requireAdmin("users.delete")
    const { id } = await ctx.params
    const before = await loadUser(id)
    await getDb().delete(u).where(eq(u.id, id))
    await audit({ actor: actorOf(s), action: "user.delete", targetType: "user", targetId: id, before: { name: before.name, email: before.email }, ipAddress: await clientIp() })
    return Response.json({ ok: true })
  })
