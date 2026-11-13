import { RequirePermission } from "@/components/admin/admin-shell"
import { ApplicationsPage } from "@/components/admin/pages/apps"

export default function Page() {
  return (
    <RequirePermission perm="apps.manage">
      <ApplicationsPage />
    </RequirePermission>
  )
}
