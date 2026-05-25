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
  bottomRight: { bottom: 112, right: 16 },
  bottomLeft: { bottom: 112, left: 16 },
  nearFeed: { bottom: 140, right: 24 },
  nearEvents: { bottom: 130, right: 20 },
  nearSwipeActions: { bottom: 180, right: 12 },
  nearProfileStats: { bottom: 200, right: 20 },
  nearSettings: { bottom: 120, right: 24 },
  nearNavbar: { bottom: 100, right: 16 },
  centerPeek: { bottom: 160, right: 48 },
  edgePeekLeft: { bottom: 120, left: 8 },
  edgePeekRight: { bottom: 120, right: 8 },
}
