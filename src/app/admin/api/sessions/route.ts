import { and, desc, eq, gt } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf } from "@/lib/admin-api"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"

// Active sessions. User sessions need sessions.manage; admin sessions need admins.manage.
export const GET = () =>
  handle(async () => {
    const s = await requireAdmin("sessions.manage")
    const db = getDb()
    const now = new Date()
    const users = await db
      .select({ id: schema.userSession.id, name: schema.userAccountUser.name, email: schema.userAccountUser.email, createdAt: schema.userSession.createdAt, updatedAt: schema.userSession.updatedAt, expiresAt: schema.userSession.expiresAt, ipAddress: schema.userSession.ipAddress, userAgent: schema.userSession.userAgent })
      .from(schema.userSession)
      .innerJoin(schema.userAccountUser, eq(schema.userAccountUser.id, schema.userSession.userId))
      .where(gt(schema.userSession.expiresAt, now))
      .orderBy(desc(schema.userSession.updatedAt))
    const admins = s.permissions.includes("admins.manage")
      ? await db
          .select({ id: schema.adminSession.id, name: schema.adminAccountUser.name, email: schema.adminAccountUser.email, createdAt: schema.adminSession.createdAt, updatedAt: schema.adminSession.updatedAt, expiresAt: schema.adminSession.expiresAt, ipAddress: schema.adminSession.ipAddress, userAgent: schema.adminSession.userAgent })
          .from(schema.adminSession)
          .innerJoin(schema.adminAccountUser, eq(schema.adminAccountUser.id, schema.adminSession.userId))
          .where(gt(schema.adminSession.expiresAt, now))
          .orderBy(desc(schema.adminSession.updatedAt))
      : null
    return Response.json({
      users,
      admins: admins?.map((a) => ({ ...a, current: a.id === s.session.id })) ?? null,
    })
  })

// Revoke one session: ?realm=user|admin&id=...
export const DELETE = (request: Request) =>
  handle(async () => {
    const url = new URL(request.url)
    const realm = url.searchParams.get("realm")
    const id = url.searchParams.get("id")
    if (!id || (realm !== "user" && realm !== "admin")) throw new HttpError(400, "Specify the session to revoke.")
    const s = await requireAdmin(realm === "user" ? "sessions.manage" : "admins.manage")
    const table = realm === "user" ? schema.userSession : schema.adminSession
    const [row] = await getDb().select({ id: table.id, userId: table.userId }).from(table).where(and(eq(table.id, id)))
    if (!row) throw new HttpError(404, "Session not found.")
    await getDb().delete(table).where(eq(table.id, id))
    await audit({ actor: actorOf(s), action: `session.revoke`, targetType: `${realm}_session`, targetId: id, after: { userId: row.userId }, ipAddress: await clientIp() })
    return Response.json({ ok: true })
  })
