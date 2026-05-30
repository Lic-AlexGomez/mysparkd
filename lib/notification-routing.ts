/**
 * Resuelve la ruta web al pulsar una notificación.
 */
import { profileHref } from "@/lib/profile-route"

export interface NotificationRouteInput {
  senderId?: string
  targetId?: string
  targetType?: string
  viewerUserId?: string | null
}

function profileRoute(id: string | undefined, viewerUserId?: string | null): string | null {
  const trimmed = id?.trim()
  if (!trimmed) return null
  return profileHref(trimmed, viewerUserId)
}

export function getNotificationPath(input: NotificationRouteInput): string {
  const type = String(input.targetType || "").toUpperCase()
  const targetId = input.targetId?.trim()
  const senderId = input.senderId?.trim()
  const viewerUserId = input.viewerUserId

  switch (type) {
    case "POST":
      if (targetId) return `/feed?post=${encodeURIComponent(targetId)}`
      break
    case "COMMENT":
    case "REPLY":
      if (targetId) return `/feed?comment=${encodeURIComponent(targetId)}`
      break
    case "LIKE":
    case "REACTION":
      if (targetId) return `/feed?post=${encodeURIComponent(targetId)}`
      if (senderId) return profileRoute(senderId, viewerUserId) ?? "/feed"
      break
    case "USER":
      if (targetId) return profileRoute(targetId, viewerUserId) ?? "/feed"
      if (senderId) return profileRoute(senderId, viewerUserId) ?? "/feed"
      break
    case "FOLLOW":
      if (senderId) return profileRoute(senderId, viewerUserId) ?? "/feed"
      if (targetId) return profileRoute(targetId, viewerUserId) ?? "/feed"
      break
    case "MESSAGE":
    case "CHAT":
      if (targetId) return `/chat/${encodeURIComponent(targetId)}`
      break
    case "EVENT":
    case "MEETUP":
      if (targetId) return `/events/${encodeURIComponent(targetId)}`
      break
    case "GROUP":
      if (targetId) return `/groups/${encodeURIComponent(targetId)}`
      break
    case "MATCH":
      return "/matches"
    default:
      break
  }

  if (targetId && !type) return `/feed?post=${encodeURIComponent(targetId)}`
  if (senderId) return profileRoute(senderId, viewerUserId) ?? "/feed"
  return "/feed"
}
