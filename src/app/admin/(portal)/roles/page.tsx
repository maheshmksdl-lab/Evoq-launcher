import { RequirePermission } from "@/components/admin/admin-shell"
import { RolesPage } from "@/components/admin/pages/people"

export default function Page() {
  return (
    <RequirePermission perm="admins.manage">
      <RolesPage />
    </RequirePermission>
  )
}
