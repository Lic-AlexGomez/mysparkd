/** Layout de mini previews — calibrado a `BottomNav.tsx` móvil. */
export const PREVIEW_VB = { w: 200, h: 80 } as const

/** Dock Sparkd: izquierda + hueco central (Events flotante) + derecha */
export const DOCK_LEFT = [
  { key: "feed", label: "FEED", x: 20, active: true },
  { key: "groups", label: "GRPS", x: 44 },
  { key: "chat", label: "CHAT", x: 64 },
] as const

export const DOCK_RIGHT = [
  { key: "swipes", label: "SWIPE", x: 136 },
  { key: "matches", label: "MATCH", x: 160 },
  { key: "profile", label: "ME", x: 182 },
] as const

export const DOCK_CENTER = { x: 100, pulseY: 22, labelY: 36 } as const

/** Gradient / Glass: fila lineal con los 7 ítems (Events no es botón central). */
export const LINEAR_NAV = [
  { key: "feed", label: "FEED", x: 16, active: true },
  { key: "groups", label: "GRPS", x: 44 },
  { key: "events", label: "EVT", x: 72 },
  { key: "chat", label: "CHAT", x: 100 },
  { key: "swipes", label: "SWIPE", x: 128 },
  { key: "matches", label: "MATCH", x: 156 },
  { key: "profile", label: "ME", x: 184 },
] as const

export const ICON_Y = 54
export const LABEL_Y = 66
