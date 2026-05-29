/** Memoria local Sparky (web) — sin PII. */

export type InteractionStyle = "fast" | "calm" | "mixed"

export type TraitState = {
  confidence: number
  humor: number
  chaos: number
  affection: number
}

export type SparkyRelationshipLevel = "stranger" | "buddy" | "closeFriend" | "bestie"
export type SparkyArchetype = "roomie" | "bestie" | "deadpan" | "softChaotic"

export type SparkyMemory = {
  bondPoints?: number
  favoriteCompanion?: string
  activeHoursHistogram?: Record<string, number>
  interactionStyle?: InteractionStyle
  avgSessionMinutes?: number
  traitState?: TraitState
  lastProcessedDay?: string
  lastOpenDay?: string
  wardrobeUnlocked?: string[]
  lastCompanionPushDay?: string
  sparkyMode?: string
  companionPushOptIn?: boolean
  companionSoundsEnabled?: boolean
  currentMood?: string
  moodSince?: string
  moodExpiresAt?: string
  fatigueLevel?: number
  relationshipLevel?: SparkyRelationshipLevel
  archetype?: SparkyArchetype
  insideJokesUnlocked?: string[]
  activeNickname?: { id: string; label: string; setAt: string }
  emotionalMoments?: Array<{ id: string; at: string; context?: string }>
  pacing?: { quietHours?: { start: number; end: number }; maxProactivePerHour?: number; maxMentionsPerDay?: number }
  repetitionState?: {
    cooldownByKey?: Record<string, string>
    hourlyBudgetByBucket?: Record<string, number>
    recentLineKeys?: string[]
  }
  updatedAt?: string
}

export const EMPTY_SPARKY_MEMORY: SparkyMemory = {}

const STORAGE_KEY = "sparkd_sparky_memory"
const SETTINGS_KEY = "sparkd_help_assistant_settings"

const FORBIDDEN = ["email", "phone", "password", "latitude", "longitude", "conversation", "messages"]

function clampTrait(n: unknown): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 50
  return Math.min(100, Math.max(0, Math.round(n)))
}

function clampHour(n: unknown, fallback: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return fallback
  return Math.max(0, Math.min(23, Math.round(n)))
}

export function sanitizeSparkyMemory(raw: unknown): SparkyMemory {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SPARKY_MEMORY }
  const o = raw as SparkyMemory
  return {
    bondPoints: typeof o.bondPoints === "number" ? Math.min(100, Math.max(0, o.bondPoints)) : 0,
    favoriteCompanion:
      typeof o.favoriteCompanion === "string" ? o.favoriteCompanion.slice(0, 24) : "sparky",
    activeHoursHistogram:
      o.activeHoursHistogram && typeof o.activeHoursHistogram === "object" ? o.activeHoursHistogram : {},
    interactionStyle:
      o.interactionStyle === "fast" || o.interactionStyle === "calm" || o.interactionStyle === "mixed"
        ? o.interactionStyle
        : "mixed",
    avgSessionMinutes:
      typeof o.avgSessionMinutes === "number" ? Math.min(240, Math.max(0, o.avgSessionMinutes)) : 0,
    traitState:
      o.traitState && typeof o.traitState === "object"
        ? {
            confidence: clampTrait(o.traitState.confidence),
            humor: clampTrait(o.traitState.humor),
            chaos: clampTrait(o.traitState.chaos),
            affection: clampTrait(o.traitState.affection),
          }
        : undefined,
    lastProcessedDay: typeof o.lastProcessedDay === "string" ? o.lastProcessedDay.slice(0, 10) : undefined,
    lastOpenDay: typeof o.lastOpenDay === "string" ? o.lastOpenDay.slice(0, 10) : undefined,
    wardrobeUnlocked: Array.isArray(o.wardrobeUnlocked) ? o.wardrobeUnlocked.slice(0, 20) : [],
    lastCompanionPushDay:
      typeof o.lastCompanionPushDay === "string" ? o.lastCompanionPushDay.slice(0, 10) : undefined,
    sparkyMode: typeof o.sparkyMode === "string" ? o.sparkyMode : "companion",
    companionPushOptIn: o.companionPushOptIn === true,
    companionSoundsEnabled: o.companionSoundsEnabled === true,
    currentMood: typeof o.currentMood === "string" ? o.currentMood.slice(0, 24) : undefined,
    moodSince: typeof o.moodSince === "string" ? o.moodSince : undefined,
    moodExpiresAt: typeof o.moodExpiresAt === "string" ? o.moodExpiresAt : undefined,
    fatigueLevel:
      typeof o.fatigueLevel === "number" ? Math.min(1, Math.max(0, o.fatigueLevel)) : undefined,
    relationshipLevel:
      o.relationshipLevel === "stranger" ||
      o.relationshipLevel === "buddy" ||
      o.relationshipLevel === "closeFriend" ||
      o.relationshipLevel === "bestie"
        ? o.relationshipLevel
        : undefined,
    archetype:
      o.archetype === "roomie" ||
      o.archetype === "bestie" ||
      o.archetype === "deadpan" ||
      o.archetype === "softChaotic"
        ? o.archetype
        : undefined,
    insideJokesUnlocked: Array.isArray(o.insideJokesUnlocked)
      ? o.insideJokesUnlocked.filter((x): x is string => typeof x === "string").slice(-24)
      : [],
    activeNickname:
      o.activeNickname && typeof o.activeNickname === "object"
        ? {
            id: typeof o.activeNickname.id === "string" ? o.activeNickname.id.slice(0, 40) : "nickname",
            label: typeof o.activeNickname.label === "string" ? o.activeNickname.label.slice(0, 40) : "bro",
            setAt: typeof o.activeNickname.setAt === "string" ? o.activeNickname.setAt : new Date().toISOString(),
          }
        : undefined,
    emotionalMoments: Array.isArray(o.emotionalMoments)
      ? o.emotionalMoments
          .slice(-40)
          .map((m) => ({
            id: typeof m?.id === "string" ? m.id.slice(0, 48) : "moment",
            at: typeof m?.at === "string" ? m.at : new Date().toISOString(),
            context: typeof m?.context === "string" ? m.context.slice(0, 80) : undefined,
          }))
      : [],
    pacing:
      o.pacing && typeof o.pacing === "object"
        ? {
            quietHours:
              o.pacing.quietHours && typeof o.pacing.quietHours === "object"
                ? {
                    start: clampHour(o.pacing.quietHours.start, 23),
                    end: clampHour(o.pacing.quietHours.end, 8),
                  }
                : undefined,
            maxProactivePerHour:
              typeof o.pacing.maxProactivePerHour === "number"
                ? Math.min(12, Math.max(0, Math.round(o.pacing.maxProactivePerHour)))
                : undefined,
            maxMentionsPerDay:
              typeof o.pacing.maxMentionsPerDay === "number"
                ? Math.min(30, Math.max(0, Math.round(o.pacing.maxMentionsPerDay)))
                : undefined,
          }
        : undefined,
    repetitionState:
      o.repetitionState && typeof o.repetitionState === "object"
        ? {
            cooldownByKey:
              o.repetitionState.cooldownByKey && typeof o.repetitionState.cooldownByKey === "object"
                ? Object.fromEntries(
                    Object.entries(o.repetitionState.cooldownByKey)
                      .slice(-120)
                      .map(([k, v]) => [k.slice(0, 80), typeof v === "string" ? v : ""])
                  )
                : {},
            hourlyBudgetByBucket:
              o.repetitionState.hourlyBudgetByBucket &&
              typeof o.repetitionState.hourlyBudgetByBucket === "object"
                ? Object.fromEntries(
                    Object.entries(o.repetitionState.hourlyBudgetByBucket)
                      .slice(-96)
                      .map(([k, v]) => [k.slice(0, 20), Math.max(0, Math.min(99, Number(v) || 0))])
                  )
                : {},
            recentLineKeys: Array.isArray(o.repetitionState.recentLineKeys)
              ? o.repetitionState.recentLineKeys
                  .filter((x): x is string => typeof x === "string")
                  .map((x) => x.slice(0, 80))
                  .slice(-30)
              : [],
          }
        : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
  }
}

export function isMemoryPayloadSafe(memory: SparkyMemory): boolean {
  const json = JSON.stringify(memory).toLowerCase()
  return !FORBIDDEN.some((k) => json.includes(`"${k}"`))
}

export function loadSparkyMemory(): SparkyMemory {
  if (typeof window === "undefined") return { ...EMPTY_SPARKY_MEMORY }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_SPARKY_MEMORY }
    return sanitizeSparkyMemory(JSON.parse(raw))
  } catch {
    return { ...EMPTY_SPARKY_MEMORY }
  }
}

let remotePushTimer: ReturnType<typeof setTimeout> | null = null
let remotePushPending: SparkyMemory | null = null

function flushSparkyMemoryRemote() {
  if (typeof window === "undefined" || !remotePushPending) return
  const payload = remotePushPending
  remotePushPending = null
  void import("@/lib/sparky-memory-api").then(({ pushSparkyMemoryRemote }) => {
    void pushSparkyMemoryRemote(payload).then((remote) => {
      if (!remote) return
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote))
    })
  })
}

export function saveSparkyMemory(memory: SparkyMemory): void {
  if (typeof window === "undefined") return
  const next = { ...sanitizeSparkyMemory(memory), updatedAt: new Date().toISOString() }
  if (!isMemoryPayloadSafe(next)) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  remotePushPending = next
  if (remotePushTimer) clearTimeout(remotePushTimer)
  remotePushTimer = setTimeout(() => {
    remotePushTimer = null
    flushSparkyMemoryRemote()
  }, 5000)
}

const REMOTE_SYNC_MIN_GAP_MS = 45_000
let remoteSyncInFlight: Promise<SparkyMemory> | null = null
let lastRemoteSyncAt = 0

/** Pull desde hosting y fusiona con localStorage (llamar tras login). */
export async function syncSparkyMemoryFromServer(): Promise<SparkyMemory> {
  if (typeof window === "undefined") return { ...EMPTY_SPARKY_MEMORY }
  const now = Date.now()
  if (remoteSyncInFlight) return remoteSyncInFlight
  if (now - lastRemoteSyncAt < REMOTE_SYNC_MIN_GAP_MS) return loadSparkyMemory()

  remoteSyncInFlight = (async () => {
    try {
      const { fetchSparkyMemoryRemote } = await import("@/lib/sparky-memory-api")
      const { mergeSparkyMemory } = await import("@/lib/sparky-memory-merge")
      const local = loadSparkyMemory()
      const remote = await fetchSparkyMemoryRemote()
      lastRemoteSyncAt = Date.now()
      if (!remote) return local
      const merged = mergeSparkyMemory(local, remote)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return merged
    } finally {
      remoteSyncInFlight = null
    }
  })()

  return remoteSyncInFlight
}

export async function clearSparkyMemory(): Promise<void> {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
  const { deleteSparkyMemoryRemote } = await import("@/lib/sparky-memory-api")
  await deleteSparkyMemoryRemote()
}

export function recordAppOpenDay(memory: SparkyMemory, day: string): SparkyMemory {
  return { ...memory, lastOpenDay: day.slice(0, 10) }
}

export function loadSparkyWebSettings(): {
  sparkyMode: string
  companionPushOptIn: boolean
  companionSoundsEnabled: boolean
} {
  if (typeof window === "undefined") {
    return { sparkyMode: "companion", companionPushOptIn: false, companionSoundsEnabled: false }
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { sparkyMode: "companion", companionPushOptIn: false, companionSoundsEnabled: false }
    const o = JSON.parse(raw) as { sparkyMode?: string; sparkyVoice?: Record<string, unknown> }
    return {
      sparkyMode: o.sparkyMode ?? "companion",
      companionPushOptIn: o.sparkyVoice?.companionPushOptIn === true,
      companionSoundsEnabled: o.sparkyVoice?.companionSoundsEnabled === true,
    }
  } catch {
    return { sparkyMode: "companion", companionPushOptIn: false, companionSoundsEnabled: false }
  }
}
