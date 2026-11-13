import "server-only"
import type { z } from "zod"
import { HttpError } from "@/lib/auth/guards"

/** Parses and validates a JSON body, or throws a 400 with a readable message. */
export async function parseBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    throw new HttpError(400, first ? `${first.path.join(".") || "Request"}: ${first.message}` : "Invalid request.")
  }
  return parsed.data
}

export const actorOf = (s: { admin: { id: string; email: string } }) => ({ id: s.admin.id, email: s.admin.email })
