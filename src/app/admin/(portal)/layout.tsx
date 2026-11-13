import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = { title: "Admin Portal · EVOQ" }

export default function AdminPortalLayout({ children }: LayoutProps<"/admin">) {
  // AdminShell reads the URL (active menu item), so it renders inside Suspense.
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
