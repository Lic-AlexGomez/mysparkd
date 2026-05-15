import { NextResponse } from "next/server"
import { aggregateFeedLive } from "@/lib/server/aggregate-feed-live"
import { getEventInfrastructureBaseUrl } from "@/lib/server/event-infrastructure-url"

export const runtime = "nodejs"

const normalizeBackend = (raw: string) =>
  raw.replace(/\/api\/?$/, "").replace(/\/$/, "")

const PRIMARY_BACKEND_URL = normalizeBackend(
  process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com"
)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const lat = Number(url.searchParams.get("lat"))
  const lng = Number(url.searchParams.get("lng"))
  const lim = Number(url.searchParams.get("limit"))
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng)
  const authHeader = request.headers.get("authorization")

  try {
    const body = await aggregateFeedLive({
      backendBaseUrl: PRIMARY_BACKEND_URL,
      catalogBaseUrl: getEventInfrastructureBaseUrl(),
      authHeader,
      lat: hasGeo ? lat : undefined,
      lng: hasGeo ? lng : undefined,
      limit: Number.isFinite(lim) ? lim : undefined,
    })
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=25" },
    })
  } catch (e) {
    console.error("[feed/live]", e)
    const now = new Date().toISOString()
    return NextResponse.json(
      {
        events: [],
        activity: [],
        meta: { generated_at: now, partial: true },
      },
      { status: 200 }
    )
  }
}
