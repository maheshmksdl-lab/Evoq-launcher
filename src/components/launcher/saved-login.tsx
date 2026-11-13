"use client"

import { useState, type FormEvent } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, KeyRound, Loader2, Lock, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { LauncherApp } from "@/lib/schemas/app"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppIcon } from "./status"

/* ---------- Data ---------- */

type SavedLogin = { appId: string; username: string; updatedAt: string }
const QUERY_KEY = ["saved-logins"]
const CLEAR_AFTER_MS = 30_000

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error((data as { error?: string }).error ?? "Something went wrong"), { status: res.status })
  return data as T
}

/** The user's saved logins (usernames only). Shared by every card through the query cache. */
export function useSavedLogins() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: () => call<{ logins: SavedLogin[] }>("/api/saved-logins"), staleTime: 60_000 })
}

export const useSavedLogin = (appId: string) => useSavedLogins().data?.logins.find((l) => l.appId === appId)

/* ---------- Clipboard ---------- */

/** Copies text and clears the clipboard 30 seconds later (best effort: needs the tab to stay focused). */
async function copy(text: string, label: string, clearLater: boolean) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    toast.error("Couldn't copy. Allow clipboard access for this site and try again.")
    return false
  }
  toast.success(clearLater ? `${label} copied. It clears from the clipboard in 30 seconds.` : `${label} copied.`)
  if (clearLater) setTimeout(() => navigator.clipboard.writeText("").catch(() => undefined), CLEAR_AFTER_MS)
  return true
}

export const copyUsername = (username: string) => copy(username, "Username", false)

/**
 * Copies the saved password. Returns "locked" when the launcher password hasn't
 * been re-entered recently, so the caller can ask for it.
 */
export async function copyPassword(appId: string): Promise<"copied" | "locked" | "failed"> {
  try {
    const { password } = await call<{ password: string }>(`/api/saved-logins/${encodeURIComponent(appId)}/reveal`, { method: "POST" })
    return (await copy(password, "Password", true)) ? "copied" : "failed"
  } catch (err) {
    if ((err as { status?: number }).status === 403) return "locked"
    toast.error(err instanceof Error ? err.message : "Couldn't copy the password")
    return "failed"
  }
}

/* ---------- Dialog ---------- */

const fieldClass = "h-10 rounded-none"
const primary = "label-mono bg-primary text-primary-foreground hover:bg-evoq-interactive inline-flex h-9 items-center justify-center gap-2 px-4 font-semibold transition-colors disabled:opacity-50"
const secondary = "label-mono bg-surface hover:border-evoq-tint inline-flex h-9 items-center justify-center gap-2 border px-4 font-semibold transition-colors disabled:opacity-50"
const linkBtn = "text-evoq-interactive dark:text-evoq-bright inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:opacity-50"

export function SavedLoginDialog({ app, open, onOpenChange }: { app: LauncherApp; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient()
  const saved = useSavedLogin(app.id)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [unlocking, setUnlocking] = useState(false)
  const [launcherPassword, setLauncherPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const showForm = editing || !saved

  const close = (o: boolean) => {
    onOpenChange(o)
    if (!o) {
      setEditing(false)
      setUnlocking(false)
      setPassword("")
      setLauncherPassword("")
      setError(null)
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await call(`/api/saved-logins/${encodeURIComponent(app.id)}`, { method: "PUT", body: { username, password } })
      await qc.invalidateQueries({ queryKey: QUERY_KEY })
      setPassword("")
      setEditing(false)
      toast.success(`Saved login for ${app.name} updated`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save")
    } finally {
      setBusy(false)
    }
  }

  async function copyPw() {
    const result = await copyPassword(app.id)
    if (result === "locked") setUnlocking(true)
  }

  async function unlock(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await call("/api/saved-logins/unlock", { method: "POST", body: { password: launcherPassword } })
      setLauncherPassword("")
      setUnlocking(false)
      await copyPw()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't unlock")
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await call(`/api/saved-logins/${encodeURIComponent(app.id)}`, { method: "DELETE" })
      await qc.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(`Saved login for ${app.name} removed`)
      close(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="rounded-none sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AppIcon app={app} size={32} />
            {app.name} · saved login
          </DialogTitle>
          <DialogDescription>
            Only you can see this. It&apos;s stored encrypted, and your password is only copied after you confirm your launcher password.
          </DialogDescription>
        </DialogHeader>

        {showForm ? (
          <form onSubmit={save} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sl-user">Username or email for {app.name}</Label>
              <Input id="sl-user" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className={fieldClass} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sl-pass">Password for {app.name}</Label>
              <Input id="sl-pass" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} required />
            </div>
            {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              {saved && (
                <button type="button" className={secondary} onClick={() => { setEditing(false); setError(null) }}>
                  Cancel
                </button>
              )}
              <button type="submit" className={primary} disabled={busy}>
                {busy && <Loader2 className="size-3.5 animate-spin" />}
                Save login
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[90px_1fr_auto] items-center gap-x-3 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Username</dt>
              <dd className="truncate font-medium">{saved!.username}</dd>
              <dd>
                <button type="button" className={linkBtn} onClick={() => copyUsername(saved!.username)}>
                  <Copy className="size-3.5" /> Copy
                </button>
              </dd>
              <dt className="text-muted-foreground">Password</dt>
              <dd className="tracking-widest">••••••••••</dd>
              <dd>
                <button type="button" className={linkBtn} onClick={copyPw}>
                  <Copy className="size-3.5" /> Copy
                </button>
              </dd>
            </dl>

            {unlocking && (
              <form onSubmit={unlock} className="bg-muted/50 flex flex-col gap-3 border p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="size-4" /> Confirm your launcher password
                </p>
                <Input
                  type="password"
                  aria-label="Launcher password"
                  autoComplete="current-password"
                  autoFocus
                  value={launcherPassword}
                  onChange={(e) => setLauncherPassword(e.target.value)}
                  className={fieldClass}
                  required
                />
                {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">Then copying stays one click for 5 minutes.</span>
                  <button type="submit" className={primary} disabled={busy || !launcherPassword}>
                    {busy && <Loader2 className="size-3.5 animate-spin" />}
                    Unlock and copy
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-between border-t pt-3">
              <button type="button" className={linkBtn} onClick={() => { setUsername(saved!.username); setPassword(""); setEditing(true); setUnlocking(false); setError(null) }}>
                <Pencil className="size-3.5" /> Update
              </button>
              <button type="button" disabled={busy} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400" onClick={remove}>
                <Trash2 className="size-3.5" /> Remove
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export { KeyRound as SavedLoginIcon }
