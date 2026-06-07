"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import SubscriptionManager from "@/components/SubscriptionManager"

export default function SubscriptionsPage() {
  const { status } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status !== "authenticated") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <span className="text-muted">Loading...</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Subscriptions</h1>
        <p style={{ color: "var(--text-3)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          Track and manage your recurring bills and active subscriptions
        </p>
      </div>
      <SubscriptionManager />
    </div>
  )
}
