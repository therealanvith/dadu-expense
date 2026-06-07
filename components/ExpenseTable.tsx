"use client"

import React, { useState } from "react"
import { showToast } from "@/components/Toast"

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
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        showToast("Expense updated successfully", "success")
        setEditingId(null)
        onEdit()
      } else {
        showToast("Failed to update expense", "error")
      }
    } catch {
      showToast("Failed to update expense", "error")
    }
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
          <td style="color: #64748b;">${date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
          <td style="color: #64748b;">${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}</td>
          <td style="font-weight: 500; color: #0f172a;">${e.description}</td>
          <td><span class="category-badge">${e.category}</span></td>
          <td class="amount">₹${e.amount.toLocaleString("en-IN")}</td>
          <td><span class="source-badge">${e.source}</span></td>
        </tr>`
    }).join("")

    win.document.write(`
      <html>
        <head>
          <title>Expense Report</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px; 
              color: #0f172a; 
              background-color: #ffffff; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-bottom: 2px solid #6366f1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: 800;
              color: #6366f1;
              letter-spacing: -0.02em;
            }
            .meta {
              font-size: 13px;
              color: #64748b;
              text-align: right;
              line-height: 1.5;
            }
            .title {
              font-size: 28px;
              font-weight: 800;
              margin: 0 0 4px 0;
              color: #0f172a;
              letter-spacing: -0.02em;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              overflow: hidden;
            }
            th, td { 
              padding: 12px 16px; 
              text-align: left; 
              font-size: 13px; 
              border-bottom: 1px solid #e2e8f0;
            }
            th { 
              background: #f8fafc; 
              font-weight: 600; 
              color: #475569;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.05em;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .category-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              text-transform: capitalize;
              background: rgba(99, 102, 241, 0.08);
              color: #4f46e5;
            }
            .source-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              background: rgba(100, 116, 139, 0.08);
              color: #475569;
            }
            .amount {
              font-weight: 700;
              color: #0f172a;
            }
            .total-row { 
              background: #f8fafc; 
              font-weight: 700;
              font-size: 14px;
            }
            .total-row td {
              padding: 14px 16px;
              border-top: 2px solid #e2e8f0;
            }
            @media print {
              body {
                background-color: #ffffff !important;
                color: #0f172a !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Expense Report</h1>
              <div class="logo">Kuberly</div>
            </div>
            <div class="meta">
              <div>Generated: ${new Date().toLocaleDateString("en-IN")}</div>
              <div>${filtered.length} records</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4">Total</td>
                <td style="color: #6366f1;">₹${totalFiltered.toLocaleString("en-IN")}</td>
                <td></td>
              </tr>
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
      <div className="filter-grid">
        <div>
          <label>Search</label>
          <input placeholder="description..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div>
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Source</label>
          <select value={source} onChange={e => setSource(e.target.value)}>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}>
          Date {sortOrder === "desc" ? "↓" : "↑"}
        </button>
        <button className="btn btn-ghost" onClick={() => { setSearch(""); setCategory("all"); setSource("all"); setFrom(""); setTo("") }}>
          Clear filters
        </button>
        <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
        <button className="btn btn-secondary" onClick={exportPDF}>Export PDF</button>
      </div>

      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Showing {filtered.length} expenses | Total: ₹{totalFiltered.toFixed(2)}
      </p>

      {filtered.length === 0 ? (
        <div className="empty-state">No expenses found</div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Date & Time</th>
                <th>Description</th>
                <th style={{ width: "120px" }}>Category</th>
                <th style={{ width: "110px" }}>Amount</th>
                <th style={{ width: "100px" }}>Source</th>
                <th style={{ width: "160px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <React.Fragment key={e.id}>
                  <tr>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(e.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" })}
                      {" "}
                      <span style={{ color: "var(--text-3)", fontSize: "0.8125rem" }}>
                        {new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })}
                      </span>
                    </td>
                    <td style={{ wordBreak: "break-word" }}>{e.description}</td>
                    <td>
                      <span className="badge badge-accent" style={{ textTransform: "capitalize" }}>
                        {e.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{e.amount.toLocaleString("en-IN")}</td>
                    <td className="text-muted" style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.02em" }}>{e.source}</td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost" style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem" }} onClick={() => startEdit(e)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem" }} onClick={() => onDelete(e.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                  {editingId === e.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: "1.5rem", background: "var(--bg-elevated)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                          <input type="text" value={editForm.description} onChange={ev => setEditForm(f => ({ ...f, description: ev.target.value }))} placeholder="Description" />
                          <select value={editForm.category} onChange={ev => setEditForm(f => ({ ...f, category: ev.target.value }))}>
                            {CATEGORIES.filter(c => c !== "all").map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input type="number" value={editForm.amount} onChange={ev => setEditForm(f => ({ ...f, amount: Number(ev.target.value) }))} placeholder="Amount" />
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button className="btn btn-primary" onClick={() => saveEdit(e.id)}>Save</button>
                          <button className="btn btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}