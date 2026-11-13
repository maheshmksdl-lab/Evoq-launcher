import { eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { handle, requireUser } from "@/lib/auth/guards"

// The signed-in user's saved logins. Usernames only: passwords never leave the server here.
export const GET = () =>
  handle(async () => {
    const { user } = await requireUser()
    const rows = await getDb()
      .select({ appId: schema.savedLogins.appId, username: schema.savedLogins.username, updatedAt: schema.savedLogins.updatedAt })
      .from(schema.savedLogins)
      .where(eq(schema.savedLogins.userId, user.id))
    return Response.json({ logins: rows })
  })
