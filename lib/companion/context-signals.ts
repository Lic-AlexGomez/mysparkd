/** Taxonomía de eventos de contexto para el companion. */

export type CompanionMood =
  | "happy"
  | "sleepy"
  | "curious"
  | "excited"
  | "confused"
  | "sad"
  | "celebrating"
  | "thinking"
  | "scared"
  | "idle"

export type CompanionEvent =
  | "app_open"
  | "app_background"
  | "user_idle"
  | "user_return_after_days"
  | "user_return_long_absence"
  | "success"
  | "error"
  | "loading_slow"
  | "rage_click"
  | "new_message"
  | "achievement"
  | "tour_complete"
  | "scroll_fast"

export type CompanionMotionHint = "wink" | "bounce" | "celebrate" | "peek" | "think" | "shiver" | "none"

export type EventPriority = "low" | "normal" | "high"

const EVENT_PRIORITY: Record<CompanionEvent, EventPriority> = {
  app_open: "normal",
  app_background: "low",
  user_idle: "low",
  user_return_after_days: "high",
  user_return_long_absence: "high",
  success: "normal",
  error: "normal",
  loading_slow: "low",
  rage_click: "normal",
  new_message: "low",
  achievement: "high",
  tour_complete: "high",
  scroll_fast: "low",
}

export function getEventPriority(event: CompanionEvent): EventPriority {
  return EVENT_PRIORITY[event] ?? "normal"
}

/** Duración base del mood en ms según evento. */
export function defaultMoodDurationMs(event: CompanionEvent): number {
  switch (event) {
    case "user_return_long_absence":
    case "achievement":
    case "tour_complete":
      return 12_000
    case "user_return_after_days":
    case "success":
      return 8_000
    case "error":
    case "rage_click":
      return 5_000
    case "loading_slow":
    case "user_idle":
      return 15_000
    default:
      return 6_000
  }
}
