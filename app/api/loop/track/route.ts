import { NextResponse } from "next/server"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { applyLoopTrack, milestonesFromRow } from "@/lib/server/conversion-loop-store"
import type { LoopTrackPayload } from "@/lib/types/conversion-loop"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  const viewer = decodeJwtUserId(auth)
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: LoopTrackPayload
  try {
    body = (await request.json()) as LoopTrackPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const stage = body?.stage
  if (
    stage !== "swipe" &&
    stage !== "match" &&
    stage !== "chat" &&
    stage !== "event" &&
    stage !== "meetup" &&
    stage !== "session"
  ) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 })
  }

  const row = applyLoopTrack(viewer, stage, body.occurred_at, body.metadata)

  return NextResponse.json({
    ok: true,
    journey_updated: true,
    milestones: milestonesFromRow(row),
  })
}
