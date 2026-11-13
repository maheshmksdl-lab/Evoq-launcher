"use client"

import { ArrowUpRight, Info, Loader2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { useRequestAccess } from "@/lib/queries/apps"
import type { LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Props = { app: LauncherApp; compact?: boolean; onDetails?: () => void }

/** True when this user may open the app: the org subscribes and the user is granted. */
export const canOpenApp = (app: LauncherApp) => app.access === "granted" && (app.status === "installed" || app.status === "update")

export function AppActions({ app, compact = false, onDetails }: Props) {
  const mutation = useRequestAccess(app)
  const open = canOpenApp(app)
  const comingSoon = app.status === "coming-soon"
  const requested = app.access === "requested"

  function onPrimary() {
    if (open) {
      window.open(app.productUrl, "_blank", "noopener,noreferrer")
      return
    }
    mutation.mutate(undefined, {
      onSuccess: (a) => toast.success(`Access to ${a.name} requested. An admin will review it.`),
      onError: (err) => toast.error(`${app.name}: ${err.message}`),
    })
  }

  const label = comingSoon ? "Coming soon" : open ? "Open" : requested ? "Requested" : "Request access"

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={onPrimary}
        disabled={mutation.isPending || comingSoon || requested}
        className={cn(
          "label-mono focus-visible:ring-ring/60 inline-flex h-9 flex-1 items-center justify-center gap-2 font-semibold transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed",
          compact && "w-28 flex-none",
          open
            ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground border bg-transparent"
            : "bg-primary text-primary-foreground hover:bg-evoq-interactive dark:hover:bg-evoq-tint disabled:opacity-60",
        )}
      >
        {mutation.isPending && <Loader2 className="size-3.5 animate-spin" />}
        {mutation.isPending ? "Requesting" : label}
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
          {open && (
            <DropdownMenuItem onClick={() => window.open(app.productUrl, "_blank", "noopener,noreferrer")}>
              <ArrowUpRight />
              Open app
            </DropdownMenuItem>
          )}
          {open &&
            app.extraLinks?.map((l) => (
              <DropdownMenuItem key={l.href} onClick={() => window.open(l.href, "_blank", "noopener,noreferrer")}>
                <ArrowUpRight />
                {l.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
