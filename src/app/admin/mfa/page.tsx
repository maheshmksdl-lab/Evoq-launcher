import type { Metadata } from "next"
import { AdminMfaGate } from "@/components/admin/admin-mfa-gate"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Set up two-factor · EVOQ Admin" }

export default function AdminMfaPage() {
  return (
    <AuthShell admin title="Set up two-factor authentication" subtitle="Required for every administrator before using the Admin Portal.">
      <AdminMfaGate />
    </AuthShell>
  )
}
