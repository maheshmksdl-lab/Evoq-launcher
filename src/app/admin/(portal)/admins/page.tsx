import { RequirePermission } from "@/components/admin/admin-shell"
import { AdminsPage } from "@/components/admin/pages/people"

export default function Page() {
  return (
    <RequirePermission perm="admins.manage">
      <AdminsPage />
    </RequirePermission>
  )
}
