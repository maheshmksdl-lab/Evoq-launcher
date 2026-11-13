import { and, desc, eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { handle, requireUser } from "@/lib/auth/guards"

// The signed-in user's own recent sign-in attempts (User Portal → Security).
export const GET = () =>
  handle(async () => {
    const { user } = await requireUser()
    const rows = await getDb()
      .select({
        id: schema.loginEvents.id,
        success: schema.loginEvents.success,
        reason: schema.loginEvents.reason,
        ipAddress: schema.loginEvents.ipAddress,
        userAgent: schema.loginEvents.userAgent,
        createdAt: schema.loginEvents.createdAt,
      })
      .from(schema.loginEvents)
      .where(and(eq(schema.loginEvents.realm, "user"), eq(schema.loginEvents.email, user.email.toLowerCase())))
      .orderBy(desc(schema.loginEvents.createdAt))
      .limit(20)
    return Response.json({ events: rows })
  })
