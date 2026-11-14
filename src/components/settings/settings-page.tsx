"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { LayoutGrid, List, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { appCategorySchema, launcherAppSchema, type AppCategory, type LauncherApp } from "@/lib/schemas/app"
import { LOCAL_APP_ID_PREFIX } from "@/lib/local-app-cards"
import { useManagedApps } from "@/lib/queries/apps"
import { TitleBar } from "@/components/launcher/chrome"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type FormValues = {
  name: string
  tagline: string
  description: string
  category: AppCategory
  version: string
  productUrl: string
  icon: string
  primaryColor: string
  logoColor: string
}

const categories = appCategorySchema.options

const initialForm: FormValues = {
  name: "",
  tagline: "",
  description: "",
  category: "Operations",
  version: "1.0.0",
  productUrl: "https://",
  icon: "/logos/crm.svg",
  primaryColor: "#0062FA",
  logoColor: "#0062FA",
}

function formValues(app?: LauncherApp): FormValues {
  if (!app) return initialForm
  return {
    name: app.name,
    tagline: app.tagline,
    description: app.description,
    category: app.category,
    version: app.version,
    productUrl: app.productUrl,
    icon: app.icon,
    primaryColor: app.color.primary,
    logoColor: app.color.logo,
  }
}

function isSubscribed(app: LauncherApp) {
  return app.status === "installed" || app.status === "update"
}

function statusLabel(app: LauncherApp) {
  if (app.status === "update") return "Subscribed · update available"
  if (app.status === "installed") return "Subscribed"
  if (app.status === "coming-soon") return "Coming soon"
  return "Unsubscribed"
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function appId(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app"
  return `${LOCAL_APP_ID_PREFIX}${slug}-${crypto.randomUUID()}`
}

const fieldClass = "bg-background focus-visible:border-ring focus-visible:ring-ring/40 h-10 w-full rounded-none"
const labelClass = "label-mono text-muted-foreground mb-1.5 block"
const iconButtonClass = "bg-surface text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center border transition-colors"

export function SettingsPage() {
  const { data, isPending, error, localError, refetch, refreshLocalState, localState, saveLocalState } = useManagedApps()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<LauncherApp | null>(null)
  const [adding, setAdding] = useState(false)
  const [values, setValues] = useState<FormValues>(initialForm)
  const [formError, setFormError] = useState("")

  const apps = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (data?.apps ?? []).filter((app) =>
      [app.name, app.tagline, app.description, app.category].some((value) => value.toLowerCase().includes(query)),
    )
  }, [data?.apps, search])

  function startAdding() {
    setEditing(null)
    setValues(initialForm)
    setFormError("")
    setAdding(true)
  }

  function startEditing(app: LauncherApp) {
    setEditing(app)
    setValues(formValues(app))
    setFormError("")
    setAdding(false)
  }

  function cancelForm() {
    setAdding(false)
    setEditing(null)
    setFormError("")
  }

  function saveApp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = editing?.id ?? appId(values.name)
    const candidate = {
      ...editing,
      id,
      name: values.name.trim(),
      tagline: values.tagline.trim(),
      description: values.description.trim(),
      category: values.category,
      version: values.version.trim(),
      sizeMb: editing?.sizeMb ?? 12,
      updatedAt: today(),
      icon: values.icon.trim(),
      color: { primary: values.primaryColor, logo: values.logoColor },
      productUrl: values.productUrl.trim(),
      status: editing?.status ?? "available",
    }
    const result = launcherAppSchema.safeParse(candidate)
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Check the app details and try again.")
      return
    }

    try {
      if (editing) {
        const added = localState.added.some((app) => app.id === editing.id)
        const nextState = added
          ? {
              ...localState,
              added: localState.added.map((app) => (app.id === editing.id ? result.data : app)),
            }
          : {
              ...localState,
              edited: {
                ...localState.edited,
                [editing.id]: {
                  name: result.data.name,
                  tagline: result.data.tagline,
                  description: result.data.description,
                  category: result.data.category,
                  version: result.data.version,
                  updatedAt: result.data.updatedAt,
                  icon: result.data.icon,
                  color: result.data.color,
                  productUrl: result.data.productUrl,
                },
              },
            }
        saveLocalState(nextState)
        toast.success(`${result.data.name} updated`)
      } else {
        saveLocalState({ ...localState, added: [...localState.added, result.data] })
        toast.success(`${result.data.name} added`)
      }
      cancelForm()
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save this app."
      setFormError(message)
      toast.error(message)
    }
  }

  function deleteApp(app: LauncherApp) {
    if (!window.confirm(`Delete "${app.name}" from this launcher? This change is stored only in this browser.`)) return
    try {
      const isAdded = localState.added.some((item) => item.id === app.id)
      const edited = { ...localState.edited }
      const statusOverrides = { ...localState.statusOverrides }
      delete edited[app.id]
      delete statusOverrides[app.id]
      saveLocalState({
        ...localState,
        added: localState.added.filter((item) => item.id !== app.id),
        edited,
        statusOverrides,
        deleted: isAdded ? localState.deleted : [...new Set([...localState.deleted, app.id])],
      })
      if (editing?.id === app.id) cancelForm()
      toast.success(`${app.name} deleted`)
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Could not delete this app.")
    }
  }

  const catalogError = error ?? localError

  return (
    <div className="flex h-dvh flex-col">
      <TitleBar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/" className="label-mono text-muted-foreground hover:text-evoq-interactive inline-flex items-center gap-2">
                ← Back to launcher
              </Link>
              <p className="label-mono text-evoq-interactive mt-6">Launcher / Settings</p>
              <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Application settings</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
                Add, update, and remove application cards. These changes are saved in this browser only.
              </p>
            </div>
            <button type="button" onClick={startAdding} className="label-mono bg-primary text-primary-foreground inline-flex h-10 items-center justify-center gap-2 px-4 font-semibold">
              <Plus className="size-4" /> Add application
            </button>
          </div>

          {(adding || editing) && (
            <form onSubmit={saveApp} className="bg-surface mt-6 border p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="label-mono text-evoq-interactive">{editing ? "Edit subscribed app" : "New app card"}</p>
                  <h2 className="font-heading mt-1 text-xl font-bold">{editing ? editing.name : "Configure an application"}</h2>
                </div>
                <button type="button" onClick={cancelForm} className="label-mono text-muted-foreground hover:text-foreground h-9 px-3">
                  Cancel
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm">
                  <span className={labelClass}>Application name</span>
                  <Input required maxLength={70} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} className={fieldClass} />
                </label>
                <label className="text-sm">
                  <span className={labelClass}>Tagline</span>
                  <Input required maxLength={100} value={values.tagline} onChange={(event) => setValues({ ...values, tagline: event.target.value })} className={fieldClass} />
                </label>
                <label className="text-sm">
                  <span className={labelClass}>Category</span>
                  <select value={values.category} onChange={(event) => setValues({ ...values, category: appCategorySchema.parse(event.target.value) })} className={fieldClass}>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className={labelClass}>Version (x.y.z)</span>
                  <Input required pattern="\d+\.\d+\.\d+" placeholder="1.0.0" value={values.version} onChange={(event) => setValues({ ...values, version: event.target.value })} className={fieldClass} />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className={labelClass}>Application URL</span>
                  <Input required type="url" value={values.productUrl} onChange={(event) => setValues({ ...values, productUrl: event.target.value })} className={fieldClass} />
                </label>
                <label className="text-sm sm:col-span-2 lg:col-span-3">
                  <span className={labelClass}>Icon URL or path</span>
                  <Input required value={values.icon} onChange={(event) => setValues({ ...values, icon: event.target.value })} className={fieldClass} />
                </label>
                <label className="text-sm sm:col-span-2 lg:col-span-3">
                  <span className={labelClass}>Description</span>
                  <textarea required rows={3} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className="bg-background focus-visible:border-ring focus-visible:ring-ring/40 w-full resize-y border px-3 py-2 text-sm outline-none focus-visible:ring-3" />
                </label>
                <label className="text-sm">
                  <span className={labelClass}>Brand color</span>
                  <span className="flex h-10 items-center gap-3 border px-3">
                    <input type="color" value={values.primaryColor} onChange={(event) => setValues({ ...values, primaryColor: event.target.value })} aria-label="Brand color" className="size-6 cursor-pointer border-0 bg-transparent p-0" />
                    <span className="label-mono text-muted-foreground">{values.primaryColor}</span>
                  </span>
                </label>
                <label className="text-sm">
                  <span className={labelClass}>Icon mark color</span>
                  <span className="flex h-10 items-center gap-3 border px-3">
                    <input type="color" value={values.logoColor} onChange={(event) => setValues({ ...values, logoColor: event.target.value })} aria-label="Icon mark color" className="size-6 cursor-pointer border-0 bg-transparent p-0" />
                    <span className="label-mono text-muted-foreground">{values.logoColor}</span>
                  </span>
                </label>
              </div>
              {formError && <p role="alert" className="text-destructive mt-4 text-sm">{formError}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button type="submit" className="label-mono bg-primary text-primary-foreground h-10 px-5 font-semibold">
                  {editing ? "Save changes" : "Add application"}
                </button>
                {!editing && <span className="text-muted-foreground text-xs">New cards start unsubscribed.</span>}
              </div>
            </form>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input aria-label="Search application cards" placeholder="Search application cards" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 rounded-none pl-9" />
            </div>
            <div role="group" aria-label="Application card view" className="flex self-start">
              {([
                ["grid", LayoutGrid, "Grid view"],
                ["list", List, "List view"],
              ] as const).map(([mode, Icon, label]) => (
                <button key={mode} type="button" aria-label={label} aria-pressed={view === mode} onClick={() => setView(mode)} className={cn(iconButtonClass, "-ml-px first:ml-0", view === mode && "bg-primary border-primary text-primary-foreground")}>
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <span className="label-mono text-muted-foreground">{apps.length} application{apps.length === 1 ? "" : "s"}</span>
          </div>

          {catalogError ? (
            <div className="mt-5 border p-5 text-sm">
              <p className="text-destructive">{catalogError.message}</p>
              <button type="button" onClick={() => (localError ? refreshLocalState() : refetch())} className="label-mono bg-primary text-primary-foreground mt-3 h-9 px-4">
                Try again
              </button>
            </div>
          ) : isPending ? (
            <p className="text-muted-foreground mt-6 border p-6 text-sm">Loading application cards…</p>
          ) : apps.length === 0 ? (
            <p className="text-muted-foreground mt-6 border p-10 text-center text-sm">No application cards match this search.</p>
          ) : (
            <div className={cn("mt-5 gap-3", view === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col")}>
              {apps.map((app) => (
                <article key={app.id} className={cn("bg-surface min-w-0 border p-5", view === "list" && "md:grid md:grid-cols-[minmax(0,1fr)_auto] md:gap-x-6")}>
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <span aria-hidden className="mt-1 size-4 shrink-0 border" style={{ backgroundColor: app.color.primary }} />
                      <div className="min-w-0">
                        <h2 className="font-heading text-lg leading-tight font-bold">{app.name}</h2>
                        <p className="text-muted-foreground mt-1 text-sm">{app.tagline}</p>
                      </div>
                    </div>
                    <p className="text-foreground/80 mt-4 text-sm leading-relaxed">{app.description}</p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div><dt className="label-mono text-muted-foreground text-[10px]">Category</dt><dd className="mt-1">{app.category}</dd></div>
                      <div><dt className="label-mono text-muted-foreground text-[10px]">Version</dt><dd className="mt-1">{app.version}</dd></div>
                      <div className="col-span-2"><dt className="label-mono text-muted-foreground text-[10px]">Icon</dt><dd className="mt-1 break-all">{app.icon}</dd></div>
                      <div className="col-span-2"><dt className="label-mono text-muted-foreground text-[10px]">Application URL</dt><dd className="mt-1 break-all"><a href={app.productUrl} target="_blank" rel="noopener noreferrer" className="text-evoq-interactive hover:underline">{app.productUrl}</a></dd></div>
                      <div><dt className="label-mono text-muted-foreground text-[10px]">Brand color</dt><dd className="mt-1 flex items-center gap-2"><span aria-hidden className="size-3 border" style={{ backgroundColor: app.color.primary }} />{app.color.primary}</dd></div>
                      <div><dt className="label-mono text-muted-foreground text-[10px]">Status</dt><dd className="mt-1">{statusLabel(app)}</dd></div>
                    </dl>
                  </div>
                  <div className="mt-5 flex items-center gap-2 border-t pt-4 md:mt-0 md:self-end md:border-t-0 md:pt-0">
                    {isSubscribed(app) ? (
                      <button type="button" onClick={() => startEditing(app)} className="label-mono bg-primary text-primary-foreground h-9 px-4 font-semibold">Edit</button>
                    ) : (
                      <button type="button" disabled title="Subscribe to this app before editing it" className="label-mono h-9 border px-4 text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60">Edit when subscribed</button>
                    )}
                    <button type="button" onClick={() => deleteApp(app)} aria-label={`Delete ${app.name}`} className="label-mono text-destructive hover:bg-destructive/10 inline-flex h-9 items-center gap-2 border px-3">
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
