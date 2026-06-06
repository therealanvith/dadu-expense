"use client"

import { useState } from "react"
import Tesseract from "tesseract.js"

type ParsedExpense = {
  amount: number
  category: string
  description: string
}

type Props = {
  onParsed: (expense: ParsedExpense) => void
}

export default function OcrUpload({ onParsed }: Props) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return

  setPreview(URL.createObjectURL(file))
  setLoading(true)

  const img = await createImageBitmap(file)
  const canvas = document.createElement("canvas")
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext("2d")!
  
  ctx.filter = "grayscale(1) contrast(1.5)"
  ctx.drawImage(img, 0, 0)

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"))

  const { data: { text } } = await Tesseract.recognize(blob, "eng")
  console.log("ocr text:", text)

  const res = await fetch("/api/parse-expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  })


    const parsed = await res.json()
    console.log("parsed:", parsed)
    onParsed(parsed)
    setLoading(false)
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFile} />
      {preview && <img src={preview} alt="receipt" width={200} />}
      {loading && <p>Scanning receipt...</p>}
    </div>
  )
}