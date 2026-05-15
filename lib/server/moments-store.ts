import { randomUUID } from "crypto"
import type {
  CreateMomentRequest,
  MomentType,
  MomentUser,
  SparkdMoment,
} from "@/lib/types/moments"
import { affinityBoostFromMoments, connectionScoreForUser, deltaForMomentType } from "@/lib/moments-scoring"

const VALID_MOMENT_TYPES: MomentType[] = [
  "JOIN_MEETUP",
  "FAST_DATE_MATCH",
  "GROUP_PLAN_JOINED",
  "EVENT_ATTENDANCE",
]

const MAX_STORE = 2500

type GlobalMoments = { list: SparkdMoment[] }
const g = globalThis as unknown as { __sparkd_moments_store__?: GlobalMoments }

function store(): SparkdMoment[] {
  if (!g.__sparkd_moments_store__) g.__sparkd_moments_store__ = { list: [] }
  return g.__sparkd_moments_store__.list
}

function trimStore(list: SparkdMoment[]) {
  while (list.length > MAX_STORE) list.shift()
}

function buildHeadline(type: MomentType, users: MomentUser[], body: CreateMomentRequest): string {
  if (body.headline?.trim()) return body.headline.trim()
  const a = users[0]?.username || users[0]?.userId?.slice(0, 8) || "Someone"
  const b = users[1]?.username || users[1]?.userId?.slice(0, 8)
  switch (type) {
    case "JOIN_MEETUP":
      return `${a} joined a meetup`
    case "FAST_DATE_MATCH":
      return b ? `${a} matched with ${b} on Fast Date` : `${a} matched on Fast Date`
    case "GROUP_PLAN_JOINED":
      return `${a} joined a group plan`
    case "EVENT_ATTENDANCE":
      return `${a} is attending an event`
    default:
      return "Sparkd moment"
  }
}

function sharePath(m: SparkdMoment): string {
  return `/feed?moment=${encodeURIComponent(m.id)}`
}

export function createMoment(actorUserId: string, body: CreateMomentRequest): SparkdMoment {
  const type = body.moment_type as MomentType
  if (!type || !VALID_MOMENT_TYPES.includes(type)) {
    throw new Error("Invalid moment_type")
  }

  let merged: MomentUser[] = []
  if (type === "EVENT_ATTENDANCE" && body.users_involved?.[0]?.userId) {
    for (const u of body.users_involved) {
      if (!u?.userId) continue
      merged.push({
        userId: String(u.userId),
        username: u.username,
        profilePictureUrl: u.profilePictureUrl,
      })
    }
  } else {
    const primary: MomentUser = { userId: actorUserId }
    merged = [primary]
    for (const u of body.users_involved || []) {
      if (!u?.userId) continue
      if (String(u.userId) === actorUserId) {
        merged[0] = { ...merged[0], ...u, userId: actorUserId }
      } else {
        merged.push({ userId: String(u.userId), username: u.username, profilePictureUrl: u.profilePictureUrl })
      }
    }
  }
  if (merged.length === 0) {
    merged = [{ userId: actorUserId }]
  }

  const delta = deltaForMomentType(type)
  const headline = buildHeadline(type, merged, body)
  const m: SparkdMoment = {
    id: `mom_${randomUUID()}`,
    moment_type: type,
    users_involved: merged,
    event_id: body.event_id ?? undefined,
    group_id: body.group_id ?? undefined,
    metadata: body.metadata ?? undefined,
    timestamp: new Date().toISOString(),
    location: body.location ?? undefined,
    headline,
    connection_score_delta: delta,
    share_path: "",
  }
  m.share_path = sharePath(m)

  const list = store()
  list.push(m)
  trimStore(list)
  return m
}

export function listMomentsForUser(userId: string): SparkdMoment[] {
  const uid = String(userId || "").trim()
  if (!uid) return []
  return store()
    .filter((m) => (m.users_involved || []).some((u) => String(u.userId) === uid))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function listTrendingMoments(limit: number): SparkdMoment[] {
  const list = [...store()]
  const now = Date.now()
  list.sort((a, b) => {
    const score =
      (m: SparkdMoment) =>
        (m.connection_score_delta || 0) *
        Math.exp(-(now - new Date(m.timestamp).getTime()) / (4 * 60 * 60 * 1000))
    return score(b) - score(a)
  })
  return list.slice(0, Math.max(1, Math.min(50, limit)))
}

export function getRecommendationHint(userId: string): {
  connection_score: number
  affinity_boost: number
  moment_count_30d: number
} {
  const mine = listMomentsForUser(userId)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recent = mine.filter((m) => new Date(m.timestamp).getTime() >= cutoff)
  return {
    connection_score: connectionScoreForUser(userId, mine),
    affinity_boost: affinityBoostFromMoments(mine),
    moment_count_30d: recent.length,
  }
}
