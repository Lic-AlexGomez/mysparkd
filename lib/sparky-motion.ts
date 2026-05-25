/** Anchors de posición de Sparky en web (FAB fijo + desplazamiento visual). */

export type SparkyAnchor =
  | "bottomRight"
  | "bottomLeft"
  | "nearFeed"
  | "nearEvents"
  | "nearSwipeActions"
  | "nearProfileStats"
  | "nearSettings"
  | "nearNavbar"
  | "centerPeek"
  | "edgePeekLeft"
  | "edgePeekRight"

export type SparkyAnchorPosition = {
  bottom: number
  right?: number
  left?: number
}

export const SPARKY_ANCHOR_POSITION: Record<SparkyAnchor, SparkyAnchorPosition> = {
  bottomRight: { bottom: 32, right: 12 },
  bottomLeft: { bottom: 32, left: 12 },
  nearFeed: { bottom: 38, right: 16 },
  nearEvents: { bottom: 36, right: 14 },
  nearSwipeActions: { bottom: 48, right: 10 },
  nearProfileStats: { bottom: 54, right: 16 },
  nearSettings: { bottom: 34, right: 16 },
  nearNavbar: { bottom: 30, right: 12 },
  centerPeek: { bottom: 44, right: 40 },
  edgePeekLeft: { bottom: 34, left: 6 },
  edgePeekRight: { bottom: 34, right: 6 },
}
