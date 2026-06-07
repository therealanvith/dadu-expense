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

const CATEGORIES = ["food", "travel", "health", "shopping", "entertainment", "investments", "other"]

export default function BudgetManager({ expenses }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [category, setCategory] = useState("food")
  const [limit, setLimit] = useState("")

  useEffect(() => {
    fetch("/api/budgets")
      .then(r => r.json())
      .then(data => setBudgets(data))
  }, [])

  async function handleSave() {
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, limit_amount: Number(limit) })
    })
    fetch("/api/budgets")
      .then(r => r.json())
      .then(data => setBudgets(data))
    setLimit("")
  }

  function getSpent(cat: string) {
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

      <div>
        {budgets.map(b => {
          const spent = getSpent(b.category)
          const percent = Math.min((spent / b.limit_amount) * 100, 100)
          const nearLimit = percent >= 80 && percent < 100
          const overLimit = percent >= 100
          return (
            <div key={b.id}>
              <p>
                {b.category}: ₹{spent} / ₹{b.limit_amount}
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