"use client"

import { ArrowUpRight, Info, Loader2, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useInstallApp } from "@/lib/queries/apps"
import type { LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const primaryLabel = {
  available: "Subscribe",
  installed: "Open",
  update: "Update",
  "coming-soon": "Coming soon",
} as const

type Props = { app: LauncherApp; compact?: boolean; onDetails?: () => void }

export function AppActions({ app, compact = false, onDetails }: Props) {
  const mutation = useInstallApp(app)
  const busy = mutation.isPending
  const unsubscribing = busy && mutation.variables === "uninstall"
  const canUnsubscribe = app.status === "installed" || app.status === "update"

  function run(action: "install" | "uninstall") {
    mutation.mutate(action, {
      onSuccess: (a) =>
        toast.success(action === "install" ? `${a.name} ${app.status === "update" ? "updated" : "subscribed"}` : `${a.name} unsubscribed`),
      onError: (err) => toast.error(`${app.name}: ${err.message}`),
    })
  }

  function onPrimary() {
    if (app.status === "installed") {
      window.open(app.productUrl, "_blank", "noopener,noreferrer")
      return
    }
    run("install")
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={busy || app.status === "coming-soon"}
        className={cn(
          "label-mono focus-visible:ring-ring/60 inline-flex h-9 flex-1 items-center justify-center gap-2 font-semibold transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed",
          compact && "w-28 flex-none",
          app.status === "installed"
            ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground border bg-transparent"
            : "bg-primary text-primary-foreground hover:bg-evoq-interactive dark:hover:bg-evoq-tint disabled:opacity-60",
        )}
      >
        {busy && <Loader2 className="size-3.5 animate-spin" />}
        {busy ? (unsubscribing ? "Unsubscribing" : app.status === "update" ? "Updating" : "Subscribing") : primaryLabel[app.status]}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`More actions for ${app.name}`}
          className="border-border bg-surface text-muted-foreground hover:text-foreground hover:border-evoq-tint focus-visible:ring-ring/60 data-popup-open:border-evoq-interactive inline-flex size-9 shrink-0 items-center justify-center border transition-colors outline-none focus-visible:ring-3"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onDetails && (
            <DropdownMenuItem onClick={onDetails}>
              <Info />
              App details
            </DropdownMenuItem>
          )}
          {app.status !== "coming-soon" && (
            <DropdownMenuItem onClick={() => window.open(app.productUrl, "_blank", "noopener,noreferrer")}>
              <ArrowUpRight />
              Open app
            </DropdownMenuItem>
          )}
          {app.status !== "coming-soon" &&
            app.extraLinks?.map((l) => (
              <DropdownMenuItem key={l.href} onClick={() => window.open(l.href, "_blank", "noopener,noreferrer")}>
                <ArrowUpRight />
                {l.label}
              </DropdownMenuItem>
            ))}
          {canUnsubscribe && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={busy} onClick={() => run("uninstall")}>
                <Trash2 />
                Unsubscribe
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
