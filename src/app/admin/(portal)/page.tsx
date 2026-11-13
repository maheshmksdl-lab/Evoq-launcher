import { RequirePermission } from "@/components/admin/admin-shell"
import { DashboardPage } from "@/components/admin/pages/dashboard"

export default function Page() {
  return (
    <RequirePermission perm="dashboard.view">
      <DashboardPage />
    </RequirePermission>
  )
}
