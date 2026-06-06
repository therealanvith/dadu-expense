"use client"

import { useState } from "react"
import React from "react"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  date: string
  source: string
  created_at: string
}

type Props = {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit: () => void
}

const CATEGORIES = ["food", "travel", "health", "shopping", "entertainment","investments", "other"]

export default function ExpenseTable({ expenses, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ amount: 0, category: "", description: ""})

  function startEdit(e: Expense) {
    setEditingId(e.id)
    setEditForm({ amount: e.amount, category: e.category, description: e.description })
  }

  async function saveEdit(id: string) {
    await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    })
    setEditingId(null)
    onEdit()
  }

  const filtered = expenses.filter(e => {
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase())
    const matchFrom = from ? e.date >= from : true
    const matchTo = to ? e.date <= to : true
    return matchSearch && matchFrom && matchTo
  })

  return (
    <div>
      <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
      <input type="date" value={to} onChange={e => setTo(e.target.value)} />
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(e => (
            <React.Fragment key={e.id}>
              <tr>
                <td>{new Date(e.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })}</td>
                <td>{new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</td>
                <td>{e.description}</td>
                <td>{e.category}</td>
                <td>₹{e.amount}</td>
                <td>{e.source}</td>
                <td>
                  <button onClick={() => startEdit(e)}>Edit</button>
                  <button onClick={() => onDelete(e.id)}>Delete</button>
                </td>
              </tr>
              {editingId === e.id && (
                <tr key={`edit-${e.id}`}>
                  <td colSpan={7}>
                    <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} />
                    <select value={editForm.category} onChange={ev => setEditForm(f => ({ ...f, category: ev.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" value={editForm.amount} onChange={ev => setEditForm(f => ({ ...f, amount: Number(ev.target.value) }))} />
                    <button onClick={() => saveEdit(e.id)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}