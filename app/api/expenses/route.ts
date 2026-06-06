import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from("expenses")
    .select("*")
    .eq("user_id", session.user.email)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  console.log("session:", session)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  console.log("body:", body)

  const { amount, category, description, date, source } = body

  const { data, error } = await supabaseAdmin
    .from("expenses")
    .insert({ user_id: session.user.email, amount, category, description, date, source })
    .select()
    .single()

  console.log("supabase error:", error)
  console.log("supabase data:", data)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}