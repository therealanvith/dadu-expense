"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "@/components/ThemeProvider"

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/charts", label: "Charts" },
  { href: "/budgets", label: "Budgets" },
  { href: "/subscriptions", label: "Subscriptions" },
]

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { theme, toggle } = useTheme()

  if (status === "loading" || !session) return null

  return (
    <nav style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      height: "3.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 1rem",
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.125rem", overflowX: "auto", flex: 1, marginRight: "0.5rem" }}>
        <span style={{
          fontWeight: 700,
          fontSize: "1rem",
          color: "var(--accent-light)",
          marginRight: "1rem",
          letterSpacing: "-0.02em",
          flexShrink: 0
        }}>
          Kuberly
        </span>
        <div style={{ display: "flex", gap: "0.125rem", overflowX: "auto" }} className="nav-links">
          {links.map(link => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "0.375rem 0.625rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.8125rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--text-1)" : "var(--text-2)",
                  background: active ? "var(--bg-elevated)" : "transparent",
                  textDecoration: "none",
                  transition: "all var(--transition)",
                  flexShrink: 0
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
        <button
          className="btn btn-ghost"
          style={{ padding: "0.375rem 0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={toggle}
          title="Toggle theme"
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>
        <div className="nav-email" style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          fontSize: "0.75rem",
          color: "var(--text-2)",
          padding: "0.25rem 0.625rem",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "99px",
          marginRight: "0.25rem",
          fontWeight: 500
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{session.user?.email}</span>
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem" }}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}