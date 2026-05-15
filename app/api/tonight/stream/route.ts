import { NextResponse } from "next/server"
import { aggregateTonightStream } from "@/lib/server/aggregate-tonight-stream"
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
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng)
  const authHeader = request.headers.get("authorization")

  try {
    const body = await aggregateTonightStream({
      sparkdBackendUrl: PRIMARY_BACKEND_URL,
      catalogBaseUrl: getEventInfrastructureBaseUrl(),
      authHeader,
      lat: hasGeo ? lat : undefined,
      lng: hasGeo ? lng : undefined,
    })
    console.log("body", body)
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=20" },
    })
  } catch (e) {
    console.error("[tonight/stream]", e)
    const now = new Date().toISOString()
    return NextResponse.json(
      {
        events: [],
        active_users: [],
        groups: [],
        plans: [],
        meta: { generated_at: now, partial: true },
      },
      { status: 200 }
    )
  }
}
