import "server-only"
import { appendFileSync, mkdirSync } from "node:fs"
import { Resend } from "resend"

/*
 * Outgoing email (invitations, password resets, security notices).
 *  - With RESEND_API_KEY + EMAIL_FROM set: sent through Resend.
 *  - In local development without them: the message is written to the server
 *    console so links can be followed. Never used in production.
 */

type Mail = { to: string; subject: string; text: string }

export async function sendEmail({ to, subject, text }: Mail) {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (key && from) {
    const { error } = await new Resend(key).emails.send({ from, to, subject, text })
    if (error) throw new Error(`Email could not be sent: ${error.message}`)
    return
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Email is not configured (RESEND_API_KEY / EMAIL_FROM).")
  }
  const entry = `\n[dev email] To: ${to}\n[dev email] Subject: ${subject}\n${text}\n`
  console.info(entry)
  // Local development only: keep a copy in the git-ignored .data folder so
  // automated tests can follow invitation links.
  mkdirSync(".data", { recursive: true })
  appendFileSync(".data/dev-outbox.log", `${new Date().toISOString()}${entry}`)
}
