import { signIn } from "@/lib/auth/sign-in"

export const POST = (request: Request) => signIn("admin", request)
