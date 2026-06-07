import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", session.user.email!)
    .order("next_due_date", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, amount, category, frequency, next_due_date } = await req.json()

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .insert({ user_id: session.user.email!, name, amount, category, frequency, next_due_date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.email!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}