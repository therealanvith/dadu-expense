"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status,router])

  if (status === "loading") return <p>Loading...</p>

  return (
    <div>
      <h1>Welcome {session?.user?.email}</h1>
      <button onClick={() => signOut({ callbackUrl: "/login" })}>Sign Out</button>
    </div>
  )
}