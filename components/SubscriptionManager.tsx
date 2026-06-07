"use client"

import { useState, useEffect } from "react"
import { showToast } from "@/components/Toast"

type Subscription = {
  id: string
  name: string
  amount: number
  category: string
  frequency: string
  next_due_date: string
}

const CATEGORIES = ["food", "travel", "health", "shopping", "entertainment", "investments", "other"]

export default function SubscriptionManager() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("entertainment")
  const [frequency, setFrequency] = useState("monthly")
  const [nextDue, setNextDue] = useState("")

  useEffect(() => { fetchSubscriptions() }, [])

  async function fetchSubscriptions() {
    const res = await fetch("/api/subscriptions")
    const data = await res.json()
    setSubscriptions(Array.isArray(data) ? data : [])
  }

  async function handleAdd() {
    if (!name || !amount || !nextDue) return
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, amount: Number(amount), category, frequency, next_due_date: nextDue })
      })
      if (res.ok) {
        showToast("Subscription added successfully", "success")
        setName(""); setAmount(""); setNextDue("")
        await fetchSubscriptions()
      } else {
        showToast("Failed to add subscription", "error")
      }
    } catch {
      showToast("Failed to add subscription", "error")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        showToast("Subscription deleted", "success")
        await fetchSubscriptions()
      } else {
        showToast("Failed to delete subscription", "error")
      }
    } catch {
      showToast("Failed to delete subscription", "error")
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
      
      {/* Add Subscription Form */}
      <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", height: "fit-content" }}>
        <h2 className="section-title">Add New Subscription</h2>
        <div>
          <label>Subscription Name</label>
          <input placeholder="e.g. Netflix, Spotify" value={name} onChange={e => setName(e.target.value)} />
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label>Amount (₹)</label>
            <input type="number" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label>Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ textTransform: "capitalize" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Next Due Date</label>
            <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleAdd} style={{ marginTop: "0.5rem", width: "100%" }}>Add Subscription</button>
      </div>

      {/* Subscriptions List */}
      <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
        <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Active Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <div className="empty-state" style={{ flex: 1, padding: "3rem 1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.5rem", opacity: 0.5 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <p>No active subscriptions yet.</p>
            <p style={{ fontSize: "0.8125rem" }}>Add one to track automatic renewals.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {subscriptions.map(s => (
              <div key={s.id} style={{ 
                padding: "1rem", 
                borderRadius: "var(--radius-md)", 
                background: "var(--bg-elevated)", 
                border: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{s.name}</span>
                    <span className="badge badge-accent" style={{ textTransform: "capitalize" }}>{s.category}</span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-3)", marginTop: "0.25rem" }}>
                    Next renewal: {new Date(s.next_due_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>₹{s.amount}</span>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.frequency}</p>
                  </div>
                  <button className="btn btn-danger" onClick={() => handleDelete(s.id)} style={{ padding: "0.375rem 0.5rem" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}