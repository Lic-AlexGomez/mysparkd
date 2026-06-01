import type { RecommendationScores } from "@/lib/types/recommendation-graph-v2"

/** Higher = socially closer to viewer (matches / mutual context). */
export function socialProximityFromSignals(hasMatch: boolean, mutualFollowHint: boolean): number {
  if (hasMatch) return 92
  if (mutualFollowHint) return 78
  return 52
}

/**
 * social_distance: lower = closer socially (per brief graph intuition).
 * Maps proximity p (high=close) → distance bucket 0–100 where small distance means close.
 */
export function socialDistanceFromProximity(proximity0to100: number): number {
  const p = Math.min(100, Math.max(0, proximity0to100))
  return Math.round(100 - p)
}

export function activityOverlapScore(sharedBuckets: number, maxBuckets = 8): number {
  if (sharedBuckets <= 0) return 22
  const x = Math.min(maxBuckets, sharedBuckets) / maxBuckets
  return Math.round(28 + 72 * x)
}

export function locationMatchScore(
  viewerZones: string[],
  candidateZone?: string | null,
  viewerLatLng?: { lat: number; lng: number },
  candidateLatLng?: { lat: number; lng: number }
): number {
  const vz = viewerZones.map((z) => z.toLowerCase().trim()).filter(Boolean)
  const cz = String(candidateZone || "")
    .toLowerCase()
    .trim()
  if (vz.length && cz) {
    if (vz.some((z) => cz.includes(z) || z.includes(cz))) return 88
    const tokens = cz.split(/[,/\s]+/).filter((t) => t.length >= 3)
    if (tokens.some((t) => vz.some((z) => z.includes(t)))) return 76
  }

  if (
    viewerLatLng &&
    candidateLatLng &&
    Number.isFinite(viewerLatLng.lat) &&
    Number.isFinite(viewerLatLng.lng) &&
    Number.isFinite(candidateLatLng.lat) &&
    Number.isFinite(candidateLatLng.lng)
  ) {
    const km = haversKm(viewerLatLng.lat, viewerLatLng.lng, candidateLatLng.lat, candidateLatLng.lng)
    if (km <= 8) return 90
    if (km <= 25) return 72
    if (km <= 80) return 55
    return 38
  }

  return 44
}

function haversKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function composeAffinityScores(parts: {
  social_proximity: number
  activity_overlap: number
  location_match: number
}): RecommendationScores {
  const social_distance = socialDistanceFromProximity(parts.social_proximity)
  const affinity_score = Math.round(
    0.38 * parts.social_proximity +
      0.34 * parts.activity_overlap +
      0.28 * parts.location_match
  )
  return {
    affinity_score: Math.min(100, Math.max(0, affinity_score)),
    social_distance: Math.min(100, Math.max(0, social_distance)),
    activity_overlap: Math.min(100, Math.max(0, Math.round(parts.activity_overlap))),
    location_match: Math.min(100, Math.max(0, Math.round(parts.location_match))),
  }
}
