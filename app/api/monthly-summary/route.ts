import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"
import { sendMonthlySummary } from "@/lib/email"
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user.email!

  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const { data: expenses } = await supabaseAdmin
    .from("expenses")
    .select("amount, category")
    .eq("user_id", email)
    .gte("created_at", start.toISOString())

  if (!expenses) return NextResponse.json({ ok: false })

  const byCategory: Record<string, number> = {}
  let total = 0
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    total += e.amount
  }

  await sendMonthlySummary(email, Math.round(total), byCategory)
  return NextResponse.json({ ok: true })
}