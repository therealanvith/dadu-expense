"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import VoiceInput from "@/components/VoiceInput"
import OcrUpload from "@/components/OcrUpload"
import ExpenseTable from "@/components/ExpenseTable"
import Charts from "@/components/Charts"
import BudgetManager from "@/components/BudgetManager"
import SubscriptionManager from "@/components/SubscriptionManager"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
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

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/expenses")
      .then(r => r.json())
      .then(data => setExpenses(data))
  }, [status])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/process-subscriptions", { method: "POST" })
      .then(r => r.json())
      .then(data => { if (data.processed > 0) fetchExpenses() })
    fetchExpenses()
  }, [status])


  async function fetchExpenses() {
    const res = await fetch("/api/expenses")
    const data = await res.json()
    setExpenses(data)
  }

  async function handleExpenseParsed(
    expense: { amount: number; category: string; description: string },
    source: string
  ) {
    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...expense, source })
    })
    await fetch("/api/alerts", { method: "POST" })
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
      <SubscriptionManager />
      <ExpenseTable expenses={expenses} onDelete={handleDelete} onEdit={fetchExpenses} />
      <Charts expenses={expenses} />
      <BudgetManager expenses={expenses} />
    </div>
  )
}