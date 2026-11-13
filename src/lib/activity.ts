import "server-only"
import { and, count, eq, gte, isNull, ne, or } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { getSetting } from "@/lib/settings"

/* Login activity, account lockout and the audit log. */

export type Realm = "user" | "admin"

export async function recordLogin(e: {
  realm: Realm
  email: string
  userId?: string | null
  success: boolean
  reason?: string
  ipAddress?: string | null
  userAgent?: string | null
}) {
  await getDb()
    .insert(schema.loginEvents)
    .values({ id: crypto.randomUUID(), ...e, email: e.email.toLowerCase(), userId: e.userId ?? null, reason: e.reason ?? null })
}

/**
 * True when this email has too many failed attempts inside the lockout window.
 * Attempts refused *because* of the lockout ("locked_out") are logged for the
 * audit trail but don't count, so retrying can't extend the lockout forever:
 * it ends lockoutMinutes after the last real failed attempt.
 */
export async function isLockedOut(realm: Realm, email: string) {
  const { lockoutThreshold, lockoutMinutes } = await getSetting("security")
  const since = new Date(Date.now() - lockoutMinutes * 60 * 1000)
  const [row] = await getDb()
    .select({ n: count() })
    .from(schema.loginEvents)
    .where(
      and(
        eq(schema.loginEvents.realm, realm),
        eq(schema.loginEvents.email, email.toLowerCase()),
        eq(schema.loginEvents.success, false),
        or(isNull(schema.loginEvents.reason), ne(schema.loginEvents.reason, "locked_out")),
        gte(schema.loginEvents.createdAt, since),
      ),
    )
  return { locked: (row?.n ?? 0) >= lockoutThreshold, minutes: lockoutMinutes }
}

/** Append-only audit entry for an administrative action. */
export async function audit(e: {
  actor: { id: string; email: string }
  action: string
  targetType: string
  targetId?: string | null
  before?: unknown
  after?: unknown
  ipAddress?: string | null
}) {
  await getDb()
    .insert(schema.auditLogs)
    .values({
      id: crypto.randomUUID(),
      actorId: e.actor.id,
      actorEmail: e.actor.email,
      action: e.action,
      targetType: e.targetType,
      targetId: e.targetId ?? null,
      before: (e.before ?? null) as never,
      after: (e.after ?? null) as never,
      ipAddress: e.ipAddress ?? null,
    })
}
