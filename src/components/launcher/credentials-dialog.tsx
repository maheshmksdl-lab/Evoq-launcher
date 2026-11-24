"use client"

import { useState } from "react"
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { AppCredentials } from "@/lib/credentials"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type CredentialsMode = "view" | "edit"

type Props = {
  appName: string
  mode: CredentialsMode
  hasCredentials: boolean
  credentials: AppCredentials | null
  loading: boolean
  loadError: string | null
  saving: boolean
  onModeChange: (m: CredentialsMode) => void
  onSave: (c: AppCredentials) => void
  onClose: () => void
}

export function CredentialsDialog(props: Props) {
  const waiting = props.hasCredentials && !props.credentials

  return (
    <Dialog open onOpenChange={(o) => !o && props.onClose()}>
      <DialogContent>
        {waiting ? (
          <div className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Credentials</DialogTitle>
              <DialogDescription>{props.loadError ? "Could not load the saved credentials." : "Loading…"}</DialogDescription>
            </DialogHeader>
            {props.loading && <Loader2 className="text-muted-foreground size-5 animate-spin" />}
            {props.loadError && <p className="text-destructive text-sm">{props.loadError}</p>}
          </div>
        ) : /* key resets local form state whenever the mode switches */ props.mode === "edit" ? (
          <EditForm key="edit" {...props} />
        ) : (
          <ViewPanel key="view" {...props} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ appName, credentials, saving, onSave, onClose }: Props) {
  const [username, setUsername] = useState(credentials?.username ?? "")
  const [password, setPassword] = useState(credentials?.password ?? "")
  const [show, setShow] = useState(false)
  const valid = username.trim() !== "" && password !== ""

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    onSave({ username: username.trim(), password })
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{credentials ? "Edit" : "Save"} credentials</DialogTitle>
        <DialogDescription>Login for {appName}. Stored only in this browser.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="cred-username">Username</Label>
        <Input id="cred-username" autoComplete="off" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cred-password">Password</Label>
        <div className="flex gap-2">
          <Input
            id="cred-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="button" variant="outline" size="icon" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff /> : <Eye />}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

function ViewPanel({ appName, credentials, onModeChange }: Props) {
  const [show, setShow] = useState(false)
  if (!credentials) return null

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Saved credentials</DialogTitle>
        <DialogDescription>Login for {appName}.</DialogDescription>
      </DialogHeader>
      <Field label="Username" value={credentials.username} />
      <Field
        label="Password"
        value={credentials.password}
        masked={!show}
        extra={
          <Button type="button" variant="outline" size="icon" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
            {show ? <EyeOff /> : <Eye />}
          </Button>
        }
      />
      <DialogFooter>
        <Button type="button" onClick={() => onModeChange("edit")}>
          Edit
        </Button>
      </DialogFooter>
    </div>
  )
}

function Field({ label, value, masked, extra }: { label: string; value: string; masked?: boolean; extra?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input readOnly value={masked ? "•".repeat(Math.min(value.length, 16)) : value} className="font-mono" />
        {extra}
        <Button type="button" variant="outline" size="icon" aria-label={`Copy ${label.toLowerCase()}`} onClick={copy}>
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}
