"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import VoiceInput from "@/components/VoiceInput"
import OcrUpload from "@/components/OcrUpload"
import { showToast } from "@/components/Toast"

type ParsedExpense = { amount: number; category: string; description: string }
type Tab = "manual" | "voice" | "scan"

const categories = ["food", "travel", "health", "shopping", "entertainment", "investments", "other"]

export default function FloatingAdd() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>("manual")
  const [form, setForm] = useState({ amount: "", category: "", description: "" })
  const [saving, setSaving] = useState(false)

  if (!session) return null

  async function save(expense: ParsedExpense, source: string) {
    setSaving(true)
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...expense, source }),
      })
      if (res.ok) {
        showToast("Expense added successfully", "success")
        await fetch("/api/alerts", { method: "POST" })
        window.dispatchEvent(new Event("expense-added"))
      } else {
        showToast("Failed to add expense", "error")
      }
    } catch {
      showToast("Failed to add expense", "error")
    }
    setSaving(false)
    setOpen(false)
    setForm({ amount: "", category: "", description: "" })
  }

  async function handleManualSubmit() {
    if (!form.amount || !form.category) return
    await save(
      { amount: parseFloat(form.amount), category: form.category, description: form.description },
      "manual"
    )
  }

  function close() {
    setOpen(false)
    setTab("manual")
    setForm({ amount: "", category: "", description: "" })
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "manual", label: "Manual" },
    { key: "voice", label: "Voice" },
    { key: "scan", label: "Scan" },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add expense"
        style={{
          position: "fixed",
          bottom: "1.75rem",
          right: "1.75rem",
          zIndex: 200,
          width: "3rem",
          height: "3rem",
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          fontSize: "1.375rem",
          lineHeight: 1,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 150ms ease",
        }}
        onMouseEnter={e => {
          const b = e.currentTarget
          b.style.transform = "scale(1.06)"
        }}
        onMouseLeave={e => {
          const b = e.currentTarget
          b.style.transform = "scale(1)"
        }}
      >
        +
      </button>

      {open && (
        <div onClick={close} className="modal-overlay">
          <div
            className="modal-card animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span className="section-title">Add Expense</span>
              <button className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={close}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
              <div style={{
                display: "flex",
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-md)",
                padding: "3px",
                marginBottom: "1.25rem",
                border: "1px solid var(--border)",
              }}>
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      flex: 1,
                      padding: "0.4rem 0",
                      borderRadius: "calc(var(--radius-md) - 2px)",
                      border: "none",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      background: tab === t.key ? "var(--bg-surface)" : "transparent",
                      color: tab === t.key ? "var(--text-1)" : "var(--text-3)",
                      boxShadow: tab === t.key ? "var(--shadow-sm)" : "none",
                      transition: "all var(--transition)",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "manual" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  <div>
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label>Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      style={{ textTransform: "capitalize" }}
                    >
                      <option value="">Select category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Description <span style={{ color: "var(--text-3)", fontWeight: 400 }}>(optional)</span></label>
                    <input
                      type="text"
                      placeholder="What was this for?"
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: "0.25rem", width: "100%" }}
                    onClick={handleManualSubmit}
                    disabled={saving || !form.amount || !form.category}
                  >
                    {saving ? "Saving…" : "Save Expense"}
                  </button>
                </div>
              )}

              {tab === "voice" && <VoiceInput onParsed={e => save(e, "voice")} />}
              {tab === "scan" && <OcrUpload onParsed={e => save(e, "ocr")} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}