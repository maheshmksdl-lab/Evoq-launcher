import { desc, eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { handle, requireAdmin } from "@/lib/auth/guards"
import { catalogApps } from "@/lib/data/apps"

// Access requests raised from the launcher.
export const GET = (request: Request) =>
  handle(async () => {
    await requireAdmin("access.manage")
    const status = new URL(request.url).searchParams.get("status") ?? "pending"
    const r = schema.accessRequests
    const rows = await getDb()
      .select({ id: r.id, appId: r.appId, status: r.status, createdAt: r.createdAt, decidedAt: r.decidedAt, userId: r.userId, userName: schema.userAccountUser.name, userEmail: schema.userAccountUser.email })
      .from(r)
      .innerJoin(schema.userAccountUser, eq(schema.userAccountUser.id, r.userId))
      .where(status === "all" ? undefined : eq(r.status, status))
      .orderBy(desc(r.createdAt))
      .limit(200)
    const names = new Map(catalogApps.map((a) => [a.id, a.name]))
    return Response.json({ requests: rows.map((x) => ({ ...x, appName: names.get(x.appId) ?? x.appId })) })
  })
