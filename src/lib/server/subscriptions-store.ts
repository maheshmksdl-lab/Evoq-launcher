import "server-only"
import type { InstallStatus } from "@/lib/schemas/app"
import { getSql } from "./db"

/*
 * Per-user subscription state. A row overrides the catalog default for that
 * user and app, and survives logout, restarts and new serverless instances.
 */
let schemaReady: Promise<unknown> | undefined

async function ready() {
  const q = getSql()
  schemaReady ??= q`
    CREATE TABLE IF NOT EXISTS app_subscriptions (
      user_id    text        NOT NULL,
      app_id     text        NOT NULL,
      status     text        NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, app_id)
    )`.catch((e: unknown) => {
    schemaReady = undefined
    throw e
  })
  await schemaReady
  return q
}

export async function getSubscriptionOverrides(userId: string) {
  const q = await ready()
  const rows = (await q`SELECT app_id, status FROM app_subscriptions WHERE user_id = ${userId}`) as {
    app_id: string
    status: InstallStatus
  }[]
  return new Map(rows.map((r) => [r.app_id, r.status]))
}

export async function saveSubscription(userId: string, appId: string, status: "installed" | "available") {
  const q = await ready()
  await q`
    INSERT INTO app_subscriptions (user_id, app_id, status) VALUES (${userId}, ${appId}, ${status})
    ON CONFLICT (user_id, app_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`
}
