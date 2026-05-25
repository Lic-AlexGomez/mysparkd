import { storage, STORAGE_KEYS } from "@/lib/storage"
import {
  clearSparkyLocalHistory,
  loadSparkyLocalHistory,
  mergeMemoryWithLocalHistory,
  persistSparkyShownState,
} from "@/lib/sparky-local-history"
import type { HelpRouteKey } from "@/lib/help-assistant"
import type { VisualAppearanceId } from "@/lib/visual-appearances"

export type SparkyTonePreference = "casual" | "funny" | "direct"

export type SparkyGoal = "meet_people" | "events" | "improve_profile" | "explore"

/** Memoria permitida — sin datos sensibles. */
export type SparkyMemory = {
  nickname?: string
  tonePreference?: SparkyTonePreference
  favoriteSections?: HelpRouteKey[]
  favoriteSkins?: VisualAppearanceId[]
  personalityLevel?: "calm" | "balanced" | "playful"
  goals?: SparkyGoal[]
  tipsSeen?: string[]
  /** Claves de decisiones del usuario (dismiss, ack, etc.) */
  completedActions?: string[]
  nudgesDismissed?: string[]
  momentsShownKeys?: string[]
  dismissCount?: number
  ignoreStreak?: number
  touchCount?: number
  lastTouchAt?: string
  lastIgnoreAt?: string
  lastDailySparkDay?: string
  lastOpenDay?: string
  bondPoints?: number
  recentMoments?: Array<{ type: string; message: string; at: string }>
  visitCounts?: Partial<Record<HelpRouteKey, number>>
  updatedAt?: string
}

export const EMPTY_SPARKY_MEMORY: SparkyMemory = {
  favoriteSections: [],
  favoriteSkins: [],
  goals: [],
  tipsSeen: [],
  completedActions: [],
  nudgesDismissed: [],
  momentsShownKeys: [],
  dismissCount: 0,
  ignoreStreak: 0,
  touchCount: 0,
  visitCounts: {},
}

const FORBIDDEN_MEMORY_KEYS = [
  "email",
  "phone",
  "password",
  "latitude",
  "longitude",
  "conversation",
  "messages",
  "health",
  "religion",
  "politics",
]

export function sanitizeSparkyMemory(raw: unknown): SparkyMemory {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SPARKY_MEMORY }
  const o = raw as SparkyMemory
  return {
    nickname: typeof o.nickname === "string" ? o.nickname.slice(0, 32) : undefined,
    tonePreference:
      o.tonePreference === "casual" || o.tonePreference === "funny" || o.tonePreference === "direct"
        ? o.tonePreference
        : undefined,
    favoriteSections: Array.isArray(o.favoriteSections)
      ? o.favoriteSections.filter((s): s is HelpRouteKey => typeof s === "string").slice(0, 6)
      : [],
    favoriteSkins: Array.isArray(o.favoriteSkins)
      ? o.favoriteSkins.filter((s): s is VisualAppearanceId => typeof s === "string").slice(0, 4)
      : [],
    goals: Array.isArray(o.goals) ? o.goals.slice(0, 4) : [],
    tipsSeen: Array.isArray(o.tipsSeen) ? o.tipsSeen.slice(-120) : [],
    completedActions: Array.isArray(o.completedActions) ? o.completedActions.slice(-120) : [],
    nudgesDismissed: Array.isArray(o.nudgesDismissed)
      ? o.nudgesDismissed.filter((id): id is string => typeof id === "string").slice(-40)
      : [],
    momentsShownKeys: Array.isArray(o.momentsShownKeys)
      ? o.momentsShownKeys.filter((k): k is string => typeof k === "string").slice(-40)
      : [],
    dismissCount: typeof o.dismissCount === "number" ? o.dismissCount : 0,
    ignoreStreak: typeof o.ignoreStreak === "number" ? o.ignoreStreak : 0,
    touchCount: typeof o.touchCount === "number" ? Math.min(999, o.touchCount) : 0,
    lastTouchAt: typeof o.lastTouchAt === "string" ? o.lastTouchAt : undefined,
    lastIgnoreAt: typeof o.lastIgnoreAt === "string" ? o.lastIgnoreAt : undefined,
    lastDailySparkDay: typeof o.lastDailySparkDay === "string" ? o.lastDailySparkDay : undefined,
    lastOpenDay: typeof o.lastOpenDay === "string" ? o.lastOpenDay : undefined,
    bondPoints: typeof o.bondPoints === "number" ? Math.min(99, o.bondPoints) : 0,
    recentMoments: Array.isArray(o.recentMoments)
      ? o.recentMoments
          .filter((m) => m && typeof m.message === "string")
          .slice(-8)
          .map((m) => ({
            type: String(m.type ?? "moment"),
            message: String(m.message).slice(0, 120),
            at: typeof m.at === "string" ? m.at : new Date().toISOString(),
          }))
      : [],
    visitCounts: o.visitCounts && typeof o.visitCounts === "object" ? o.visitCounts : {},
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
  }
}

export function isMemoryPayloadSafe(memory: SparkyMemory): boolean {
  const json = JSON.stringify(memory).toLowerCase()
  return !FORBIDDEN_MEMORY_KEYS.some((k) => json.includes(`"${k}"`))
}

export async function loadSparkyMemory(): Promise<SparkyMemory> {
  const raw = await storage.getItem(STORAGE_KEYS.sparkyMemory)
  let base = { ...EMPTY_SPARKY_MEMORY }
  if (raw) {
    try {
      base = sanitizeSparkyMemory(JSON.parse(raw))
    } catch {
      base = { ...EMPTY_SPARKY_MEMORY }
    }
  }
  const local = await loadSparkyLocalHistory()
  return mergeMemoryWithLocalHistory(base, local)
}

export async function saveSparkyMemory(memory: SparkyMemory): Promise<void> {
  const next = { ...sanitizeSparkyMemory(memory), updatedAt: new Date().toISOString() }
  if (!isMemoryPayloadSafe(next)) return
  await storage.setItem(STORAGE_KEYS.sparkyMemory, JSON.stringify(next))
  await persistSparkyShownState(next)
}

export async function clearSparkyMemory(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.sparkyMemory)
  await clearSparkyLocalHistory()
}

export function recordSectionVisit(memory: SparkyMemory, section: HelpRouteKey): SparkyMemory {
  const counts = { ...memory.visitCounts }
  counts[section] = (counts[section] ?? 0) + 1
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const favoriteSections = sorted.slice(0, 3).map(([k]) => k as HelpRouteKey)
  return { ...memory, visitCounts: counts, favoriteSections }
}

/** Clave estable por pantalla + texto del tip (no repetir tips ya vistos). */
export function tipSeenKey(routeKey: HelpRouteKey | null, tip: string): string {
  const route = routeKey ?? "global"
  const normalized = tip.trim().replace(/\s+/g, " ").slice(0, 120)
  return `${route}:${normalized}`
}

export function filterUnseenTips(
  memory: SparkyMemory,
  routeKey: HelpRouteKey | null,
  tips: string[]
): string[] {
  const seen = new Set(memory.tipsSeen ?? [])
  return tips.filter((t) => {
    const key = tipSeenKey(routeKey, t)
    return t.trim().length > 0 && !seen.has(key)
  })
}

export function recordTipSeen(
  memory: SparkyMemory,
  routeKey: HelpRouteKey | null,
  tip: string
): SparkyMemory {
  const text = tip.trim()
  if (!text) return memory
  const key = tipSeenKey(routeKey, text)
  const seen = memory.tipsSeen ?? []
  if (seen.includes(key)) return memory
  return { ...memory, tipsSeen: [...seen, key].slice(-80) }
}

export function recordTipsSeen(
  memory: SparkyMemory,
  routeKey: HelpRouteKey | null,
  tips: string[]
): SparkyMemory {
  let next = memory
  for (const tip of tips) {
    next = recordTipSeen(next, routeKey, tip)
  }
  return next
}

export function memoryGreeting(memory: SparkyMemory): string | null {
  if (memory.nickname) return `Hola, ${memory.nickname}. `
  if (memory.favoriteSections?.includes("events")) return "Sé que te gustan los eventos. "
  if (memory.favoriteSections?.includes("discover")) return "Como usas Discover, puedo ayudarte con matches. "
  return null
}
