import { and, desc, eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { handle, requireAdmin } from "@/lib/auth/guards"

// Sign-in attempts for both realms. ?realm=user|admin&result=success|failed
export const GET = (request: Request) =>
  handle(async () => {
    await requireAdmin("logs.view")
    const url = new URL(request.url)
    const realm = url.searchParams.get("realm")
    const result = url.searchParams.get("result")
    const l = schema.loginEvents
    const rows = await getDb()
      .select({ id: l.id, realm: l.realm, email: l.email, success: l.success, reason: l.reason, ipAddress: l.ipAddress, userAgent: l.userAgent, createdAt: l.createdAt })
      .from(l)
      .where(
        and(
          realm === "user" || realm === "admin" ? eq(l.realm, realm) : undefined,
          result === "success" ? eq(l.success, true) : result === "failed" ? eq(l.success, false) : undefined,
        ),
      )
      .orderBy(desc(l.createdAt))
      .limit(300)
    return Response.json({ events: rows })
  })
