import { Suspense } from "react"
import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/auth-forms"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Admin sign-in · EVOQ" }

export default function AdminLoginPage() {
  return (
    <AuthShell admin title="Admin sign-in" subtitle="Use your administrator account. User accounts can't sign in here.">
      <Suspense>
        <SignInForm realm="admin" />
      </Suspense>
    </AuthShell>
  )
}
