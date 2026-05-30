import { NextRequest, NextResponse } from "next/server"
import { userIdFromAuthorization } from "@/lib/server/sparky-memory-auth"
import {
  loadSparkyMemoryFromDb,
  proxySparkyContextToBackend,
} from "@/lib/server/sparky-memory-db"
import { EMPTY_SPARKY_MEMORY, sanitizeSparkyMemory } from "@/lib/sparky-memory"
import { getSparkBond } from "@/lib/sparky-bond"

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function javaApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com")
    .replace(/\/api\/?$/i, "")
    .replace(/\/$/, "")
}

async function fetchProfileForContext(authHeader: string) {
  try {
    const res = await fetch(`${javaApiBase()}/api/profile/me`, {
      headers: { Accept: "application/json", Authorization: authHeader },
    })
    if (!res.ok) return null
    return (await res.json()) as Record<string, unknown>
  } catch {
    return null
  }
}

function enrichContext(
  base: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  memory: ReturnType<typeof sanitizeSparkyMemory>
) {
  const bond = getSparkBond(memory)
  const firstName =
    typeof profile?.nombres === "string"
      ? profile.nombres.trim().split(/\s+/)[0]
      : typeof profile?.username === "string"
        ? profile.username
        : undefined

  let userAge: number | undefined
  if (typeof profile?.dateOfBirth === "string") {
    const dob = new Date(profile.dateOfBirth)
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date()
      userAge = now.getFullYear() - dob.getFullYear()
      const m = now.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) userAge -= 1
    }
  }

  return {
    ...base,
    bondLevel: bond.level,
    bondLabel: bond.label,
    bondPoints: bond.points,
    bondProgress: bond.progress,
    userFirstName: base.userFirstName ?? firstName,
    userAge: base.userAge ?? userAge,
    username: base.username ?? profile?.username,
    accountType: base.accountType ?? profile?.accountType,
    premium:
      base.premium ??
      profile?.premium ??
      profile?.subscriptionStatus === "ACTIVE",
    favoriteCompanion: memory.favoriteCompanion ?? "sparky",
    avatarStyle: memory.avatarStyle,
    relationshipLevel: memory.relationshipLevel,
    sparkyMode: memory.sparkyMode ?? "companion",
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const userId = userIdFromAuthorization(auth)
  if (!userId || !auth) return unauthorized()

  let memory = EMPTY_SPARKY_MEMORY
  if (process.env.DATABASE_URL) {
    memory = (await loadSparkyMemoryFromDb(userId)) ?? EMPTY_SPARKY_MEMORY
  }

  try {
    const proxied = await proxySparkyContextToBackend(auth)
    if (proxied.ok) {
      const text = await proxied.text()
      let parsed: Record<string, unknown> = {}
      try {
        parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {}
      } catch {
        parsed = {}
      }
      const profile = await fetchProfileForContext(auth)
      const enriched = enrichContext(parsed, profile, sanitizeSparkyMemory(memory))
      return NextResponse.json(enriched)
    }
    if (proxied.status !== 404 && proxied.status !== 502) {
      const text = await proxied.text()
      return new NextResponse(text || JSON.stringify({ error: "Upstream error" }), {
        status: proxied.status,
        headers: { "Content-Type": proxied.headers.get("content-type") ?? "application/json" },
      })
    }
  } catch (e) {
    console.warn("[sparky/context] proxy failed:", e)
  }

  const profile = await fetchProfileForContext(auth)
  const fallback = enrichContext({ userId, source: "next-fallback" }, profile, sanitizeSparkyMemory(memory))
  return NextResponse.json(fallback)
}
