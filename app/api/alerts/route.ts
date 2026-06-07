import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"
import { sendBudgetAlert } from "@/lib/email"
export const dynamic = 'force-dynamic'

export async function POST() {
  console.log("Alert route hit")
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user.email!

  const { data: expenses } = await supabaseAdmin
    .from("expenses")
    .select("amount, category")
    .eq("user_id", email)

  const { data: budgets } = await supabaseAdmin
    .from("budgets")
    .select("*")
    .eq("user_id", email)

  if (!expenses || !budgets) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const budget of budgets) {
    const spent = expenses
      .filter(e => e.category.toLowerCase().trim() === budget.category.toLowerCase().trim())
      .reduce((s, e) => s + e.amount, 0)
    const percent = (spent / budget.limit_amount) * 100
    if (percent >= 80) {
      await sendBudgetAlert(email, budget.category, spent, budget.limit_amount)
      sent++
    }
  }

  return NextResponse.json({ sent })
}