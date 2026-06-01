export type AvatarStyleId = "orb" | "star" | "aurora" | "pixel" | "bloom" | "neon"

export type AvatarStyleDefinition = {
  id: AvatarStyleId
  name: string
  description: string
  unlockedByDefault: boolean
  bondRequired?: number
}

export const AVATAR_STYLE_CATALOG: AvatarStyleDefinition[] = [
  {
    id: "orb",
    name: "Orbe",
    description: "Clásico con brillo y mejillas — mascota iOS.",
    unlockedByDefault: true,
  },
  {
    id: "star",
    name: "Estrella",
    description: "Forma puntiaguda y energética.",
    unlockedByDefault: true,
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Capas suaves tipo aurora boreal.",
    unlockedByDefault: true,
  },
  {
    id: "pixel",
    name: "Pixel",
    description: "Retro 8-bit cuadrado.",
    unlockedByDefault: false,
    bondRequired: 12,
  },
  {
    id: "bloom",
    name: "Flor",
    description: "Pétalos alrededor del núcleo.",
    unlockedByDefault: false,
    bondRequired: 28,
  },
  {
    id: "neon",
    name: "Neón",
    description: "Anillo luminoso con núcleo.",
    unlockedByDefault: false,
    bondRequired: 45,
  },
]

const VALID = new Set(AVATAR_STYLE_CATALOG.map((s) => s.id))

export function normalizeAvatarStyle(raw: unknown): AvatarStyleId {
  return typeof raw === "string" && VALID.has(raw as AvatarStyleId) ? (raw as AvatarStyleId) : "orb"
}

export function getAvatarStyleById(id: AvatarStyleId): AvatarStyleDefinition {
  return AVATAR_STYLE_CATALOG.find((s) => s.id === id) ?? AVATAR_STYLE_CATALOG[0]
}

export function isAvatarStyleUnlocked(def: AvatarStyleDefinition, bondPoints: number): boolean {
  if (def.unlockedByDefault) return true
  return bondPoints >= (def.bondRequired ?? 99)
}

export function listUnlockedAvatarStyles(bondPoints: number): AvatarStyleDefinition[] {
  return AVATAR_STYLE_CATALOG.filter((s) => isAvatarStyleUnlocked(s, bondPoints))
}
