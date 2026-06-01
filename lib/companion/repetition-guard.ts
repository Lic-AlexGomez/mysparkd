import type { SparkyMemory } from "@/lib/sparky-memory"

function normalizeLineKey(line: string): string {
  return line.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80)
}

function hourBucket(now: Date): string {
  return now.toISOString().slice(0, 13)
}

function dayBucket(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export function applyRepetitionGuard(
  memory: SparkyMemory,
  opts: {
    key: string
    line: string
    now?: Date
    cooldownMs?: number
    maxPerHour?: number
    maxMentionsPerDay?: number
  }
): { allowed: boolean; memory: SparkyMemory } {
  const now = opts.now ?? new Date()
  const key = opts.key.slice(0, 80)
  const lineKey = normalizeLineKey(opts.line)
  const cooldownMs = Math.max(0, opts.cooldownMs ?? 45_000)
  const maxPerHour = Math.max(1, opts.maxPerHour ?? 3)
  const maxMentionsPerDay = Math.max(1, opts.maxMentionsPerDay ?? 8)

  const repetition = memory.repetitionState ?? {}
  const cooldownByKey = { ...(repetition.cooldownByKey ?? {}) }
  const hourlyBudgetByBucket = { ...(repetition.hourlyBudgetByBucket ?? {}) }
  const recentLineKeys = [...(repetition.recentLineKeys ?? [])]
  const day = dayBucket(now)
  const hour = hourBucket(now)
  const globalHourKey = `global:${hour}`
  const globalDayKey = `global-day:${day}`

  const cooldownUntilMs = Date.parse(cooldownByKey[key] ?? "")
  if (!Number.isNaN(cooldownUntilMs) && cooldownUntilMs > now.getTime()) {
    return { allowed: false, memory }
  }

  if (recentLineKeys.includes(lineKey)) {
    return { allowed: false, memory }
  }

  if ((hourlyBudgetByBucket[globalHourKey] ?? 0) >= maxPerHour) {
    return { allowed: false, memory }
  }

  if ((hourlyBudgetByBucket[globalDayKey] ?? 0) >= maxMentionsPerDay) {
    return { allowed: false, memory }
  }

  cooldownByKey[key] = new Date(now.getTime() + cooldownMs).toISOString()
  hourlyBudgetByBucket[globalHourKey] = (hourlyBudgetByBucket[globalHourKey] ?? 0) + 1
  hourlyBudgetByBucket[globalDayKey] = (hourlyBudgetByBucket[globalDayKey] ?? 0) + 1

  recentLineKeys.push(lineKey)
  const nextRecent = recentLineKeys.slice(-18)

  const next: SparkyMemory = {
    ...memory,
    repetitionState: {
      cooldownByKey,
      hourlyBudgetByBucket,
      recentLineKeys: nextRecent,
    },
  }
  return { allowed: true, memory: next }
}

export { normalizeLineKey }
