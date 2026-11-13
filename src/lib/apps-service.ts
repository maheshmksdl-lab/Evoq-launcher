import "server-only"
import { and, eq } from "drizzle-orm"
import { getDb, schema } from "@/db"
import { catalogApps } from "@/lib/data/apps"
import type { InstallStatus, LauncherApp } from "@/lib/schemas/app"

/*
 * Merges the static catalog with database state:
 *   app_setting      → organisation-level status (subscribed / available / ...), enabled, URL
 *   user_app_access  → which apps this user may open
 *   access_request   → pending requests
 */

export async function getAppSettings() {
  const rows = await getDb().select().from(schema.appSettings)
  return new Map(rows.map((r) => [r.appId, r]))
}

export async function listAppsForUser(userId: string): Promise<LauncherApp[]> {
  const db = getDb()
  const [settings, grants, requests] = await Promise.all([
    getAppSettings(),
    db.select({ appId: schema.userAppAccess.appId }).from(schema.userAppAccess).where(eq(schema.userAppAccess.userId, userId)),
    db
      .select({ appId: schema.accessRequests.appId })
      .from(schema.accessRequests)
      .where(and(eq(schema.accessRequests.userId, userId), eq(schema.accessRequests.status, "pending"))),
  ])
  const granted = new Set(grants.map((g) => g.appId))
  const requested = new Set(requests.map((r) => r.appId))

  return catalogApps
    .filter((a) => settings.get(a.id)?.enabled !== false)
    .map((a) => {
      const s = settings.get(a.id)
      const status = (s?.status ?? "available") as InstallStatus
      const access = granted.has(a.id) ? "granted" : requested.has(a.id) ? "requested" : "none"
      return { ...a, productUrl: s?.url || a.productUrl, status, access }
    })
}

/** True when the user may open the app: org subscribes and the user is granted. */
export function canOpen(app: LauncherApp) {
  return app.access === "granted" && (app.status === "installed" || app.status === "update")
}
