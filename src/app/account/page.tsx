import { Suspense } from "react"
import type { Metadata } from "next"
import { AccountPortal } from "@/components/account/account-portal"

export const metadata: Metadata = { title: "Account settings · EVOQ Launcher" }

export default function AccountPage() {
  return (
    <Suspense>
      <AccountPortal />
    </Suspense>
  )
}
