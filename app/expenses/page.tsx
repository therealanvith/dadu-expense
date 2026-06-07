"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ExpenseTable from "@/components/ExpenseTable"
import { showToast } from "@/components/Toast"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  source: string
  created_at: string
}

export default function ExpensesPage() {
  const { status } = useSession()
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

  async function fetchExpenses() {
    const res = await fetch("/api/expenses")
    const data = await res.json()
    setExpenses(data)
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        setExpenses(prev => prev.filter(e => e.id !== id))
        showToast("Expense deleted successfully", "success")
      } else {
        showToast("Failed to delete expense", "error")
      }
    } catch {
      showToast("Failed to delete expense", "error")
    }
  }

  if (status === "loading") return <div className="page-title">Loading...</div>

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>
      <h1 className="page-title" style={{ marginBottom: "1.5rem" }}>All Expenses</h1>
      {expenses.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.5rem", opacity: 0.5 }}>
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
            <circle cx="16" cy="15" r="1" />
          </svg>
          <p>No expenses yet.</p>
          <p style={{ fontSize: "0.8125rem" }}>Add your first expense</p>
        </div>
      ) : (
        <ExpenseTable expenses={expenses} onDelete={handleDelete} onEdit={fetchExpenses} />
      )}
    </div>
  )
}