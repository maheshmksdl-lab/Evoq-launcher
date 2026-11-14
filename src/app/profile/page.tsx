import type { Metadata } from "next"
import { ProfilePage } from "@/components/profile/profile-page"

export const metadata: Metadata = {
  title: "Profile settings | EVOQ Launcher",
}

export default function Page() {
  return <ProfilePage />
}
