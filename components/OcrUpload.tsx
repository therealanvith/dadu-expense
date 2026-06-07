"use client"

import { useRef, useState } from "react"
import Tesseract from "tesseract.js"
import Image from "next/image"

type ParsedExpense = { amount: number; category: string; description: string }
type Props = { onParsed: (expense: ParsedExpense) => void }

export default function OcrUpload({ onParsed }: Props) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [stage, setStage] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setLoading(true)
    setStage("Preprocessing image…")

    const img = await createImageBitmap(file)
    const canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext("2d")!
    ctx.filter = "grayscale(1) contrast(1.5)"
    ctx.drawImage(img, 0, 0)

    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/png"))

    setStage("Reading text…")
    const { data: { text } } = await Tesseract.recognize(blob, "eng")

    setStage("Parsing with AI…")
    const res = await fetch("/api/parse-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })

    const parsed = await res.json()
    onParsed(parsed)
    setLoading(false)
    setStage("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {!preview ? (
        <button
          className="btn btn-secondary"
          style={{
            width: "100%",
            padding: "2rem",
            flexDirection: "column",
            gap: "0.5rem",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-elevated)",
            cursor: "pointer",
          }}
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.25rem", opacity: 0.7 }}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>Click to upload receipt</span>
          <span style={{ color: "var(--text-3)", fontSize: "0.75rem" }}>PNG, JPG, WEBP</span>
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{
            position: "relative",
            width: "100%",
            height: "180px",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}>
            <Image src={preview} alt="receipt" fill style={{ objectFit: "contain" }} />
          </div>
          {!loading && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: "0.8125rem", color: "var(--text-3)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
              onClick={() => {
                setPreview(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Remove
            </button>
          )}
        </div>
      )}

      {loading && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
        }}>
          <span style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
            flexShrink: 0,
          }} />
          <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>{stage}</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}