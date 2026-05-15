import { NextResponse } from "next/server"
import { connectionScoreForUser } from "@/lib/moments-scoring"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { createMoment, listMomentsForUser } from "@/lib/server/moments-store"
import type { CreateMomentRequest } from "@/lib/types/moments"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  const actorId = decodeJwtUserId(auth)
  if (!actorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: CreateMomentRequest
  try {
    body = (await request.json()) as CreateMomentRequest
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const moment = createMoment(actorId, body)
    const subjectId = moment.users_involved[0]?.userId || actorId
    const all = listMomentsForUser(subjectId)
    const connection_score_total = connectionScoreForUser(subjectId, all)
    return NextResponse.json({ moment, connection_score_total })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bad request"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
