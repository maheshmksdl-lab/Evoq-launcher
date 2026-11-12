import { Check, Loader2, Plus, Search, Sparkles } from "lucide-react"
import type { AppDetails, LauncherApp } from "@/lib/schemas/app"
import { cn } from "@/lib/utils"

/*
 * Drawn product screens for the App Details gallery. They follow the look of the
 * real EVOQ apps (light shell, left nav, product colour on primary actions) so
 * apps without screenshots still get a consistent, recognisable preview.
 * Fixed 16:10 frame; text scales with the container via cqw units.
 */

type ScreenProps = { app: LauncherApp; details: AppDetails }

/** Renders "**bold**" segments from EVI scene copy. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
      )}
    </>
  )
}

function Shell({ app, details, active, children }: ScreenProps & { active: number; children: React.ReactNode }) {
  const c = app.color.primary
  return (
    <div className="@container flex aspect-[16/10] w-full overflow-hidden bg-[#F5F7FB] text-[#1F2430] select-none">
      <aside className="flex w-[19%] shrink-0 flex-col gap-[0.6cqw] border-r border-[#E6EAF0] bg-white p-[1.4cqw]">
        <div className="mb-[1cqw] flex items-center gap-[0.8cqw]">
          <span className="flex size-[3.2cqw] items-center justify-center rounded-[0.6cqw]" style={{ background: c }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={app.icon} alt="" className="size-[1.8cqw]" />
          </span>
          <span className="truncate text-[1.6cqw] font-bold">{app.name}</span>
        </div>
        {details.window.nav.map((n, i) => (
          <span
            key={n}
            className={cn("truncate rounded-[0.5cqw] px-[0.8cqw] py-[0.6cqw] text-[1.15cqw]", i === active ? "font-semibold" : "text-[#5F6B7A]")}
            style={i === active ? { background: `${c}14`, color: c } : undefined}
          >
            {n}
          </span>
        ))}
        <span className="mt-auto flex items-center gap-[0.6cqw] text-[1cqw] text-[#667085]">
          <span className="size-[2.2cqw] rounded-full bg-[#E6EAF0]" />
          Marcus Bell
        </span>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col p-[2cqw]">{children}</div>
    </div>
  )
}

function Tag({ text, flag, color }: { text: string; flag?: boolean; color: string }) {
  return (
    <span
      className="shrink-0 rounded-full px-[0.8cqw] py-[0.2cqw] text-[0.95cqw] font-semibold whitespace-nowrap"
      style={flag ? { background: "#FEF3F2", color: "#B42318" } : { background: `${color}12`, color }}
    >
      {text}
    </span>
  )
}

/** Main workspace: list rows or a Kanban board. */
export function WindowScreen({ app, details }: ScreenProps) {
  const w = details.window
  const c = app.color.primary
  return (
    <Shell app={app} details={details} active={w.layout === "board" ? 2 : 1}>
      <div className="flex items-start justify-between gap-[1cqw]">
        <div className="min-w-0">
          <p className="truncate text-[2.2cqw] font-bold tracking-tight">{w.title}</p>
          <p className="truncate text-[1.15cqw] text-[#667085]">{w.subtitle}</p>
        </div>
        <span className="flex shrink-0 items-center gap-[0.4cqw] rounded-[0.6cqw] px-[1.2cqw] py-[0.7cqw] text-[1.15cqw] font-semibold text-white" style={{ background: c }}>
          <Plus className="size-[1.3cqw]" /> {w.action}
        </span>
      </div>
      <div className="mt-[1.4cqw] flex items-center gap-[0.6cqw] rounded-[0.6cqw] border border-[#E6EAF0] bg-white px-[1cqw] py-[0.7cqw] text-[1.1cqw] text-[#9BA8B7]">
        <Search className="size-[1.3cqw]" /> Search {w.title.toLowerCase()}…
      </div>

      {w.layout === "board" ? (
        <div className="mt-[1.4cqw] grid min-h-0 flex-1 grid-cols-4 gap-[1cqw]">
          {w.columns.map((col) => (
            <div key={col.name} className="flex min-w-0 flex-col gap-[0.8cqw]">
              <p className="flex items-center justify-between text-[1.15cqw] font-semibold">
                <span className="truncate">{col.name}</span>
                <span className="text-[#9BA8B7]">{col.items.length}</span>
              </p>
              {col.items.map((it) => (
                <div key={it.title} className={cn("flex flex-col gap-[0.4cqw] rounded-[0.7cqw] border bg-white p-[1cqw]", it.flag ? "border-[#FDA29B]" : "border-[#E6EAF0]")}>
                  <span className="truncate text-[1.2cqw] font-semibold">{it.title}</span>
                  <span className="truncate text-[1.05cqw] text-[#667085]">{it.meta}</span>
                  {it.tag && <Tag text={it.tag} flag={it.flag} color={c} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-[1.4cqw] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.8cqw] border border-[#E6EAF0] bg-white">
          {w.rows.map((r) => (
            <div key={r.title} className="flex items-center gap-[1cqw] border-b border-[#EEF1F6] px-[1.2cqw] py-[1cqw] last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[1.25cqw] font-semibold">{r.title}</span>
                <span className="block truncate text-[1.05cqw] text-[#667085]">{r.meta}</span>
              </span>
              {r.value && <span className="shrink-0 text-[1.15cqw] font-semibold tabular-nums">{r.value}</span>}
              {r.tag && <Tag text={r.tag} flag={r.flag} color={c} />}
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}

/** Dashboard: four stat tiles and a weekly activity chart in the product colour. */
export function OverviewScreen({ app, details }: ScreenProps) {
  const c = app.color.primary
  // Deterministic bar heights per app so the chart is stable between renders.
  const seed = [...app.id].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const bars = Array.from({ length: 12 }, (_, i) =>
    Math.round(30 + i * 3.5 + 22 * Math.abs(Math.sin(seed * 0.37 + i * 1.3))),
  )
  return (
    <Shell app={app} details={details} active={0}>
      <p className="text-[2.2cqw] font-bold tracking-tight">{details.window.nav[0]}</p>
      <p className="text-[1.15cqw] text-[#667085]">Last 12 weeks</p>
      <div className="mt-[1.4cqw] grid grid-cols-4 gap-[1cqw]">
        {details.stats.map((s, i) => (
          <div key={s.label} className="rounded-[0.8cqw] border border-[#E6EAF0] bg-white p-[1.2cqw]">
            <p className="truncate text-[1.05cqw] text-[#667085]">{s.label}</p>
            <p className="mt-[0.3cqw] text-[2.2cqw] font-bold tabular-nums" style={i === 0 ? { color: c } : undefined}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-[1.2cqw] flex min-h-0 flex-1 flex-col rounded-[0.8cqw] border border-[#E6EAF0] bg-white p-[1.4cqw]">
        <p className="text-[1.2cqw] font-semibold">Activity</p>
        <div className="mt-[1cqw] flex min-h-0 flex-1 items-end gap-[1cqw] border-b border-[#E6EAF0]">
          {bars.map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-[0.4cqw]"
              style={{ height: `${h}%`, background: i === bars.length - 1 ? c : `${c}40` }}
            />
          ))}
        </div>
      </div>
    </Shell>
  )
}

/** EVI answering in the product, with the product's agent preparing the work. */
export function EviScreen({ app, details }: ScreenProps) {
  const s = details.scene
  const agent = app.agent && app.agent.name !== "EVI" ? app.agent : null
  return (
    <div className="@container relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#F2F2FF] via-white to-[#EEF1FF] p-[3cqw] text-[#1F2430] select-none">
      <span aria-hidden className="absolute -top-[10cqw] -right-[6cqw] size-[30cqw] rounded-full bg-[#BDBDFF]/40 blur-[6cqw]" />
      <span aria-hidden className="absolute -bottom-[12cqw] -left-[8cqw] size-[30cqw] rounded-full blur-[6cqw]" style={{ background: `${app.color.primary}26` }} />
      <div className="relative flex w-[78%] flex-col gap-[1.4cqw]">
        <div className="ml-auto max-w-[70%] rounded-[1.2cqw] rounded-br-[0.3cqw] bg-[#1A1190] px-[1.6cqw] py-[1.1cqw] text-[1.45cqw] text-white">
          {s.question}
        </div>
        <div className="flex items-start gap-[1.2cqw]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/characters/evi.webp" alt="" className="size-[4.4cqw] shrink-0 rounded-full object-cover ring-[0.3cqw] ring-white" />
          <div className="flex min-w-0 flex-1 flex-col gap-[1cqw] rounded-[1.2cqw] rounded-tl-[0.3cqw] border border-[#E6EAF0] bg-white p-[1.6cqw] shadow-[0_1cqw_3cqw_-1.5cqw_rgb(26_17_144/0.25)]">
            <p className="flex items-center gap-[0.5cqw] text-[1.1cqw] font-semibold text-[#4747E0]">
              <Sparkles className="size-[1.3cqw]" /> EVI
            </p>
            <p className="text-[1.45cqw] leading-snug">
              <RichText text={s.answer} />
            </p>
            <div className="flex flex-col gap-[0.6cqw] rounded-[0.8cqw] bg-[#F8FAFC] p-[1.2cqw]">
              {agent && (
                <p className="mb-[0.2cqw] flex items-center gap-[0.7cqw] text-[1.1cqw] text-[#5F6B7A]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={agent.avatar} alt="" className="size-[2.2cqw] rounded-full object-cover" />
                  <span>
                    <b className="text-[#1F2430]">{agent.name}</b> · {agent.role}
                  </span>
                </p>
              )}
              {s.steps.map((st) => (
                <p key={st.text} className="flex items-center gap-[0.7cqw] text-[1.15cqw]">
                  {st.done ? (
                    <Check className="size-[1.4cqw] text-emerald-600" />
                  ) : (
                    <Loader2 className="size-[1.4cqw] text-[#4747E0]" />
                  )}
                  <span className={st.done ? "text-[#5F6B7A]" : "font-semibold"}>{st.text}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
