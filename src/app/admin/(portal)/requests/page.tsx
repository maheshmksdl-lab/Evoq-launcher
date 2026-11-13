import { RequirePermission } from "@/components/admin/admin-shell"
import { RequestsPage } from "@/components/admin/pages/apps"

export default function Page() {
  return (
    <RequirePermission perm="access.manage">
      <RequestsPage />
    </RequirePermission>
  )
}
