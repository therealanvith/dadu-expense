"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  source: string
  created_at: string
}

type Budget = {
  category: string
  limit_amount: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/budgets").then(r => r.json()),
      fetch("/api/process-subscriptions", { method: "POST" }).then(r => r.json()),
    ]).then(([exp, bud, subs]) => {
      setExpenses(exp)
      setBudgets(bud)
      if (subs.processed > 0) {
        fetch("/api/expenses").then(r => r.json()).then(setExpenses)
      }
      setLoading(false)
    })
  }, [status])

  useEffect(() => {
    const handler = () => fetch("/api/expenses").then(r => r.json()).then(setExpenses)
    window.addEventListener("expense-added", handler)
    return () => window.removeEventListener("expense-added", handler)
  }, [])

  if (status === "loading" || loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <span className="text-muted">Loading…</span>
    </div>
  )

  const istNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const thisMonth = expenses.filter(e => {
    const ist = new Date(new Date(e.created_at).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    return ist.getMonth() === istNow.getMonth() && ist.getFullYear() === istNow.getFullYear()
  })

  const totalThisMonth = thisMonth.reduce((s, e) => s + e.amount, 0)

  const categoryTotals = thisMonth.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category.toLowerCase().trim()
    acc[cat] = (acc[cat] || 0) + e.amount
    return acc
  }, {})

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]
  const overallBudget = budgets.find(b => b.category.toLowerCase() === "overall")
  const budgetRemaining = overallBudget ? overallBudget.limit_amount - totalThisMonth : null
  const budgetPct = overallBudget ? Math.min((totalThisMonth / overallBudget.limit_amount) * 100, 100) : null

  const budgetAlerts = budgets.filter(b => {
    if (b.category.toLowerCase() === "overall") return false
    const spent = categoryTotals[b.category.toLowerCase()] || 0
    return spent >= b.limit_amount * 0.8
  })

  const anyOver = budgetAlerts.some(b => {
    const spent = categoryTotals[b.category.toLowerCase()] || 0
    return spent >= b.limit_amount
  })

  const last10 = expenses.slice(0, 10)

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>

      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Dashboard</h1>
        <p style={{ color: "var(--text-3)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>
          {istNow.toLocaleString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="stats-grid">
        <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
          <p className="stat-label" style={{ marginBottom: "0.625rem" }}>Spent this month</p>
          <p className="stat-value">{fmt(totalThisMonth)}</p>
          {overallBudget && budgetPct !== null && (
            <div style={{ marginTop: "0.875rem" }}>
              <div className="progress-track">
                <div
                  className={`progress-fill${budgetPct >= 100 ? " danger" : budgetPct >= 80 ? " warning" : ""}`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.375rem" }}>
                {fmt(budgetRemaining! > 0 ? budgetRemaining! : 0)} remaining of {fmt(overallBudget.limit_amount)}
              </p>
            </div>
          )}
          {!overallBudget && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.375rem" }}>
              {thisMonth.length} transactions
            </p>
          )}
        </div>

        <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
          <p className="stat-label" style={{ marginBottom: "0.625rem" }}>Top category</p>
          {topCategory ? (
            <>
              <p className="stat-value" style={{ textTransform: "capitalize" }}>{topCategory[0]}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.375rem" }}>
                {fmt(topCategory[1])} · {Math.round((topCategory[1] / totalThisMonth) * 100)}% of total
              </p>
            </>
          ) : (
            <p className="stat-value" style={{ color: "var(--text-3)" }}>-</p>
          )}
        </div>

        <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
          <p className="stat-label" style={{ marginBottom: "0.625rem" }}>Budget alerts</p>
          <p className="stat-value" style={{ color: budgetAlerts.length > 0 ? "var(--danger)" : "var(--text-1)" }}>
            {budgetAlerts.length}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: "0.375rem" }}>
            {budgetAlerts.length > 0 ? "categories near or over limit" : "all within limits"}
          </p>
        </div>
      </div>

      {budgetAlerts.length > 0 && (
        <div style={{
          marginBottom: "0.75rem",
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-lg)",
          background: anyOver ? "var(--danger-dim)" : "var(--warning-dim)",
          border: anyOver ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(245,158,11,0.15)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: anyOver ? "var(--danger)" : "var(--warning)" }}>
              Budget Alerts
            </span>
            <Link href="/budgets" style={{ fontSize: "0.75rem", color: "var(--accent-light)", textDecoration: "none" }}>
              Manage →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {budgetAlerts.map(b => {
              const spent = categoryTotals[b.category.toLowerCase()] || 0
              const pct = Math.round((spent / b.limit_amount) * 100)
              const over = pct >= 100
              return (
                <div key={b.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                  <span style={{ color: "var(--text-2)", textTransform: "capitalize" }}>{b.category}</span>
                  <span style={{ fontWeight: 500, color: over ? "var(--danger)" : "var(--warning)" }}>
                    {pct}% : {fmt(spent)} / {fmt(b.limit_amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: "0.75rem" }}>
        <div style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span className="section-title">Recent Expenses</span>
          <Link href="/expenses" style={{ fontSize: "0.8125rem", color: "var(--accent-light)", textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        {last10.length === 0 ? (
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
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {last10.map(e => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap", color: "var(--text-3)", fontSize: "0.8125rem" }}>
                      {new Date(e.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td style={{ color: "var(--text-3)", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                      {new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                    </td>
                    <td style={{
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: e.description ? "var(--text-1)" : "var(--text-3)",
                    }}>
                      {e.description || "-"}
                    </td>
                    <td>
                      <span className="badge badge-default" style={{ textTransform: "capitalize" }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{
                      textAlign: "right",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--text-1)",
                    }}>
                      {fmt(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}