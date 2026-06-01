import type { NavbarStyle } from "./types"

/** Preset móvil del dock real (`components/layout/bottom-nav.tsx`). */
export const SPARKD_DOCK_PRESET = {
  w: 420,
  h: 64,
  shellH: 64,
  barOffset: 22,
  navTop: 22,
  navHeight: 42,
  centerGap: 56,
  navPx: 8,
  pulseTop: -18,
  path: `M 24 0 L 140 0 C 165 0, 185 -22, 210 -22 C 235 -22, 255 0, 280 0 L 396 0 Q 420 0 420 32 L 420 64 L 0 64 L 0 32 Q 0 0 24 0 Z`,
  pulse: { outer: 56, mid: 44, core: 32 },
  labelClass: "text-[7px] font-bold tracking-wide leading-none",
  eventsLabelClass: "text-[7px] font-bold uppercase tracking-[0.2em]",
  liveClass: "text-[7px] font-extrabold uppercase tracking-[0.18em] text-cyan-400/90",
} as const

export type NavPreviewVariant = "sparkd-dock" | "gradient-bar" | "glass-bar"

export function navbarStyleToPreviewVariant(style: NavbarStyle): NavPreviewVariant {
  if (style === "gradient") return "gradient-bar"
  if (style === "glass") return "glass-bar"
  return "sparkd-dock"
}
