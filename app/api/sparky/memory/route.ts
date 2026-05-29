import { NextRequest, NextResponse } from "next/server"
import { userIdFromAuthorization } from "@/lib/server/sparky-memory-auth"
import {
  deleteSparkyMemoryFromDb,
  loadSparkyMemoryFromDb,
  proxySparkyMemoryToBackend,
  saveSparkyMemoryToDb,
} from "@/lib/server/sparky-memory-db"
import { EMPTY_SPARKY_MEMORY, sanitizeSparkyMemory } from "@/lib/sparky-memory"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const userId = userIdFromAuthorization(auth)
  if (!userId) return unauthorized()

  if (process.env.DATABASE_URL) {
    const memory = await loadSparkyMemoryFromDb(userId)
    return NextResponse.json(memory ?? { ...EMPTY_SPARKY_MEMORY })
  }

  try {
    const proxied = await proxySparkyMemoryToBackend("GET", auth!)
    const text = await proxied.text()
    return new NextResponse(text, {
      status: proxied.status,
      headers: { "Content-Type": proxied.headers.get("content-type") ?? "application/json" },
    })
  } catch (e) {
    console.error("[sparky/memory] proxy GET failed:", e)
    return NextResponse.json(
      { error: "Backend unreachable", backend: process.env.NEXT_PUBLIC_API_URL },
      { status: 502 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const userId = userIdFromAuthorization(auth)
  if (!userId) return unauthorized()

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (process.env.DATABASE_URL) {
    const saved = await saveSparkyMemoryToDb(userId, sanitizeSparkyMemory(raw))
    return NextResponse.json(saved)
  }

  try {
    const proxied = await proxySparkyMemoryToBackend("PUT", auth!, JSON.stringify(raw))
    const text = await proxied.text()
    return new NextResponse(text, {
      status: proxied.status,
      headers: { "Content-Type": proxied.headers.get("content-type") ?? "application/json" },
    })
  } catch (e) {
    console.error("[sparky/memory] proxy PUT failed:", e)
    return NextResponse.json(
      { error: "Backend unreachable", backend: process.env.NEXT_PUBLIC_API_URL },
      { status: 502 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const userId = userIdFromAuthorization(auth)
  if (!userId) return unauthorized()

  if (process.env.DATABASE_URL) {
    await deleteSparkyMemoryFromDb(userId)
    return new NextResponse(null, { status: 204 })
  }

  try {
    const proxied = await proxySparkyMemoryToBackend("DELETE", auth!)
    return new NextResponse(null, { status: proxied.status })
  } catch (e) {
    console.error("[sparky/memory] proxy DELETE failed:", e)
    return NextResponse.json(
      { error: "Backend unreachable", backend: process.env.NEXT_PUBLIC_API_URL },
      { status: 502 }
    )
  }
}
