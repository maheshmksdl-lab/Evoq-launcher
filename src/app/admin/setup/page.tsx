import { Suspense } from "react"
import type { Metadata } from "next"
import { AdminSetupForm } from "@/components/admin/admin-setup-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Admin setup · EVOQ" }

export default function AdminSetupPage() {
  return (
    <AuthShell admin title="Create the first Super Admin" subtitle="One-time setup. This page stops working once an admin exists.">
      <Suspense>
        <AdminSetupForm />
      </Suspense>
    </AuthShell>
  )
}
