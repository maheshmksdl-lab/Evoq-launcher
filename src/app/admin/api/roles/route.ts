import { eq } from "drizzle-orm"
import { z } from "zod"
import { getDb, schema } from "@/db"
import { audit } from "@/lib/activity"
import { actorOf, parseBody } from "@/lib/admin-api"
import { clientIp, handle, HttpError, permissionsForRole, requireAdmin } from "@/lib/auth/guards"
import { ALL_PERMISSIONS, PERMISSIONS, ROLE_LABELS, SUPER_ADMIN_ONLY, type Permission } from "@/lib/permissions"

// The permission grid. Super Admin is fixed; admin and manager are configurable.
export const GET = () =>
  handle(async () => {
    await requireAdmin("admins.manage")
    const roles = await Promise.all(
      (["super_admin", "admin", "manager"] as const).map(async (role) => ({
        role,
        label: ROLE_LABELS[role],
        editable: role !== "super_admin",
        permissions: await permissionsForRole(role),
      })),
    )
    return Response.json({ roles, permissions: PERMISSIONS, superAdminOnly: SUPER_ADMIN_ONLY })
  })

const putSchema = z.object({ role: z.enum(["admin", "manager"]), permissions: z.array(z.string()) })

export const PUT = (request: Request) =>
  handle(async () => {
    const s = await requireAdmin("admins.manage")
    const { role, permissions } = await parseBody(request, putSchema)
    const next = permissions.filter((p): p is Permission => ALL_PERMISSIONS.includes(p as Permission))
    if (next.some((p) => SUPER_ADMIN_ONLY.includes(p))) throw new HttpError(400, "Admin and settings management stay with Super Admin.")
    const before = await permissionsForRole(role)
    const db = getDb()
    await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.role, role))
    if (next.length) await db.insert(schema.rolePermissions).values(next.map((permission) => ({ role, permission })))
    await audit({ actor: actorOf(s), action: "role.update", targetType: "role", targetId: role, before: { permissions: before }, after: { permissions: next }, ipAddress: await clientIp() })
    return Response.json({ role, permissions: next })
  })
