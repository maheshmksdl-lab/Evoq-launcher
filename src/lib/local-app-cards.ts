import { z } from "zod"
import { installStatusSchema, launcherAppSchema, type InstallStatus, type LauncherApp } from "@/lib/schemas/app"

const editableAppSchema = launcherAppSchema.omit({ id: true, status: true }).partial()

const localAppCardStateSchema = z.object({
  added: z.array(launcherAppSchema),
  edited: z.record(z.string(), editableAppSchema),
  deleted: z.array(z.string()),
  statusOverrides: z.record(z.string(), installStatusSchema),
})

export type LocalAppCardState = z.infer<typeof localAppCardStateSchema>

export const LOCAL_APP_CARDS_EVENT = "evoq:local-app-cards-updated"
export const LOCAL_APP_ID_PREFIX = "custom-"
const LOCAL_APP_CARDS_KEY = "evoq.launcher.local-app-cards"

export function emptyLocalAppCardState(): LocalAppCardState {
  return { added: [], edited: {}, deleted: [], statusOverrides: {} }
}

export type LocalAppCardSnapshot = { state: LocalAppCardState; error: Error | null }

const EMPTY_SNAPSHOT: LocalAppCardSnapshot = { state: emptyLocalAppCardState(), error: null }
const UNCACHED = Symbol("uncached")
const STORAGE_ERROR = Symbol("storage-error")
let cachedRaw: string | null | symbol = UNCACHED
let cachedSnapshot = EMPTY_SNAPSHOT

export function getLocalAppCardSnapshot(): LocalAppCardSnapshot {
  if (typeof window === "undefined") return EMPTY_SNAPSHOT
  if (cachedRaw !== UNCACHED) return cachedSnapshot

  try {
    const raw = window.localStorage.getItem(LOCAL_APP_CARDS_KEY)
    if (raw === null) {
      cachedRaw = null
      cachedSnapshot = EMPTY_SNAPSHOT
    } else {
      cachedRaw = raw
      cachedSnapshot = { state: localAppCardStateSchema.parse(JSON.parse(raw)), error: null }
    }
  } catch (error) {
    cachedRaw = STORAGE_ERROR
    cachedSnapshot = {
      state: emptyLocalAppCardState(),
      error: error instanceof Error ? error : new Error("Could not read local app settings."),
    }
  }
  return cachedSnapshot
}

export function getServerLocalAppCardSnapshot(): LocalAppCardSnapshot {
  return EMPTY_SNAPSHOT
}

export function subscribeToLocalAppCards(callback: () => void): () => void {
  const notify = () => {
    cachedRaw = UNCACHED
    callback()
  }
  window.addEventListener(LOCAL_APP_CARDS_EVENT, notify)
  window.addEventListener("storage", notify)
  return () => {
    window.removeEventListener(LOCAL_APP_CARDS_EVENT, notify)
    window.removeEventListener("storage", notify)
  }
}

export function refreshLocalAppCards(): void {
  cachedRaw = UNCACHED
  window.dispatchEvent(new Event(LOCAL_APP_CARDS_EVENT))
}

export function readLocalAppCardState(): LocalAppCardState {
  const snapshot = getLocalAppCardSnapshot()
  if (snapshot.error) throw snapshot.error
  return snapshot.state
}

export function writeLocalAppCardState(state: LocalAppCardState): void {
  const validated = localAppCardStateSchema.parse(state)
  window.localStorage.setItem(LOCAL_APP_CARDS_KEY, JSON.stringify(validated))
  refreshLocalAppCards()
}

export function mergeLocalAppCards(apps: LauncherApp[], state: LocalAppCardState): LauncherApp[] {
  const deleted = new Set(state.deleted)
  const merge = (app: LauncherApp): LauncherApp => ({
    ...app,
    ...state.edited[app.id],
    status: state.statusOverrides[app.id] ?? app.status,
  })

  return [
    ...apps.filter((app) => !deleted.has(app.id)).map(merge),
    ...state.added.filter((app) => !deleted.has(app.id)).map(merge),
  ]
}

export function setLocalAppStatus(id: string, status: InstallStatus): LauncherApp {
  const state = readLocalAppCardState()
  const app = state.added.find((candidate) => candidate.id === id)
  if (!app || !id.startsWith(LOCAL_APP_ID_PREFIX)) {
    throw new Error("This locally managed app is no longer available.")
  }

  const updated = { ...app, status }
  writeLocalAppCardState({
    ...state,
    added: state.added.map((candidate) => (candidate.id === id ? updated : candidate)),
  })
  return updated
}
