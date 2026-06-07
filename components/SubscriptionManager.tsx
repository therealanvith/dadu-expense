"use client"

import { useState, useEffect } from "react"

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
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: Number(amount), category, frequency, next_due_date: nextDue })
    })
    setName(""); setAmount(""); setNextDue("")
    await fetchSubscriptions()
  }

  async function handleDelete(id: string) {
    await fetch("/api/subscriptions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    })
    await fetchSubscriptions()
  }

  return (
    <div>
      <h2>Subscriptions</h2>
      <input placeholder="Name (e.g. Netflix)" value={name} onChange={e => setName(e.target.value)} />
      <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} />
      <select value={category} onChange={e => setCategory(e.target.value)}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={frequency} onChange={e => setFrequency(e.target.value)}>
        <option value="monthly">Monthly</option>
        <option value="weekly">Weekly</option>
      </select>
      <input type="date" value={nextDue} onChange={e => setNextDue(e.target.value)} />
      <button onClick={handleAdd}>Add Subscription</button>

      <div>
        {subscriptions.length === 0 && <p>No subscriptions yet.</p>}
        {subscriptions.map(s => (
          <div key={s.id}>
            <p>
              <strong>{s.name}</strong> — ₹{s.amount} / {s.frequency} — {s.category}
              <br />
              Next due: {s.next_due_date}
            </p>
            <button onClick={() => handleDelete(s.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}