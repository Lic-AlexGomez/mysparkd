import type { CompanionEvent, CompanionMood, CompanionMotionHint } from "@/lib/companion/context-signals"
import { defaultMoodDurationMs, getEventPriority } from "@/lib/companion/context-signals"
import type { SparkyExpression } from "@/components/sparky/sparky-types"

export type CompanionEngineState = {
  mood: CompanionMood
  intensity: number
  expiresAt: number
  lastEvent: CompanionEvent | null
  motionHint: CompanionMotionHint
}

export type CompanionDispatchResult = {
  state: CompanionEngineState
  expression: SparkyExpression
  motionHint: CompanionMotionHint
  /** Si el evento reemplazó el mood actual. */
  applied: boolean
}

const INITIAL: CompanionEngineState = {
  mood: "idle",
  intensity: 0.5,
  expiresAt: 0,
  lastEvent: null,
  motionHint: "none",
}

const EVENT_MOOD: Record<CompanionEvent, CompanionMood> = {
  app_open: "happy",
  app_background: "sleepy",
  user_idle: "sleepy",
  user_return_after_days: "happy",
  user_return_long_absence: "sad",
  success: "celebrating",
  error: "confused",
  loading_slow: "thinking",
  rage_click: "scared",
  new_message: "curious",
  achievement: "celebrating",
  tour_complete: "celebrating",
  scroll_fast: "curious",
}

const EVENT_MOTION: Partial<Record<CompanionEvent, CompanionMotionHint>> = {
  success: "celebrate",
  achievement: "celebrate",
  tour_complete: "celebrate",
  rage_click: "shiver",
  user_return_after_days: "bounce",
  error: "think",
  scroll_fast: "peek",
}

const PRIORITY_RANK = { low: 0, normal: 1, high: 2 }

export function moodToSparkyExpression(mood: CompanionMood): SparkyExpression {
  switch (mood) {
    case "happy":
      return "happy"
    case "sleepy":
      return "sleepy"
    case "curious":
      return "thinking"
    case "excited":
      return "excited"
    case "confused":
      return "confused"
    case "sad":
      return "sad"
    case "celebrating":
      return "celebrating"
    case "thinking":
      return "thinking"
    case "scared":
      return "scared"
    default:
      return "idle"
  }
}

export function createCompanionEngineState(now = Date.now()): CompanionEngineState {
  return { ...INITIAL, expiresAt: now }
}

export function tickCompanionEngine(
  state: CompanionEngineState,
  now = Date.now()
): CompanionEngineState {
  if (state.expiresAt > 0 && now >= state.expiresAt && state.mood !== "idle") {
    return {
      ...state,
      mood: "idle",
      intensity: 0.4,
      expiresAt: 0,
      motionHint: "none",
      lastEvent: null,
    }
  }
  return state
}

export function dispatchCompanionEvent(
  state: CompanionEngineState,
  event: CompanionEvent,
  opts?: { intensity?: number; now?: number; force?: boolean }
): CompanionDispatchResult {
  const now = opts?.now ?? Date.now()
  const ticked = tickCompanionEngine(state, now)
  const incomingPriority = getEventPriority(event)
  const currentPriority =
    ticked.lastEvent != null ? getEventPriority(ticked.lastEvent) : ("low" as const)

  const canReplace =
    opts?.force ||
    ticked.mood === "idle" ||
    ticked.expiresAt <= now ||
    PRIORITY_RANK[incomingPriority] >= PRIORITY_RANK[currentPriority]

  if (!canReplace) {
    return {
      state: ticked,
      expression: moodToSparkyExpression(ticked.mood),
      motionHint: ticked.motionHint,
      applied: false,
    }
  }

  const mood = EVENT_MOOD[event] ?? "idle"
  const intensity = Math.min(1, Math.max(0.2, opts?.intensity ?? 0.75))
  const duration = defaultMoodDurationMs(event)
  const motionHint = EVENT_MOTION[event] ?? "none"

  const next: CompanionEngineState = {
    mood,
    intensity,
    expiresAt: now + duration,
    lastEvent: event,
    motionHint,
  }

  return {
    state: next,
    expression: moodToSparkyExpression(mood),
    motionHint,
    applied: true,
  }
}

export function daysSinceLastOpen(lastOpenDay: string | undefined, now = new Date()): number | null {
  if (!lastOpenDay?.trim()) return null
  const last = new Date(`${lastOpenDay}T12:00:00`)
  if (Number.isNaN(last.getTime())) return null
  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  const diff = Math.floor((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000))
  return diff >= 0 ? diff : null
}

export function resolveReturnEvent(daysAway: number | null): CompanionEvent | null {
  if (daysAway == null || daysAway < 1) return null
  if (daysAway >= 7) return "user_return_long_absence"
  if (daysAway >= 3) return "user_return_after_days"
  return null
}
