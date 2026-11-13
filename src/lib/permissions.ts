/*
 * Admin Portal roles and permissions.
 * Permission checks always run on the server (see requireAdmin); the client
 * only uses them to decide which navigation items to show.
 */

export const PERMISSIONS = [
  { id: "dashboard.view", label: "View dashboard and statistics" },
  { id: "users.view", label: "View users" },
  { id: "users.manage", label: "Add, edit and deactivate users" },
  { id: "users.delete", label: "Delete users" },
  { id: "access.manage", label: "Grant app access and decide access requests" },
  { id: "apps.manage", label: "Manage applications and subscriptions" },
  { id: "sessions.manage", label: "View and revoke user sessions" },
  { id: "logs.view", label: "View login activity and audit log" },
  { id: "settings.manage", label: "Change security and general settings" },
  { id: "admins.manage", label: "Manage admin accounts and roles" },
] as const

export type Permission = (typeof PERMISSIONS)[number]["id"]

export const ADMIN_ROLES = ["super_admin", "admin", "manager"] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export const ROLE_LABELS: Record<AdminRole | "user", string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  user: "User",
}

export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.id) as Permission[]

/** Defaults written on first start; Super Admin can change admin/manager later. */
export const DEFAULT_ROLE_PERMISSIONS: Record<Exclude<AdminRole, "super_admin">, Permission[]> = {
  admin: ["dashboard.view", "users.view", "users.manage", "users.delete", "access.manage", "apps.manage", "sessions.manage", "logs.view"],
  manager: ["dashboard.view", "users.view", "users.manage", "access.manage", "sessions.manage"],
}

/** Permissions that must stay with Super Admin only, so nobody can escalate themselves. */
export const SUPER_ADMIN_ONLY: Permission[] = ["admins.manage", "settings.manage"]

export const isAdminRole = (r: string): r is AdminRole => (ADMIN_ROLES as readonly string[]).includes(r)
