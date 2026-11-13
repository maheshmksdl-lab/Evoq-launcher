import type { ReactNode } from "react"
import { ShieldCheck } from "lucide-react"

/** Branded full-page frame for sign-in screens (user and admin). */
export function AuthShell({
  title,
  subtitle,
  admin = false,
  children,
  footer,
}: {
  title: string
  subtitle: string
  admin?: boolean
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div
      className={
        admin
          ? "relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_85%_5%,#3333CC_0%,transparent_40%),linear-gradient(160deg,#0D0F1C_0%,#1A1190_70%,#000099_100%)] p-6"
          : "relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_80%_10%,#8484FF_0%,transparent_45%),radial-gradient(circle_at_10%_90%,#3333CC_0%,transparent_45%),linear-gradient(135deg,#000099_0%,#1A1190_45%,#4747E0_100%)] p-6"
      }
    >
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/evoq-logo.png" alt="EVOQ" width={132} height={28} className="h-7 w-auto brightness-0 invert" />
          {admin && (
            <span className="label-mono inline-flex items-center gap-1.5 border border-white/30 px-2 py-1 text-[10px] text-white">
              <ShieldCheck className="size-3.5" /> Admin Portal
            </span>
          )}
        </div>
        <div className="bg-surface border-evoq-line w-full border shadow-[0_24px_60px_-20px_rgba(0,0,153,0.55)]">
          <div className="border-b px-6 py-5">
            <h1 className="font-heading text-evoq-charcoal dark:text-foreground text-xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          </div>
          <div className="px-6 py-6">{children}</div>
          {footer && <div className="border-t px-6 py-4 text-xs">{footer}</div>}
        </div>
        <p className="text-xs text-white/70">
          {admin ? "Restricted area · administrators only" : "EVOQ Launcher · desktop-style access to every EVOQ product"}
        </p>
      </div>
    </div>
  )
}
