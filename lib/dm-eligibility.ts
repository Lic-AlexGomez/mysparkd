/**
 * Permisos de DM y perfil por contexto (Social vs Dating).
 * Ver docs/CONTACT_PERMISSIONS.md y plan aislamiento_social_dating.
 */

import { api } from "./api"
import {
  evaluateCanMessage,
  type ContactBlockReason,
  type ContactPermissionInput,
  type DatingExposureRecord,
  type DatingExposureStatus,
} from "./contact-permissions"
import type { UserProfile } from "./types"

export type SparkdViewerContext = "SOCIAL" | "DATING"

export const SPARKD_CONTEXT_HEADER = "X-Sparkd-Context"

export type EligibilityReason =
  | "OK"
  | "DATING_MATCH_REQUIRED"
  | "SOCIAL_MUTUAL_FOLLOW_REQUIRED"
  | "DATING_EXPOSURE_NO_MATCH"
  | "PRIVATE_MUST_FOLLOW"
  | "BLOCKED"
  | "PREMIUM_REQUIRED"
  | "NOT_FOUND"
  | "UNKNOWN"

export type RelationshipSnapshot = {
  match: boolean
  mutualFollow: boolean
  following: boolean
  followedBy: boolean
  blocked?: boolean
  /** Viewer vio al target en dating (solo fallback local; backend es autoridad). */
  datingExposure?: DatingExposureRecord | null
  senderFollowCreatedAt?: string | null
  receiverFollowCreatedAt?: string | null
  receiverWhoCanSendDM?: ContactPermissionInput["receiverWhoCanSendDM"]
  hideFromSocialSearch?: boolean
}

export type EligibilityResult = {
  canViewProfile: boolean
  canOpenDm: boolean
  canFollow?: boolean
  reason: EligibilityReason
  relationship: RelationshipSnapshot
  /** Backend: ocultar en búsqueda social */
  hideFromSocialSearch?: boolean
  datingSearchRestricted?: boolean
}

export type OpenChatOptions = {
  context: SparkdViewerContext
}

export type ProfileFetchOptions = {
  context: SparkdViewerContext
}

/** Rutas web → contexto del visor */
const DATING_PATH_PREFIXES = ["/swipes", "/matches", "/pulse"]
const SOCIAL_PATH_PREFIXES = [
  "/feed",
  "/search",
  "/groups",
  "/events",
  "/chat",
  "/profile",
  "/tonight",
  "/mutual-plans",
]

export function getViewerContext(pathname: string, searchParams?: URLSearchParams): SparkdViewerContext {
  const fromQuery = searchParams?.get("context")
  if (fromQuery === "DATING" || fromQuery === "SOCIAL") return fromQuery

  const p = pathname.split("?")[0]
  if (DATING_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
    return "DATING"
  }
  if (p.startsWith("/profile/") && searchParams?.get("from") === "dating") {
    return "DATING"
  }
  return "SOCIAL"
}

export function contextHeaders(context: SparkdViewerContext): Record<string, string> {
  return { [SPARKD_CONTEXT_HEADER]: context }
}

export function contextQuery(context: SparkdViewerContext): string {
  return `context=${encodeURIComponent(context)}`
}

export function canShowMessageButton(eligibility: EligibilityResult | null | undefined): boolean {
  return !!eligibility?.canOpenDm
}

export function getProfilePath(
  targetUserId: string,
  context: SparkdViewerContext,
  extra?: { compatibility?: string }
): string {
  const qs = new URLSearchParams()
  if (context === "DATING") {
    qs.set("context", "DATING")
    qs.set("from", "dating")
  }
  if (extra?.compatibility) qs.set("compatibility", extra.compatibility)
  const q = qs.toString()
  return `/profile/${encodeURIComponent(targetUserId)}${q ? `?${q}` : ""}`
}

/** Perfil dating: ocultar identificadores buscables (defensa si API viejo devuelve todo). */
export function redactProfileForDatingContext(
  profile: UserProfile,
  context: SparkdViewerContext
): UserProfile {
  if (context !== "DATING") return profile
  const firstName = (profile.nombres ?? "").trim().split(/\s+/)[0] || profile.nombres
  return {
    ...profile,
    nombres: firstName,
    apellidos: "",
    username: undefined,
    posts: [],
    totalPosts: 0,
    followersCount: undefined,
    followingCount: undefined,
    email: undefined,
    website: undefined,
    url: undefined,
  }
}

export function getDatingDisplayName(nombres?: string | null, fallback = "Usuario"): string {
  const first = (nombres ?? "").trim().split(/\s+/)[0]
  return first || fallback
}

export function eligibilityMessageKey(reason: EligibilityReason): string | undefined {
  switch (reason) {
    case "DATING_MATCH_REQUIRED":
      return "dm.datingMatchRequired"
    case "SOCIAL_MUTUAL_FOLLOW_REQUIRED":
      return "dm.socialMutualFollowRequired"
    case "DATING_EXPOSURE_NO_MATCH":
      return "contact.datingExposureNoMatch"
    case "PRIVATE_MUST_FOLLOW":
      return "contact.privateMustFollow"
    case "BLOCKED":
      return "contact.blocked"
    case "PREMIUM_REQUIRED":
      return "dm.premiumRequired"
    default:
      return undefined
  }
}

type ContactContextApi = {
  hasActiveMatch?: boolean
  isBlocked?: boolean
  senderFollowsReceiver?: boolean
  receiverFollowsSender?: boolean
  senderFollowCreatedAt?: string | null
  receiverFollowCreatedAt?: string | null
  datingExposure?: {
    firstSeenAt: string
    source: DatingExposureRecord["source"]
    status: string
  } | null
  receiverWhoCanSendDM?: ContactPermissionInput["receiverWhoCanSendDM"]
  hideFromSocialSearch?: boolean
}

function mapContactReasonToEligibility(reason: ContactBlockReason): EligibilityReason {
  switch (reason) {
    case "dating_match":
    case "mutual_follow":
    case "social_before_dating":
    case "follower_dm_allowed":
    case "everyone":
    case "allowed":
      return "OK"
    case "dating_exposure_no_match":
      return "DATING_EXPOSURE_NO_MATCH"
    case "private_must_follow":
      return "PRIVATE_MUST_FOLLOW"
    case "blocked":
      return "BLOCKED"
    case "privacy":
    case "no_relation":
      return "SOCIAL_MUTUAL_FOLLOW_REQUIRED"
    default:
      return "UNKNOWN"
  }
}

function snapshotToContactInput(
  targetUserId: string,
  rel: RelationshipSnapshot,
  opts?: { receiverPrivateAndNotFollowing?: boolean }
): ContactPermissionInput {
  return {
    senderId: "",
    receiverId: targetUserId,
    hasActiveMatch: rel.match,
    isBlocked: !!rel.blocked,
    senderFollowsReceiver: rel.following,
    receiverFollowsSender: rel.followedBy,
    senderFollowCreatedAt: rel.senderFollowCreatedAt,
    receiverFollowCreatedAt: rel.receiverFollowCreatedAt,
    datingExposureAB: rel.datingExposure,
    receiverWhoCanSendDM: rel.receiverWhoCanSendDM,
    receiverPrivateAndNotFollowing: opts?.receiverPrivateAndNotFollowing,
  }
}

/** DM según regla madre (independiente del context UI; el servidor no confía en context del cliente). */
function evaluateDmEligibility(
  targetUserId: string,
  rel: RelationshipSnapshot,
  opts?: { receiverPrivateAndNotFollowing?: boolean }
): Pick<EligibilityResult, "canOpenDm" | "reason" | "canFollow"> {
  const perm = evaluateCanMessage(snapshotToContactInput(targetUserId, rel, opts))
  const canFollow =
    !rel.blocked && !opts?.receiverPrivateAndNotFollowing && !rel.following

  return {
    canOpenDm: perm.allowed,
    reason: mapContactReasonToEligibility(perm.reason),
    canFollow,
  }
}

/** Política de superficie (DATING vs SOCIAL) encima del permiso real de DM. */
function evaluateLocal(
  context: SparkdViewerContext,
  targetUserId: string,
  rel: RelationshipSnapshot,
  opts?: { receiverPrivateAndNotFollowing?: boolean }
): EligibilityResult {
  const dm = evaluateDmEligibility(targetUserId, rel, opts)

  if (rel.blocked) {
    return {
      canViewProfile: false,
      canOpenDm: false,
      reason: "BLOCKED",
      relationship: rel,
      hideFromSocialSearch: rel.hideFromSocialSearch,
    }
  }

  if (context === "DATING") {
    const ok = rel.match
    return {
      canViewProfile: ok,
      canOpenDm: dm.canOpenDm,
      canFollow: false,
      reason: dm.canOpenDm || ok ? dm.reason : "DATING_MATCH_REQUIRED",
      relationship: rel,
      hideFromSocialSearch: rel.hideFromSocialSearch,
    }
  }

  return {
    canViewProfile: true,
    canOpenDm: dm.canOpenDm,
    canFollow: dm.canFollow,
    reason: dm.reason,
    relationship: rel,
    hideFromSocialSearch: rel.hideFromSocialSearch,
  }
}

async function fetchContactContext(targetUserId: string): Promise<ContactContextApi | null> {
  try {
    return await api.get<ContactContextApi>(
      `/api/contact-permissions/context/${encodeURIComponent(targetUserId)}`
    )
  } catch {
    return null
  }
}

function mergeContextIntoSnapshot(
  rel: RelationshipSnapshot,
  targetUserId: string,
  ctx: ContactContextApi
): RelationshipSnapshot {
  const exp = ctx.datingExposure
  const datingExposure: DatingExposureRecord | null | undefined = exp
    ? {
        viewerUserId: "",
        viewedUserId: targetUserId,
        firstSeenAt: exp.firstSeenAt,
        source: exp.source,
        status: (exp.status as DatingExposureStatus) || "exposed",
      }
    : rel.datingExposure

  return {
    match: ctx.hasActiveMatch ?? rel.match,
    mutualFollow:
      ctx.senderFollowsReceiver != null && ctx.receiverFollowsSender != null
        ? !!ctx.senderFollowsReceiver && !!ctx.receiverFollowsSender
        : rel.mutualFollow,
    following: ctx.senderFollowsReceiver ?? rel.following,
    followedBy: ctx.receiverFollowsSender ?? rel.followedBy,
    blocked: ctx.isBlocked ?? rel.blocked,
    datingExposure,
    senderFollowCreatedAt: ctx.senderFollowCreatedAt ?? rel.senderFollowCreatedAt,
    receiverFollowCreatedAt: ctx.receiverFollowCreatedAt ?? rel.receiverFollowCreatedAt,
    receiverWhoCanSendDM: ctx.receiverWhoCanSendDM ?? rel.receiverWhoCanSendDM,
    hideFromSocialSearch: ctx.hideFromSocialSearch ?? rel.hideFromSocialSearch,
  }
}

async function fetchRelationshipSnapshot(targetUserId: string): Promise<RelationshipSnapshot> {
  const [followStatus, matches] = await Promise.all([
    api
      .get<{ following: boolean; followedBy: boolean }>(`/api/follow/status/${targetUserId}`)
      .catch(() => ({ following: false, followedBy: false })),
    api.get<unknown>("/api/matches/my/matches").catch(() => []),
  ])

  const matchRows = Array.isArray(matches) ? matches : []
  const isMatch = matchRows.some((m: { userId?: string; matchedUserId?: string; id?: string }) => {
    const id = m.userId ?? m.matchedUserId ?? m.id
    return String(id) === String(targetUserId)
  })

  return {
    match: isMatch,
    mutualFollow: !!followStatus.following && !!followStatus.followedBy,
    following: !!followStatus.following,
    followedBy: !!followStatus.followedBy,
  }
}

/** Preflight: backend eligibility o cálculo local. */
export async function fetchEligibility(
  targetUserId: string,
  context: SparkdViewerContext,
  opts?: { receiverPrivateAndNotFollowing?: boolean }
): Promise<EligibilityResult> {
  try {
    const data = await api.get<EligibilityResult>(
      `/api/relationships/eligibility?targetUserId=${encodeURIComponent(targetUserId)}&${contextQuery(context)}`,
      { headers: contextHeaders(context) }
    )
    if (typeof data?.canOpenDm === "boolean") return data
  } catch {
    // fallback
  }

  try {
    const alt = await api.get<{
      allowed: boolean
      reason: string
      hideFromSocialSearch?: boolean
    }>(`/api/contact-permissions/can-message/${encodeURIComponent(targetUserId)}`)
    const rel = await fetchRelationshipSnapshot(targetUserId)
    if (typeof alt?.allowed === "boolean") {
      return {
        canViewProfile: true,
        canOpenDm: alt.allowed,
        reason: alt.allowed ? "OK" : "DATING_EXPOSURE_NO_MATCH",
        relationship: rel,
        hideFromSocialSearch: alt.hideFromSocialSearch,
      }
    }
  } catch {
    // continue local
  }

  const [rel, contactCtx] = await Promise.all([
    fetchRelationshipSnapshot(targetUserId),
    fetchContactContext(targetUserId),
  ])
  const merged = contactCtx ? mergeContextIntoSnapshot(rel, targetUserId, contactCtx) : rel
  return evaluateLocal(context, targetUserId, merged, opts?.receiverPrivateAndNotFollowing)
}

export class DmEligibilityBlockedError extends Error {
  readonly eligibility: EligibilityResult

  constructor(eligibility: EligibilityResult) {
    super(eligibility.reason)
    this.name = "DmEligibilityBlockedError"
    this.eligibility = eligibility
  }
}

/** Preflight UI antes de abrir chat (el backend sigue siendo autoridad). */
export async function ensureCanOpenDm(
  targetUserId: string,
  context: SparkdViewerContext,
  opts?: { receiverPrivateAndNotFollowing?: boolean }
): Promise<EligibilityResult> {
  const eligibility = await fetchEligibility(targetUserId, context, opts)
  if (!canShowMessageButton(eligibility)) {
    throw new DmEligibilityBlockedError(eligibility)
  }
  return eligibility
}

export async function recordDatingExposure(
  viewedUserId: string,
  source: "dating_feed" | "dating_likes" | "dating_match" | "dating_profile" = "dating_feed"
): Promise<void> {
  try {
    await api.post<void>("/api/dating/exposure", { viewedUserId, source })
  } catch {
    // Backend puede no existir aún
  }
}

export function isDatingOnlySearchMode(
  experienceMode: string,
  context?: SparkdViewerContext
): boolean {
  return experienceMode === "DATING" || context === "DATING"
}
