"use client"

import { useEffect, useState } from "react"

export type ToastType = "success" | "error" | "info"

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { message, type },
      })
    )
  }
}

export default function ToastContainer() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    let timer: NodeJS.Timeout

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType }>
      setToast(customEvent.detail)

      clearTimeout(timer)
      timer = setTimeout(() => {
        setToast(null)
      }, 3000)
    }

    window.addEventListener("toast", handleToast)
    return () => {
      window.removeEventListener("toast", handleToast)
      clearTimeout(timer)
    }
  }, [])

  if (!toast) return null

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "✓"
      case "error":
        return "✕"
      case "info":
      default:
        return "ℹ"
    }
  }

  return (
    <div className={`toast toast-${toast.type}`}>
      <span style={{ fontWeight: "bold" }}>{getIcon()}</span>
      <span>{toast.message}</span>
    </div>
  )
}
