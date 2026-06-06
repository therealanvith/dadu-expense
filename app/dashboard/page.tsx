"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import VoiceInput from "@/components/VoiceInput"
import OcrUpload from "@/components/OcrUpload"
import ExpenseTable from "@/components/ExpenseTable"
import Charts from "@/components/Charts"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: string
  source: string
  created_at: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  async function fetchExpenses() {
    const res = await fetch("/api/expenses")
    const data = await res.json()
    setExpenses(data)
  }

  useEffect(() => {
  if (status !== "authenticated") return
  fetch("/api/expenses")
    .then(r => r.json())
    .then(data => setExpenses(data))
}, [status])

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
    fetchExpenses()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" })
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  if (status === "loading") return <p>Loading...</p>

  return (
    <div>
      <h1>Welcome {session?.user?.email}</h1>
      <button onClick={() => signOut({ callbackUrl: "/login" })}>Sign Out</button>
      <VoiceInput onParsed={(e) => handleExpenseParsed(e, "voice")} />
      <OcrUpload onParsed={(e) => handleExpenseParsed(e, "ocr")} />
      <ExpenseTable expenses={expenses} onDelete={handleDelete} onEdit={fetchExpenses} />
      <Charts expenses={expenses} />
    </div>
  )
}