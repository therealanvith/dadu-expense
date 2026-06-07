/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (!email || !password) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    try {
      if (isSignup) {
        const { error: signupError } = await supabase.auth.signUp({ email, password })
        if (signupError) {
          setError(signupError.message)
          setLoading(false)
          return
        }
        setSuccess("Account created! Sign in with your credentials.")
        setEmail("")
        setPassword("")
        setIsSignup(false)
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          setError(result.error)
        } else if (result?.ok) {
          window.location.href = "/dashboard"
        }
      }
    } catch {
      setError("An error occurred. Please try again.")
    }
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-base)",
      padding: "1.5rem",
    }}>
      <div className="card-raised animate-fade-up" style={{
        width: "100%",
        maxWidth: "400px",
        borderRadius: "var(--radius-xl)",
      }}>
        <div style={{
          padding: "2rem",
          textAlign: "center",
        }}>
          <span style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "var(--accent-light)",
            letterSpacing: "-0.02em",
            display: "block",
            marginBottom: "0.5rem",
          }}>
            Expenses
          </span>
          <p style={{
            color: "var(--text-3)",
            fontSize: "0.875rem",
            margin: 0,
          }}>
            Your personal expense tracker
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--border)" }} />

        <div style={{ padding: "2rem" }}>
          <div style={{ marginBottom: "1.5rem",textAlign: "center" }}>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            <p style={{ color: "var(--text-3)", fontSize: "0.875rem", margin: 0 }}>
              {isSignup
                ? "Sign up to start tracking expenses"
                : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && handleSubmit(e as any)}
                disabled={loading}
              />
            </div>

            {error && (
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--danger-dim)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "var(--danger)",
                fontSize: "0.875rem",
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--success-dim)",
                border: "1px solid rgba(34,197,94,0.15)",
                color: "var(--success)",
                fontSize: "0.875rem",
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={loading}
            >
              {loading ? "Loading…" : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "1.5rem 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ color: "var(--text-3)", fontSize: "0.8125rem" }}>OR</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            >
            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: "0.375rem" }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Sign in with Google
        </button>

          <div style={{
            marginTop: "1.5rem",
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-2)",
          }}>
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false)
                    setError("")
                    setSuccess("")
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-light)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Dont have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true)
                    setError("")
                    setSuccess("")
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--accent-light)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}