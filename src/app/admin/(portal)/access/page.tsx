import { RequirePermission } from "@/components/admin/admin-shell"
import { AccessPage } from "@/components/admin/pages/apps"

export default function Page() {
  return (
    <RequirePermission perm="access.manage">
      <AccessPage />
    </RequirePermission>
  )
}
