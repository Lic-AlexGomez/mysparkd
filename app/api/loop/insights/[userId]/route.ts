import { NextResponse } from "next/server"

import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"

import { touchSeen, getJourney, milestonesFromRow } from "@/lib/server/conversion-loop-store"

import { buildInsights } from "@/lib/server/conversion-loop-engine"



export const runtime = "nodejs"



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



  touchSeen(viewer)

  const m = milestonesFromRow(getJourney(viewer))

  const insights = buildInsights(viewer, m)



  return NextResponse.json(insights, {

    headers: { "Cache-Control": "private, no-store" },

  })

}


