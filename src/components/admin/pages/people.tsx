"use client"

import { useState, type FormEvent } from "react"
import { UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ROLE_LABELS, type AdminRole, type Permission } from "@/lib/permissions"
import { adminFetch, Badge, btn, Confirm, ErrorNote, Field, fmtDateTime, inputClass, Loading, PageHeader, Table, td, useAdminMutation, useAdminQuery } from "../ui"

/* ---------- Admins ---------- */

type AdminRow = { id: string; name: string; email: string; role: AdminRole; status: string; twoFactorEnabled: boolean; lastLoginAt: string | null; isSelf: boolean }
const roles: AdminRole[] = ["super_admin", "admin", "manager"]

function InviteAdmin() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", role: "manager" as AdminRole })
  const invite = useAdminMutation((body: typeof form) => adminFetch("/admin/api/admins", { method: "POST", body }), {
    success: (v) => `Admin invitation sent to ${v.email}`,
    invalidate: [["admin", "admins"]],
  })
  function submit(e: FormEvent) {
    e.preventDefault()
    invite.mutate(form, { onSuccess: () => { setOpen(false); setForm({ name: "", email: "", role: "manager" }) } })
  }
  return (
    <>
      <button type="button" className={btn.primary} onClick={() => setOpen(true)}>
        <UserPlus className="size-4" /> Invite admin
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite an administrator</DialogTitle>
            <DialogDescription>Admin accounts are separate from user accounts. They&apos;ll set a password by email and must set up two-factor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Full name" htmlFor="ad-name">
              <input id="ad-name" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Field>
            <Field label="Admin email" htmlFor="ad-email">
              <input id="ad-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="Role" htmlFor="ad-role">
              <select id="ad-role" className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button type="button" className={btn.secondary} onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className={btn.primary} disabled={invite.isPending}>Send invitation</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AdminsPage() {
  const { data, error, isPending } = useAdminQuery<{ admins: AdminRow[] }>(["admin", "admins"], "/admin/api/admins")
  const patch = useAdminMutation(({ id, body }: { id: string; body: object }) => adminFetch(`/admin/api/admins/${id}`, { method: "PATCH", body }), {
    success: "Admin updated",
    invalidate: [["admin", "admins"]],
  })
  const remove = useAdminMutation((id: string) => adminFetch(`/admin/api/admins/${id}`, { method: "DELETE" }), { success: "Admin removed", invalidate: [["admin", "admins"]] })

  return (
    <>
      <PageHeader title="Admins" description="Administrator accounts and roles. Only Super Admins can see this page." actions={<InviteAdmin />} />
      {isPending ? (
        <Loading />
      ) : !data ? (
        <ErrorNote error={error} />
      ) : (
        <Table head={["Admin", "Role", "Status", "Two-factor", "Last sign-in", ""]}>
          {data.admins.map((a) => (
            <tr key={a.id}>
              <td className={td}>
                <p className="font-medium">
                  {a.name} {a.isSelf && <span className="text-muted-foreground text-xs">(you)</span>}
                </p>
                <p className="text-muted-foreground text-xs">{a.email}</p>
              </td>
              <td className={td}>
                <select
                  aria-label={`Role for ${a.name}`}
                  className={`${inputClass} w-36`}
                  value={a.role}
                  disabled={a.isSelf}
                  onChange={(e) => patch.mutate({ id: a.id, body: { role: e.target.value } })}
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </td>
              <td className={td}>{a.status === "active" ? <Badge tone="good">Active</Badge> : <Badge>Inactive</Badge>}</td>
              <td className={td}>{a.twoFactorEnabled ? <Badge tone="good">On</Badge> : <Badge tone="warn">Not set up</Badge>}</td>
              <td className={`${td} text-muted-foreground text-xs`}>{fmtDateTime(a.lastLoginAt)}</td>
              <td className={`${td} text-right whitespace-nowrap`}>
                {!a.isSelf && (
                  <span className="inline-flex gap-3">
                    <button type="button" className={btn.ghost} onClick={() => patch.mutate({ id: a.id, body: { action: "reset-password" } })}>Password link</button>
                    {a.twoFactorEnabled && (
                      <button type="button" className={btn.ghost} onClick={() => patch.mutate({ id: a.id, body: { action: "reset-mfa" } })}>Reset 2FA</button>
                    )}
                    <button type="button" className={btn.ghost} onClick={() => patch.mutate({ id: a.id, body: { status: a.status === "active" ? "inactive" : "active" } })}>
                      {a.status === "active" ? "Deactivate" : "Reactivate"}
                    </button>
                    <Confirm
                      title={`Remove ${a.name}?`}
                      body="Their admin account and sessions are deleted. This can't be undone."
                      confirmLabel="Remove admin"
                      danger
                      onConfirm={() => remove.mutateAsync(a.id)}
                      trigger={(open) => <button type="button" className="text-xs font-medium text-red-600 hover:underline dark:text-red-400" onClick={open}>Remove</button>}
                    />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  )
}

/* ---------- Roles & permissions ---------- */

type RolesData = {
  roles: { role: AdminRole; label: string; editable: boolean; permissions: Permission[] }[]
  permissions: { id: Permission; label: string }[]
  superAdminOnly: Permission[]
}

export function RolesPage() {
  const { data, error, isPending, dataUpdatedAt } = useAdminQuery<RolesData>(["admin", "roles"], "/admin/api/roles")
  if (isPending) return <Loading />
  if (!data) return <ErrorNote error={error} />
  return <RolesGrid key={dataUpdatedAt} data={data} />
}

function RolesGrid({ data }: { data: RolesData }) {
  const [draft, setDraft] = useState<Record<string, Permission[]>>(() => Object.fromEntries(data.roles.map((r) => [r.role, r.permissions])))
  const save = useAdminMutation((role: "admin" | "manager") => adminFetch("/admin/api/roles", { method: "PUT", body: { role, permissions: draft[role] } }), {
    success: (r) => `${ROLE_LABELS[r]} permissions saved`,
    invalidate: [["admin", "roles"], ["admin", "me"]],
  })

  return (
    <>
      <PageHeader title="Roles and permissions" description="Super Admin always has every permission. Admin and settings management can't be given to other roles. Regular users never reach the Admin Portal." />
      <div className="overflow-x-auto border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-surface">
            <tr className="border-b">
              <th className="label-mono text-muted-foreground px-3 py-2.5 text-left text-[10px] font-normal">Permission</th>
              {data.roles.map((r) => (
                <th key={r.role} className="label-mono text-muted-foreground px-3 py-2.5 text-center text-[10px] font-normal">{r.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.permissions.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="px-3 py-2.5">{p.label}</td>
                {data.roles.map((r) => {
                  const locked = !r.editable || data.superAdminOnly.includes(p.id)
                  const checked = (draft[r.role] ?? []).includes(p.id)
                  return (
                    <td key={r.role} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${r.label}: ${p.label}`}
                        className="accent-[var(--primary)]"
                        checked={checked}
                        disabled={locked}
                        onChange={(e) =>
                          setDraft({ ...draft, [r.role]: e.target.checked ? [...(draft[r.role] ?? []), p.id] : (draft[r.role] ?? []).filter((x) => x !== p.id) })
                        }
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" className={btn.primary} disabled={save.isPending} onClick={() => save.mutate("admin")}>Save Admin role</button>
        <button type="button" className={btn.secondary} disabled={save.isPending} onClick={() => save.mutate("manager")}>Save Manager role</button>
      </div>
    </>
  )
}
