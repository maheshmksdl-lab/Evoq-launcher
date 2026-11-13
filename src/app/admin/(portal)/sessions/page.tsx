import { RequirePermission } from "@/components/admin/admin-shell"
import { SessionsPage } from "@/components/admin/pages/security"

export default function Page() {
  return (
    <RequirePermission perm="sessions.manage">
      <SessionsPage />
    </RequirePermission>
  )
}
