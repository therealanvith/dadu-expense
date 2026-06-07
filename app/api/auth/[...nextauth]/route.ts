import { handlers } from "@/auth"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.GET(request as any)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  return handlers.POST(request as any)
}

export const dynamic = 'force-dynamic'