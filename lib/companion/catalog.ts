import type { ComponentType } from "react"
import type { CompanionMood } from "@/lib/companion/context-signals"

export type CompanionId = "sparky" | "slime" | "pixel_cat" | "ghost" | "clippy"

export type CompanionCategory = "cute" | "retro" | "cyber" | "pixel"

export type CompanionTraits = {
  humor: number
  energy: number
  kindness: number
  chaos: number
  curiosity: number
}

export type CompanionDefinition = {
  id: CompanionId
  name: string
  category: CompanionCategory
  traits: CompanionTraits
  defaultMood: CompanionMood
  description: string
  rarity: "common" | "rare" | "legendary"
  unlockedByDefault: boolean
  bondRequired?: number
  riveAsset?: string
  fallbackSvg?: ComponentType
}

export const COMPANION_CATALOG: CompanionDefinition[] = [
  {
    id: "sparky",
    name: "Sparky",
    category: "cyber",
    traits: { humor: 70, energy: 65, kindness: 80, chaos: 45, curiosity: 75 },
    defaultMood: "happy",
    description: "Tu chispa guía — cálido y listo para ayudar.",
    rarity: "common",
    unlockedByDefault: true,
    // Habilitar cuando exista public/assets/rive/sparky.riv
    // riveAsset: "/assets/rive/sparky.riv",
  },
  {
    id: "slime",
    name: "Bloop",
    category: "cute",
    traits: { humor: 85, energy: 95, kindness: 70, chaos: 80, curiosity: 60 },
    defaultMood: "excited",
    description: "Hiperactivo y juguetón — rebota con cada logro.",
    rarity: "rare",
    unlockedByDefault: false,
    bondRequired: 15,
  },
  {
    id: "pixel_cat",
    name: "Pixel",
    category: "pixel",
    traits: { humor: 40, energy: 35, kindness: 85, chaos: 20, curiosity: 55 },
    defaultMood: "idle",
    description: "Calmado y observador — perfecto para modo quiet.",
    rarity: "rare",
    unlockedByDefault: false,
    bondRequired: 25,
  },
  {
    id: "clippy",
    name: "Clip",
    category: "retro",
    traits: { humor: 60, energy: 70, kindness: 50, chaos: 65, curiosity: 90 },
    defaultMood: "curious",
    description: "Entrometido a propósito — tips contextuales extra.",
    rarity: "legendary",
    unlockedByDefault: false,
    bondRequired: 50,
  },
  {
    id: "ghost",
    name: "Wisp",
    category: "cute",
    traits: { humor: 55, energy: 40, kindness: 75, chaos: 30, curiosity: 80 },
    defaultMood: "sleepy",
    description: "Presencia suave — casi no molesta.",
    rarity: "rare",
    unlockedByDefault: false,
    bondRequired: 35,
  },
]

export function getCompanionById(id: CompanionId): CompanionDefinition {
  return COMPANION_CATALOG.find((c) => c.id === id) ?? COMPANION_CATALOG[0]
}

export function isCompanionUnlocked(def: CompanionDefinition, bondPoints: number): boolean {
  if (def.unlockedByDefault) return true
  return bondPoints >= (def.bondRequired ?? 99)
}

export function listUnlockedCompanions(bondPoints: number): CompanionDefinition[] {
  return COMPANION_CATALOG.filter((c) => isCompanionUnlocked(c, bondPoints))
}
