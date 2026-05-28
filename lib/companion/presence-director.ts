type PresenceEvent = "peek_from_edge" | "idle_breath_glow" | "curious_scan" | "micro_celebrate"

export type PresenceDirectorState = {
  sessionStartedAt: number
  lastPeekAt: number
  lastCuriousAt: number
  lastCelebrateAt: number
  peekCount: number
}

export function createPresenceDirectorState(now = Date.now()): PresenceDirectorState {
  return {
    sessionStartedAt: now,
    lastPeekAt: 0,
    lastCuriousAt: 0,
    lastCelebrateAt: 0,
    peekCount: 0,
  }
}

type PresenceInput = {
  now: number
  idleMs: number
  openPanel: boolean
  successPulse?: number
}

export function reducePresenceDirector(
  state: PresenceDirectorState,
  input: PresenceInput
): { state: PresenceDirectorState; event: PresenceEvent | null } {
  const { now, idleMs, openPanel, successPulse = 0 } = input
  if (openPanel) return { state, event: null }

  if (successPulse > 0 && now - state.lastCelebrateAt > 25_000) {
    return { state: { ...state, lastCelebrateAt: now }, event: "micro_celebrate" }
  }

  const canPeek = now - state.lastPeekAt > 45_000 && state.peekCount < 6
  if (idleMs > 20_000 && canPeek) {
    return {
      state: { ...state, lastPeekAt: now, peekCount: state.peekCount + 1 },
      event: "peek_from_edge",
    }
  }

  if (idleMs > 30_000 && now - state.lastCuriousAt > 35_000) {
    return { state: { ...state, lastCuriousAt: now }, event: "curious_scan" }
  }

  if (idleMs > 12_000) return { state, event: "idle_breath_glow" }
  return { state, event: null }
}

