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

    recognition.onstart = () => console.log("recognition started")
    
    recognition.onresult = async (event: any) => {
        console.log("got result", event.results)
        const text = event.results[0][0].transcript
        console.log("transcript:", text)
        setTranscript(text)
        const res = await fetch("/api/parse-expense", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text })
        })
        const parsed = await res.json()
        onParsed(parsed)
    }

    recognition.onerror = (event: any) => console.log("error:", event.error)
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