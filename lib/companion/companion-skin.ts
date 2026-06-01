import type { CompanionId } from "@/lib/companion/catalog"

export type CompanionSkinTokens = {
  primary: string
  secondary: string
  accent: string
  bodyScale: number
  roundness: number
}

export const COMPANION_SKINS: Record<CompanionId, CompanionSkinTokens> = {
  sparky: { primary: "#8be9ff", secondary: "#f472b6", accent: "#67e8f9", bodyScale: 1, roundness: 1.18 },
  slime: { primary: "#22c55e", secondary: "#84cc16", accent: "#a3e635", bodyScale: 1.08, roundness: 1.2 },
  pixel_cat: { primary: "#64748b", secondary: "#94a3b8", accent: "#cbd5e1", bodyScale: 0.95, roundness: 0.85 },
  clippy: { primary: "#f59e0b", secondary: "#eab308", accent: "#fef08a", bodyScale: 1, roundness: 0.9 },
  ghost: { primary: "#e2e8f0", secondary: "#cbd5e1", accent: "#a5b4fc", bodyScale: 1.05, roundness: 1.15 },
}

export function getCompanionSkin(id: CompanionId): CompanionSkinTokens {
  return COMPANION_SKINS[id] ?? COMPANION_SKINS.sparky
}
