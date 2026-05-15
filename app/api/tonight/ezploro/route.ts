import { NextResponse } from "next/server"

export const runtime = "nodejs"

const EZPLORO_API = "https://api-v3-backend-ezploro.apps.ezploro.com/api"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const lat = url.searchParams.get("lat")
  const lng = url.searchParams.get("lng")
  const size = url.searchParams.get("size") || "100"

  const params = new URLSearchParams()
  params.set("size", size)
  if (lat) params.set("lat", lat)
  if (lng) params.set("lng", lng)

  try {
    const res = await fetch(`${EZPLORO_API}/events?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      return NextResponse.json({ events: [], error: `Ezploro responded ${res.status}` }, { status: 200 })
    }
    const data = await res.json()
    return NextResponse.json({ events: Array.isArray(data) ? data : data.events ?? [] }, {
      headers: { "Cache-Control": "private, max-age=30" },
    })
  } catch (e) {
    console.error("[tonight/ezploro]", e)
    return NextResponse.json({ events: [], error: String(e) }, { status: 200 })
  }
}
