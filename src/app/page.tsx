import { AppGrid } from "@/components/launcher/app-grid"
import { RequestAppForm } from "@/components/launcher/request-app-form"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Evoq Launcher</h1>
        <p className="text-muted-foreground">All your Evoq apps in one place.</p>
      </header>
      <AppGrid />
      <div className="max-w-md">
        <RequestAppForm />
      </div>
    </main>
  )
}
