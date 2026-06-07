"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import BudgetManager from "@/components/BudgetManager"

type Expense = {
  amount: number
  category: string
}

export default function BudgetsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/expenses")
      .then(r => r.json())
      .then(data => {
        setExpenses(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <span className="text-muted">Loading...</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Budgets</h1>
        <p style={{ color: "var(--text-3)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Manage your budget limits and view spending recommendations
        </p>
      </div>
      <BudgetManager expenses={expenses} />
    </div>
  )
}
