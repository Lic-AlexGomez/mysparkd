import type { SparkyAnchor } from "@/lib/sparky-motion"
import { SPARKY_ANCHOR_POSITION } from "@/lib/sparky-motion"

export type SparkyScreenPosition = {
  bottom: number
  right?: number
  left?: number
}

export type SparkyFacing = "left" | "right" | "center"

export type SparkyAnimMode = "float" | "bounce" | "walk" | "sleep" | "celebrate" | "think"

const NAV_CLEARANCE = 29
const SIDE_MARGIN = 10
const TOP_MARGIN = 72

/** Convierte anchor a posición en pantalla. */
export function anchorToPosition(anchor: SparkyAnchor): SparkyScreenPosition {
  return { ...SPARKY_ANCHOR_POSITION[anchor] }
}

/** Waypoints para deambular — no se queda pegado a una esquina. */
export function buildRoamWaypoints(routeAnchor: SparkyAnchor): SparkyScreenPosition[] {
  const home = anchorToPosition("bottomRight")
  const contextual = anchorToPosition(routeAnchor)
  const left = anchorToPosition("edgePeekLeft")
  const right = anchorToPosition("edgePeekRight")
  const center = anchorToPosition("centerPeek")
  const feed = anchorToPosition("nearFeed")

  const list: SparkyScreenPosition[] = [
    home,
    contextual,
    feed,
    center,
    right,
    left,
    { bottom: home.bottom + 24, right: 48 },
    { bottom: home.bottom + 8, left: 20 },
    home,
  ]

  const seen = new Set<string>()
  return list.filter((p) => {
    const key = `${p.bottom}-${p.right ?? ""}-${p.left ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function clampPosition(
  pos: SparkyScreenPosition,
  vw: number,
  vh: number,
  size = 64
): SparkyScreenPosition {
  const bottom = Math.max(NAV_CLEARANCE, Math.min(vh - TOP_MARGIN - size, pos.bottom))
  if (pos.left != null) {
    return {
      bottom,
      left: Math.max(SIDE_MARGIN, Math.min(vw - size - SIDE_MARGIN, pos.left)),
    }
  }
  return {
    bottom,
    right: Math.max(SIDE_MARGIN, Math.min(vw - size - SIDE_MARGIN, pos.right ?? SIDE_MARGIN)),
  }
}

export function facingFromMove(
  from: SparkyScreenPosition,
  to: SparkyScreenPosition
): SparkyFacing {
  const fromX = from.left ?? (typeof window !== "undefined" ? window.innerWidth - (from.right ?? 12) : 300)
  const toX = to.left ?? (typeof window !== "undefined" ? window.innerWidth - (to.right ?? 12) : 280)
  if (toX > fromX + 8) return "right"
  if (toX < fromX - 8) return "left"
  return "center"
}
