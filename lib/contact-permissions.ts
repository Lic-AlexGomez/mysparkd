/**
 * Reglas de contacto Social vs Dating (evaluación pura).
 * Debe coincidir con ContactPermissionService en el backend.
 * El context SOCIAL/DATING del cliente no es confiable; esta función no lo usa.
 */

export type DatingExposureSource =
  | "dating_feed"
  | "dating_likes"
  | "dating_match"
  | "dating_profile"

export type DatingExposureStatus =
  | "exposed"
  | "swiped_left"
  | "swiped_right"
  | "matched"
  | "expired"

export type ContactBlockReason =
  | "allowed"
  | "dating_match"
  | "mutual_follow"
  | "social_before_dating"
  | "follower_dm_allowed"
  | "everyone"
  | "dating_exposure_no_match"
  | "privacy"
  | "no_relation"
  | "blocked"
  | "private_must_follow"

export type DatingExposureRecord = {
  viewerUserId: string
  viewedUserId: string
  firstSeenAt: string
  source: DatingExposureSource
  status: DatingExposureStatus
}

export type FollowEdge = {
  followerId: string
  followedId: string
  createdAt: string
}

export type ContactPermissionInput = {
  senderId: string
  receiverId: string
  /** Match activo entre ambos (dating). */
  hasActiveMatch: boolean
  /** Bloqueo en cualquier dirección. */
  isBlocked: boolean
  /** A sigue a B. */
  senderFollowsReceiver: boolean
  /** B sigue a A. */
  receiverFollowsSender: boolean
  /** Momento en que A siguió a B (ISO), si existe. */
  senderFollowCreatedAt?: string | null
  /** Momento en que B siguió a A (ISO), si existe. */
  receiverFollowCreatedAt?: string | null
  /** A vio a B en dating (primera exposición). */
  datingExposureAB?: DatingExposureRecord | null
  /** Privacidad DM del receptor. */
  receiverWhoCanSendDM?: "EVERYONE" | "FOLLOWERS" | "MATCHES"
  /** Perfil receptor privado y A no sigue a B. */
  receiverPrivateAndNotFollowing?: boolean
}

export type ContactPermissionResult = {
  allowed: boolean
  reason: ContactBlockReason
  /** Mensaje UX (clave i18n o texto). */
  messageKey?: string
}

function mutualFollow(input: ContactPermissionInput): boolean {
  return input.senderFollowsReceiver && input.receiverFollowsSender
}

/** Follow mutuo existía antes de que A viera a B en dating. */
function socialRelationBeforeDatingExposure(input: ContactPermissionInput): boolean {
  const exp = input.datingExposureAB
  if (!exp || !mutualFollow(input)) return false
  const firstSeen = new Date(exp.firstSeenAt).getTime()
  if (Number.isNaN(firstSeen)) return false

  const aFollowsB = input.senderFollowCreatedAt
    ? new Date(input.senderFollowCreatedAt).getTime() < firstSeen
    : false
  const bFollowsA = input.receiverFollowCreatedAt
    ? new Date(input.receiverFollowCreatedAt).getTime() < firstSeen
    : false

  return aFollowsB && bFollowsA
}

/**
 * Regla madre + social/dating — misma lógica que docs/CONTACT_PERMISSIONS.md
 */
export function evaluateCanMessage(input: ContactPermissionInput): ContactPermissionResult {
  if (input.isBlocked) {
    return { allowed: false, reason: "blocked", messageKey: "contact.blocked" }
  }

  if (input.receiverPrivateAndNotFollowing) {
    return {
      allowed: false,
      reason: "private_must_follow",
      messageKey: "contact.privateMustFollow",
    }
  }

  if (input.hasActiveMatch) {
    return { allowed: true, reason: "dating_match" }
  }

  const exposure = input.datingExposureAB
  if (exposure && exposure.status !== "matched") {
    if (socialRelationBeforeDatingExposure(input)) {
      return { allowed: true, reason: "social_before_dating" }
    }
    return {
      allowed: false,
      reason: "dating_exposure_no_match",
      messageKey: "contact.datingExposureNoMatch",
    }
  }

  if (mutualFollow(input)) {
    return { allowed: true, reason: "mutual_follow" }
  }

  const dm = input.receiverWhoCanSendDM ?? "EVERYONE"
  if (dm === "MATCHES") {
    return {
      allowed: false,
      reason: "privacy",
      messageKey: "contact.matchesOnly",
    }
  }
  if (dm === "FOLLOWERS" && input.senderFollowsReceiver) {
    return { allowed: true, reason: "follower_dm_allowed" }
  }
  if (dm === "EVERYONE") {
    return { allowed: true, reason: "everyone" }
  }

  return {
    allowed: false,
    reason: "no_relation",
    messageKey: "contact.noRelation",
  }
}

/** Nombre visible en surfaces Dating (sin apellido ni @username). */
export function getDatingDisplayName(nombres?: string | null, fallback = "Usuario"): string {
  const first = (nombres ?? "").trim().split(/\s+/)[0]
  return first || fallback
}

/** ¿Debe ocultarse en búsqueda social? (política estricta). */
export function shouldHideFromSocialSearch(
  viewerId: string,
  candidateId: string,
  exposure: DatingExposureRecord | null | undefined,
  hasActiveMatch: boolean
): boolean {
  if (!exposure || exposure.viewerUserId !== viewerId || exposure.viewedUserId !== candidateId) {
    return false
  }
  return !hasActiveMatch && exposure.status !== "matched"
}
