import { getAdminSession, handle, HttpError, permissionsForRole } from "@/lib/auth/guards"

// Signed-in admin, role, permissions and MFA status (allowed before MFA is set up).
export const GET = () =>
  handle(async () => {
    const s = await getAdminSession()
    if (!s) throw new HttpError(401, "Admin sign-in required.")
    return Response.json({ ...s.admin, mfaEnabled: s.mfaEnabled, permissions: s.mfaOk ? await permissionsForRole(s.admin.role) : [] })
  })
