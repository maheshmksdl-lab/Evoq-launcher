import { cookies, headers } from "next/headers"
import { z } from "zod"
import { isLockedOut, recordLogin } from "@/lib/activity"
import { getUserAuth } from "@/lib/auth/instances"
import { clientIp, handle, HttpError, requireUser } from "@/lib/auth/guards"
import { makeUnlockToken, UNLOCK_COOKIE, UNLOCK_SECONDS } from "@/lib/vault"

/*
 * Re-enter the launcher password to allow copying saved passwords for 5 minutes.
 * Wrong attempts count towards the same lockout as signing in.
 */
export const POST = (request: Request) =>
  handle(async () => {
    const { user } = await requireUser()
    const { password } = z.object({ password: z.string().min(1).max(256) }).parse(await request.json().catch(() => ({})))

    const lock = await isLockedOut("user", user.email)
    if (lock.locked) throw new HttpError(429, `Too many failed attempts. Try again in ${lock.minutes} minutes.`)

    const ctx = await getUserAuth().$context
    const account = await ctx.internalAdapter.findCredentialAccount(user.id)
    const ok = account?.password ? await ctx.password.verify({ hash: account.password, password }) : false
    if (!ok) {
      await recordLogin({ realm: "user", email: user.email, userId: user.id, success: false, reason: "reauth_failed", ipAddress: await clientIp(), userAgent: (await headers()).get("user-agent") })
      throw new HttpError(401, "That isn't your launcher password.")
    }
    ;(await cookies()).set(UNLOCK_COOKIE, makeUnlockToken(user.id), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/saved-logins",
      maxAge: UNLOCK_SECONDS,
    })
    return Response.json({ ok: true, seconds: UNLOCK_SECONDS })
  })
