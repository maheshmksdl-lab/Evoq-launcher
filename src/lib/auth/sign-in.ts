import "server-only"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { isLockedOut, recordLogin, type Realm } from "@/lib/activity"
import { getAdminAuth, getUserAuth } from "./instances"

const bodySchema = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(256),
})

const GENERIC = "Incorrect email or password."

/**
 * Email + password sign-in for either realm, with lockout and login-activity
 * recording around Better Auth. Passwords are only ever handled by Better Auth
 * (hashed with scrypt) and are never logged.
 */
export async function signIn(realm: Realm, request: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Enter your email and password." }, { status: 400 })
  const { email, password } = parsed.data

  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
  const userAgent = request.headers.get("user-agent")
  const log = (success: boolean, reason: string, userId?: string) =>
    recordLogin({ realm, email, userId, success, reason, ipAddress, userAgent })

  const lock = await isLockedOut(realm, email)
  if (lock.locked) {
    await log(false, "locked_out")
    return Response.json(
      { error: `Too many failed attempts. Try again in ${lock.minutes} minutes, or reset your password.` },
      { status: 429 },
    )
  }

  const table = realm === "user" ? schema.userAccountUser : schema.adminAccountUser
  const [account] = await getDb().select({ id: table.id, status: table.status }).from(table).where(eq(table.email, email))
  if (!account || account.status !== "active") {
    await log(false, account ? "inactive" : "unknown_account")
    return Response.json({ error: account ? "This account is deactivated. Contact your administrator." : GENERIC }, { status: 401 })
  }

  const auth = realm === "user" ? getUserAuth() : getAdminAuth()
  let res: Response
  try {
    res = await auth.api.signInEmail({ body: { email, password, rememberMe: true }, headers: request.headers, asResponse: true })
  } catch {
    await log(false, "invalid_credentials", account.id)
    return Response.json({ error: GENERIC }, { status: 401 })
  }

  if (!res.ok) {
    await log(false, "invalid_credentials", account.id)
    return Response.json({ error: GENERIC }, { status: 401 })
  }

  const data = (await res.clone().json().catch(() => ({}))) as { twoFactorRedirect?: boolean }
  await log(true, data.twoFactorRedirect ? "password_ok_mfa_required" : "success", account.id)
  await getDb().update(table).set({ lastLoginAt: new Date() }).where(eq(table.id, account.id))
  return res
}
