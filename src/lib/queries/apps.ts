import { queryOptions } from "@tanstack/react-query"
import { launcherAppListSchema } from "@/lib/schemas/app"

async function fetchApps() {
  const res = await fetch("/api/apps")
  if (!res.ok) throw new Error(`Failed to load apps (${res.status})`)
  // Validate at the boundary so the UI only ever sees well-formed data.
  return launcherAppListSchema.parse(await res.json())
}

export const appsQuery = queryOptions({
  queryKey: ["apps"],
  queryFn: fetchApps,
})
