"use client"

import React, { useState } from "react"

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  source: string
  created_at: string
}

type Props = {
  expenses: Expense[]
  onDelete: (id: string) => void
  onEdit: () => void
}

const CATEGORIES = ["all", "food", "travel", "health", "shopping", "entertainment", "investments", "other"]
const SOURCES = ["all", "voice", "ocr", "manual"]

export default function ExpenseTable({ expenses, onDelete, onEdit }: Props) {
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [category, setCategory] = useState("all")
  const [source, setSource] = useState("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ amount: 0, category: "", description: "" })

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

  const filtered = expenses
    .filter(e => {
      const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase())
      const matchFrom = from ? e.created_at >= from : true
      const matchTo = to ? e.created_at <= to : true
      const matchCategory = category === "all" ? true : e.category === category
      const matchSource = source === "all" ? true : e.source === source
      return matchSearch && matchFrom && matchTo && matchCategory && matchSource
    })
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === "desc" ? -diff : diff
    })

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0)

  function exportCSV() {
    const headers = ["Date", "Time", "Description", "Category", "Amount", "Source"]
    const rows = filtered.map(e => {
      const date = new Date(e.created_at)
      return [
        date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
        `"${e.description}"`,
        e.category,
        e.amount,
        e.source
      ].join(",")
    })
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    const win = window.open("", "_blank")
    if (!win) return
    const rows = filtered.map(e => {
      const date = new Date(e.created_at)
      return `
        <tr>
          <td>${date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
          <td>${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</td>
          <td>${e.description}</td>
          <td>${e.category}</td>
          <td>₹${e.amount}</td>
          <td>${e.source}</td>
        </tr>`
    }).join("")

    win.document.write(`
      <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { font-family: sans-serif; padding: 24px; }
            h1 { font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f5f5f5; }
            tfoot td { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Expense Report</h1>
          <p>Generated: ${new Date().toLocaleDateString("en-IN")} · ${filtered.length} expenses · Total: ₹${totalFiltered.toFixed(2)}</p>
          <table>
            <thead>
              <tr><th>Date</th><th>Time</th><th>Description</th><th>Category</th><th>Amount</th><th>Source</th></tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr><td colspan="4">Total</td><td>₹${totalFiltered.toFixed(2)}</td><td></td></tr>
            </tfoot>
          </table>
        </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div>
      {/* filters */}
      <div>
        <input placeholder="Search description..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={source} onChange={e => setSource(e.target.value)}>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        <button onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}>
          Date {sortOrder === "desc" ? "↓" : "↑"}
        </button>
        <button onClick={() => { setSearch(""); setCategory("all"); setSource("all"); setFrom(""); setTo("") }}>
          Clear filters
        </button>
        <button onClick={exportCSV}>Export CSV</button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>

      {/* summary */}
      <p>Showing {filtered.length} expenses — Total: ₹{totalFiltered.toFixed(2)}</p>

      <table>
        <thead>
          <tr>
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
                <td>
                  {new Date(e.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year:"numeric" })}
                  {" "}
                  {new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                </td>                
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
                <tr>
                  <td colSpan={6}>
                    <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} />
                    <select value={editForm.category} onChange={ev => setEditForm(f => ({ ...f, category: ev.target.value }))}>
                      {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c}</option>)}
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