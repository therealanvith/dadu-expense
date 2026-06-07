import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { auth } from "@/auth"
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = session.user.email!
  const today = new Date().toISOString().slice(0, 10)

  const { data: subscriptions } = await supabaseAdmin
  .from("subscriptions")
  .select("*")
  .eq("user_id", email)
  .lte("next_due_date", today)
  .or(`last_processed.is.null,last_processed.neq.${today}`)

  if (!subscriptions || subscriptions.length === 0)
    return NextResponse.json({ processed: 0 })

  let processed = 0
  for (const sub of subscriptions) {
    await supabaseAdmin.from("expenses").insert({
      user_id: email,
      amount: sub.amount,
      category: sub.category,
      description: sub.name,
      source: "subscription"
    })

    const next = new Date(sub.next_due_date)
    if (sub.frequency === "weekly") next.setDate(next.getDate() + 7)
    else next.setMonth(next.getMonth() + 1)

    // update subscription
    await supabaseAdmin
      .from("subscriptions")
      .update({
        next_due_date: next.toISOString().slice(0, 10),
        last_processed: today
      })
      .eq("id", sub.id)

    processed++
  }

  await fetch(`${process.env.NEXTAUTH_URL}/api/alerts`, { method: "POST" })

  return NextResponse.json({ processed })
}