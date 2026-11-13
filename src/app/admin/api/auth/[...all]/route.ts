import { toNextJsHandler } from "better-auth/next-js"
import { getAdminAuth } from "@/lib/auth/instances"

// Better Auth endpoints for the Admin Portal realm (separate accounts and cookies).
export const GET = (req: Request) => toNextJsHandler(getAdminAuth()).GET(req)
export const POST = (req: Request) => toNextJsHandler(getAdminAuth()).POST(req)
