import { NextResponse } from "next/server"
import { aggregateCityPulse } from "@/lib/server/city-pulse-aggregator"

export const runtime = "nodejs"

const normalizeBackend = (raw: string) =>
  raw.replace(/\/api\/?$/, "").replace(/\/$/, "")

const PRIMARY_BACKEND_URL = normalizeBackend(
  process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com"
)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const city = url.searchParams.get("city")?.trim() || ""
  const lat = Number(url.searchParams.get("lat"))
  const lng = Number(url.searchParams.get("lng"))

  const hasGeo =
    Number.isFinite(lat) && Number.isFinite(lng)
  if (!city && !hasGeo) {
    return NextResponse.json(
      {
        error: "Provide `city` or both `lat` and `lng` query params.",
      },
      { status: 400 }
    )
  }

  const authHeader = request.headers.get("authorization")

  try {
    const body = await aggregateCityPulse({
      backendBaseUrl: PRIMARY_BACKEND_URL,
      authHeader,
      city: city || undefined,
      lat: hasGeo ? lat : undefined,
      lng: hasGeo ? lng : undefined,
    })

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "private, max-age=45",
      },
    })
  } catch (e) {
    console.error("[city-pulse]", e)
    return NextResponse.json(
      {
        city_label: city || "Unknown",
        activity_score: 0,
        metrics: {
          active_users_count: 0,
          ongoing_events_count: 0,
          fast_date_activity_count: 0,
          group_signals_count: 0,
          group_formation_rate: 0,
        },
        trending_events: [],
        hot_zones: [],
        partial: true,
        generated_at: new Date().toISOString(),
        recommendation_boost: 0,
      },
      { status: 200 }
    )
  }
}
