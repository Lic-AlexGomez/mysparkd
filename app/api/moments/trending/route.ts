import { NextResponse } from "next/server"
import { listTrendingMoments } from "@/lib/server/moments-store"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Number(url.searchParams.get("limit") || "20")
  const moments = listTrendingMoments(Number.isFinite(limit) ? limit : 20)
  return NextResponse.json({
    moments,
    generated_at: new Date().toISOString(),
  })
}
