import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { AdminResetSwitch } from "@/components/admin/admin-reset-switch"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Admin password · EVOQ" }

export default function AdminResetPasswordPage() {
  return (
    <AuthShell
      admin
      title="Admin password"
      subtitle="Set or reset your Admin Portal password."
      footer={<Link href="/admin/login" className="text-evoq-interactive hover:underline">Back to admin sign-in</Link>}
    >
      <Suspense>
        <AdminResetSwitch />
      </Suspense>
    </AuthShell>
  )
}
