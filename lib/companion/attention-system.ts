export type AttentionSource = "touch" | "hover" | "notification" | "curiosity" | "wander"

export type AttentionTarget = {
  source: AttentionSource
  x: number
  y: number
  at: number
}

const PRIORITY: Record<AttentionSource, number> = {
  touch: 5,
  hover: 4,
  notification: 3,
  curiosity: 2,
  wander: 1,
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n))

export function resolveAttentionTarget(
  targets: AttentionTarget[],
  now = Date.now(),
  staleMs = 9000
): AttentionTarget | null {
  const fresh = targets.filter((t) => now - t.at <= staleMs)
  if (!fresh.length) return null
  const sorted = [...fresh].sort((a, b) => {
    const p = PRIORITY[b.source] - PRIORITY[a.source]
    if (p !== 0) return p
    return b.at - a.at
  })
  const top = sorted[0]
  if (!top) return null
  return { ...top, x: clamp(top.x), y: clamp(top.y) }
}

