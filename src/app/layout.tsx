import type { Metadata } from "next"
import { DM_Sans, Figtree, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

// EVOQ type system: Figtree for display, DM Sans for body (as on evoq.one),
// plus a mono for the launcher's micro-labels.
const figtree = Figtree({ variable: "--font-display", subsets: ["latin"] })
const dmSans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EVOQ Launcher",
  description: "Install, update and open every EVOQ app from one place.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${figtree.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
