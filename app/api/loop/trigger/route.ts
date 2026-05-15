import { NextResponse } from "next/server"

import { decodeJwtUserId } from "@/lib/server/jwt-payload-user"

import { getJourney, milestonesFromRow } from "@/lib/server/conversion-loop-store"

import { evaluateTriggers } from "@/lib/server/conversion-loop-engine"

import type { LoopTriggerPayload } from "@/lib/types/conversion-loop"



export const runtime = "nodejs"



export async function POST(request: Request) {

  const auth = request.headers.get("authorization")

  const viewer = decodeJwtUserId(auth)

  if (!viewer) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  }



  let body: LoopTriggerPayload = {}

  try {

    const raw = await request.json()

    body = (typeof raw === "object" && raw ? raw : {}) as LoopTriggerPayload

  } catch {

    body = {}

  }



  const m = milestonesFromRow(getJourney(viewer))

  const { actions, evaluated_drop_offs } = evaluateTriggers(viewer, m, body)



  return NextResponse.json({

    ok: true,

    actions,

    evaluated_drop_offs,

  })

}


