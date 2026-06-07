/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import { useState } from "react"

type ParsedExpense = { amount: number; category: string; description: string }
type Props = { onParsed: (expense: ParsedExpense) => void }

const CATEGORIES = ["food", "travel", "health", "shopping", "entertainment", "investments", "other"]

export default function VoiceInput({ onParsed }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [parsed, setParsed] = useState<ParsedExpense | null>(null)
  const [useManual, setUseManual] = useState(false)
  const [manualText, setManualText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isSpeechSupported =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  async function parseText(text: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      const cleanCategory = (data.category || "").toLowerCase().trim()
      const result: ParsedExpense = {
        amount: data.amount || 0,
        category: CATEGORIES.includes(cleanCategory)
          ? cleanCategory
          : "other",
        description: data.description || text,
      }

      if (result.amount === 0) {
        setError("Couldn't detect an amount. Please edit before saving.")
      }

      setParsed(result)
    } catch {
      setError("Failed to parse. Please try again.")
    }
    setLoading(false)
  }

  async function startListening() {
    if (!isSpeechSupported) {
      setUseManual(true)
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      setTranscript(text)
      if (confidence < 0.5) {
        setError("Audio unclear. Please check before saving.")
      }
      await parseText(text)
    }

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") setError("No speech detected. Try again.")
      else if (event.error === "not-allowed") setError("Microphone access denied.")
      else setError("Voice error: " + event.error)
      setListening(false)
    }

    recognition.onend = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  async function handleManualSubmit() {
    if (!manualText.trim()) return
    setTranscript(manualText)
    await parseText(manualText)
    setManualText("")
  }

  function confirmAndSave() {
    if (!parsed) return
    onParsed(parsed)
    setParsed(null)
    setTranscript("")
    setError("")
  }

  function reset() {
    setParsed(null)
    setTranscript("")
    setError("")
    setManualText("")
    setUseManual(false)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {!useManual ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            className="btn btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            onClick={startListening}
            disabled={listening || loading}
          >
            {listening ? (
              <>
                <span className="rec-dot" />
                <span>Listening…</span>
              </>
            ) : loading ? (
              <span>Parsing…</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />
                </svg>
                <span>Speak</span>
              </>
            )}
          </button>
          {isSpeechSupported && (
            <button
              className="btn btn-secondary"
              style={{ width: "100%" }}
              onClick={() => setUseManual(true)}
            >
              Type instead
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input
            type="text"
            placeholder='e.g. "spent 250 on lunch"'
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
            autoFocus
          />
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={handleManualSubmit}
            disabled={loading || !manualText.trim()}
          >
            {loading ? "Parsing…" : "Parse"}
          </button>
          {isSpeechSupported && (
            <button className="btn btn-ghost" onClick={() => setUseManual(false)}>
              Use voice instead
            </button>
          )}
        </div>
      )}

      {transcript && (
        <div style={{
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginBottom: "0.25rem" }}>Heard</p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-1)" }}>{transcript}</p>
        </div>
      )}

      {error && (
        <div style={{
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          background: "var(--warning-dim)",
          border: "1px solid rgba(245,158,11,0.2)",
          color: "var(--warning)",
          fontSize: "0.875rem",
        }}>
          {error}
        </div>
      )}

      {parsed && (
        <div style={{
          padding: "1rem",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
        }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-2)", margin: 0 }}>
            Review & edit
          </p>

          <div>
            <label>Amount (₹)</label>
            <input
              type="number"
              value={parsed.amount}
              onChange={e => setParsed(p => p ? { ...p, amount: Number(e.target.value) } : p)}
              onWheel={e => (e.currentTarget as HTMLInputElement).blur()}
            />
          </div>

          <div>
            <label>Category</label>
            <select
              value={parsed.category}
              onChange={e => setParsed(p => p ? { ...p, category: e.target.value } : p)}
              style={{ textTransform: "capitalize" }}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label>Description</label>
            <input
              type="text"
              value={parsed.description}
              onChange={e => setParsed(p => p ? { ...p, description: e.target.value } : p)}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmAndSave}>
              Save
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={reset}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}