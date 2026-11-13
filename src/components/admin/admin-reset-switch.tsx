"use client"

import { useSearchParams } from "next/navigation"
import { ForgotPasswordForm, ResetPasswordForm } from "@/components/auth/auth-forms"

/** With a token from an email: set a new password. Without one: request a link. */
export function AdminResetSwitch() {
  const params = useSearchParams()
  return params.get("token") || params.get("error") ? <ResetPasswordForm realm="admin" /> : <ForgotPasswordForm realm="admin" />
}
