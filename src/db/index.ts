import "server-only"
import { mkdirSync } from "node:fs"
import { PGlite } from "@electric-sql/pglite"
import { neon } from "@neondatabase/serverless"
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http"
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite"
import * as schema from "./schema"

/*
 * Database connection.
 *  - Production / preview: Neon Postgres via DATABASE_URL.
 *  - Local development without DATABASE_URL: an embedded Postgres (PGlite)
 *    stored in .data/pglite, so the launcher runs with no external services.
 * Both are real Postgres, so the same schema and queries run everywhere.
 */

export type Database = PgliteDatabase<typeof schema>

const globalForDb = globalThis as unknown as { evoqDb?: Database; evoqPglite?: PGlite }

function create(): Database {
  const url = process.env.DATABASE_URL
  if (url) {
    // neon-http and pglite share Drizzle's Postgres query API.
    return drizzleNeon(neon(url), { schema, casing: "snake_case" }) as unknown as Database
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production.")
  }
  if (!globalForDb.evoqPglite) {
    mkdirSync(".data", { recursive: true })
    globalForDb.evoqPglite = new PGlite(".data/pglite")
  }
  return drizzlePglite(globalForDb.evoqPglite, { schema, casing: "snake_case" })
}

/** Lazily created, reused across hot reloads in development. */
export function getDb(): Database {
  globalForDb.evoqDb ??= create()
  return globalForDb.evoqDb
}

export { schema }
