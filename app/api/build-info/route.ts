import { NextResponse } from "next/server"

export const runtime = "nodejs"

/** GET /api/build-info — comprueba qué commit está desplegado en producción. */
export async function GET() {
  return NextResponse.json({
    buildId: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
    nodeEnv: process.env.NODE_ENV,
  })
}
