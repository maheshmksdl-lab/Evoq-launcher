"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react"
import { appDetailsQuery } from "@/lib/queries/apps"
import type { AppDetails, GallerySlide, LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { AppActions, canOpenApp } from "./app-actions"
import { EviScreen, OverviewScreen, WindowScreen } from "./product-screens"
import { AgentTag, AppIcon, formatDate, StatusChip } from "./status"

type Props = {
  /** Apps in the order the launcher currently shows them (for prev / next). */
  apps: LauncherApp[]
  openId: string | null
  onOpenChange: (id: string | null) => void
}

const navBtn =
  "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-evoq-tint focus-visible:ring-ring/60 inline-flex size-9 items-center justify-center border transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-40"

/**
 * Title accent = the logo's background colour. White / pale logo tiles
 * (Skillberry, Billing) would be invisible on the light header, so those use
 * the logo's mark colour (their primary) instead.
 */
function titleColor(app: LauncherApp) {
  const hex = app.color.logo.replace("#", "")
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.85 ? app.color.primary : app.color.logo
}

const sectionLabel = (n: string, text: string) => (
  <p className="label-mono text-muted-foreground">
    {n} <span className="text-evoq-subtle">/</span> {text}
  </p>
)

export function AppDetailsDialog({ apps, openId, onOpenChange }: Props) {
  const index = apps.findIndex((a) => a.id === openId)
  const app = index >= 0 ? apps[index] : undefined
  const prev = index > 0 ? apps[index - 1] : undefined
  const next = index >= 0 && index < apps.length - 1 ? apps[index + 1] : undefined

  return (
    <DialogPrimitive.Root open={!!app} onOpenChange={(open) => !open && onOpenChange(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-[#1F2430]/45 duration-150 supports-backdrop-filter:backdrop-blur-[2px]" />
        <DialogPrimitive.Popup
          onKeyDown={(e) => {
            if (e.target instanceof HTMLInputElement) return
            if (e.key === "ArrowLeft" && prev) onOpenChange(prev.id)
            if (e.key === "ArrowRight" && next) onOpenChange(next.id)
          }}
          className="bg-background data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0 fixed top-1/2 left-1/2 z-50 flex h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[1272px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border-t-2 border-t-[var(--selected-line)] shadow-2xl outline-none sm:h-[calc(100dvh-4rem)]"
        >
          {app && (
            <DetailsBody
              key={app.id}
              app={app}
              position={`${index + 1} of ${apps.length}`}
              onPrev={prev ? () => onOpenChange(prev.id) : undefined}
              onNext={next ? () => onOpenChange(next.id) : undefined}
            />
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

type BodyProps = { app: LauncherApp; position: string; onPrev?: () => void; onNext?: () => void }

function DetailsBody({ app, position, onPrev, onNext }: BodyProps) {
  const { data: details, error, refetch } = useQuery(appDetailsQuery(app.id))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {/* ---------- Header ---------- */}
      <header className="bg-selected relative border-b px-5 pt-5 pb-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <p className="label-mono text-muted-foreground pt-2">
            App details <span className="text-evoq-subtle">· {position}</span>
          </p>
          <div className="flex gap-2">
            <button type="button" aria-label="Previous app" onClick={onPrev} disabled={!onPrev} className={navBtn}>
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Next app" onClick={onNext} disabled={!onNext} className={navBtn}>
              <ChevronRight className="size-4" />
            </button>
            <DialogPrimitive.Close aria-label="Close" className={navBtn}>
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <AppIcon app={app} size={112} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <DialogPrimitive.Title className="font-heading text-[34px] leading-tight font-bold tracking-tight">
                  <span className="text-evoq-charcoal dark:text-foreground">EVOQ </span>
                  <span style={{ color: titleColor(app) }}>{app.name.replace(/^EVOQ\s+/, "")}</span>
                </DialogPrimitive.Title>
                <StatusChip app={app} />
              </div>
              <DialogPrimitive.Description className="text-foreground/85 mt-1 text-base">
                {details?.headline ?? app.description}
              </DialogPrimitive.Description>
              <p className="text-muted-foreground mt-2 text-sm">
                Version {app.version} · {formatDate(app.updatedAt)} · {app.category}
              </p>
            </div>
          </div>
          <div className="w-full lg:w-[310px]">
            <AppActions app={app} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {app.status === "coming-soon" ? (
            <span className="label-mono text-muted-foreground/70 border-foreground/15 bg-surface inline-flex h-9 items-center border px-4 font-semibold">
              Coming soon
            </span>
          ) : (
            (details?.links ?? [{ label: "Open app", href: app.productUrl }])
              // Only users who can open the app see a direct "Open app" link.
              .filter((l) => l.label !== "Open app" || canOpenApp(app))
              .map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono border-foreground/25 bg-surface hover:border-evoq-interactive hover:text-evoq-interactive inline-flex h-9 items-center gap-1.5 border px-4 font-semibold transition-colors"
              >
                {l.label} <ArrowUpRight className="size-3.5" />
              </a>
            ))
          )}
          {app.agent && (
            <span className="bg-surface ml-auto hidden h-9 items-center border px-3 sm:inline-flex">
              <AgentTag app={app} />
            </span>
          )}
        </div>
      </header>

      {/* ---------- Body ---------- */}
      {error ? (
        <div className="flex items-center gap-3 p-6 text-sm">
          <p className="text-destructive">{error.message}</p>
          <button type="button" onClick={() => refetch()} className="label-mono bg-primary text-primary-foreground h-9 px-4">
            Try again
          </button>
        </div>
      ) : !details ? (
        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]">
          <Skeleton className="aspect-[16/10] rounded-none" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-none" />
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <Gallery app={app} details={details} />
              <p className="text-foreground/85 mt-5 text-[15px] leading-relaxed">{details.about}</p>
            </div>

            <section aria-labelledby="features-heading">
              <h3 id="features-heading">{sectionLabel("01", "Features")}</h3>
              <ol className="mt-4 flex flex-col gap-2">
                {details.features.map((f, i) => (
                  <li key={f.title} className="bg-surface hover:border-evoq-tint border p-4 transition-colors">
                    <p className="flex items-baseline gap-4">
                      <span className="label-mono text-evoq-interactive dark:text-evoq-bright">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-heading text-base font-semibold">{f.title}</span>
                    </p>
                    <p className="text-muted-foreground mt-2 pl-[2.6rem] text-sm leading-relaxed">{f.body}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section aria-labelledby="release-heading" className="mt-10 border-t pt-8">
            <h3 id="release-heading">{sectionLabel("02", "Latest release")}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                ["Version", app.version],
                ["Released", formatDate(app.updatedAt)],
                ["Download", `${app.sizeMb} MB`],
                ["Platforms", details.release.platforms.join(", ")],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface border px-4 py-3">
                  <dt className="label-mono text-muted-foreground text-[10px]">{k}</dt>
                  <dd className="mt-1 text-[15px]">{v}</dd>
                </div>
              ))}
            </dl>
            <h4 className="font-heading mt-7 text-lg font-bold">What&apos;s changed</h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {details.release.changes.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <span aria-hidden className="bg-evoq-tint mt-2 size-1.5 shrink-0 rounded-full" />
                  {c}
                </li>
              ))}
            </ul>
            <a
              href={details.release.changelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-evoq-interactive dark:text-evoq-bright mt-5 inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Full changelog <ArrowUpRight className="size-3.5" />
            </a>
          </section>
        </div>
      )}
    </div>
  )
}

/* ---------- Screenshot gallery ---------- */

function Slide({ slide, app, details }: { slide: GallerySlide; app: LauncherApp; details: AppDetails }) {
  switch (slide.kind) {
    case "image":
      return (
        <div className="flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#F5F7FB]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.src} alt={slide.caption} className="size-full object-contain" />
        </div>
      )
    case "window":
      return <WindowScreen app={app} details={details} />
    case "overview":
      return <OverviewScreen app={app} details={details} />
    case "evi":
      return <EviScreen app={app} details={details} />
  }
}

function Gallery({ app, details }: { app: LauncherApp; details: AppDetails }) {
  const [i, setI] = useState(0)
  const slides = details.gallery
  const go = (d: number) => setI((v) => (v + d + slides.length) % slides.length)
  const arrow =
    "bg-surface/95 text-foreground hover:bg-surface focus-visible:ring-ring/60 absolute top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center border shadow-sm transition outline-none focus-visible:ring-3"

  return (
    <figure>
      <div className="relative border">
        <Slide slide={slides[i]} app={app} details={details} />
        {slides.length > 1 && (
          <>
            <button type="button" aria-label="Previous screenshot" onClick={() => go(-1)} className={cn(arrow, "left-3")}>
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Next screenshot" onClick={() => go(1)} className={cn(arrow, "right-3")}>
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>
      <figcaption className="label-mono text-muted-foreground mt-3">
        {slides[i].caption} · {i + 1}/{slides.length}
      </figcaption>

      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))` }}>
        {slides.map((s, k) => (
          <button
            key={k}
            type="button"
            aria-label={`Show screenshot ${k + 1}: ${s.caption}`}
            aria-current={k === i || undefined}
            onClick={() => setI(k)}
            className={cn(
              "focus-visible:ring-ring/60 relative overflow-hidden border-2 transition outline-none focus-visible:ring-3",
              k === i ? "border-[var(--selected-line)]" : "border-transparent opacity-60 hover:opacity-100",
            )}
          >
            <span className="pointer-events-none block">
              <Slide slide={s} app={app} details={details} />
            </span>
          </button>
        ))}
      </div>
    </figure>
  )
}
