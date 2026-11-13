// Runs once when the server starts: apply database migrations and seed defaults.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (process.env.NEXT_PHASE === "phase-production-build") return
  const { ensureDatabase } = await import("./db/migrate")
  await ensureDatabase()
}
