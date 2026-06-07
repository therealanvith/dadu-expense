/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"
import { useState } from "react"

type ParsedExpense = {
  amount: number
  category: string
  description: string
}

type Props = {
  onParsed: (expense: ParsedExpense) => void
}
const CATEGORIES = ["food", "travel", "health", "shopping", "entertainment", "investments", "other"]
export default function VoiceInput({ onParsed }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [parsed, setParsed] = useState<ParsedExpense | null>(null)
  const [useManual, setUseManual] = useState(false)
  const [manualText, setManualText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isSpeechSupported = typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

  async function parseText(text: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/parse-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })
      const data = await res.json()
      const result: ParsedExpense = {
        amount: data.amount || 0,
        category: CATEGORIES.includes(data.category) ? data.category : "other",
        description: data.description || text
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
        setError("Audio unclear. Please check the parsed result before saving.")
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

  return (
    <div>
      {!useManual ? (
        <div>
          <button onClick={startListening} disabled={listening || loading}>
            {listening ? "🔴 Listening..." : loading ? "Parsing..." : "🎤 Speak Expense"}
          </button>
          <button onClick={() => setUseManual(true)}>Type instead</button>
        </div>
      ) : (
        <div>
          <input
            placeholder='e.g. "spent 250 on lunch"'
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
          />
          <button onClick={handleManualSubmit} disabled={loading}>
            {loading ? "Parsing..." : "Parse"}
          </button>
          {isSpeechSupported && (
            <button onClick={() => setUseManual(false)}>Use voice</button>
          )}
        </div>
      )}
      {transcript && <p>Heard: {transcript}</p>}
      {error && <p style={{ color: "orange" }}>{error}</p>}
      {parsed && (
        <div>
          <p>Review before saving:</p>
          <input
            type="number"
            value={parsed.amount}
            onChange={e => setParsed(p => p ? { ...p, amount: Number(e.target.value) } : p)}
          />
          <select
            value={parsed.category}
            onChange={e => setParsed(p => p ? { ...p, category: e.target.value } : p)}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="text"
            value={parsed.description}
            onChange={e => setParsed(p => p ? { ...p, description: e.target.value } : p)}
          />
          <button onClick={confirmAndSave}>✅ Save Expense</button>
          <button onClick={() => { setParsed(null); setTranscript(""); setError("") }}>Cancel</button>
        </div>
      )}
    </div>
  )
}