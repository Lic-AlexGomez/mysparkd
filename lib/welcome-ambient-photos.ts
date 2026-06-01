/**
 * Fotos decorativas welcome — Unsplash License (uso libre).
 * https://unsplash.com/license
 * IDs verificados (HTTP 200) con ?auto=format&fit=crop
 */
export type WelcomeAmbientCategory = "meetup" | "fast-date" | "match" | "social"

export type WelcomeAmbientPhoto = {
  id: string
  category: WelcomeAmbientCategory
  /** Ruta local bajo `public/assets/welcome/` */
  url: string
  label: string
}

const a = (filename: string) => `/assets/welcome/${filename}`

/** 4 fotos únicas por categoría — sin IDs duplicados */
export const WELCOME_AMBIENT_BY_CATEGORY: Record<
  WelcomeAmbientCategory,
  readonly WelcomeAmbientPhoto[]
> = {
  meetup: [
    { id: "meetup-01", category: "meetup", label: "Meetup", url: a("meetup-01.jpg") },
    { id: "meetup-02", category: "meetup", label: "Grupo", url: a("meetup-02.jpg") },
    { id: "meetup-03", category: "meetup", label: "Evento", url: a("meetup-03.jpg") },
  ],
  "fast-date": [
    { id: "fast-01", category: "fast-date", label: "Cita", url: a("fast-01.jpg") },
    { id: "fast-02", category: "fast-date", label: "Cena", url: a("fast-02.jpg") },
    { id: "fast-03", category: "fast-date", label: "Cita", url: a("fast-03.jpg") },
    { id: "fast-04", category: "fast-date", label: "Pareja", url: a("fast-04.jpg") },
    { id: "fast-05", category: "fast-date", label: "Pareja", url: a("fast-05.jpg") },
  ],
  match: [
    { id: "match-01", category: "match", label: "Match", url: a("match-01.jpg") },
    { id: "match-02", category: "match", label: "Match", url: a("match-02.jpg") },
    { id: "match-03", category: "match", label: "Match", url: a("match-03.jpg") },
    { id: "match-04", category: "match", label: "Match", url: a("match-04.jpg") },
    { id: "match-05", category: "match", label: "Match", url: a("match-05.jpg") },
  ],
  social: [
    { id: "social-a", category: "social", label: "Social", url: a("social-01.jpg") },
    { id: "social-b", category: "social", label: "Social", url: a("social-02.jpg") },
    { id: "social-c", category: "social", label: "Social", url: a("social-03.jpg") },
    { id: "social-d", category: "social", label: "Social", url: a("social-04.jpg") },
  ],
}

export const WELCOME_AMBIENT_PHOTOS: readonly WelcomeAmbientPhoto[] = [
  ...WELCOME_AMBIENT_BY_CATEGORY.meetup,
  ...WELCOME_AMBIENT_BY_CATEGORY["fast-date"],
  ...WELCOME_AMBIENT_BY_CATEGORY.match,
  ...WELCOME_AMBIENT_BY_CATEGORY.social,
]

export type WelcomeAmbientSlot = {
  id: number
  category: WelcomeAmbientCategory
  top: string
  left?: string
  right?: string
  width: number
  height: number
  rotate: number
  desktopOnly?: boolean
}

export const WELCOME_AMBIENT_SLOTS: readonly WelcomeAmbientSlot[] = [
  { id: 0, category: "meetup", top: "5%", left: "6%", width: 118, height: 152, rotate: -6 },
  { id: 1, category: "fast-date", top: "9%", right: "6%", width: 122, height: 156, rotate: 6 },
  { id: 2, category: "meetup", top: "33%", left: "5%", width: 110, height: 142, rotate: 3, desktopOnly: true },
  { id: 3, category: "match", top: "37%", right: "5%", width: 114, height: 146, rotate: -4, desktopOnly: true },
  { id: 4, category: "social", top: "63%", left: "6%", width: 116, height: 150, rotate: -5 },
  { id: 5, category: "fast-date", top: "67%", right: "6%", width: 120, height: 154, rotate: 6 },
]

const categoryCursor: Record<WelcomeAmbientCategory, number> = {
  meetup: 0,
  "fast-date": 0,
  match: 0,
  social: 0,
}

export function getInitialPhotosForSlots(): Map<number, WelcomeAmbientPhoto> {
  categoryCursor.meetup = 0
  categoryCursor["fast-date"] = 0
  categoryCursor.match = 0
  categoryCursor.social = 0
  const taken = new Set<string>()
  const map = new Map<number, WelcomeAmbientPhoto>()
  for (const slot of WELCOME_AMBIENT_SLOTS) {
    const photo = pickNextInCategory(slot.category, taken)
    taken.add(photo.id)
    map.set(slot.id, photo)
  }
  return map
}

function pickRandomFromPool(list: readonly WelcomeAmbientPhoto[]): WelcomeAmbientPhoto {
  return list[Math.floor(Math.random() * list.length)] ?? list[0]
}

export function pickNextInCategory(
  category: WelcomeAmbientCategory,
  excludeIds: ReadonlySet<string> | string[] = [],
): WelcomeAmbientPhoto {
  const exclude = excludeIds instanceof Set ? excludeIds : new Set(excludeIds)
  const pool = WELCOME_AMBIENT_BY_CATEGORY[category]
  const available = pool.filter((p) => !exclude.has(p.id))
  const list = available.length > 0 ? available : pool

  if (category === "meetup" && list.length > 1) {
    return pickRandomFromPool(list)
  }

  const idx = categoryCursor[category] % list.length
  categoryCursor[category] = idx + 1
  return list[idx]
}

/** @deprecated Usar pickNextInCategory */
export function pickRandomAmbientPhoto(excludeId?: string): WelcomeAmbientPhoto {
  const all = WELCOME_AMBIENT_PHOTOS.filter((p) => p.id !== excludeId)
  return all[0]
}

export function borderClassForCategory(category: WelcomeAmbientCategory): string {
  switch (category) {
    case "meetup":
      return "border-secondary/45 shadow-[0_0_24px_rgba(217,70,239,0.2)]"
    case "fast-date":
      return "border-primary/50 shadow-[0_0_24px_rgba(0,229,255,0.22)]"
    case "match":
      return "border-primary/40 shadow-[0_0_20px_rgba(0,229,255,0.15)]"
    case "social":
      return "border-white/20 shadow-[0_0_18px_rgba(255,255,255,0.08)]"
  }
}

export function fallbackPhotoForCategory(category: WelcomeAmbientCategory): WelcomeAmbientPhoto {
  return WELCOME_AMBIENT_BY_CATEGORY[category][0]
}
