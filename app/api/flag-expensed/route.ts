import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: expenses } = await supabaseAdmin
    .from("expenses")
    .select("id, amount, category, description")
    .eq("user_id", session.user.email!)

  if (!expenses) return NextResponse.json({ flagged: [] })

  const totals: Record<string, { sum: number; count: number }> = {}
  for (const e of expenses) {
    const cat = e.category.toLowerCase().trim()
    if (!totals[cat]) totals[cat] = { sum: 0, count: 0 }
    totals[cat].sum += e.amount
    totals[cat].count += 1
  }

  const flagged = expenses.filter(e => {
    const cat = e.category.toLowerCase().trim()
    const avg = totals[cat].sum / totals[cat].count
    return e.amount > avg * 2 && totals[cat].count >= 3 
  }).map(e => {
    const cat = e.category.toLowerCase().trim()
    const avg = totals[cat].sum / totals[cat].count
    return {
      description: e.description,
      amount: e.amount,
      category: cat,
      reason: `₹${Math.round(avg)} avg in ${cat}`
    }
  })

  return NextResponse.json({ flagged })
}