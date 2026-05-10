import { NextRequest, NextResponse } from "next/server"
import { photonReverse } from "@/lib/geocoding/server/photon"
import { nominatimReverse } from "@/lib/geocoding/server/nominatim-search"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function resolveProvider(): "photon" | "nominatim" | "mapbox" {
  const p = process.env.ADDRESS_GEOCODING_PROVIDER?.toLowerCase()?.trim()
  if (p === "nominatim") return "nominatim"
  if (p === "mapbox") return "mapbox"
  return "photon"
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"))
  const lon = Number(req.nextUrl.searchParams.get("lon"))
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "invalid coordinates" }, { status: 400 })
  }

  const prov = resolveProvider()

  try {
    if (prov === "nominatim") {
      const nom = await nominatimReverse(lat, lon)
      if (nom?.display_name) return NextResponse.json(nom)
    } else {
      const photon = await photonReverse(lat, lon)
      if (photon?.display_name) return NextResponse.json(photon)
    }

    const fallback = await nominatimReverse(lat, lon)
    if (fallback?.display_name) return NextResponse.json(fallback)

    return NextResponse.json({ display_name: "", address: {} })
  } catch (e) {
    console.error("[api/reverse-geocode]", e)
    return NextResponse.json({ error: "Reverse geocode failed" }, { status: 502 })
  }
}
