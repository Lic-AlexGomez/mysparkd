import { NextResponse } from "next/server"
import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"
import { mergeGraphUpdate } from "@/lib/server/graph-preferences-store"
import type { GraphUpdatePayload } from "@/lib/types/recommendation-graph-v2"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  const viewer = decodeJwtUserId(auth)
  if (!viewer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: GraphUpdatePayload
  try {
    body = (await request.json()) as GraphUpdatePayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const merged = mergeGraphUpdate(viewer, body)
  return NextResponse.json({
    ok: true,
    edges_indexed: merged.edges,
    signals_merged: merged.signals,
  })
}
