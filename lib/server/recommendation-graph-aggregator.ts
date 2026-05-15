import type {
  RecommendationsResponse,
  RecommendedEvent,
  RecommendedFastDate,
  RecommendedGroup,
  RecommendedPerson,
  SimilarityResponse,
  SimilarPeer,
} from "@/lib/types/recommendation-graph-v2"
import {
  activityOverlapScore,
  composeAffinityScores,
  locationMatchScore,
  socialProximityFromSignals,
} from "@/lib/recommendation-graph-scoring"
import { getViewerSignals } from "@/lib/server/graph-preferences-store"

async function backendJson(
  backendBaseUrl: string,
  pathWithQuery: string,
  authHeader: string | null
): Promise<{ ok: boolean; data: unknown }> {
  const url = `${backendBaseUrl}${pathWithQuery}`
  const headers: Record<string, string> = { Accept: "application/json" }
  if (authHeader) headers.Authorization = authHeader
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(14_000),
    })
    if (!res.ok) return { ok: false, data: null }
    const data = await res.json().catch(() => null)
    return { ok: true, data }
  } catch {
    return { ok: false, data: null }
  }
}

function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>
    if (Array.isArray(o.content)) return o.content
    if (Array.isArray(o.data)) return o.data as unknown[]
  }
  return []
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === "string" && v.trim()) return v.trim()
    if (typeof v === "number" && Number.isFinite(v)) return String(v)
  }
  return undefined
}

function extractSocialRows(raw: unknown): Record<string, unknown>[] {
  return unwrapArray(raw).filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
}

function extractUserFromSocialRow(
  row: Record<string, unknown>,
  viewerId: string,
  mode: "following" | "follower"
): { id: string; username?: string; photo?: string } | null {
  const ordered =
    mode === "following"
      ? ["followingId", "following_id", "userId", "user_id", "id", "profileId"]
      : ["followerId", "follower_id", "userId", "user_id", "id", "profileId"]
  let id: string | undefined
  for (const k of ordered) {
    const v = pickStr(row, k)
    if (v && String(v).trim() !== viewerId) {
      id = String(v).trim()
      break
    }
  }
  if (!id) return null
  const nested =
    row.user && typeof row.user === "object"
      ? (row.user as Record<string, unknown>)
      : row.followedUser && typeof row.followedUser === "object"
        ? (row.followedUser as Record<string, unknown>)
        : row.followerUser && typeof row.followerUser === "object"
          ? (row.followerUser as Record<string, unknown>)
          : null
  const username =
    pickStr(row, "username", "handle", "name") || (nested ? pickStr(nested, "username", "handle") : undefined)
  const photo =
    pickStr(row, "profilePictureUrl", "photoUrl", "photo", "avatarUrl") ||
    (nested ? pickStr(nested, "profilePictureUrl", "photoUrl", "photo") : undefined)
  return { id, username, photo }
}

export async function aggregateRecommendations(options: {
  viewerId: string
  backendBaseUrl: string
  authHeader: string | null
}): Promise<RecommendationsResponse> {
  const viewerId = options.viewerId
  const prefs = getViewerSignals(viewerId)
  const viewerZones = prefs ? [...prefs.zones] : []
  const viewerLatLng =
    prefs?.lat != null && prefs?.lng != null ? { lat: prefs.lat, lng: prefs.lng } : undefined

  const partial = { v: false }

  const [folRes, ferRes, matchRes, feedRes, grpRes, dateRes] = await Promise.all([
    backendJson(options.backendBaseUrl, `/api/follow/following/${encodeURIComponent(viewerId)}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/follow/followers/${encodeURIComponent(viewerId)}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/matches/my/matches`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/activity-feed`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/groups/discover`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/date-cards/feed`, options.authHeader),
  ])

  if (!folRes.ok) partial.v = true
  if (!ferRes.ok) partial.v = true
  if (!matchRes.ok) partial.v = true
  if (!feedRes.ok) partial.v = true
  if (!grpRes.ok) partial.v = true
  if (!dateRes.ok) partial.v = true

  const followingIds = new Set<string>()
  const followerIds = new Set<string>()
  const matchedPartners = new Map<string, { username?: string; photo?: string }>()

  for (const row of extractSocialRows(folRes.data)) {
    const u = extractUserFromSocialRow(row, viewerId, "following")
    if (u) followingIds.add(u.id)
  }
  for (const row of extractSocialRows(ferRes.data)) {
    const u = extractUserFromSocialRow(row, viewerId, "follower")
    if (u) followerIds.add(u.id)
  }

  const matchRows = unwrapArray(matchRes.data)
  for (const raw of matchRows) {
    if (!raw || typeof raw !== "object") continue
    const m = raw as Record<string, unknown>
    const u1 = pickStr(m, "userId1", "user_id1", "userA", "user_a")
    const u2 = pickStr(m, "userId2", "user_id2", "userB", "user_b")
    const partner =
      u1 === viewerId ? u2 : u2 === viewerId ? u1 : u1 && u1 !== viewerId ? u1 : u2 && u2 !== viewerId ? u2 : null
    if (!partner) continue
    matchedPartners.set(partner, {
      username: pickStr(m, "username", "matchedUsername") || undefined,
      photo: pickStr(m, "photo", "profilePictureUrl") || undefined,
    })
  }

  /** Extra overlap buckets from stored graph edges + prefs */
  const viewerEdgeTargets = new Set<string>()
  if (prefs?.edges?.length) {
    for (const e of prefs.edges) {
      if (e.source_id === viewerId) viewerEdgeTargets.add(e.target_id)
      if (e.target_id === viewerId) viewerEdgeTargets.add(e.source_id)
    }
  }

  const peopleMap = new Map<
    string,
    { username?: string; photo?: string; has_match: boolean; mutual_follow_hint: boolean; overlap_buckets: number }
  >()

  for (const [pid, meta] of matchedPartners) {
    peopleMap.set(pid, {
      username: meta.username,
      photo: meta.photo,
      has_match: true,
      mutual_follow_hint: followerIds.has(pid) && followingIds.has(pid),
      overlap_buckets: Math.max(
        1,
        (viewerEdgeTargets.has(pid) ? 2 : 0) + (followerIds.has(pid) && followingIds.has(pid) ? 2 : 0)
      ),
    })
  }

  for (const row of extractSocialRows(folRes.data)) {
    const u = extractUserFromSocialRow(row, viewerId, "following")
    if (!u || matchedPartners.has(u.id)) continue
    const mutual_follow_hint = followerIds.has(u.id)
    const overlap_buckets = (viewerEdgeTargets.has(u.id) ? 2 : 0) + (mutual_follow_hint ? 2 : 1)
    peopleMap.set(u.id, {
      username: u.username,
      photo: u.photo,
      has_match: false,
      mutual_follow_hint,
      overlap_buckets,
    })
  }

  for (const row of extractSocialRows(ferRes.data)) {
    const u = extractUserFromSocialRow(row, viewerId, "follower")
    if (!u || peopleMap.has(u.id)) continue
    const overlap_buckets = (viewerEdgeTargets.has(u.id) ? 2 : 0) + (followingIds.has(u.id) ? 1 : 0)
    peopleMap.set(u.id, {
      username: u.username,
      photo: u.photo,
      has_match: false,
      mutual_follow_hint: followingIds.has(u.id),
      overlap_buckets,
    })
  }

  const people: RecommendedPerson[] = []
  for (const [uid, meta] of peopleMap) {
    const proximity = socialProximityFromSignals(meta.has_match, meta.mutual_follow_hint)
    const overlap = activityOverlapScore(meta.overlap_buckets)
    const loc = locationMatchScore(viewerZones, meta.username, viewerLatLng, undefined)
    const scores = composeAffinityScores({
      social_proximity: proximity,
      activity_overlap: overlap,
      location_match: loc,
    })
    people.push({
      kind: "person",
      user_id: uid,
      username: meta.username,
      profile_picture_url: meta.photo,
      headline: meta.has_match ? "Someone you matched with" : meta.mutual_follow_hint ? "Mutual circle" : "Suggested connection",
      scores,
      reasons: [
        meta.has_match ? "match_edge" : "",
        meta.mutual_follow_hint ? "follow_overlap" : "",
        prefs?.edges?.length ? "graph_signals" : "",
      ].filter(Boolean),
    })
  }

  people.sort((a, b) => b.scores.affinity_score - a.scores.affinity_score)

  const feedRows = extractSocialRows(feedRes.data).filter((r) => String(r.type ?? "").toUpperCase() !== "DATE")
  const events: RecommendedEvent[] = []
  for (const r of feedRows.slice(0, 48)) {
    const eventId = pickStr(r, "eventId", "id", "event_id")
    if (!eventId) continue
    const zone =
      pickStr(r, "zone", "locationZone", "location_zone", "officialAddress") || undefined
    const starts = pickStr(r, "startsAt", "eventDate", "dateTime", "starts_at")
    const lat = typeof r.latitude === "number" ? r.latitude : undefined
    const lng = typeof r.longitude === "number" ? r.longitude : undefined
    let overlapBuckets = 0
    if (prefs?.event_ids.has(eventId)) overlapBuckets += 2
    viewerZones.forEach((z) => {
      if (zone?.toLowerCase().includes(z)) overlapBuckets += 1
    })
    const proximity = 58 + Math.min(30, overlapBuckets * 8)
    const overlap = activityOverlapScore(overlapBuckets || 1)
    const loc = locationMatchScore(
      viewerZones,
      zone,
      viewerLatLng,
      lat != null && lng != null ? { lat, lng } : undefined
    )
    events.push({
      kind: "event",
      event_id: eventId,
      title: pickStr(r, "title", "name") || "Meetup",
      zone,
      starts_at: starts,
      scores: composeAffinityScores({
        social_proximity: proximity,
        activity_overlap: overlap,
        location_match: loc,
      }),
    })
  }
  events.sort((a, b) => b.scores.affinity_score - a.scores.affinity_score)

  const groupsRaw = grpRes.ok && Array.isArray(grpRes.data) ? (grpRes.data as Record<string, unknown>[]) : []
  const groups: RecommendedGroup[] = []
  for (const g of groupsRaw.slice(0, 36)) {
    const gid = pickStr(g, "id", "groupId")
    if (!gid) continue
    let buckets = 0
    if (prefs?.group_ids.has(gid)) buckets += 2
    const blob = `${pickStr(g, "name", "category") || ""}`.toLowerCase()
    viewerZones.forEach((z) => {
      if (blob.includes(z)) buckets += 1
    })
    const proximity = 55 + Math.min(35, buckets * 10)
    groups.push({
      kind: "group",
      group_id: gid,
      name: pickStr(g, "name") || "Group",
      category: pickStr(g, "category"),
      member_count: typeof g.memberCount === "number" ? g.memberCount : Number(g.memberCount) || undefined,
      scores: composeAffinityScores({
        social_proximity: proximity,
        activity_overlap: activityOverlapScore(buckets || 1),
        location_match: locationMatchScore(viewerZones, pickStr(g, "name")),
      }),
    })
  }
  groups.sort((a, b) => b.scores.affinity_score - a.scores.affinity_score)

  const dateRows = unwrapArray(dateRes.data)
  const fast_dates: RecommendedFastDate[] = []
  for (const raw of dateRows.slice(0, 36)) {
    if (!raw || typeof raw !== "object") continue
    const d = raw as Record<string, unknown>
    const id = pickStr(d, "id", "dateCardId", "date_card_id")
    if (!id) continue
    const zone = pickStr(d, "locationZone", "location_zone") || undefined
    const cat = pickStr(d, "category")
    let buckets = 0
    viewerZones.forEach((z) => {
      if (zone?.toLowerCase().includes(z)) buckets += 1
    })
    prefs?.moment_hints.forEach((h) => {
      const title = `${pickStr(d, "title", "message") || ""}`.toLowerCase()
      if (title.includes(h)) buckets += 1
    })
    fast_dates.push({
      kind: "fast_date",
      date_card_id: id,
      title: pickStr(d, "title") || "Fast date",
      location_zone: zone,
      category: cat,
      scores: composeAffinityScores({
        social_proximity: 56 + Math.min(34, buckets * 9),
        activity_overlap: activityOverlapScore(buckets || 1),
        location_match: locationMatchScore(viewerZones, zone),
      }),
    })
  }
  fast_dates.sort((a, b) => b.scores.affinity_score - a.scores.affinity_score)

  return {
    viewer_id: viewerId,
    generated_at: new Date().toISOString(),
    graph_version: "v2-bff",
    partial: partial.v,
    people: people.slice(0, 24),
    events: events.slice(0, 18),
    groups: groups.slice(0, 14),
    fast_dates: fast_dates.slice(0, 14),
  }
}

export async function aggregateSimilarity(options: {
  viewerId: string
  backendBaseUrl: string
  authHeader: string | null
}): Promise<SimilarityResponse> {
  const viewerId = options.viewerId
  const prefs = getViewerSignals(viewerId)

  const [folRes, ferRes, matchRes] = await Promise.all([
    backendJson(options.backendBaseUrl, `/api/follow/following/${encodeURIComponent(viewerId)}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/follow/followers/${encodeURIComponent(viewerId)}`, options.authHeader),
    backendJson(options.backendBaseUrl, `/api/matches/my/matches`, options.authHeader),
  ])

  const following = new Set<string>()
  const followers = new Set<string>()
  for (const row of extractSocialRows(folRes.data)) {
    const u = extractUserFromSocialRow(row, viewerId, "following")
    if (u) following.add(u.id)
  }
  for (const row of extractSocialRows(ferRes.data)) {
    const u = extractUserFromSocialRow(row, viewerId, "follower")
    if (u) followers.add(u.id)
  }

  const partnerMeta = new Map<string, { username?: string }>()
  const matchRows = unwrapArray(matchRes.data)
  for (const raw of matchRows) {
    if (!raw || typeof raw !== "object") continue
    const m = raw as Record<string, unknown>
    const u1 = pickStr(m, "userId1", "user_id1", "userA")
    const u2 = pickStr(m, "userId2", "user_id2", "userB")
    const partner =
      u1 === viewerId ? u2 : u2 === viewerId ? u1 : u1 && u1 !== viewerId ? u1 : u2 && u2 !== viewerId ? u2 : null
    if (!partner) continue
    partnerMeta.set(partner, { username: pickStr(m, "username") })
  }

  const candidates = new Map<string, { username?: string; bits: Set<string> }>()
  const tag = (uid: string, bit: string, username?: string) => {
    const cur = candidates.get(uid) ?? { username, bits: new Set<string>() }
    cur.bits.add(bit)
    if (username) cur.username = username
    candidates.set(uid, cur)
  }

  for (const uid of following) tag(uid, "following", undefined)
  for (const uid of followers) tag(uid, "follower", undefined)
  for (const uid of partnerMeta.keys()) tag(uid, "match", partnerMeta.get(uid)?.username)

  if (prefs?.edges?.length) {
    for (const e of prefs.edges) {
      const other = e.source_id === viewerId ? e.target_id : e.target_id === viewerId ? e.source_id : null
      if (other && other !== viewerId) tag(other, `edge:${e.kind}`, undefined)
    }
  }

  const peers: SimilarPeer[] = []
  for (const [uid, meta] of candidates) {
    if (uid === viewerId) continue
    const shared = [...meta.bits]
    const similarity_score = Math.min(
      100,
      shared.includes("match") ? 96 : shared.length >= 3 ? 88 : shared.length * 28 + (followers.has(uid) && following.has(uid) ? 14 : 0)
    )
    peers.push({
      user_id: uid,
      username: meta.username || partnerMeta.get(uid)?.username,
      similarity_score,
      shared_signals: shared.slice(0, 12),
    })
  }

  peers.sort((a, b) => b.similarity_score - a.similarity_score)

  return {
    viewer_id: viewerId,
    generated_at: new Date().toISOString(),
    peers: peers.slice(0, 30),
  }
}
