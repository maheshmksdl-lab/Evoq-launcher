import { and, count, eq, ne } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { sendPasswordLink } from "@/lib/auth/accounts"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"
import { ADMIN_ROLES } from "@/lib/permissions"

type Ctx = RouteContext<"/admin/api/admins/[id]">
const a = schema.adminAccountUser

async function loadAdmin(id: string) {
  const [row] = await getDb().select().from(a).where(eq(a.id, id))
  if (!row) throw new HttpError(404, "Admin not found.")
  return row
}

/** Never leave the portal without an active Super Admin. */
async function assertAnotherSuperAdmin(id: string) {
  const [row] = await getDb()
    .select({ n: count() })
    .from(a)
    .where(and(eq(a.role, "super_admin"), eq(a.status, "active"), ne(a.id, id)))
  if ((row?.n ?? 0) === 0) throw new HttpError(409, "You can't remove or demote the last active Super Admin.")
}

const patchSchema = z.object({
  role: z.enum(ADMIN_ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  action: z.enum(["reset-password", "reset-mfa", "revoke-sessions"]).optional(),
})

export const PATCH = (request: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const s = await requireAdmin("admins.manage")
    const { id } = await ctx.params
    const before = await loadAdmin(id)
    const body = await parseBody(request, patchSchema)
    const db = getDb()

    if ((body.role || body.status) && id === s.admin.id) throw new HttpError(409, "You can't change your own role or status.")
    const losingSuper = before.role === "super_admin" && ((body.role && body.role !== "super_admin") || body.status === "inactive")
    if (losingSuper) await assertAnotherSuperAdmin(id)

    if (body.role || body.status) {
      await db.update(a).set({ ...(body.role && { role: body.role }), ...(body.status && { status: body.status }), updatedAt: new Date() }).where(eq(a.id, id))
      if (body.status === "inactive") await db.delete(schema.adminSession).where(eq(schema.adminSession.userId, id))
      await audit({ actor: actorOf(s), action: "admin.update", targetType: "admin", targetId: id, before: { role: before.role, status: before.status }, after: { role: body.role ?? before.role, status: body.status ?? before.status }, ipAddress: await clientIp() })
    }
    if (body.action === "reset-password") await sendPasswordLink("admin", before.email)
    if (body.action === "reset-mfa") {
      await db.delete(schema.adminTwoFactor).where(eq(schema.adminTwoFactor.userId, id))
      await db.update(a).set({ twoFactorEnabled: false }).where(eq(a.id, id))
      await db.delete(schema.adminSession).where(eq(schema.adminSession.userId, id))
    }
    if (body.action === "revoke-sessions") await db.delete(schema.adminSession).where(eq(schema.adminSession.userId, id))
    if (body.action) await audit({ actor: actorOf(s), action: `admin.${body.action}`, targetType: "admin", targetId: id, ipAddress: await clientIp() })
    return Response.json({ ok: true })
  })

export const DELETE = (_req: NextRequest, ctx: Ctx) =>
  handle(async () => {
    const s = await requireAdmin("admins.manage")
    const { id } = await ctx.params
    if (id === s.admin.id) throw new HttpError(409, "You can't delete your own admin account.")
    const before = await loadAdmin(id)
    if (before.role === "super_admin") await assertAnotherSuperAdmin(id)
    await getDb().delete(a).where(eq(a.id, id))
    await audit({ actor: actorOf(s), action: "admin.delete", targetType: "admin", targetId: id, before: { email: before.email, role: before.role }, ipAddress: await clientIp() })
    return Response.json({ ok: true })
  })
