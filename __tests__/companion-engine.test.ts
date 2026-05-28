import { describe, expect, it } from "vitest"
import {
  createCompanionEngineState,
  daysSinceLastOpen,
  dispatchCompanionEvent,
  moodToSparkyExpression,
  resolveReturnEvent,
  tickCompanionEngine,
} from "@/lib/companion/engine"

describe("companion engine", () => {
  it("maps moods to expressions", () => {
    expect(moodToSparkyExpression("scared")).toBe("scared")
    expect(moodToSparkyExpression("confused")).toBe("confused")
  })

  it("dispatches scroll_fast to curious/thinking face", () => {
    const result = dispatchCompanionEvent(createCompanionEngineState(), "scroll_fast", {
      force: true,
    })
    expect(result.applied).toBe(true)
    expect(result.expression).toBe("thinking")
  })

  it("expires mood", () => {
    const now = Date.now()
    const state = dispatchCompanionEvent(createCompanionEngineState(now), "error", {
      force: true,
      now,
    }).state
    expect(tickCompanionEngine(state, state.expiresAt + 1).mood).toBe("idle")
  })

  it("resolveReturnEvent", () => {
    expect(resolveReturnEvent(7)).toBe("user_return_long_absence")
    expect(resolveReturnEvent(3)).toBe("user_return_after_days")
  })

  it("daysSinceLastOpen", () => {
    expect(daysSinceLastOpen("2026-05-20", new Date("2026-05-26T12:00:00"))).toBe(6)
  })
})
