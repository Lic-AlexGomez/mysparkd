import { NextResponse } from "next/server"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { aggregateRecommendations } from "@/lib/server/recommendation-graph-aggregator"

export const runtime = "nodejs"

const normalizeBackend = (raw: string) =>
  raw.replace(/\/api\/?$/, "").replace(/\/$/, "")

const PRIMARY_BACKEND_URL = normalizeBackend(
  process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com"
)

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  const auth = request.headers.get("authorization")
  const viewer = decodeJwtUserId(auth)
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { userId } = await Promise.resolve(context.params)
  const target = String(userId || "").trim()
  if (!target) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }
  if (viewer !== target) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await aggregateRecommendations({
      viewerId: target,
      backendBaseUrl: PRIMARY_BACKEND_URL,
      authHeader: auth,
    })
    return NextResponse.json(body, {
      headers: { "Cache-Control": "private, max-age=30" },
    })
  } catch (e) {
    console.error("[recommendations/user]", e)
    return NextResponse.json({ error: "Aggregation failed" }, { status: 500 })
  }
}
