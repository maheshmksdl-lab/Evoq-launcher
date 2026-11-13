"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  AppWindow,
  FileClock,
  Gauge,
  Inbox,
  KeyRound,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { adminAuthClient } from "@/lib/auth/client"
import { ROLE_LABELS, type AdminRole, type Permission } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { Loading, useAdminQuery } from "./ui"

type Me = { id: string; name: string; email: string; role: AdminRole; mfaEnabled: boolean; permissions: Permission[] }

const MeContext = createContext<Me | null>(null)
/** Signed-in admin and permissions (UI only; the server enforces every action). Null while loading. */
export const useMe = () => useContext(MeContext)
export const useCan = () => {
  const me = useMe()
  return (p: Permission) => Boolean(me?.permissions.includes(p))
}

type NavItem = { href: string; label: string; icon: LucideIcon; perm: Permission }
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: Gauge, perm: "dashboard.view" }] },
  {
    group: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users, perm: "users.view" },
      { href: "/admin/admins", label: "Admins", icon: UserCog, perm: "admins.manage" },
      { href: "/admin/roles", label: "Roles", icon: KeyRound, perm: "admins.manage" },
    ],
  },
  {
    group: "Apps",
    items: [
      { href: "/admin/applications", label: "Applications", icon: AppWindow, perm: "apps.manage" },
      { href: "/admin/access", label: "Access", icon: Shield, perm: "access.manage" },
      { href: "/admin/requests", label: "Requests", icon: Inbox, perm: "access.manage" },
    ],
  },
  {
    group: "Security",
    items: [
      { href: "/admin/sessions", label: "Sessions", icon: Monitor, perm: "sessions.manage" },
      { href: "/admin/logins", label: "Login activity", icon: Activity, perm: "logs.view" },
      { href: "/admin/audit", label: "Audit log", icon: FileClock, perm: "logs.view" },
      { href: "/admin/security", label: "Security", icon: ShieldCheck, perm: "settings.manage" },
    ],
  },
  { group: "System", items: [{ href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings.manage" }] },
]

function Sidebar({ me, pathname, onNavigate }: { me: Me; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5 p-4">
      {NAV.map(({ group, items }) => {
        const visible = items.filter((i) => me.permissions.includes(i.perm))
        if (!visible.length) return null
        return (
          <div key={group}>
            <p className="label-mono text-muted-foreground mb-1.5 px-2 text-[10px]">{group}</p>
            <ul className="flex flex-col gap-0.5">
              {visible.map(({ href, label, icon: Icon }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-2 text-sm transition-colors",
                        active ? "bg-selected text-foreground shadow-[inset_2px_0_0_var(--selected-line)] font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { data: me, error } = useAdminQuery<Me>(["admin", "me"], "/admin/api/me")
  const [drawer, setDrawer] = useState(false)

  async function logout() {
    await adminAuthClient.signOut()
    router.replace("/admin/login")
    router.refresh()
  }

  const iconBtn = "text-muted-foreground hover:text-foreground hover:bg-muted inline-flex w-12 items-center justify-center border-l transition-colors"

  return (
    <div className="flex h-dvh flex-col">
      <header className="bg-surface flex h-12 shrink-0 items-stretch border-b">
        <button type="button" aria-label="Open menu" onClick={() => setDrawer(true)} className="text-muted-foreground hover:text-foreground flex w-12 items-center justify-center border-r lg:hidden">
          <Menu className="size-4" />
        </button>
        <Link href="/admin" className="flex items-center gap-2.5 pr-5 pl-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/evoq-logo.png" alt="EVOQ" width={98} height={20} className="h-5 w-auto dark:brightness-0 dark:invert" />
        </Link>
        <div className="flex items-center border-l pl-4">
          <span className="label-mono text-evoq-interactive dark:text-evoq-bright inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" /> Admin portal
          </span>
        </div>
        <div className="ml-auto flex items-stretch">
          {me && (
            <div className="hidden items-center gap-3 border-l px-4 text-xs sm:flex">
              <span className="label-mono border-evoq-tint text-evoq-interactive dark:text-evoq-tint border px-1.5 py-0.5 text-[10px]">{ROLE_LABELS[me.role]}</span>
              <span className="max-w-[180px] truncate font-medium">{me.name}</span>
            </div>
          )}
          <button type="button" aria-label="Toggle colour theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className={iconBtn}>
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </button>
          <button type="button" aria-label="Sign out of the Admin Portal" onClick={logout} className={iconBtn}>
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <MeContext.Provider value={me ?? null}>
        <div className="flex min-h-0 flex-1">
          <aside className="bg-surface hidden w-60 shrink-0 overflow-y-auto border-r lg:block">{me && <Sidebar me={me} pathname={pathname} />}</aside>
          {me && drawer && (
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
                <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
                <aside className="bg-surface relative h-full w-72 overflow-y-auto border-r">
                  <div className="flex h-12 items-center justify-between border-b px-4">
                    <span className="label-mono text-muted-foreground text-[10px]">Menu</span>
                    <button type="button" aria-label="Close menu" onClick={() => setDrawer(false)} className="text-muted-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                  <Sidebar me={me} pathname={pathname} onNavigate={() => setDrawer(false)} />
                </aside>
              </div>
            )}
          <main className="min-w-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
            {error ? (
              <p className="text-destructive py-6 text-sm">
                {error.message} <Link href="/admin/login" className="underline">Sign in again</Link>
              </p>
            ) : (
              children
            )}
          </main>
        </div>
      </MeContext.Provider>
    </div>
  )
}

/** Waits for the admin's permissions, then renders the page or a no-permission note (the API refuses too). */
export function RequirePermission({ perm, children }: { perm: Permission; children: ReactNode }) {
  const me = useMe()
  if (!me) return <Loading />
  if (!me.permissions.includes(perm)) return <p className="text-muted-foreground py-10 text-sm">You don&apos;t have permission to view this page.</p>
  return <>{children}</>
}
