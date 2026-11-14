"use client"

import { useState, useSyncExternalStore, type FormEvent } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { DEMO_CREDENTIALS } from "@/lib/auth"
import { TitleBar } from "@/components/launcher/chrome"
import { Input } from "@/components/ui/input"

const PROFILE_KEY = "evoq.launcher.profile"
const PROFILE_EVENT = "evoq:profile-updated"
const DEFAULT_DISPLAY_NAME = "Admin"

function subscribeToProfile(callback: () => void) {
  window.addEventListener(PROFILE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(PROFILE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

function getDisplayName() {
  return window.localStorage.getItem(PROFILE_KEY) ?? DEFAULT_DISPLAY_NAME
}

export function ProfilePage() {
  const savedName = useSyncExternalStore(subscribeToProfile, getDisplayName, () => DEFAULT_DISPLAY_NAME)
  const [draftName, setDraftName] = useState<string | null>(null)
  const displayName = draftName ?? savedName

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = displayName.trim()
    if (!normalized) {
      toast.error("Enter a display name.")
      return
    }
    try {
      window.localStorage.setItem(PROFILE_KEY, normalized)
      window.dispatchEvent(new Event(PROFILE_EVENT))
      setDraftName(null)
      toast.success("Profile settings saved in this browser.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile settings.")
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <TitleBar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[960px] px-5 py-7 sm:px-8 sm:py-10">
          <Link href="/" className="label-mono text-muted-foreground hover:text-evoq-interactive inline-flex items-center gap-2">
            ← Back to launcher
          </Link>
          <p className="label-mono text-evoq-interactive mt-6">Account / Profile</p>
          <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Profile settings</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
            Manage the profile shown in this launcher. Profile changes are stored locally in this browser.
          </p>

          <form onSubmit={saveProfile} className="bg-surface mt-7 max-w-2xl border p-5 sm:p-7">
            <label className="block text-sm">
              <span className="label-mono text-muted-foreground mb-1.5 block">Display name</span>
              <Input required maxLength={60} value={displayName} onChange={(event) => setDraftName(event.target.value)} className="h-10 rounded-none" />
            </label>
            <label className="mt-5 block text-sm">
              <span className="label-mono text-muted-foreground mb-1.5 block">Account email</span>
              <Input value={DEMO_CREDENTIALS.username} readOnly aria-readonly className="bg-muted h-10 rounded-none" />
              <span className="text-muted-foreground mt-1.5 block text-xs">Email is managed by the demo sign-in and cannot be changed here.</span>
            </label>
            <div className="mt-6 border-t pt-5">
              <button type="submit" className="label-mono bg-primary text-primary-foreground h-10 px-5 font-semibold">Save profile</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
