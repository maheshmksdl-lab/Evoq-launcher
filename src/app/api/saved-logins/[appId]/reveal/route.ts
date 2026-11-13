import { and, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { getDb, schema } from "@/db"
import { handle, HttpError, requireUser } from "@/lib/auth/guards"
import { decryptPassword, isUnlocked, UNLOCK_COOKIE } from "@/lib/vault"

// Returns the saved password, only while unlocked (launcher password re-entered in the last 5 minutes).
export const POST = (_req: NextRequest, ctx: RouteContext<"/api/saved-logins/[appId]/reveal">) =>
  handle(async () => {
    const { user } = await requireUser()
    if (!isUnlocked(user.id, (await cookies()).get(UNLOCK_COOKIE)?.value)) throw new HttpError(403, "locked")
    const { appId } = await ctx.params
    const [row] = await getDb()
      .select()
      .from(schema.savedLogins)
      .where(and(eq(schema.savedLogins.userId, user.id), eq(schema.savedLogins.appId, appId)))
    if (!row) throw new HttpError(404, "No saved login for this app.")
    const res = Response.json({ username: row.username, password: decryptPassword(user.id, appId, row.passwordEnc) })
    res.headers.set("Cache-Control", "no-store")
    return res
  })
