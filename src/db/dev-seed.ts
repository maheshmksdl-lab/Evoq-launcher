import "server-only"
import { and, eq, inArray } from "drizzle-orm"
import { getAdminAuth, getUserAuth } from "@/lib/auth/instances"
import { devSeedTestAccounts } from "@/lib/dev-flags"
import { getDb, schema } from "./index"

/*
 * Local development test accounts. Runs on server start ONLY when
 * DEV_SEED_TEST_ACCOUNTS=true and NODE_ENV is not "production". The shared
 * password comes from DEV_TEST_PASSWORD (git-ignored .env.local), is hashed with
 * the app's own scrypt hasher, and is never written to the code or the logs.
 *
 * Idempotent: existing accounts are updated in place (password, role, status,
 * two-factor cleared so they sign in with email + password only). Nothing is
 * duplicated, and other accounts are left alone.
 */

const TEST_ACCOUNTS = [
  { realm: "admin", email: "superadmin@evoq.test", name: "Test Super Admin", role: "super_admin" },
  { realm: "admin", email: "manager@evoq.test", name: "Meera Iyer", role: "manager" },
  { realm: "user", email: "asha@evoq.test", name: "Asha Rao", apps: ["crm", "desk", "billing", "campaigns"] },
] as const

export async function seedDevAccounts() {
  if (!devSeedTestAccounts()) return
  const password = process.env.DEV_TEST_PASSWORD
  if (!password) {
    console.warn("[dev-seed] DEV_TEST_PASSWORD is not set; skipping test accounts.")
    return
  }
  const db = getDb()

  for (const acct of TEST_ACCOUNTS) {
    const auth = acct.realm === "admin" ? getAdminAuth() : getUserAuth()
    const ctx = await auth.$context
    const hash = await ctx.password.hash(password)

    let user = await ctx.internalAdapter.findUserByEmail(acct.email).then((r) => r?.user ?? null)
    if (!user) {
      user = await ctx.internalAdapter.createUser({ name: acct.name, email: acct.email, emailVerified: true }, { method: "admin" })
    }
    const credential = await ctx.internalAdapter.findCredentialAccount(user.id)
    if (credential) await ctx.internalAdapter.updatePassword(user.id, hash)
    else await ctx.internalAdapter.createAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: hash })

    if (acct.realm === "admin") {
      await db
        .update(schema.adminAccountUser)
        .set({ role: acct.role, status: "active", twoFactorEnabled: false, updatedAt: new Date() })
        .where(eq(schema.adminAccountUser.id, user.id))
      await db.delete(schema.adminTwoFactor).where(eq(schema.adminTwoFactor.userId, user.id))
      await db.delete(schema.adminSession).where(eq(schema.adminSession.userId, user.id))
    } else {
      await db
        .update(schema.userAccountUser)
        .set({ status: "active", twoFactorEnabled: false, updatedAt: new Date() })
        .where(eq(schema.userAccountUser.id, user.id))
      await db.delete(schema.userTwoFactor).where(eq(schema.userTwoFactor.userId, user.id))
      // Make sure the test user can open a few apps, without disturbing other grants.
      await db
        .insert(schema.userAppAccess)
        .values(acct.apps.map((appId) => ({ userId: user.id, appId, grantedBy: "dev-seed" })))
        .onConflictDoNothing()
    }
  }

  // Clear old failed attempts so a stale lockout can't block the test accounts.
  await db.delete(schema.loginEvents).where(and(eq(schema.loginEvents.success, false), inArray(schema.loginEvents.email, TEST_ACCOUNTS.map((a) => a.email))))
  console.info("[dev-seed] Local test accounts ready: superadmin@evoq.test, manager@evoq.test, asha@evoq.test")
}
