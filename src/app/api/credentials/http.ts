// Generic responses only: never include secrets or driver error text.
export const noStore = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
export const unauthorized = () => noStore({ error: "Not signed in." }, 401)
export const serverError = () => noStore({ error: "Could not reach credential storage." }, 500)
export const badRequest = (error: string) => noStore({ error }, 400)
