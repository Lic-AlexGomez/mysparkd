import { NextResponse } from "next/server"
import { connectionScoreForUser } from "@/lib/moments-scoring"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { listMomentsForUser } from "@/lib/server/moments-store"

export const runtime = "nodejs"

export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  const { userId } = await Promise.resolve(context.params)
  const target = String(userId || "").trim()
  if (!target) {
    return NextResponse.json({ error: "userId required" }, { status: 400 })
  }

  const auth = request.headers.get("authorization")
  const viewer = decodeJwtUserId(auth)
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (viewer !== target) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const moments = listMomentsForUser(target)
  const connection_score = connectionScoreForUser(target, moments)
  return NextResponse.json({ moments, connection_score })
}
