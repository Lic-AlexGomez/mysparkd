import { NextResponse } from "next/server"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { getRecommendationHint } from "@/lib/server/moments-store"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  const viewer = decodeJwtUserId(auth)
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const hint = getRecommendationHint(viewer)
  return NextResponse.json({
    connection_score: hint.connection_score,
    affinity_boost: hint.affinity_boost,
    moment_count_30d: hint.moment_count_30d,
  })
}
