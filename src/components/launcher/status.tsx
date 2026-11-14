import type { InstallStatus, LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"

const statusStyle: Record<InstallStatus, { label: string; className: string }> = {
  available: {
    label: "Unsubscribed",
    className: "border-evoq-tint bg-evoq-soft text-evoq-interactive dark:border-evoq-mid/60 dark:bg-evoq-indigo/30 dark:text-evoq-tint",
  },
  installed: {
    label: "Subscribed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  update: {
    label: "Update available",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  "coming-soon": {
    label: "Coming soon",
    className: "border-border bg-muted text-muted-foreground",
  },
}

export function StatusChip({ status, className }: { status: InstallStatus; className?: string }) {
  const s = statusStyle[status]
  return (
    <span className={cn("label-mono inline-flex h-5 items-center border px-1.5 text-[10px] leading-none", s.className, className)}>
      {s.label}
    </span>
  )
}

/**
 * The app's official logo (public/logos): a solid brand-colour tile, exactly as
 * on evoq.one, with no gradient.
 */
export function AppIcon({ app, size = 56 }: { app: LauncherApp; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={app.icon}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  )
}

export function AgentTag({ app }: { app: LauncherApp }) {
  if (!app.agent) return null
  return (
    <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 text-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={app.agent.avatar}
        alt=""
        width={20}
        height={20}
        className="ring-background size-5 shrink-0 rounded-full object-cover ring-2"
      />
      <span className="truncate">
        <span className="text-foreground font-medium">{app.agent.name}</span> · {app.agent.role}
      </span>
    </span>
  )
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
export const formatDate = (iso: string) => dateFmt.format(new Date(`${iso}T00:00:00Z`))
