"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Search, UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCan } from "../admin-shell"
import { adminFetch, Badge, btn, ErrorNote, Field, fmtDateTime, inputClass, Loading, PageHeader, Table, td, useAdminMutation, useAdminQuery } from "../ui"

export type AdminApp = { id: string; name: string; icon: string; status: string; enabled: boolean; users: number }
type UserRow = { id: string; name: string; email: string; title: string | null; status: string; twoFactorEnabled: boolean; passwordSet: boolean; lastLoginAt: string | null; apps: string[] }

function InviteUser({ apps }: { apps: AdminApp[] }) {
  const can = useCan()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", title: "", apps: [] as string[] })
  const invite = useAdminMutation((body: typeof form) => adminFetch("/admin/api/users", { method: "POST", body }), {
    success: (v) => `Invitation sent to ${v.email}`,
    invalidate: [["admin", "users"], ["admin", "dashboard"]],
  })
  const grantable = apps.filter((a) => a.status !== "coming-soon")

  function submit(e: FormEvent) {
    e.preventDefault()
    invite.mutate(form, {
      onSuccess: () => {
        setOpen(false)
        setForm({ name: "", email: "", title: "", apps: [] })
      },
    })
  }

  return (
    <>
      <button type="button" className={btn.primary} onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Invite user
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>They&apos;ll get an email to set their own password. You never see or set it.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="inv-name">
                <input id="inv-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Job title" htmlFor="inv-title">
                <input id="inv-title" className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </Field>
            </div>
            <Field label="Email" htmlFor="inv-email">
              <input id="inv-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            {can("access.manage") && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium">App access</legend>
                <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto border p-2">
                  {grantable.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="accent-[var(--primary)]"
                        checked={form.apps.includes(a.id)}
                        onChange={(e) => setForm({ ...form, apps: e.target.checked ? [...form.apps, a.id] : form.apps.filter((x) => x !== a.id) })}
                      />
                      {a.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className={btn.secondary} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={btn.primary} disabled={invite.isPending}>
                Send invitation
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function UsersPage() {
  const can = useCan()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const params = new URLSearchParams({ status, ...(q.trim() && { q: q.trim() }) })
  const users = useAdminQuery<{ users: UserRow[] }>(["admin", "users", status, q.trim()], `/admin/api/users?${params}`)
  const apps = useAdminQuery<{ apps: AdminApp[] }>(["admin", "apps"], "/admin/api/apps")
  const appName = new Map((apps.data?.apps ?? []).map((a) => [a.id, a.name]))

  return (
    <>
      <PageHeader title="Users" description="Launcher accounts. Admins are managed separately." actions={can("users.manage") && <InviteUser apps={apps.data?.apps ?? []} />} />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input aria-label="Search users" placeholder="Search name or email" className={`${inputClass} w-full pl-9`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select aria-label="Filter by status" className={`${inputClass} w-40`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {users.isPending ? (
        <Loading />
      ) : users.error ? (
        <ErrorNote error={users.error} />
      ) : (
        <Table head={["Name", "Status", "Two-factor", "Apps", "Last sign-in"]} empty={users.data.users.length === 0}>
          {users.data.users.map((u) => (
            <tr key={u.id} className="hover:bg-muted/50">
              <td className={td}>
                <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                  {u.name}
                </Link>
                <p className="text-muted-foreground text-xs">{u.email}</p>
              </td>
              <td className={td}>
                {u.status === "active" ? (u.passwordSet ? <Badge tone="good">Active</Badge> : <Badge tone="brand">Invited</Badge>) : <Badge>Inactive</Badge>}
              </td>
              <td className={td}>{u.twoFactorEnabled ? <Badge tone="good">On</Badge> : <Badge>Off</Badge>}</td>
              <td className={`${td} text-muted-foreground text-xs`}>{u.apps.length ? u.apps.map((a) => appName.get(a) ?? a).join(", ") : "None"}</td>
              <td className={`${td} text-muted-foreground text-xs`}>{fmtDateTime(u.lastLoginAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  )
}
