"use client"

import { useState, useEffect } from "react"
import { showToast } from "@/components/Toast"

type Budget = {
  id: string
  category: string
  limit_amount: number
}

type Expense = {
  amount: number
  category: string
}

type Props = {
  expenses: Expense[]
}

const CATEGORIES = ["overall", "food", "travel", "health", "shopping", "entertainment", "investments", "other"]

export default function BudgetManager({ expenses }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [category, setCategory] = useState("overall")
  const [limit, setLimit] = useState("")
  const [suggestions, setSuggestions] = useState<Record<string, number>>({})
  const [flagged, setFlagged] = useState<{ description: string; amount: number; category: string; reason: string }[]>([])
  const [summaryStatus, setSummaryStatus] = useState("")

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  useEffect(() => { fetchBudgets() }, [])

  async function fetchBudgets() {
    const res = await fetch("/api/budgets")
    const data = await res.json()
    setBudgets(Array.isArray(data) ? data : [])
  }

  async function handleSave() {
    if (!limit) return
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, limit_amount: Number(limit) })
      })
      if (res.ok) {
        showToast(`Budget for ${category} set successfully`, "success")
        await fetchBudgets()
        setLimit("")
      } else {
        showToast("Failed to set budget", "error")
      }
    } catch {
      showToast("Failed to set budget", "error")
    }
  }

  async function handleSuggest() {
    try {
      const res = await fetch("/api/suggest-budgets")
      const data = await res.json()
      setSuggestions(data.suggestions || {})
      showToast("Budget suggestions loaded", "info")
    } catch {
      showToast("Failed to load budget suggestions", "error")
    }
  }

  async function applySuggestion(cat: string, amount: number) {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, limit_amount: amount })
      })
      if (res.ok) {
        showToast(`Suggested budget for ${cat} applied`, "success")
        await fetchBudgets()
        setSuggestions(prev => {
          const copy = { ...prev }
          delete copy[cat]
          return copy
        })
      } else {
        showToast("Failed to apply suggestion", "error")
      }
    } catch {
      showToast("Failed to apply suggestion", "error")
    }
  }

  async function handleFlagUnusual() {
    try {
      const res = await fetch("/api/flag-expensed")
      const data = await res.json()
      setFlagged(data.flagged || [])
      showToast("Scanned for unusual expenses", "info")
    } catch {
      showToast("Failed to scan expenses", "error")
    }
  }

  async function handleMonthlySummary() {
    try {
      setSummaryStatus("Sending...")
      const res = await fetch("/api/monthly-summary", { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        setSummaryStatus("Sent!")
        showToast("Monthly summary sent via email", "success")
      } else {
        setSummaryStatus("Failed")
        showToast("Failed to send monthly summary", "error")
      }
    } catch {
      setSummaryStatus("Failed")
      showToast("Failed to send monthly summary", "error")
    }
  }

  function getSpent(cat: string) {
    const cleanCat = cat.toLowerCase().trim()
    if (cleanCat === "overall") return totalSpent
    return expenses.filter(e => e.category.toLowerCase().trim() === cleanCat).reduce((s, e) => s + e.amount, 0)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        
        {/* Set Budget Limit Form */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 className="section-title">Set Budget Limit</h2>
          <div>
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ textTransform: "capitalize" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Limit (₹)</label>
            <input type="number" placeholder="Limit (₹)" value={limit} onChange={e => setLimit(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} style={{ width: "100%" }}>Set Budget</button>
        </div>

        {/* Tools and Actions */}
        <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 className="section-title">Budgeting Tools</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%", justifyContent: "center" }}>
            <button className="btn btn-secondary" onClick={handleSuggest} style={{ width: "100%" }}>Auto-suggest limits</button>
            <button className="btn btn-secondary" onClick={handleFlagUnusual} style={{ width: "100%" }}>Flag unusual expenses</button>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button className="btn btn-secondary" onClick={handleMonthlySummary} style={{ flex: 1 }}>Send monthly summary</button>
              {summaryStatus && <span style={{ fontSize: "0.8125rem", color: "var(--text-2)" }}>{summaryStatus}</span>}
            </div>
          </div>
        </div>

      </div>

      {/* Suggestions and Flagged Row */}
      {(Object.keys(suggestions).length > 0 || flagged.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {Object.keys(suggestions).length > 0 && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 className="section-title" style={{ marginBottom: "1rem", color: "var(--accent-light)" }}>Suggestions (based on last 30 days)</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {Object.entries(suggestions).map(([cat, amt]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
                    <span style={{ textTransform: "capitalize", color: "var(--text-2)" }}>{cat}</span>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>₹{amt}</span>
                      <button className="btn btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }} onClick={() => applySuggestion(cat, amt)}>Apply</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flagged.length > 0 && (
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 className="section-title" style={{ marginBottom: "1rem", color: "var(--warning)" }}>Unusual Expenses</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "250px", overflowY: "auto" }}>
                {flagged.map((f, i) => (
                  <div key={i} style={{ fontSize: "0.8125rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--text-1)", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        {f.description || "Expense"}
                      </span>
                      <span>₹{f.amount}</span>
                    </div>
                    <p style={{ color: "var(--text-3)", fontSize: "0.75rem", marginTop: "0.125rem" }}>
                      Category: <span style={{ textTransform: "capitalize" }}>{f.category}</span> · {f.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budgets Progress List */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Budget Limits & Progress</h2>
        {budgets.length === 0 ? (
          <p style={{ color: "var(--text-3)", fontSize: "0.875rem", textAlign: "center", padding: "2rem" }}>No budgets set yet. Use the form above to set your first limit.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {budgets.map(b => {
              const spent = getSpent(b.category)
              const percent = Math.min((spent / b.limit_amount) * 100, 100)
              const nearLimit = percent >= 80 && percent < 100
              const overLimit = percent >= 100
              return (
                <div key={b.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 600, textTransform: "capitalize" }}>
                      {b.category.toLowerCase().trim() === "overall" ? "Overall Budget" : b.category}
                    </span>
                    <span style={{ color: overLimit ? "var(--danger)" : nearLimit ? "var(--warning)" : "var(--text-2)" }}>
                      ₹{Math.round(spent).toLocaleString("en-IN")} / ₹{b.limit_amount.toLocaleString("en-IN")}
                      {nearLimit && " (Near limit)"}
                      {overLimit && " (Over limit)"}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div 
                      className={`progress-fill ${overLimit ? "danger" : nearLimit ? "warning" : ""}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}