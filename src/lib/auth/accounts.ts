import "server-only"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { getDb, schema } from "@/db"
import { getAdminAuth, getUserAuth } from "./instances"

/*
 * Account creation for invitations and first-time setup. Accounts are created
 * without a usable password; the person sets their own through an emailed link
 * (Better Auth password reset). Only the first Super Admin sets a password
 * directly, during the one-time /admin/setup step.
 */

type Realm = "user" | "admin"

async function createAccount(realm: Realm, input: { name: string; email: string; password?: string }) {
  const auth = realm === "user" ? getUserAuth() : getAdminAuth()
  const ctx = await auth.$context
  const email = input.email.toLowerCase()
  const existing = await ctx.internalAdapter.findUserByEmail(email)
  if (existing) throw new Error("An account with this email already exists.")

  const user = await ctx.internalAdapter.createUser({ name: input.name, email, emailVerified: true }, { method: "admin" })
  if (input.password) {
    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await ctx.password.hash(input.password),
    })
  }
  return user
}

/** Sends the "set your password" link (invitation or admin-triggered reset). */
export async function sendPasswordLink(realm: Realm, email: string) {
  const auth = realm === "user" ? getUserAuth() : getAdminAuth()
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: realm === "user" ? "/reset-password" : "/admin/reset-password" },
    headers: await headers(),
  })
}

export async function inviteUser(input: { name: string; email: string; title?: string | null }) {
  const user = await createAccount("user", input)
  if (input.title) await getDb().update(schema.userAccountUser).set({ title: input.title }).where(eq(schema.userAccountUser.id, user.id))
  await sendPasswordLink("user", user.email)
  return user
}

export async function inviteAdmin(input: { name: string; email: string; role: string }) {
  const admin = await createAccount("admin", input)
  await getDb().update(schema.adminAccountUser).set({ role: input.role }).where(eq(schema.adminAccountUser.id, admin.id))
  await sendPasswordLink("admin", admin.email)
  return admin
}

export async function createFirstSuperAdmin(input: { name: string; email: string; password: string }) {
  const admin = await createAccount("admin", input)
  await getDb().update(schema.adminAccountUser).set({ role: "super_admin" }).where(eq(schema.adminAccountUser.id, admin.id))
  return admin
}

/** A user's password must be set through the emailed link before they can sign in. */
export async function hasPassword(realm: Realm, userId: string) {
  const table = realm === "user" ? schema.userCredential : schema.adminCredential
  const rows = await getDb().select({ password: table.password }).from(table).where(eq(table.userId, userId))
  return rows.some((r) => Boolean(r.password))
}
