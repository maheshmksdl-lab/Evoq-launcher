import { Suspense } from "react"
import type { Metadata } from "next"
import { LoginForm } from "@/components/login/login-form"

export const metadata: Metadata = {
  title: "Log in · EVOQ Launcher",
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_80%_10%,#8484FF_0%,transparent_45%),radial-gradient(circle_at_10%_90%,#3333CC_0%,transparent_45%),linear-gradient(135deg,#000099_0%,#1A1190_45%,#4747E0_100%)] p-6">
      <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/evoq-logo.png" alt="EVOQ" width={132} height={28} className="h-7 w-auto brightness-0 invert" />

        <div className="bg-surface border-evoq-line w-full border shadow-[0_24px_60px_-20px_rgba(0,0,153,0.55)]">
          <div className="border-b px-6 py-5">
            <h1 className="font-heading text-evoq-charcoal dark:text-foreground text-xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Log in to open and manage your EVOQ apps.</p>
          </div>

          <div className="px-6 py-6">
            <Suspense>
              <LoginForm />
            </Suspense>
          </div>

          <div className="border-t px-6 py-4">
            <p className="label-mono text-muted-foreground mb-1.5 text-[10px]">Demo credentials</p>
            <p className="text-foreground/80 text-xs">
              Username <span className="font-mono">admin@evoq.one</span> · Password <span className="font-mono">Evoq@2026</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-white/70">EVOQ Launcher · desktop-style access to every EVOQ product</p>
      </div>
    </div>
  )
}
