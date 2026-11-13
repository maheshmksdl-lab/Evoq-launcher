import "server-only"
import { eq } from "drizzle-orm"
import { headers as nextHeaders } from "next/headers"
import { connection } from "next/server"
import { getDb, schema } from "@/db"
import { ALL_PERMISSIONS, isAdminRole, type AdminRole, type Permission } from "@/lib/permissions"
import { SESSION_POLICY } from "@/lib/settings"
import { getAdminAuth, getUserAuth } from "./instances"

/*
 * Server-side authorization. Every protected route handler calls one of these;
 * hiding UI is never the protection.
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Wraps a route handler: always dynamic (never prerendered at build time, since
 * every response depends on the session and the database), and converts thrown
 * HttpErrors into JSON responses.
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  await connection()
  try {
    return await fn()
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status })
    console.error("[api]", err instanceof Error ? err.message : "unexpected error")
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

const tooOld = (createdAt: Date, maxSeconds: number) => Date.now() - new Date(createdAt).getTime() > maxSeconds * 1000

/* ---------- Users ---------- */

export async function getUserSession(h?: Headers) {
  const result = await getUserAuth().api.getSession({ headers: h ?? (await nextHeaders()) })
  if (!result) return null
  const user = result.user as typeof result.user & { status?: string }
  if (user.status !== "active" || tooOld(result.session.createdAt, SESSION_POLICY.user.absoluteSeconds)) return null
  return result
}

export async function requireUser() {
  const s = await getUserSession()
  if (!s) throw new HttpError(401, "Please sign in.")
  return s
}

/* ---------- Admins ---------- */

export async function permissionsForRole(role: AdminRole): Promise<Permission[]> {
  if (role === "super_admin") return ALL_PERMISSIONS
  const rows = await getDb().select().from(schema.rolePermissions).where(eq(schema.rolePermissions.role, role))
  return rows.map((r) => r.permission as Permission).filter((p) => ALL_PERMISSIONS.includes(p))
}

export async function getAdminSession(h?: Headers) {
  const result = await getAdminAuth().api.getSession({ headers: h ?? (await nextHeaders()) })
  if (!result) return null
  const admin = result.user as typeof result.user & { role?: string; status?: string; twoFactorEnabled?: boolean | null }
  if (admin.status !== "active" || !admin.role || !isAdminRole(admin.role)) return null
  if (tooOld(result.session.createdAt, SESSION_POLICY.admin.absoluteSeconds)) return null
  return {
    ...result,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role as AdminRole },
    mfaEnabled: Boolean(admin.twoFactorEnabled),
  }
}

/**
 * Requires a signed-in admin with MFA set up, and (optionally) a permission.
 * Admins who haven't enrolled MFA yet can only reach the MFA setup endpoints.
 */
export async function requireAdmin(permission?: Permission) {
  const s = await getAdminSession()
  if (!s) throw new HttpError(401, "Admin sign-in required.")
  if (!s.mfaEnabled) throw new HttpError(403, "Set up two-factor authentication to continue.")
  const permissions = await permissionsForRole(s.admin.role)
  if (permission && !permissions.includes(permission)) throw new HttpError(403, "You don't have permission to do this.")
  return { ...s, permissions }
}

export async function clientIp() {
  const h = await nextHeaders()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null
}
