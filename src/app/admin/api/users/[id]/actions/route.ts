import { eq } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { sendPasswordLink } from "@/lib/auth/accounts"
import { clientIp, handle, HttpError, requireAdmin } from "@/lib/auth/guards"

/*
 * Credential actions on a user. Admins never see or set a user's password:
 *   reset-password  → emails the user a link to set a new one
 *   reset-mfa       → removes two-factor so the user can enrol again
 *   revoke-sessions → signs the user out on every device
 */
export const POST = (request: NextRequest, ctx: RouteContext<"/admin/api/users/[id]/actions">) =>
  handle(async () => {
    const { action } = await parseBody(request, z.object({ action: z.enum(["reset-password", "reset-mfa", "revoke-sessions"]) }))
    const s = await requireAdmin(action === "revoke-sessions" ? "sessions.manage" : "users.manage")
    const { id } = await ctx.params
    const db = getDb()
    const [user] = await db.select().from(schema.userAccountUser).where(eq(schema.userAccountUser.id, id))
    if (!user) throw new HttpError(404, "User not found.")

    if (action === "reset-password") {
      await sendPasswordLink("user", user.email)
    } else if (action === "reset-mfa") {
      await db.delete(schema.userTwoFactor).where(eq(schema.userTwoFactor.userId, id))
      await db.update(schema.userAccountUser).set({ twoFactorEnabled: false }).where(eq(schema.userAccountUser.id, id))
    } else {
      await db.delete(schema.userSession).where(eq(schema.userSession.userId, id))
    }
    await audit({ actor: actorOf(s), action: `user.${action}`, targetType: "user", targetId: id, ipAddress: await clientIp() })
    return Response.json({ ok: true })
  })
