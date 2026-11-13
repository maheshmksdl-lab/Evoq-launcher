import { and, count, desc, eq, gt, gte, sql } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { handle, requireAdmin } from "@/lib/auth/guards"
import { catalogApps } from "@/lib/data/apps"

// Key statistics and charts for the Admin Portal dashboard.
export const GET = () =>
  handle(async () => {
    const s = await requireAdmin("dashboard.view")
    const db = getDb()
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
    monthAgo.setHours(0, 0, 0, 0)

    const u = schema.userAccountUser
    const [[users], [admins], [sessions], [signInsToday], [failed24h], [pending], perDay, perApp] = await Promise.all([
      db.select({ total: count(), active: sql<number>`count(*) filter (where ${u.status} = 'active')`, mfa: sql<number>`count(*) filter (where ${u.twoFactorEnabled})` }).from(u),
      db.select({ n: count() }).from(schema.adminAccountUser),
      db.select({ n: count() }).from(schema.userSession).where(gt(schema.userSession.expiresAt, now)),
      db.select({ n: count() }).from(schema.loginEvents).where(and(eq(schema.loginEvents.realm, "user"), eq(schema.loginEvents.success, true), gte(schema.loginEvents.createdAt, startOfDay))),
      db.select({ n: count() }).from(schema.loginEvents).where(and(eq(schema.loginEvents.success, false), gte(schema.loginEvents.createdAt, dayAgo))),
      db.select({ n: count() }).from(schema.accessRequests).where(eq(schema.accessRequests.status, "pending")),
      db
        .select({ day: sql<string>`to_char(date_trunc('day', ${schema.loginEvents.createdAt}), 'YYYY-MM-DD')`, ok: sql<number>`count(*) filter (where ${schema.loginEvents.success})`, failed: sql<number>`count(*) filter (where not ${schema.loginEvents.success})` })
        .from(schema.loginEvents)
        .where(and(eq(schema.loginEvents.realm, "user"), gte(schema.loginEvents.createdAt, monthAgo)))
        .groupBy(sql`1`),
      db.select({ appId: schema.userAppAccess.appId, n: count() }).from(schema.userAppAccess).groupBy(schema.userAppAccess.appId),
    ])

    // Fill every day of the last 30 so the chart has no gaps.
    const byDay = new Map(perDay.map((d) => [d.day, d]))
    const signIns = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(monthAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const row = byDay.get(key)
      return { day: key, success: Number(row?.ok ?? 0), failed: Number(row?.failed ?? 0) }
    })

    const names = new Map(catalogApps.map((a) => [a.id, a.name]))
    const usersPerApp = perApp
      .map((p) => ({ appId: p.appId, name: names.get(p.appId) ?? p.appId, users: Number(p.n) }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 8)

    const recent = s.permissions.includes("logs.view")
      ? await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(6)
      : []

    const total = Number(users?.total ?? 0)
    const active = Number(users?.active ?? 0)
    return Response.json({
      stats: {
        totalUsers: total,
        activeUsers: active,
        inactiveUsers: total - active,
        mfaUsers: Number(users?.mfa ?? 0),
        admins: Number(admins?.n ?? 0),
        activeSessions: Number(sessions?.n ?? 0),
        signInsToday: Number(signInsToday?.n ?? 0),
        failedSignIns24h: Number(failed24h?.n ?? 0),
        pendingRequests: Number(pending?.n ?? 0),
      },
      signIns,
      usersPerApp,
      recent,
    })
  })
