import "server-only"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { twoFactor } from "better-auth/plugins/two-factor"
import { eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { sendEmail } from "@/lib/email"
import { SESSION_POLICY } from "@/lib/settings"

/*
 * Two completely separate Better Auth instances:
 *   - userAuth   → table set user_*,  cookie prefix "evoq",       mounted at /api/auth
 *   - adminAuth  → table set admin_*, cookie prefix "evoq_admin", mounted at /admin/api/auth,
 *                  cookies limited to the /admin path
 * A user account does not exist in the admin tables, so it can never sign in to /admin.
 * Self sign-up is disabled for both: users are invited by admins; the first
 * Super Admin is created once through /admin/setup.
 */

const isProd = process.env.NODE_ENV === "production"

/** Public origin for links in emails: configured URL, else the incoming request, else local dev. */
function publicOrigin(request?: Request) {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL.replace(/\/$/, "")
  const h = request?.headers
  const host = h?.get("x-forwarded-host") ?? h?.get("host")
  if (host) return `${h?.get("x-forwarded-proto") ?? (isProd ? "https" : "http")}://${host}`
  return "http://localhost:3000"
}

/** Link straight to our own set-password page (used for invitations and resets). */
const resetLink = (path: "/reset-password" | "/admin/reset-password", token: string, request?: Request) =>
  `${publicOrigin(request)}${path}?token=${encodeURIComponent(token)}`

function createUserAuth() {
  return betterAuth({
    appName: "EVOQ Launcher",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      transaction: false,
      schema: {
        user: schema.userAccountUser,
        session: schema.userSession,
        account: schema.userCredential,
        verification: schema.userVerification,
        twoFactor: schema.userTwoFactor,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: SESSION_POLICY.minPasswordLength,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, token }, request) => {
        const url = resetLink("/reset-password", token, request)
        await sendEmail({
          to: user.email,
          subject: "Set your EVOQ Launcher password",
          text: `Hi ${user.name},\n\nUse this link to set your EVOQ Launcher password. It expires in 1 hour.\n\n${url}\n\nIf you didn't expect this email, you can ignore it.`,
        })
      },
    },
    user: {
      additionalFields: {
        status: { type: "string", required: false, defaultValue: "active", input: false },
        title: { type: "string", required: false },
        phone: { type: "string", required: false },
        notifyNewSignIn: { type: "boolean", required: false, defaultValue: true },
        notifyAccess: { type: "boolean", required: false, defaultValue: true },
        notifySecurity: { type: "boolean", required: false, defaultValue: true },
        lastLoginAt: { type: "date", required: false, input: false },
      },
    },
    session: {
      expiresIn: SESSION_POLICY.user.idleSeconds, // sliding: idle timeout
      updateAge: 60 * 60,
    },
    rateLimit: { enabled: true, storage: "memory", window: 60, max: 60 },
    advanced: {
      cookiePrefix: "evoq",
      useSecureCookies: isProd,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: isProd },
    },
    databaseHooks: {
      session: {
        create: {
          // Deactivated users can never start a session.
          before: async (session) => {
            const [u] = await getDb()
              .select({ status: schema.userAccountUser.status })
              .from(schema.userAccountUser)
              .where(eq(schema.userAccountUser.id, session.userId))
            return u?.status === "active"
          },
        },
      },
    },
    plugins: [twoFactor({ issuer: "EVOQ Launcher" })],
  })
}

function createAdminAuth() {
  return betterAuth({
    appName: "EVOQ Admin Portal",
    secret: process.env.ADMIN_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    basePath: "/admin/api/auth",
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      transaction: false,
      schema: {
        user: schema.adminAccountUser,
        session: schema.adminSession,
        account: schema.adminCredential,
        verification: schema.adminVerification,
        twoFactor: schema.adminTwoFactor,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: SESSION_POLICY.minPasswordLength,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, token }, request) => {
        const url = resetLink("/admin/reset-password", token, request)
        await sendEmail({
          to: user.email,
          subject: "Set your EVOQ Admin Portal password",
          text: `Hi ${user.name},\n\nUse this link to set your EVOQ Admin Portal password. It expires in 1 hour.\n\n${url}\n\nYou'll be asked to set up two-factor authentication after signing in.`,
        })
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, defaultValue: "manager", input: false },
        status: { type: "string", required: false, defaultValue: "active", input: false },
        lastLoginAt: { type: "date", required: false, input: false },
      },
    },
    session: {
      expiresIn: SESSION_POLICY.admin.idleSeconds,
      updateAge: 5 * 60,
    },
    rateLimit: { enabled: true, storage: "memory", window: 60, max: 30 },
    advanced: {
      cookiePrefix: "evoq_admin",
      useSecureCookies: isProd,
      defaultCookieAttributes: { httpOnly: true, sameSite: "strict", secure: isProd, path: "/admin" },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            const [a] = await getDb()
              .select({ status: schema.adminAccountUser.status })
              .from(schema.adminAccountUser)
              .where(eq(schema.adminAccountUser.id, session.userId))
            return a?.status === "active"
          },
        },
      },
    },
    plugins: [twoFactor({ issuer: "EVOQ Admin Portal" })],
  })
}

type UserAuth = ReturnType<typeof createUserAuth>
type AdminAuth = ReturnType<typeof createAdminAuth>
const g = globalThis as unknown as { evoqUserAuth?: UserAuth; evoqAdminAuth?: AdminAuth }

/** Created lazily so builds don't open a database connection. */
export const getUserAuth = () => (g.evoqUserAuth ??= createUserAuth())
export const getAdminAuth = () => (g.evoqAdminAuth ??= createAdminAuth())
