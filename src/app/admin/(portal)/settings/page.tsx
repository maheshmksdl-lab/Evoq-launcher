import { RequirePermission } from "@/components/admin/admin-shell"
import { GeneralSettingsPage } from "@/components/admin/pages/security"

export default function Page() {
  return (
    <RequirePermission perm="settings.manage">
      <GeneralSettingsPage />
    </RequirePermission>
  )
}
