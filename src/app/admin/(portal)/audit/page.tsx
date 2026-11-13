import { RequirePermission } from "@/components/admin/admin-shell"
import { AuditPage } from "@/components/admin/pages/security"

export default function Page() {
  return (
    <RequirePermission perm="logs.view">
      <AuditPage />
    </RequirePermission>
  )
}
