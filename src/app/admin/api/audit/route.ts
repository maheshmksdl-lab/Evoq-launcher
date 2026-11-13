import { desc, ilike, or } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { handle, requireAdmin } from "@/lib/auth/guards"

// Read-only audit log of administrative actions. ?q= filters by action or admin email.
export const GET = (request: Request) =>
  handle(async () => {
    await requireAdmin("logs.view")
    const q = new URL(request.url).searchParams.get("q")?.trim()
    const t = schema.auditLogs
    const rows = await getDb()
      .select()
      .from(t)
      .where(q ? or(ilike(t.action, `%${q}%`), ilike(t.actorEmail, `%${q}%`), ilike(t.targetId, `%${q}%`)) : undefined)
      .orderBy(desc(t.createdAt))
      .limit(300)
    return Response.json({ entries: rows })
  })
