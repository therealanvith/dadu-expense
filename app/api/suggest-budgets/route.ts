import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: expenses } = await supabaseAdmin
    .from("expenses")
    .select("amount, category")
    .eq("user_id", session.user.email!)
    .gte("created_at", since.toISOString())

  if (!expenses) return NextResponse.json({ suggestions: {} })

  const totals: Record<string, number> = {}
  for (const e of expenses) {
    const cat = e.category.toLowerCase().trim()
    totals[cat] = (totals[cat] || 0) + e.amount
  }

  
  const suggestions: Record<string, number> = {}
  for (const [cat, total] of Object.entries(totals)) {
    suggestions[cat] = Math.round(total * 1.35)
  }

  return NextResponse.json({ suggestions })
}