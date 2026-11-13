import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, type PgColumnBuilderBase } from "drizzle-orm/pg-core"

/*
 * Database schema for the EVOQ Launcher.
 *
 * Users and admins are deliberately kept in SEPARATE tables (user_* vs admin_*)
 * with separate sessions, so a user credential can never authenticate to the
 * Admin Portal. Both sets follow Better Auth's core schema plus its two-factor
 * plugin tables.
 */

const now = () => timestamp({ withTimezone: true }).notNull().defaultNow()

/** Better Auth core + two-factor tables, generated once per realm (user / admin). */
function authTables<P extends "user" | "admin", X extends Record<string, PgColumnBuilderBase>>(prefix: P, extraUserColumns: X) {
  const user = pgTable(`${prefix}_account_user` as `${P}_account_user`, {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull().unique(),
    emailVerified: boolean().notNull().default(false),
    image: text(),
    twoFactorEnabled: boolean().default(false),
    createdAt: now(),
    updatedAt: now(),
    ...extraUserColumns,
  })

  const session = pgTable(
    `${prefix}_session`,
    {
      id: text().primaryKey(),
      expiresAt: timestamp({ withTimezone: true }).notNull(),
      token: text().notNull().unique(),
      createdAt: now(),
      updatedAt: now(),
      ipAddress: text(),
      userAgent: text(),
      userId: text()
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    },
    (t) => [index(`${prefix}_session_user_idx`).on(t.userId)],
  )

  const account = pgTable(
    `${prefix}_credential`,
    {
      id: text().primaryKey(),
      accountId: text().notNull(),
      providerId: text().notNull(),
      userId: text()
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      accessToken: text(),
      refreshToken: text(),
      idToken: text(),
      accessTokenExpiresAt: timestamp({ withTimezone: true }),
      refreshTokenExpiresAt: timestamp({ withTimezone: true }),
      scope: text(),
      password: text(),
      createdAt: now(),
      updatedAt: now(),
    },
    (t) => [index(`${prefix}_credential_user_idx`).on(t.userId)],
  )

  const verification = pgTable(`${prefix}_verification`, {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: now(),
    updatedAt: now(),
  })

  const twoFactor = pgTable(
    `${prefix}_two_factor`,
    {
      id: text().primaryKey(),
      secret: text().notNull(),
      backupCodes: text().notNull(),
      userId: text()
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
      verified: boolean().default(true),
      failedVerificationCount: integer().default(0),
      lockedUntil: timestamp({ withTimezone: true }),
    },
    (t) => [index(`${prefix}_two_factor_user_idx`).on(t.userId), index(`${prefix}_two_factor_secret_idx`).on(t.secret)],
  )

  return { user, session, account, verification, twoFactor }
}

/* ---------- Users (launcher + User Portal) ---------- */

export const users = authTables("user", {
  status: text().notNull().default("active"), // active | inactive
  title: text(),
  phone: text(),
  notifyNewSignIn: boolean().notNull().default(true),
  notifyAccess: boolean().notNull().default(true),
  notifySecurity: boolean().notNull().default(true),
  lastLoginAt: timestamp({ withTimezone: true }),
})

/* ---------- Admins (Admin Portal only) ---------- */

export const admins = authTables("admin", {
  role: text().notNull().default("manager"), // super_admin | admin | manager
  status: text().notNull().default("active"),
  lastLoginAt: timestamp({ withTimezone: true }),
})

// Individual exports so drizzle-kit picks every table up for migrations.
export const userAccountUser = users.user
export const userSession = users.session
export const userCredential = users.account
export const userVerification = users.verification
export const userTwoFactor = users.twoFactor
export const adminAccountUser = admins.user
export const adminSession = admins.session
export const adminCredential = admins.account
export const adminVerification = admins.verification
export const adminTwoFactor = admins.twoFactor

/* ---------- Roles & permissions (admin roles are configurable) ---------- */

export const rolePermissions = pgTable(
  "role_permission",
  {
    role: text().notNull(),
    permission: text().notNull(),
  },
  (t) => [primaryKey({ columns: [t.role, t.permission] })],
)

/* ---------- Applications, subscriptions and access ---------- */

/** Operational settings per app; descriptive catalog data stays in code. */
export const appSettings = pgTable("app_setting", {
  appId: text().primaryKey(),
  status: text().notNull(), // subscribed | available | update | coming-soon
  enabled: boolean().notNull().default(true),
  url: text(),
  updatedAt: now(),
})

export const userAppAccess = pgTable(
  "user_app_access",
  {
    userId: text()
      .notNull()
      .references(() => users.user.id, { onDelete: "cascade" }),
    appId: text().notNull(),
    grantedBy: text(),
    grantedAt: now(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.appId] })],
)

export const accessRequests = pgTable(
  "access_request",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.user.id, { onDelete: "cascade" }),
    appId: text().notNull(),
    status: text().notNull().default("pending"), // pending | approved | denied
    note: text(),
    createdAt: now(),
    decidedBy: text(),
    decidedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("access_request_status_idx").on(t.status)],
)

/* ---------- Activity ---------- */

export const loginEvents = pgTable(
  "login_event",
  {
    id: text().primaryKey(),
    realm: text().notNull(), // user | admin
    email: text().notNull(),
    userId: text(),
    success: boolean().notNull(),
    reason: text(),
    ipAddress: text(),
    userAgent: text(),
    createdAt: now(),
  },
  (t) => [index("login_event_email_idx").on(t.realm, t.email, t.createdAt), index("login_event_created_idx").on(t.createdAt)],
)

/** Append-only record of administrative actions. Never updated or deleted by the app. */
export const auditLogs = pgTable(
  "audit_log",
  {
    id: text().primaryKey(),
    actorId: text().notNull(),
    actorEmail: text().notNull(),
    action: text().notNull(),
    targetType: text().notNull(),
    targetId: text(),
    before: jsonb(),
    after: jsonb(),
    ipAddress: text(),
    createdAt: now(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
)

/* ---------- System settings ---------- */

export const systemSettings = pgTable("system_setting", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedBy: text(),
  updatedAt: now(),
})
