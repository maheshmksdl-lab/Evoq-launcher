import { Suspense } from "react"
import type { Metadata } from "next"
import { ResetPasswordForm } from "@/components/auth/auth-forms"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Set password · EVOQ Launcher" }

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Set your password" subtitle="Choose a password for your EVOQ Launcher account.">
      <Suspense>
        <ResetPasswordForm realm="user" />
      </Suspense>
    </AuthShell>
  )
}
