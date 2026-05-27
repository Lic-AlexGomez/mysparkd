/**
 * Resuelve la ruta web al pulsar una notificación.
 */
export interface NotificationRouteInput {
  senderId?: string
  targetId?: string
  targetType?: string
}

export function getNotificationPath(input: NotificationRouteInput): string {
  const type = String(input.targetType || "").toUpperCase()
  const targetId = input.targetId?.trim()
  const senderId = input.senderId?.trim()

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
      if (senderId) return `/profile/${encodeURIComponent(senderId)}`
      break
    case "USER":
      if (targetId) return `/profile/${encodeURIComponent(targetId)}`
      if (senderId) return `/profile/${encodeURIComponent(senderId)}`
      break
    case "FOLLOW":
      if (senderId) return `/profile/${encodeURIComponent(senderId)}`
      if (targetId) return `/profile/${encodeURIComponent(targetId)}`
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
  if (senderId) return `/profile/${encodeURIComponent(senderId)}`
  return "/feed"
}
