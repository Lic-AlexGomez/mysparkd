import type { SparkySpotlightRect } from "@/lib/sparky-tour"

/** IDs de anclas registradas en pantallas para el tour guiado. */
export type SparkyTourAnchorId =
  | "tour-feed-main"
  | "tour-events-main"
  | "tour-discover-main"
  | "tour-profile-main"
  | "tour-appearance-main"

export type SparkyAnchorMeasure = {
  x: number
  y: number
  width: number
  height: number
}

export const SPARKY_TOUR_ANCHOR_PADDING = {
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
} as const

export function applyAnchorPadding(measure: SparkyAnchorMeasure): SparkyAnchorMeasure {
  const pad = SPARKY_TOUR_ANCHOR_PADDING
  return {
    x: Math.max(0, measure.x - pad.left),
    y: Math.max(0, measure.y - pad.top),
    width: measure.width + pad.left + pad.right,
    height: measure.height + pad.top + pad.bottom,
  }
}

export function spotlightRectToPixels(
  rect: SparkySpotlightRect,
  width: number,
  height: number,
  insetTop: number
): SparkyAnchorMeasure {
  return {
    x: rect.x * width,
    y: rect.y * height + insetTop * 0.15,
    width: rect.width * width,
    height: rect.height * height,
  }
}
