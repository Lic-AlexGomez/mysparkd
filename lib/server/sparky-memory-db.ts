import type { SparkyMemory } from "@/lib/sparky-memory"
import { sanitizeSparkyMemory } from "@/lib/sparky-memory"

type PgPool = import("pg").Pool

let pool: PgPool | null = null

async function getPool(): Promise<PgPool | null> {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) return null
  if (pool) return pool
  const { Pool } = await import("pg")
  pool = new Pool({ connectionString: url, max: 8 })
  return pool
}

export async function loadSparkyMemoryFromDb(userId: string): Promise<SparkyMemory | null> {
  const p = await getPool()
  if (!p) return null
  const res = await p.query<{ memory_json: unknown; updated_at: Date }>(
    `SELECT memory_json, updated_at FROM sparky_user_memory WHERE user_id = $1`,
    [userId]
  )
  const row = res.rows[0]
  if (!row) return null
  const memory = sanitizeSparkyMemory(row.memory_json)
  return { ...memory, updatedAt: row.updated_at.toISOString() }
}

export async function saveSparkyMemoryToDb(userId: string, memory: SparkyMemory): Promise<SparkyMemory> {
  const p = await getPool()
  if (!p) throw new Error("DATABASE_URL not configured")
  const payload = sanitizeSparkyMemory(memory)
  const res = await p.query<{ updated_at: Date }>(
    `INSERT INTO sparky_user_memory (user_id, memory_json, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       memory_json = EXCLUDED.memory_json,
       updated_at = NOW()
     RETURNING updated_at`,
    [userId, JSON.stringify(payload)]
  )
  return { ...payload, updatedAt: res.rows[0]?.updated_at?.toISOString() ?? new Date().toISOString() }
}

export async function deleteSparkyMemoryFromDb(userId: string): Promise<void> {
  const p = await getPool()
  if (!p) throw new Error("DATABASE_URL not configured")
  await p.query(`DELETE FROM sparky_user_memory WHERE user_id = $1`, [userId])
}

/** Reenvía al backend Java si aún no hay tabla en Next pero sí endpoint en Render. */
function javaApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "https://sparkd1-0.onrender.com")
    .replace(/\/api\/?$/i, "")
    .replace(/\/$/, "")
}

export async function proxySparkyMemoryToBackend(
  method: "GET" | "PUT" | "DELETE",
  authHeader: string,
  body?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authHeader,
  }
  if (body) headers["Content-Type"] = "application/json"
  return fetch(`${javaApiBase()}/api/sparky/memory`, { method, headers, body })
}

/** Reenvía POST /api/sparky al backend Java (Render). */
export async function proxySparkyAiToBackend(
  authHeader: string | null,
  body: string
): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
  if (authHeader) headers.Authorization = authHeader
  return fetch(`${javaApiBase()}/api/sparky`, { method: "POST", headers, body })
}
