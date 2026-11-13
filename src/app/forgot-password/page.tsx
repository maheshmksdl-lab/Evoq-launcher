import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/auth-forms"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Reset password · EVOQ Launcher" }

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={<Link href="/login" className="text-evoq-interactive hover:underline">Back to log in</Link>}
    >
      <ForgotPasswordForm realm="user" />
    </AuthShell>
  )
}
