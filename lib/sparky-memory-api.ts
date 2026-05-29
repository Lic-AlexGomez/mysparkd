import type { SparkyMemory } from "@/lib/sparky-memory"
import { EMPTY_SPARKY_MEMORY, sanitizeSparkyMemory } from "@/lib/sparky-memory"
import { api } from "@/lib/api"

const SPARKY_MEMORY_URL = "/api/sparky/memory"

/** Evita 429 del backend por ráfagas de PUT (mood/touch/companion). */
const PUT_DEBOUNCE_MS = 5_000
const PUT_MIN_GAP_MS = 15_000
const GET_MIN_GAP_MS = 45_000
const RATE_LIMIT_COOLDOWN_MS = 90_000

let lastRemoteWarnAt = 0
let rateLimitUntil = 0
let lastGetAt = 0
let lastPutAt = 0
let lastPutFingerprint = ""
let pendingMemory: SparkyMemory | null = null
let putDebounceTimer: ReturnType<typeof setTimeout> | null = null
let putInFlight = false
let putWaiters: Array<(value: SparkyMemory | null) => void> = []

function warnRemoteOnce(message: string, status?: number) {
  if (process.env.NODE_ENV === "production") return
  const now = Date.now()
  if (now - lastRemoteWarnAt < 15_000) return
  lastRemoteWarnAt = now
  console.warn(`[sparky-memory] ${message}`, status != null ? `(HTTP ${status})` : "")
}

function isRateLimited(): boolean {
  return Date.now() < rateLimitUntil
}

function memoryFingerprint(memory: SparkyMemory): string {
  const { updatedAt: _u, ...rest } = sanitizeSparkyMemory(memory)
  return JSON.stringify(rest)
}

function settlePutWaiters(value: SparkyMemory | null) {
  const waiters = putWaiters
  putWaiters = []
  for (const w of waiters) w(value)
}

function scheduleRemotePut() {
  if (putDebounceTimer) clearTimeout(putDebounceTimer)
  const delay = Math.max(
    PUT_DEBOUNCE_MS,
    rateLimitUntil - Date.now(),
    lastPutAt + PUT_MIN_GAP_MS - Date.now(),
    0
  )
  putDebounceTimer = setTimeout(() => {
    putDebounceTimer = null
    void runRemotePut()
  }, delay)
}

async function runRemotePut(): Promise<void> {
  if (putInFlight) {
    scheduleRemotePut()
    return
  }
  if (!pendingMemory) return

  if (isRateLimited()) {
    scheduleRemotePut()
    return
  }

  const memory = pendingMemory
  const fingerprint = memoryFingerprint(memory)
  if (fingerprint === lastPutFingerprint) {
    pendingMemory = null
    settlePutWaiters(null)
    return
  }

  putInFlight = true
  let result: SparkyMemory | null = null
  try {
    const body = sanitizeSparkyMemory({ ...memory, updatedAt: new Date().toISOString() })
    const data = await api.put<unknown>(SPARKY_MEMORY_URL, body)
    result = sanitizeSparkyMemory(data)
    lastPutAt = Date.now()
    lastPutFingerprint = fingerprint
    pendingMemory = null
  } catch (e: unknown) {
    if (e && typeof e === "object" && "status" in e && (e as { status: number }).status === 429) {
      rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS
      warnRemoteOnce("sync PUT rate-limited; backing off", 429)
    } else {
      warnRemoteOnce("sync PUT failed", e && typeof e === "object" && "status" in e ? (e as { status: number }).status : undefined)
    }
  } finally {
    putInFlight = false
    settlePutWaiters(result)
    if (pendingMemory) scheduleRemotePut()
  }
}

/** Encola un PUT; coalesce ráfagas y respeta cooldown tras 429. */
export function enqueueSparkyMemoryRemotePush(memory: SparkyMemory): void {
  pendingMemory = memory
  scheduleRemotePut()
}

export async function fetchSparkyMemoryRemote(): Promise<SparkyMemory | null> {
  if (isRateLimited()) return null
  const now = Date.now()
  if (now - lastGetAt < GET_MIN_GAP_MS) return null
  lastGetAt = now
  try {
    const data = await api.get<unknown>(SPARKY_MEMORY_URL)
    const remote = sanitizeSparkyMemory(data)
    lastPutFingerprint = memoryFingerprint(remote)
    return remote
  } catch (e: unknown) {
    if (e && typeof e === "object" && "status" in e) {
      const status = (e as { status: number }).status
      if (status === 401) return null
      if (status === 429) {
        rateLimitUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS
        warnRemoteOnce("sync GET rate-limited; backing off", 429)
        return null
      }
      warnRemoteOnce("sync GET failed", status)
    } else {
      warnRemoteOnce("sync GET network error")
    }
    return null
  }
}

export async function pushSparkyMemoryRemote(memory: SparkyMemory): Promise<SparkyMemory | null> {
  return new Promise((resolve) => {
    pendingMemory = memory
    putWaiters.push(resolve)
    scheduleRemotePut()
  })
}

export async function deleteSparkyMemoryRemote(): Promise<boolean> {
  pendingMemory = null
  if (putDebounceTimer) {
    clearTimeout(putDebounceTimer)
    putDebounceTimer = null
  }
  settlePutWaiters(null)

  try {
    await api.delete(SPARKY_MEMORY_URL)
    lastPutFingerprint = ""
    return true
  } catch (e: unknown) {
    warnRemoteOnce("sync DELETE failed", e && typeof e === "object" && "status" in e ? (e as { status: number }).status : undefined)
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
