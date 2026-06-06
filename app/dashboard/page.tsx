"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import VoiceInput from "@/components/VoiceInput"
import OcrUpload from "@/components/OcrUpload"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  async function handleExpenseParsed(expense: { amount: number; category: string; description: string }, source: string) {
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...expense,
        date: new Date().toISOString().split("T")[0],
        source
      })
    })
  }

  if (status === "loading") return <p>Loading...</p>

  return (
    <div>
      <h1>Welcome {session?.user?.email}</h1>
      <button onClick={() => signOut({ callbackUrl: "/login" })}>Sign Out</button>
      <VoiceInput onParsed={(e) => handleExpenseParsed(e, "voice")} />
      <OcrUpload onParsed={(e) => handleExpenseParsed(e, "ocr")} />
    </div>
  )
}