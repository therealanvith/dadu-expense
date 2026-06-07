import { handlers } from "@/auth"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest
) {
  return handlers.GET(request as unknown as Parameters<typeof handlers.GET>[0])
}

export async function POST(
  request: NextRequest
) {
  return handlers.POST(request as unknown as Parameters<typeof handlers.POST>[0])
}

export const dynamic = 'force-dynamic'