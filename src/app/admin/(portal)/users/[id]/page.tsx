import { RequirePermission } from "@/components/admin/admin-shell"
import { UserDetailPage } from "@/components/admin/pages/user-detail"

export default async function Page({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params
  return (
    <RequirePermission perm="users.view">
      <UserDetailPage id={id} />
    </RequirePermission>
  )
}
