import { toNextJsHandler } from "better-auth/next-js"
import { getUserAuth } from "@/lib/auth/instances"

// Better Auth endpoints for regular users (session, password, two-factor, sign-out).
export const GET = (req: Request) => toNextJsHandler(getUserAuth()).GET(req)
export const POST = (req: Request) => toNextJsHandler(getUserAuth()).POST(req)
