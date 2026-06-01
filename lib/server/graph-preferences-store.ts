import type { GraphEdge, GraphUpdatePayload } from "@/lib/types/recommendation-graph-v2"

type ViewerSignals = {
  zones: Set<string>
  event_ids: Set<string>
  group_ids: Set<string>
  moment_hints: Set<string>
  lat?: number
  lng?: number
  edges: GraphEdge[]
  updated_at: string
}

type GlobalGraph = { map: Map<string, ViewerSignals> }
const g = globalThis as unknown as { __sparkd_graph_prefs__?: GlobalGraph }

function store(): Map<string, ViewerSignals> {
  if (!g.__sparkd_graph_prefs__) g.__sparkd_graph_prefs__ = { map: new Map() }
  return g.__sparkd_graph_prefs__.map
}

function ensure(uid: string): ViewerSignals {
  const m = store()
  let v = m.get(uid)
  if (!v) {
    v = {
      zones: new Set(),
      event_ids: new Set(),
      group_ids: new Set(),
      moment_hints: new Set(),
      edges: [],
      updated_at: new Date().toISOString(),
    }
    m.set(uid, v)
  }
  return v
}

const MAX_EDGES = 800

export function mergeGraphUpdate(viewerId: string, payload: GraphUpdatePayload): { edges: number; signals: boolean } {
  const uid = String(viewerId || "").trim()
  if (!uid) return { edges: 0, signals: false }
  const v = ensure(uid)

  let edgeCount = 0
  if (payload.edges?.length) {
    for (const e of payload.edges) {
      if (!e?.source_id || !e?.target_id || !e.kind) continue
      v.edges.push({
        kind: e.kind,
        source_id: String(e.source_id),
        target_id: String(e.target_id),
        weight: e.weight,
        metadata: e.metadata,
      })
      edgeCount++
    }
    while (v.edges.length > MAX_EDGES) v.edges.shift()
  }

  let signals = false
  const sig = payload.viewer_signals
  if (sig) {
    signals = true
    for (const z of sig.preferred_zones || []) {
      const t = String(z || "").trim()
      if (t) v.zones.add(t.toLowerCase())
    }
    for (const id of sig.attended_event_ids || []) {
      const t = String(id || "").trim()
      if (t) v.event_ids.add(t)
    }
    for (const id of sig.joined_group_ids || []) {
      const t = String(id || "").trim()
      if (t) v.group_ids.add(t)
    }
    for (const h of sig.moment_edge_hints || []) {
      const t = String(h || "").trim()
      if (t) v.moment_hints.add(t.toLowerCase())
    }
    if (typeof sig.latitude === "number" && typeof sig.longitude === "number") {
      v.lat = sig.latitude
      v.lng = sig.longitude
    }
  }

  v.updated_at = new Date().toISOString()
  return { edges: edgeCount, signals }
}

export function getViewerSignals(viewerId: string): ViewerSignals | null {
  const uid = String(viewerId || "").trim()
  if (!uid) return null
  return store().get(uid) ?? null
}
