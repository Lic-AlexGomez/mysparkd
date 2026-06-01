export function stableCompanionSeed(now: Date, salt = 0): number {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "")
  const base = Number(day) || now.getDate()
  return Math.abs(base * 31 + salt * 17 + now.getHours())
}

export function maybeAddMicroFlavor(line: string, seed: number): string {
  const clean = line.trim()
  if (!clean) return clean
  const roll = Math.abs(seed) % 10
  if (roll <= 1) return clean
  if (roll === 2) return `${clean}...`
  if (roll === 3) return `${clean} 👀`
  return clean
}

