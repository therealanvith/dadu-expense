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

export default function VoiceInput({ onParsed }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")

  async function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = "en-IN"
    
    recognition.onresult = async (event: any) => {
        const text = event.results[0][0].transcript
        setTranscript(text)
        const res = await fetch("/api/parse-expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        })
        const parsed = await res.json()
        onParsed(parsed)
    }

    recognition.onend = () => setListening(false)
    
    setListening(true)
    recognition.start()
  }

  return (
    <div>
      <button onClick={startListening} disabled={listening}>
        {listening ? "Listening..." : "🎤 Speak Expense"}
      </button>
      {transcript && <p>Heard: {transcript}</p>}
    </div>
  )
}