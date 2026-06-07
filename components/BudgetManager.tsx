"use client"

import { useState, useEffect } from "react"

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
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit_amount: Number(limit) })
    })
    await fetchBudgets()
    setLimit("")
  }

  async function handleSuggest() {
    const res = await fetch("/api/suggest-budgets")
    const data = await res.json()
    setSuggestions(data.suggestions || {})
  }

  async function applySuggestion(cat: string, amount: number) {
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, limit_amount: amount })
    })
    await fetchBudgets()
    setSuggestions(prev => {
      const copy = { ...prev }
      delete copy[cat]
      return copy
    })
  }

  async function handleFlagUnusual() {
    const res = await fetch("/api/flag-expenses")
    const data = await res.json()
    setFlagged(data.flagged || [])
  }

  async function handleMonthlySummary() {
    setSummaryStatus("Sending...")
    const res = await fetch("/api/monthly-summary", { method: "POST" })
    const data = await res.json()
    setSummaryStatus(data.ok ? "✅ Sent!" : "❌ Failed")
  }

  function getSpent(cat: string) {
    if (cat === "overall") return totalSpent
    return expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0)
  }

  return (
    <div>
      <h2>Budget Limits</h2>
      <select value={category} onChange={e => setCategory(e.target.value)}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="number" placeholder="Limit (₹)" value={limit} onChange={e => setLimit(e.target.value)} />
      <button onClick={handleSave}>Set Budget</button>
      <button onClick={handleSuggest} style={{ marginLeft: 8 }}>Auto-suggest limits</button>
      <button onClick={handleFlagUnusual} style={{ marginLeft: 8 }}>Flag unusual</button>
      <button onClick={handleMonthlySummary} style={{ marginLeft: 8 }}>Send monthly summary</button>
      {summaryStatus && <span style={{ marginLeft: 8 }}>{summaryStatus}</span>}

      {Object.keys(suggestions).length > 0 && (
        <div>
          <p><strong>Suggestions (based on last 30 days):</strong></p>
          {Object.entries(suggestions).map(([cat, amt]) => (
            <p key={cat}>
              {cat}: ₹{amt} <button onClick={() => applySuggestion(cat, amt)}>Apply</button>
            </p>
          ))}
        </div>
      )}

      {flagged.length > 0 && (
        <div>
          <p><strong>Unusual expenses:</strong></p>
          {flagged.map((f, i) => (
            <p key={i}>⚠️ {f.description} — ₹{f.amount} ({f.category}) — {f.reason}</p>
          ))}
        </div>
      )}

      <div>
        {budgets.map(b => {
          const spent = getSpent(b.category)
          const percent = Math.min((spent / b.limit_amount) * 100, 100)
          const nearLimit = percent >= 80 && percent < 100
          const overLimit = percent >= 100
          return (
            <div key={b.id}>
              <p>
                {b.category === "overall" ? "Overall" : b.category}: ₹{Math.round(spent)} / ₹{b.limit_amount}
                {nearLimit && " ⚠️ Near limit!"}
                {overLimit && " 🚨 Over limit!"}
              </p>
              <div style={{ background: "#333", borderRadius: 4, height: 8 }}>
                <div style={{
                  width: `${percent}%`,
                  background: overLimit ? "#C23519" : nearLimit ? "orange" : "green",
                  height: 8,
                  borderRadius: 4
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}