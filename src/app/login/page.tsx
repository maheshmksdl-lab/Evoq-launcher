import { Suspense } from "react"
import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/auth-forms"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata: Metadata = { title: "Log in · EVOQ Launcher" }

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to open and manage your EVOQ apps.">
      <Suspense>
        <SignInForm realm="user" />
      </Suspense>
    </AuthShell>
  )
}
