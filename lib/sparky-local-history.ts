/**
 * Historial local de tips y decisiones — siempre persistido en AsyncStorage,
 * independiente del toggle "Recordar preferencias" de Sparky.
 */
import { storage, STORAGE_KEYS } from "@/lib/storage"
import type { SparkyMemory } from "@/lib/sparky-memory"

export type SparkyLocalHistory = {
  tipsSeen: string[]
  decisions: string[]
  momentsShown: string[]
  nudgesDismissed: string[]
  updatedAt?: string
}

export const EMPTY_SPARKY_LOCAL_HISTORY: SparkyLocalHistory = {
  tipsSeen: [],
  decisions: [],
  momentsShown: [],
  nudgesDismissed: [],
}

export function decisionKey(kind: string, id: string): string {
  return `${kind}:${id}`
}

export function momentShownKey(type: string, message?: string): string {
  const msg = message?.trim().slice(0, 80) ?? ""
  return msg ? `${type}|${msg}` : type
}

export function sanitizeSparkyLocalHistory(raw: unknown): SparkyLocalHistory {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SPARKY_LOCAL_HISTORY }
  const o = raw as SparkyLocalHistory
  return {
    tipsSeen: Array.isArray(o.tipsSeen)
      ? o.tipsSeen.filter((k): k is string => typeof k === "string").slice(-120)
      : [],
    decisions: Array.isArray(o.decisions)
      ? o.decisions.filter((k): k is string => typeof k === "string").slice(-120)
      : [],
    momentsShown: Array.isArray(o.momentsShown)
      ? o.momentsShown.filter((k): k is string => typeof k === "string").slice(-40)
      : [],
    nudgesDismissed: Array.isArray(o.nudgesDismissed)
      ? o.nudgesDismissed.filter((k): k is string => typeof k === "string").slice(-40)
      : [],
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
  }
}

export async function loadSparkyLocalHistory(): Promise<SparkyLocalHistory> {
  const raw = await storage.getItem(STORAGE_KEYS.sparkyLocalHistory)
  if (!raw) return { ...EMPTY_SPARKY_LOCAL_HISTORY }
  try {
    return sanitizeSparkyLocalHistory(JSON.parse(raw))
  } catch {
    return { ...EMPTY_SPARKY_LOCAL_HISTORY }
  }
}

export async function saveSparkyLocalHistory(history: SparkyLocalHistory): Promise<void> {
  const next = sanitizeSparkyLocalHistory({
    ...history,
    updatedAt: new Date().toISOString(),
  })
  await storage.setItem(STORAGE_KEYS.sparkyLocalHistory, JSON.stringify(next))
}

export async function clearSparkyLocalHistory(): Promise<void> {
  await storage.removeItem(STORAGE_KEYS.sparkyLocalHistory)
}

/** Une memoria completa + historial local (tips/decisiones siempre aplican). */
export function mergeMemoryWithLocalHistory(
  memory: SparkyMemory,
  local: SparkyLocalHistory
): SparkyMemory {
  const uniq = (arr: string[]) => [...new Set(arr)]
  return {
    ...memory,
    tipsSeen: uniq([...(local.tipsSeen ?? []), ...(memory.tipsSeen ?? [])]).slice(-120),
    completedActions: uniq([...(local.decisions ?? []), ...(memory.completedActions ?? [])]).slice(
      -120
    ),
    nudgesDismissed: uniq([...(local.nudgesDismissed ?? []), ...(memory.nudgesDismissed ?? [])]).slice(
      -40
    ),
  }
}

export function memoryToLocalHistory(memory: SparkyMemory): SparkyLocalHistory {
  return {
    tipsSeen: memory.tipsSeen ?? [],
    decisions: memory.completedActions ?? [],
    momentsShown: (memory.recentMoments ?? []).map((m) => momentShownKey(m.type, m.message)),
    nudgesDismissed: memory.nudgesDismissed ?? [],
  }
}

/** Persiste tips vistos y decisiones en AsyncStorage (siempre). */
export async function persistSparkyShownState(memory: SparkyMemory): Promise<void> {
  await saveSparkyLocalHistory(memoryToLocalHistory(memory))
}

export function recordDecision(memory: SparkyMemory, key: string): SparkyMemory {
  const decisions = memory.completedActions ?? []
  if (decisions.includes(key)) return memory
  return { ...memory, completedActions: [...decisions, key].slice(-120) }
}

export function recordNudgeDismissed(memory: SparkyMemory, nudgeId: string): SparkyMemory {
  const list = memory.nudgesDismissed ?? []
  if (list.includes(nudgeId)) return memory
  return { ...memory, nudgesDismissed: [...list, nudgeId].slice(-40) }
}

export function recordMomentShown(
  memory: SparkyMemory,
  type: string,
  message?: string
): SparkyMemory {
  const key = momentShownKey(type, message)
  const keys = memory.momentsShownKeys ?? []
  if (keys.includes(key)) return memory
  return { ...memory, momentsShownKeys: [...keys, key].slice(-40) }
}
