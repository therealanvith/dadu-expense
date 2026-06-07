import type { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import { Geist, Geist_Mono } from "next/font/google"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"
import Navbar from "@/components/Navbar"
import FloatingAdd from "@/components/FloatingAdd"
import ToastContainer from "@/components/Toast"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kuberly - Your expense tracker",
  description: "AI-powered expense tracker",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💵</text></svg>',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <SessionProvider>
            <Navbar />
            <main style={{ paddingTop: "4rem" }}>
              {children}
            </main>
            <FloatingAdd />
            <ToastContainer />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}