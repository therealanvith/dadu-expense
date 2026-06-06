import { NextRequest, NextResponse } from "next/server"
import { parseExpense } from "@/lib/parseExpense"

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  const parsed = await parseExpense(text)
  return NextResponse.json(parsed)
}


