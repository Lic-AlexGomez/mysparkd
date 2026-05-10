import { NextRequest, NextResponse } from "next/server"
import { photonForwardSearch } from "@/lib/geocoding/server/photon"
import { nominatimForwardSearch } from "@/lib/geocoding/server/nominatim-search"
import { mapboxForwardSearch } from "@/lib/geocoding/server/mapbox-search"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function resolveProvider(): "photon" | "nominatim" | "mapbox" {
  const p = process.env.ADDRESS_GEOCODING_PROVIDER?.toLowerCase()?.trim()
  if (p === "nominatim") return "nominatim"
  if (p === "mapbox") return "mapbox"
  return "photon"
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? ""
  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] })
  }

  const country = req.nextUrl.searchParams.get("country") ?? undefined
  const latRaw = req.nextUrl.searchParams.get("lat")
  const lonRaw = req.nextUrl.searchParams.get("lon")
  const biasLat = latRaw != null && latRaw !== "" ? Number(latRaw) : undefined
  const biasLon = lonRaw != null && lonRaw !== "" ? Number(lonRaw) : undefined

  const prov = resolveProvider()

  try {
    let suggestions
    if (prov === "mapbox") {
      const token = process.env.MAPBOX_ACCESS_TOKEN
      if (!token) {
        suggestions = await photonForwardSearch(q, { country, biasLat, biasLon })
      } else {
        suggestions = await mapboxForwardSearch(q, token, { country, biasLat, biasLon })
      }
    } else if (prov === "nominatim") {
      suggestions = await nominatimForwardSearch(q, {
        country,
        biasLat,
        biasLon,
        biasDelta: 0.35,
      })
    } else {
      suggestions = await photonForwardSearch(q, { country, biasLat, biasLon })
    }

    return NextResponse.json({ suggestions })
  } catch (e) {
    console.error("[api/geocode]", e)
    return NextResponse.json({ suggestions: [], error: "Geocode failed" }, { status: 502 })
  }
}
