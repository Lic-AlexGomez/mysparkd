import type { SparkyMemory } from "@/lib/sparky-memory"
import { EMPTY_SPARKY_MEMORY, sanitizeSparkyMemory } from "@/lib/sparky-memory"

let remoteMemoryUnavailable = false

function authHeaders(): Record<string, string> | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("sparkd_token")
  if (!token) return null
  return { Authorization: `Bearer ${token}`, Accept: "application/json" }
}

export async function fetchSparkyMemoryRemote(): Promise<SparkyMemory | null> {
  if (remoteMemoryUnavailable) return null
  const headers = authHeaders()
  if (!headers) return null
  try {
    const res = await fetch("/api/sparky/memory", { method: "GET", headers })
    if (res.status === 401) return null
    if (res.status === 404) {
      remoteMemoryUnavailable = true
      return null
    }
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    return sanitizeSparkyMemory(data)
  } catch {
    return null
  }
}

export async function pushSparkyMemoryRemote(memory: SparkyMemory): Promise<SparkyMemory | null> {
  if (remoteMemoryUnavailable) return null
  const headers = authHeaders()
  if (!headers) return null
  try {
    const res = await fetch("/api/sparky/memory", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(sanitizeSparkyMemory({ ...memory, updatedAt: new Date().toISOString() })),
    })
    if (res.status === 404) {
      remoteMemoryUnavailable = true
      return null
    }
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    return sanitizeSparkyMemory(data)
  } catch {
    return null
  }
}

export async function deleteSparkyMemoryRemote(): Promise<boolean> {
  if (remoteMemoryUnavailable) return false
  const headers = authHeaders()
  if (!headers) return false
  try {
    const res = await fetch("/api/sparky/memory", { method: "DELETE", headers })
    if (res.status === 404) {
      remoteMemoryUnavailable = true
      return false
    }
    return res.status === 204 || res.ok
  } catch {
    return false
  }
}

export function clearSparkyMemoryLocal(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("sparkd_sparky_memory")
}

export function getEmptySparkyMemory(): SparkyMemory {
  return { ...EMPTY_SPARKY_MEMORY }
}
