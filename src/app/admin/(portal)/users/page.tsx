import { RequirePermission } from "@/components/admin/admin-shell"
import { UsersPage } from "@/components/admin/pages/users"

export default function Page() {
  return (
    <RequirePermission perm="users.view">
      <UsersPage />
    </RequirePermission>
  )
}
