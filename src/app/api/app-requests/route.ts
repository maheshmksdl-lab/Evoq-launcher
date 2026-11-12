import { z } from "zod"
import { appRequestSchema } from "@/lib/schemas/app"

export async function POST(request: Request) {
  const result = appRequestSchema.safeParse(await request.json().catch(() => null))
  if (!result.success) {
    return Response.json({ errors: z.flattenError(result.error).fieldErrors }, { status: 400 })
  }
  // TODO: persist or forward the request.
  return Response.json({ ok: true, request: result.data }, { status: 201 })
}
