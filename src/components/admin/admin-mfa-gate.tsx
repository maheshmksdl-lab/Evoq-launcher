"use client"

import { useRouter } from "next/navigation"
import { MfaSetup } from "@/components/auth/mfa-setup"

export function AdminMfaGate() {
  const router = useRouter()
  return (
    <MfaSetup
      realm="admin"
      onDone={() => {
        router.replace("/admin")
        router.refresh()
      }}
    />
  )
}
