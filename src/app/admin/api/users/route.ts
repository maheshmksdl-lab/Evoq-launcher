import { desc, ilike, isNotNull, or } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { inviteUser } from "@/lib/auth/accounts"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"
import { catalogApps } from "@/lib/data/apps"

const u = schema.userAccountUser

// List users (search + status filter), with their app grants.
export const GET = (request: Request) =>
  handle(async () => {
    await requireAdmin("users.view")
    const url = new URL(request.url)
    const q = url.searchParams.get("q")?.trim()
    const status = url.searchParams.get("status")
    const db = getDb()
    const where = q ? or(ilike(u.name, `%${q}%`), ilike(u.email, `%${q}%`)) : undefined
    const rows = await db
      .select({
        id: u.id,
        name: u.name,
        email: u.email,
        title: u.title,
        status: u.status,
        twoFactorEnabled: u.twoFactorEnabled,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })
      .from(u)
      .where(where)
      .orderBy(desc(u.createdAt))
    const withPassword = new Set(
      (await db.select({ userId: schema.userCredential.userId }).from(schema.userCredential).where(isNotNull(schema.userCredential.password))).map((c) => c.userId),
    )
    const grants = await db.select().from(schema.userAppAccess)
    const appsByUser = new Map<string, string[]>()
    for (const g of grants) appsByUser.set(g.userId, [...(appsByUser.get(g.userId) ?? []), g.appId])
    const users = rows
      .filter((r) => !status || status === "all" || r.status === status)
      .map((r) => ({ ...r, twoFactorEnabled: Boolean(r.twoFactorEnabled), passwordSet: withPassword.has(r.id), apps: appsByUser.get(r.id) ?? [] }))
    return Response.json({ users })
  })

const inviteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  title: z.string().trim().max(80).optional(),
  apps: z.array(z.string()).default([]),
})

// Invite a user: account without password + "set your password" email.
export const POST = (request: Request) =>
  handle(async () => {
    const s = await requireAdmin("users.manage")
    const body = await parseBody(request, inviteSchema)
    if (body.apps.length && !s.permissions.includes("access.manage")) throw new HttpError(403, "You can't grant app access.")
    const known = new Set(catalogApps.map((a) => a.id))
    let user
    try {
      user = await inviteUser({ name: body.name, email: body.email, title: body.title || null })
    } catch (err) {
      throw new HttpError(409, err instanceof Error ? err.message : "Could not create the user.")
    }
    const apps = body.apps.filter((a) => known.has(a))
    if (apps.length) await getDb().insert(schema.userAppAccess).values(apps.map((appId) => ({ userId: user.id, appId, grantedBy: s.admin.id })))
    await audit({ actor: actorOf(s), action: "user.invite", targetType: "user", targetId: user.id, after: { name: body.name, email: user.email, apps }, ipAddress: await clientIp() })
    return Response.json({ id: user.id }, { status: 201 })
  })
