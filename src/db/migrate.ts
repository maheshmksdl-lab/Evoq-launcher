import "server-only"
import { sql } from "drizzle-orm"
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator"
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator"
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions"
import { catalogDefaults } from "@/lib/data/apps"
import { getDb, schema } from "./index"

const globalForMigrate = globalThis as unknown as { evoqMigrated?: Promise<void> }

/** Applies SQL migrations and seeds defaults. Safe to call repeatedly. */
export function ensureDatabase(): Promise<void> {
  globalForMigrate.evoqMigrated ??= (async () => {
    const db = getDb()
    const folder = { migrationsFolder: "./drizzle" }
    if (process.env.DATABASE_URL) await migrateNeon(db as never, folder)
    else await migratePglite(db, folder)

    // Default app statuses (operational state that used to live in memory).
    await db
      .insert(schema.appSettings)
      .values(catalogDefaults().map((a) => ({ appId: a.id, status: a.status })))
      .onConflictDoNothing()

    // Default permissions for configurable admin roles.
    const rows = Object.entries(DEFAULT_ROLE_PERMISSIONS).flatMap(([role, perms]) => perms.map((permission) => ({ role, permission })))
    const existing = await db.select({ n: sql<number>`count(*)` }).from(schema.rolePermissions)
    if (Number(existing[0]?.n ?? 0) === 0) await db.insert(schema.rolePermissions).values(rows)
  })().catch((err) => {
    globalForMigrate.evoqMigrated = undefined
    throw err
  })
  return globalForMigrate.evoqMigrated
}
