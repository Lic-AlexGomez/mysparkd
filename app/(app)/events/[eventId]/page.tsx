"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { recordEventAttendance } from "@/lib/services/moments"
import { deriveEventChatPhase, preEventChatService } from "@/lib/services/pre-event-chat"
import { followService } from "@/lib/services/follow"
import { ApiError, api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"

const MAX_VIDEO_DURATION_SECONDS = 180
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LocationInput } from "@/components/ui/location-input"
import { AddressMapPicker } from "@/components/ui/address-map-picker"
import { Label } from "@/components/ui/label"
import { useLocalizedCountryCode } from "@/hooks/use-localized-country-code"
import { FORM_CONTROL_INPUT, FORM_CONTROL_TEXTAREA, FORM_LABEL } from "@/lib/form-field-classes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  Copy,
  Inbox,
  QrCode,
  Share2,
  Loader2,
  MapPin,
  MessageCircle,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  Reply,
  Send,
  Settings,
  Shield,
  Smile,
  Star,
  Trash2,
  CheckCircle2,
  Clock,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from "lucide-react"
import type {
  EventCapacityUpdate,
  EventGroupJoinRequest,
  EventGroupMember,
  EventGroupMessage,
  EventGroupReaction,
  EventParticipant,
  EventPoll,
  EventPollOption,
  ReactionType,
  UserProfile,
} from "@/lib/types"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { EventMutualPlansInline } from "@/components/mutual-plans/event-mutual-inline"
import { PreEventChatHub } from "@/components/events/pre-event-chat-hub"
import { JoinMeetupDialog } from "@/components/events/join-meetup-dialog"
import type { JoinEligibleUser } from "@/components/events/join-meetup-dialog"
import QRCode from "qrcode"

const normalizeMessageId = (raw: any) => String(raw?.id || raw?.messageId || "")

function buildEventInviteUrl(origin: string, token: string) {
  if (!origin || !token) return ""
  return `${origin}/events?token=${encodeURIComponent(token)}`
}

/** Usuarios invitables: matches + seguidores mutuos (mismo criterio que el backend 403). */
type GroupInviteEligibleUser = {
  userId: string
  username: string
  fullName?: string
  photo?: string
}

function firstNonEmptyString(...vals: unknown[]): string {
  for (const v of vals) {
    const s = typeof v === "string" ? v.trim() : String(v ?? "").trim()
    if (s) return s
  }
  return ""
}

/** Une campos si el backend devuelve `user` / `follower` / `profile` anidados. */
function unwrapSocialRow(raw: Record<string, unknown>): Record<string, unknown> {
  const nested =
    raw.user || raw.follower || raw.following || raw.profile || raw.account
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...raw, ...(nested as Record<string, unknown>) }
  }
  return raw
}

/**
 * ID de cuenta del usuario — nunca usar `raw.id` (suele ser PK del follow/match).
 */
function resolveEligibleUserId(
  rawIn: Record<string, unknown>,
  kind: "match" | "followers" | "following"
): string | null {
  const raw = unwrapSocialRow(rawIn)
  const direct = firstNonEmptyString(raw.userId, raw.memberId, raw.profileId)
  if (direct) return direct

  if (kind === "match") {
    const alt = firstNonEmptyString(
      raw.matchedUserId,
      raw.otherUserId,
      raw.targetUserId,
      raw.counterpartUserId
    )
    if (alt) return alt
  }
  if (kind === "followers") {
    const id = firstNonEmptyString(raw.followerId)
    if (id) return id
  } else if (kind === "following") {
    const id = firstNonEmptyString(raw.followingId)
    if (id) return id
  }

  const looksLikeRelationshipRow =
    Boolean(raw.followerId) ||
    Boolean(raw.followingId) ||
    Boolean(raw.matchedUserId) ||
    Boolean(raw.otherUserId)
  const looksLikeFlatUser =
    Boolean(raw.username || raw.nombres) && !looksLikeRelationshipRow
  const pk = String(raw.id ?? "").trim()
  if (!pk || !looksLikeFlatUser) return null

  if (kind === "match") return pk

  /** Lista social plana tipo UserDTO (`id` = usuario), sin IDs de relación */
  if (
    (kind === "followers" || kind === "following") &&
    !raw.followerId &&
    !raw.followingId
  ) {
    return pk
  }

  return null
}

function mergeEligibleInviteUsers(
  myUserId: string,
  memberIds: Set<string>,
  matches: unknown[],
  followers: unknown[],
  following: unknown[]
): GroupInviteEligibleUser[] {
  const map = new Map<string, GroupInviteEligibleUser>()
  const add = (row: GroupInviteEligibleUser | null) => {
    if (!row || row.userId === myUserId || memberIds.has(row.userId)) return
    const prev = map.get(row.userId)
    if (!prev) {
      map.set(row.userId, row)
      return
    }
    map.set(row.userId, {
      userId: row.userId,
      username: row.username.length >= prev.username.length ? row.username : prev.username,
      fullName: prev.fullName || row.fullName,
      photo: prev.photo || row.photo,
    })
  }

  for (const m of matches || []) {
    const raw = unwrapSocialRow(m as Record<string, unknown>)
    const userId = resolveEligibleUserId(raw, "match")
    if (!userId) continue
    const fullName =
      [raw.nombre, raw.apellidos].filter(Boolean).join(" ").trim() || undefined
    const username = String(raw.username || "").trim()
    const fallback = fullName
      ? fullName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .toLowerCase()
          .slice(0, 24) || `user-${userId.slice(0, 6)}`
      : `user-${userId.slice(0, 6)}`
    add({
      userId,
      username: username || fallback,
      fullName,
      photo: (raw.photoUrl as string | undefined) || undefined,
    })
  }

  const normFollow = (
    u: unknown,
    kind: "followers" | "following"
  ): GroupInviteEligibleUser | null => {
    const raw = unwrapSocialRow(u as Record<string, unknown>)
    const userId = resolveEligibleUserId(raw, kind)
    if (!userId) return null
    const username = String(raw.username || "").trim()
    const fullName =
      [raw.nombres, raw.apellidos].filter(Boolean).join(" ").trim() || undefined
    return {
      userId,
      username: username || fullName?.split(/\s+/)[0] || `user-${userId.slice(0, 6)}`,
      fullName,
      photo:
        (raw.profilePictureUrl as string | undefined) ||
        (raw.photoUrl as string | undefined) ||
        undefined,
    }
  }

  /**
   * El backend (403) valida contra matches + seguidores **mutuos**, no contra seguidos o seguidores sueltos.
   * Lista: todos los matches + intersección (quien me sigue ∩ a quien sigo).
   */
  const followerById = new Map<string, GroupInviteEligibleUser>()
  for (const u of followers || []) {
    const row = normFollow(u, "followers")
    if (row) followerById.set(row.userId, row)
  }
  const followingById = new Map<string, GroupInviteEligibleUser>()
  for (const u of following || []) {
    const row = normFollow(u, "following")
    if (row) followingById.set(row.userId, row)
  }
  for (const id of followerById.keys()) {
    if (!followingById.has(id)) continue
    const a = followerById.get(id)!
    const b = followingById.get(id)!
    add({
      userId: id,
      username: a.username.length >= b.username.length ? a.username : b.username,
      fullName: a.fullName || b.fullName,
      photo: a.photo || b.photo,
    })
  }

  return Array.from(map.values()).sort((a, b) =>
    a.username.localeCompare(b.username, undefined, { sensitivity: "base" })
  )
}

/**
 * El POST de solicitud grupal debe usar el `userId` canónico del perfil.
 * Así evitamos mandar IDs mal interpretados desde JSON de matches/follows.
 */
async function resolveInviteeIdsViaProfile(
  rows: GroupInviteEligibleUser[],
  te: (es: string, en: string) => string
): Promise<string[]> {
  const ids = await Promise.all(
    rows.map(async (row) => {
      let p: UserProfile | (UserProfile & { id?: string })
      try {
        p = await api.get<UserProfile & { id?: string }>(
          `/api/profile/${encodeURIComponent(row.userId)}`
        )
      } catch (err: unknown) {
        const hint =
          err instanceof ApiError ? err.message : te("Error de red", "Network error")
        throw new Error(
          te(
            `No se pudo validar al invitado @${row.username}. ${hint}`,
            `Could not validate invitee @${row.username}. ${hint}`
          )
        )
      }
      const canonical = String(p?.userId ?? (p as { id?: string }).id ?? "").trim()
      if (!canonical) {
        throw new Error(
          te(
            "El servidor devolvió un perfil sin identificador de usuario.",
            "Server returned a profile without a user identifier."
          )
        )
      }

      const apiUsername = String(p?.username ?? "").trim().toLowerCase()
      const labelUsername = String(row.username ?? "").trim().toLowerCase()
      const labelLooksSynthetic = /^user-[a-f0-9-]{4,}$/i.test(String(row.username))

      const apiFull = [p?.nombres, p?.apellidos].filter(Boolean).join(" ").trim().toLowerCase()
      const labelFull = String(row.fullName ?? "").trim().toLowerCase()
      const namesAlign =
        Boolean(apiFull && labelFull) &&
        (apiFull === labelFull ||
          apiFull.startsWith(labelFull.split(/\s+/)[0] ?? "") ||
          labelFull.startsWith(apiFull.split(/\s+/)[0] ?? ""))

      const usernameAlign =
        !apiUsername ||
        !labelUsername ||
        apiUsername === labelUsername ||
        labelLooksSynthetic

      if (!usernameAlign && !namesAlign) {
        throw new Error(
          te(
            "El ID del invitado no coincide con la persona mostrada. Quitar ese nombre y volver a añadirlo desde la lista.",
            "Invitee ID does not match the person shown. Remove them and add again from the list."
          )
        )
      }

      return canonical
    })
  )

  return [...new Set(ids)]
}

const EVENT_TAB_TRIGGER =
  "rounded-xl px-2 py-2.5 text-xs font-semibold shadow-none transition-all data-[state=active]:border data-[state=active]:border-primary/35 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-3 sm:text-sm dark:data-[state=active]:bg-card"

const CHAT_SUB_TAB =
  "gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all data-[state=active]:border data-[state=active]:border-primary/30 data-[state=active]:bg-background data-[state=active]:shadow-sm sm:text-sm dark:data-[state=active]:bg-card"

/** Fotos Picsum por ID (estables). Se elige una según el evento — “random” entre eventos, fija en el mismo. */
const CHAT_BG_PICSUM_IDS = [
  10, 29, 42, 76, 103, 137, 152, 180, 201, 219, 237, 266, 289, 318, 433, 512, 575, 611,
]

function hashStringToIndex(s: string, modulo: number) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) % modulo
}

/** Actualiza la lista local como hace el toggle de likes en servidor (misma reacción = quitar). */
function mergeToggleEventGroupReaction(
  prev: EventGroupReaction[] | undefined,
  myUserId: string,
  myUsername: string,
  reactionType: ReactionType
): EventGroupReaction[] {
  const list = [...(prev || [])]
  const idx = list.findIndex((r) => String(r.userId) === String(myUserId))
  if (idx >= 0 && list[idx].reaction === reactionType) {
    list.splice(idx, 1)
    return list
  }
  if (idx >= 0) {
    list[idx] = { ...list[idx], reaction: reactionType }
    return list
  }
  list.push({
    userId: myUserId,
    username: myUsername,
    reaction: reactionType,
  })
  return list
}

/** API puede usar `text`, `votes`, `pollOptions`, etc. — unificamos a EventPollOption. */
function normalizeEventPollOption(raw: Record<string, unknown>): EventPollOption {
  const id = String(raw.id ?? raw.optionId ?? "")
  const optionText = String(
    raw.optionText ?? raw.text ?? raw.label ?? raw.option_label ?? ""
  )
  const vc = raw.voteCount ?? raw.votes ?? raw.vote_count
  const voteCount =
    typeof vc === "number" && Number.isFinite(vc) ? vc : Number(vc) || 0
  const votedByMe = Boolean(raw.votedByMe ?? raw.voted_by_me ?? raw.selected)
  return { id, optionText, voteCount, votedByMe }
}

function normalizeEventPoll(rawIn: unknown): EventPoll | null {
  if (!rawIn || typeof rawIn !== "object") return null
  const raw = rawIn as Record<string, unknown>
  const optsRaw =
    raw.options ?? raw.optionTexts ?? raw.pollOptions ?? raw.choices ?? []
  const arr = Array.isArray(optsRaw) ? optsRaw : []
  const options: EventPollOption[] = arr.map((o, i) => {
    if (typeof o === "string") {
      return {
        id: String(i),
        optionText: o,
        voteCount: 0,
        votedByMe: false,
      }
    }
    return o && typeof o === "object"
      ? normalizeEventPollOption(o as Record<string, unknown>)
      : { id: "", optionText: "", voteCount: 0, votedByMe: false }
  })
  return {
    id: String(raw.id ?? ""),
    groupId: String(raw.groupId ?? ""),
    question: String(raw.question ?? ""),
    expiresAt: (raw.expiresAt as string | null | undefined) ?? null,
    createdAt: String(raw.createdAt ?? ""),
    expired: Boolean(raw.expired),
    options,
  }
}

function withNormalizedPoll(m: EventGroupMessage): EventGroupMessage {
  if (!m.poll) return m
  const poll = normalizeEventPoll(m.poll)
  return poll ? { ...m, poll } : { ...m, poll: null }
}

/** System line posted when the event location is published; hidden in chat — same info is in the page header. */
function isRedundantLocationSystemMessage(m: EventGroupMessage): boolean {
  if (!m.system) return false
  const c = String(m.content || "").trim()
  if (!c || !/^📍/.test(c)) return false
  return /ubicaci[oó]n del evento/i.test(c) || /\bevent location\b/i.test(c)
}

export default function EventDetailPage() {
  const { te, t, language } = useI18n()
  const countryCode = useLocalizedCountryCode()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const eventId = String(params.eventId || "")
  const { subscribeToEventGroup, subscribeToEventCapacity } = useWebSocket(user?.userId, {})

  const [activeTab, setActiveTab] = useState("chat")
  /** Sub-pestañas dentro de Chat: mensajes vs crear encuesta (solo mod/admin). */
  const [chatSubTab, setChatSubTab] = useState<"chat-messages" | "chat-poll">("chat-messages")
  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState("")
  /** UX tipo chat 1:1: hover / tap para barra de acciones */
  const [activeEventMsgKey, setActiveEventMsgKey] = useState<string | null>(null)
  const [showEventReactionKey, setShowEventReactionKey] = useState<string | null>(null)
  const [copiedEventMsgKey, setCopiedEventMsgKey] = useState<string | null>(null)
  const [replyToEventMessage, setReplyToEventMessage] = useState<{
    messageId: string
    username: string
    snippet: string
  } | null>(null)
  const [eventData, setEventData] = useState<any>(null)
  const [messages, setMessages] = useState<EventGroupMessage[]>([])
  const [members, setMembers] = useState<EventGroupMember[]>([])
  const [pendingParticipants, setPendingParticipants] = useState<EventParticipant[]>([])
  const [pendingGroupRequests, setPendingGroupRequests] = useState<EventGroupJoinRequest[]>([])
  const [groupSettings, setGroupSettings] = useState<{ slowMode: boolean; adminOnlyMode: boolean }>({
    slowMode: false,
    adminOnlyMode: false,
  })
  const [capacity, setCapacity] = useState<EventCapacityUpdate | null>(null)
  const [inviteLinks, setInviteLinks] = useState<any[]>([])
  const [inviteQrById, setInviteQrById] = useState<Record<string, string>>({})
  const [inviteOrigin, setInviteOrigin] = useState("")
  const [inviteRole, setInviteRole] = useState<"GUEST" | "MODERATOR">("GUEST")
  const [inviteMaxUses, setInviteMaxUses] = useState("0")
  const [pollQuestion, setPollQuestion] = useState("")
  /** Una fila por opción; mínimo 2 campos (vacíos hasta que el usuario escriba). */
  const [pollOptionRows, setPollOptionRows] = useState<string[]>(["", ""])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [locationZone, setLocationZone] = useState("")
  const [locationExact, setLocationExact] = useState("")
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [inviteeQuery, setInviteeQuery] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [eligibleInviteesPool, setEligibleInviteesPool] = useState<GroupInviteEligibleUser[]>([])
  const [eligibleInviteesLoading, setEligibleInviteesLoading] = useState(false)
  const [isCreatingSoloJoin, setIsCreatingSoloJoin] = useState(false)
  const [isCreatingGroupInvite, setIsCreatingGroupInvite] = useState(false)
  const [messagePage, setMessagePage] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
  const [myPendingInvitation, setMyPendingInvitation] = useState<EventGroupJoinRequest | null>(null)
  const [isRespondingToInvitation, setIsRespondingToInvitation] = useState(false)
  const [selectedInvitees, setSelectedInvitees] = useState<GroupInviteEligibleUser[]>([])
  const myUserId = String(user?.userId || "")
  const myMember = members.find((m) => String(m.userId) === myUserId)
  const myRole = (myMember?.role || (eventData as any)?.myRole || "").toUpperCase()
  const creatorIdStr = String((eventData as any)?.creatorId ?? "").trim()
  /** Dueño del evento (creador); Ajustes del grupo solo para él — no basta con rol MOD/ADMIN. */
  const isEventOwner = Boolean(
    myUserId && creatorIdStr && creatorIdStr === String(myUserId).trim()
  )
  const isAdmin = myRole === "ADMIN" || creatorIdStr === myUserId || Boolean((eventData as any)?.isAdmin)

  const isModerator = myRole === "MODERATOR" || isAdmin
  const isGuest = myRole === "GUEST"
  const mutedUntil = myMember?.mutedUntil ? new Date(myMember.mutedUntil) : null
  const isMuted = Boolean(mutedUntil && mutedUntil.getTime() > Date.now())
  const canSend = !isMuted && (!groupSettings.adminOnlyMode || isAdmin) && (!groupSettings.slowMode || isAdmin || isModerator)
  const normalizeAddress = (value?: string | null) =>
    String(value || "").trim().toLowerCase().replace(/\s+/g, " ")

  const upsertMessage = (incoming: EventGroupMessage) => {
    const normalized = withNormalizedPoll(incoming)
    const incomingId = normalizeMessageId(normalized)
    setMessages((prev) => {
      if (!incomingId) return [...prev, normalized]
      const idx = prev.findIndex((m) => normalizeMessageId(m) === incomingId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = withNormalizedPoll({ ...next[idx], ...normalized, id: incomingId })
        return next
      }
      return [...prev, { ...normalized, id: incomingId }]
    })
  }

  const loadEvent = async () => {
    setIsLoading(true)
    try {
      const detail = await eventService.getById(eventId)

      let msgRows: EventGroupMessage[] = []
      let memberRows: EventGroupMember[] = []
      let groupCatalogMissing = false

      try {
        msgRows = await eventService.groupMessages.list(eventId, 0, 50)
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          groupCatalogMissing = true
        } else {
          console.warn("[events] group/messages", err)
        }
      }

      try {
        memberRows = await eventService.groupMembers.list(eventId)
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          groupCatalogMissing = true
        } else {
          console.warn("[events] group/members", err)
        }
      }

      if (groupCatalogMissing) {
        toast.message(
          te(
            "El servidor aún no expone el chat o los miembros del grupo de este evento (404). Puedes ver el evento; cuando existan los endpoints se cargarán solos.",
            "Group chat/members endpoints returned 404. Event details load; chat and member list stay empty until the backend adds these routes."
          ),
          { id: "event-group-endpoints-missing", duration: 7000 }
        )
      }

      setEventData(detail)
      void preEventChatService.ensureRoom(eventId)

      const normalizedMsgs = (Array.isArray(msgRows) ? msgRows : []).map((m) =>
        withNormalizedPoll({ ...m, id: normalizeMessageId(m) })
      )
      setMessages(normalizedMsgs)
      setMessagePage(0)
      setHasMoreMessages(normalizedMsgs.length === 50)

      const normalizedMembers = Array.isArray(memberRows) ? memberRows : []
      setMembers(normalizedMembers)

      const me = normalizedMembers.find((m) => String(m.userId) === myUserId)
      const isAdminLoaded = (me?.role || "").toUpperCase() === "ADMIN" ||
                            String((detail as any)?.creatorId) === myUserId ||
                            (detail as any)?.myRole === "ADMIN"

      setGroupSettings({
        slowMode: Boolean((detail as any)?.slowMode),
        adminOnlyMode: Boolean((detail as any)?.adminOnlyMode),
      })

      // Si no soy miembro, verifico si tengo invitaciones pendientes para este evento
      if (!isAdminLoaded && myUserId) {
        try {
          const pendingInvites = await eventService.groupJoinRequests.myPending()
          const mine = (Array.isArray(pendingInvites) ? pendingInvites : [])
            .find((r) => String(r.eventId) === String(eventId)) ?? null
          setMyPendingInvitation(mine)
        } catch {
          /* silencioso */
        }
      }

      if (isAdminLoaded) {
        const [links, pendingUsers, pendingRequests] = await Promise.all([
          eventService.inviteLinks.list(eventId).catch(() => []),
          eventService.participants.pending(eventId).catch(() => []),
          eventService.groupJoinRequests.pendingAdmin(eventId).catch(() => []),
        ])
        let inviteList = Array.isArray(links) ? links : []
        if (inviteList.length === 0) {
          try {
            const created = await eventService.inviteLinks.create(eventId, {
              targetRole: "GUEST",
              maxUses: 0,
            })
            inviteList = [created]
          } catch {
            /* sin enlace si falla API */
          }
        }
        setInviteLinks(inviteList)
        setPendingParticipants(pendingUsers)
        setPendingGroupRequests(pendingRequests)
      } else {
        setInviteLinks([])
        setPendingParticipants([])
        setPendingGroupRequests([])
      }

    } catch (error: any) {
      toast.error(error?.message || te("No se pudo cargar el evento", "Could not load event"))
      router.push("/events")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!eventId) return
    void loadEvent()
  }, [eventId])

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasMoreMessages) return
    setIsLoadingOlderMessages(true)
    try {
      const nextPage = messagePage + 1
      const older = await eventService.groupMessages.list(eventId, nextPage, 50)
      const normalized = (Array.isArray(older) ? older : []).map((m) =>
        withNormalizedPoll({ ...m, id: normalizeMessageId(m) })
      )
      if (normalized.length < 50) setHasMoreMessages(false)
      setMessages((prev) => [...normalized, ...prev])
      setMessagePage(nextPage)
    } catch {
      toast.error(te("No se pudieron cargar mensajes anteriores", "Could not load older messages"))
    } finally {
      setIsLoadingOlderMessages(false)
    }
  }

  const handleRespondToInvitation = async (requestId: string, accept: boolean) => {
    setIsRespondingToInvitation(true)
    try {
      await eventService.groupJoinRequests.respond(requestId, accept)
      setMyPendingInvitation(null)
      if (accept) {
        toast.success(te("Invitación aceptada. Cuando todos acepten, llegará al organizador.", "Invitation accepted. When everyone accepts, the organizer will be notified."))
      } else {
        toast.success(te("Invitación rechazada. La solicitud grupal fue cancelada.", "Invitation declined. The group request has been cancelled."))
      }
      await loadEvent()
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo responder a la invitación", "Could not respond to the invitation"))
    } finally {
      setIsRespondingToInvitation(false)
    }
  }

  useEffect(() => {
    const tab = String(searchParams.get("tab") || "").toLowerCase()
    if (tab === "chat" || tab === "members" || tab === "requests") {
      setActiveTab(tab)
    } else if (tab === "settings") {
      if (isEventOwner) setActiveTab(tab)
      else setActiveTab("chat")
    }
  }, [searchParams, isEventOwner])

  useEffect(() => {
    if (!isEventOwner && activeTab === "settings") {
      setActiveTab("chat")
    }
  }, [isEventOwner, activeTab])

  useEffect(() => {
    if (!isEventOwner && chatSubTab === "chat-poll") {
      setChatSubTab("chat-messages")
    }
  }, [isEventOwner, chatSubTab])

  useEffect(() => {
    setInviteOrigin(typeof window !== "undefined" ? window.location.origin : "")
  }, [])

  useEffect(() => {
    if (inviteLinks.length === 0) {
      setInviteQrById({})
      return
    }
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    if (!origin) return

    let cancelled = false
    ;(async () => {
      const next: Record<string, string> = {}
      for (const link of inviteLinks) {
        const url = buildEventInviteUrl(origin, link.token)
        try {
          next[link.inviteId] = await QRCode.toDataURL(url, {
            width: 220,
            margin: 2,
            color: { dark: "#171717", light: "#ffffff" },
          })
        } catch {
          /* noop */
        }
      }
      if (!cancelled) setInviteQrById(next)
    })()

    return () => {
      cancelled = true
    }
  }, [inviteLinks])

  useEffect(() => {
    if (!eventId || !user?.userId) return
    const unsubGroup = subscribeToEventGroup(eventId, (payload: any) => {
      if (!payload) return
      if (!payload.type) {
        upsertMessage(payload as EventGroupMessage)
        return
      }
      if (payload.type === "MESSAGE_DELETED" && payload.messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            normalizeMessageId(m) === String(payload.messageId)
              ? { ...m, deleted: true, content: null, mediaUrl: null, poll: null }
              : m
          )
        )
      }
      if (payload.type === "SETTINGS_UPDATED") {
        setGroupSettings({
          slowMode: Boolean(payload.slowMode),
          adminOnlyMode: Boolean(payload.adminOnlyMode),
        })
      }
      if (payload.type === "MEMBER_KICKED" && String(payload.userId) === myUserId) {
        toast.error(te("Fuiste expulsado del grupo del evento", "You were removed from the event group"))
        router.push("/events")
      }
      if (payload.type === "POLL_UPDATED" && payload.poll?.id) {
        const nextPoll = normalizeEventPoll(payload.poll)
        if (nextPoll) {
          setMessages((prev) =>
            prev.map((m) => (m.poll?.id === nextPoll.id ? { ...m, poll: nextPoll } : m))
          )
        }
      }
    })

    const unsubCapacity = subscribeToEventCapacity(eventId, (payload) => {
      setCapacity(payload)
    })

    return () => {
      unsubGroup?.()
      unsubCapacity?.()
    }
  }, [eventId, user?.userId, myUserId, subscribeToEventGroup, subscribeToEventCapacity, router])

  const sortedMessages = useMemo(
    () =>
      [...messages]
        .filter((m) => !isRedundantLocationSystemMessage(m))
        .sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()),
    [messages]
  )

  const chatBgPicsumId = useMemo(
    () => CHAT_BG_PICSUM_IDS[hashStringToIndex(eventId, CHAT_BG_PICSUM_IDS.length)],
    [eventId]
  )

  const formatTime = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""

  const clearComposer = () => {
    setMessageText("")
    setMediaFile(null)
    setReplyToEventMessage(null)
  }

  const getVideoDurationSeconds = (file: File) =>
    new Promise<number>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file)
      const video = document.createElement("video")
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        const duration = Number(video.duration || 0)
        URL.revokeObjectURL(objectUrl)
        resolve(duration)
      }
      video.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error(te("No se pudo leer la duración del video", "Could not read video duration")))
      }
      video.src = objectUrl
    })

  const handleSend = async () => {
    let content = messageText.trim()
    if (replyToEventMessage) {
      const snip = replyToEventMessage.snippet.replace(/\s+/g, " ").slice(0, 100)
      const head = `${te("↪", "↪")} ${replyToEventMessage.username}: «${snip}»`
      content = content ? `${head}\n\n${content}` : head
    }
    if (!content && !mediaFile) return
    setIsSending(true)
    try {
      let payload: {
        content?: string
        mediaUrl?: string
        mediaPublicId?: string
        mediaType?: "IMAGE" | "VIDEO" | "AUDIO"
        durationSeconds?: number
      } = { content }

      if (mediaFile) {
        const mime = mediaFile.type || ""
        const mediaType = mime.startsWith("image/")
          ? "IMAGE"
          : mime.startsWith("video/")
            ? "VIDEO"
            : mime.startsWith("audio/")
              ? "AUDIO"
              : undefined

        if (mediaType === "VIDEO") {
          const durationSeconds = Math.floor(await getVideoDurationSeconds(mediaFile))
          if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
            toast.error(te("El video no puede durar más de 3 minutos", "Video cannot be longer than 3 minutes"))
            return
          }
          payload.durationSeconds = durationSeconds
        }

        const uploaded = await eventService.uploadMedia(mediaFile)

        payload = {
          ...payload,
          mediaUrl: uploaded.mediaUrl,
          mediaPublicId: uploaded.mediaPublicId,
          mediaType,
        }
      }

      const created = await eventService.groupMessages.send(eventId, payload)
      upsertMessage(created)
      clearComposer()
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo enviar el mensaje", "Could not send message"))
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await eventService.groupMessages.remove(eventId, messageId)
      setMessages((prev) =>
        prev.map((m) =>
          normalizeMessageId(m) === messageId
            ? { ...m, deleted: true, content: null, mediaUrl: null, poll: null }
            : m
        )
      )
      toast.success(te("Mensaje eliminado", "Message deleted"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo eliminar", "Could not delete"))
    }
  }

  const handleEditMessage = async (message: EventGroupMessage) => {
    const next = window.prompt(te("Editar mensaje", "Edit message"), message.content || "")
    if (next == null || !next.trim()) return
    try {
      const updated = await eventService.groupMessages.edit(eventId, normalizeMessageId(message), next.trim())
      upsertMessage(updated)
      toast.success(te("Mensaje editado", "Message edited"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo editar", "Could not edit"))
    }
  }

  const canEditMessage = (message: EventGroupMessage) => {
    if (!message.senderId || String(message.senderId) !== myUserId) return false
    const sentAtMs = new Date(message.sentAt).getTime()
    return Date.now() - sentAtMs <= 15 * 60 * 1000
  }
  const canDeleteMessage = (message: EventGroupMessage) =>
    isAdmin || canEditMessage(message)

  const reactionEmojiMap: Record<ReactionType, string> = {
    LIKE: "👍",
    LOVE: "❤️",
    LAUGH: "😂",
    WOW: "😮",
    SAD: "😢",
    FIRE: "🔥",
  }

  const getEventMessageCopyText = (message: EventGroupMessage) => {
    if (message.deleted) return ""
    const raw = String(message.content || "").trim()
    if (raw) return raw
    if (message.poll?.question) return message.poll.question
    return te("(contenido multimedia)", "(media)")
  }

  const handleCopyEventMessage = async (message: EventGroupMessage, msgKey: string) => {
    const txt = getEventMessageCopyText(message)
    if (!txt) return
    await navigator.clipboard.writeText(txt)
    setCopiedEventMsgKey(msgKey)
    window.setTimeout(() => setCopiedEventMsgKey((k) => (k === msgKey ? null : k)), 2000)
    toast.success(te("Copiado", "Copied"))
  }

  const handleEventComingSoon = () => {
    toast.message(te("Próximamente", "Coming soon"))
  }

  const handleReact = async (messageId: string, reactionType: ReactionType) => {
    if (!String(messageId || "").trim()) {
      toast.error(te("ID de mensaje no válido", "Invalid message id"))
      return
    }
    const displayName = String(user?.username || user?.nombres || "").trim() || te("Tú", "You")
    try {
      await eventService.reactions.toggleMessageReaction(messageId, reactionType)
      setMessages((prev) =>
        prev.map((m) =>
          normalizeMessageId(m) === messageId
            ? {
                ...m,
                reactions: mergeToggleEventGroupReaction(m.reactions, myUserId, displayName, reactionType),
              }
            : m
        )
      )
      const rows = await eventService.groupMessages.list(eventId)
      setMessages((prev) => {
        const prevById = new Map(prev.map((m) => [normalizeMessageId(m), m]))
        return (Array.isArray(rows) ? rows : []).map((raw) => {
          const id = normalizeMessageId(raw)
          const old = prevById.get(id)
          const incoming = raw as EventGroupMessage
          const hasIncoming = Array.isArray(incoming.reactions) && incoming.reactions.length > 0
          const reactions = hasIncoming ? incoming.reactions! : old?.reactions ?? incoming.reactions ?? []
          return withNormalizedPoll({ ...incoming, id, reactions })
        })
      })
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo reaccionar", "Could not react"))
      try {
        const rows = await eventService.groupMessages.list(eventId)
        setMessages(
          rows.map((m) => withNormalizedPoll({ ...m, id: normalizeMessageId(m) }))
        )
      } catch {
        /* noop */
      }
    }
  }

  const submitEventPoll = async (question: string, optionRows: string[]) => {
    const q = String(question || "").trim()
    const options = optionRows.map((v) => String(v ?? "").trim()).filter(Boolean)
    if (!q || options.length < 2) {
      toast.error(te("Pregunta y al menos 2 opciones", "Question and at least 2 options are required"))
      return
    }
    try {
      const pollMsg = await eventService.polls.create(eventId, { question: q, options })
      upsertMessage(pollMsg)
      setPollQuestion("")
      setPollOptionRows(["", ""])
      setChatSubTab("chat-messages")
      toast.success(te("Encuesta creada", "Poll created"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear la encuesta", "Could not create poll"))
    }
  }

  const handleCreatePoll = async () => {
    await submitEventPoll(pollQuestion, pollOptionRows)
  }

  const handleVotePoll = async (optionId: string, pollId: string) => {
    try {
      const updatedPollRaw = await eventService.polls.vote(eventId, optionId)
      const updatedPoll = normalizeEventPoll(updatedPollRaw)
      if (!updatedPoll) return
      setMessages((prev) =>
        prev.map((m) => (m.poll?.id === pollId ? { ...m, poll: updatedPoll } : m))
      )
    } catch (error: any) {
      const message = String(error?.message || "")
      const isExpiredPoll =
        (error instanceof ApiError && error.status === 410) ||
        /expir/i.test(message)

      if (isExpiredPoll) {
        toast.info(te("Esta encuesta ya expiró", "This poll has expired"))
        try {
          const rows = await eventService.groupMessages.list(eventId)
          setMessages(
            rows.map((m) => withNormalizedPoll({ ...m, id: normalizeMessageId(m) }))
          )
        } catch {
          // Si falla la recarga, al menos dejamos feedback claro.
        }
        return
      }

      toast.error(message || te("No se pudo votar", "Could not vote"))
    }
  }

  const handleMuteToggle = async (member: EventGroupMember) => {
    try {
      if (member.mutedUntil && new Date(member.mutedUntil).getTime() > Date.now()) {
        await eventService.groupMembers.unmute(eventId, member.userId)
      } else {
        await eventService.groupMembers.mute(eventId, member.userId)
      }
      const refreshed = await eventService.groupMembers.list(eventId)
      setMembers(refreshed)
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo actualizar mute", "Could not update mute"))
    }
  }

  const handleKick = async (targetUserId: string) => {
    try {
      await eventService.groupMembers.kick(eventId, targetUserId)
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId))
      toast.success(te("Miembro expulsado", "Member removed"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo expulsar", "Could not remove member"))
    }
  }

  const handleUpdateSettings = async (slowMode: boolean, adminOnlyMode: boolean) => {
    try {
      await eventService.groupSettings.patch(eventId, { slowMode, adminOnlyMode })
      setGroupSettings({ slowMode, adminOnlyMode })
      toast.success(te("Ajustes actualizados", "Settings updated"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo actualizar ajustes", "Could not update settings"))
    }
  }

  const handleCreateInvite = async () => {
    try {
      const created = await eventService.inviteLinks.create(eventId, {
        targetRole: inviteRole,
        maxUses: Number(inviteMaxUses || "0"),
      })
      setInviteLinks((prev) => [created, ...prev])
      toast.success(te("Link creado", "Link created"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear el link", "Could not create link"))
    }
  }

  const handleDeleteInvite = async (linkId: string) => {
    try {
      await eventService.inviteLinks.remove(eventId, linkId)
      setInviteLinks((prev) => {
        const next = prev.filter((l) => l.inviteId !== linkId)
        if (next.length === 0) {
          void eventService.inviteLinks
            .create(eventId, { targetRole: "GUEST", maxUses: 0 })
            .then((created) => setInviteLinks([created]))
            .catch(() => {})
        }
        return next
      })
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo eliminar link", "Could not delete link"))
    }
  }

  const copyEventInviteUrl = async (token: string) => {
    const url = buildEventInviteUrl(inviteOrigin || window.location.origin, token)
    await navigator.clipboard.writeText(url)
    toast.success(te("Link copiado", "Link copied"))
  }

  const shareEventInviteUrl = async (token: string) => {
    const url = buildEventInviteUrl(inviteOrigin || window.location.origin, token)
    const title = String(eventData?.title || eventData?.name || "").trim() || te("Evento", "Event")
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: te(`Te invito: ${title}`, `You're invited: ${title}`),
          url,
        })
        return
      }
    } catch (e: unknown) {
      const err = e as { name?: string }
      if (err?.name === "AbortError") return
    }
    await navigator.clipboard.writeText(url)
    toast.success(te("Link copiado", "Link copied"))
  }

  const handleApproveParticipant = async (userId: string) => {
    const officialAddress = String((eventData as any)?.officialAddress || "").trim()
    
    // Permitir aprobar si hay dirección oficial, aunque no esté publicada en chat aún
    if (!officialAddress) {
      toast.error(
        te(
          "Primero configura la dirección oficial del evento en la pestaña 'Settings'.",
          "First set the official event address in the 'Settings' tab."
        )
      )
      return
    }
    
    try {
      await eventService.approveParticipant(eventId, userId)
      const approvedMeta = pendingParticipants.find((p) => p.userId === userId)
      recordEventAttendance({
        eventId,
        attendeeUserId: userId,
        attendeeUsername: approvedMeta?.username,
        eventTitle: String((eventData as any)?.title || "").trim() || undefined,
      })
      setPendingParticipants((prev) => prev.filter((p) => p.userId !== userId))
      const refreshedMembers = await eventService.groupMembers.list(eventId)
      setMembers(refreshedMembers)
      
      // Si es el primer aprobado y el grupo se acaba de crear, sugerir publicar ubicación
      if (refreshedMembers.length === 1) {
        toast.success(
          te(
            "Participante aprobado y grupo creado. Ahora puedes publicar la ubicación en el chat desde 'Settings'.",
            "Participant approved and group created. You can now publish the location in chat from 'Settings'."
          ),
          { duration: 6000 }
        )
      } else {
        toast.success(te("Participante aprobado", "Participant approved"))
      }
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo aprobar", "Could not approve"))
    }
  }

  const handleRejectParticipant = async (userId: string) => {
    try {
      await eventService.rejectParticipant(eventId, userId)
      setPendingParticipants((prev) => prev.filter((p) => p.userId !== userId))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo rechazar", "Could not reject"))
    }
  }

  const handleApproveGroupRequest = async (requestId: string) => {
    const officialAddress = String((eventData as any)?.officialAddress || "").trim()
    
    // Permitir aprobar si hay dirección oficial, aunque no esté publicada en chat aún
    if (!officialAddress) {
      toast.error(
        te(
          "Primero configura la dirección oficial del evento en la pestaña 'Settings'.",
          "First set the official event address in the 'Settings' tab."
        )
      )
      return
    }
    
    try {
      await eventService.groupJoinRequests.approve(eventId, requestId)
      setPendingGroupRequests((prev) => prev.filter((r) => r.id !== requestId))
      const refreshedMembers = await eventService.groupMembers.list(eventId)
      setMembers(refreshedMembers)
      toast.success(te("Solicitud grupal aprobada", "Group request approved"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo aprobar solicitud grupal", "Could not approve group request"))
    }
  }

  const handleRejectGroupRequest = async (requestId: string) => {
    try {
      await eventService.groupJoinRequests.reject(eventId, requestId)
      setPendingGroupRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success(te("Solicitud grupal rechazada", "Group request rejected"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo rechazar solicitud grupal", "Could not reject group request"))
    }
  }

  const handleSoloGroupJoinRequest = async () => {
    setIsCreatingSoloJoin(true)
    try {
      await eventService.groupJoinRequests.create(eventId, [], inviteMessage)
      toast.success(te("Solicitud enviada", "Join request sent"))
      setInviteMessage("")
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo enviar la solicitud", "Could not send request"))
    } finally {
      setIsCreatingSoloJoin(false)
    }
  }

  const handleCreateGroupJoinRequest = async () => {
    if (selectedInvitees.length === 0) {
      toast.error(te("Agrega al menos un usuario para invitar", "Add at least one user to invite"))
      return
    }
    setIsCreatingGroupInvite(true)
    try {
      const inviteeUserIds = await resolveInviteeIdsViaProfile(selectedInvitees, te)
      const allowed = new Set(
        eligibleInviteesPool.map((u) => String(u.userId).trim().toLowerCase())
      )
      const filteredIds = inviteeUserIds.filter((id) =>
        allowed.has(String(id).trim().toLowerCase())
      )
      if (filteredIds.length === 0) {
        toast.error(
          te(
            "Los invitados ya no están en la lista permitida. Cierra y vuelve a abrir esta pestaña.",
            "Invitees are no longer on the allowed list. Leave this tab and open it again."
          )
        )
        return
      }
      await eventService.groupJoinRequests.create(eventId, filteredIds, inviteMessage)
      toast.success(te("Solicitud grupal creada", "Group request created"))
      setSelectedInvitees([])
      setInviteeQuery("")
      setInviteMessage("")
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear solicitud grupal", "Could not create group request"))
    } finally {
      setIsCreatingGroupInvite(false)
    }
  }

  const handleUpdateLocation = async () => {
    const exact = locationExact.trim()
    const zone = locationZone.trim() || exact.split(",")[0]?.trim() || ""
    if (!exact || !zone) {
      toast.error(te("Ingresa la dirección exacta", "Enter the exact address"))
      return
    }
    setIsUpdatingLocation(true)
    try {
      // 1. Guardar como dirección oficial primero
      await eventService.setOfficialAddress(eventId, exact)
      
      // 2. Intentar actualizar ubicación y publicar en chat
      try {
        await eventService.updateLocation(eventId, {
          zone,
          exactAddress: exact,
          latitude: locationCoords?.latitude ?? 0,
          longitude: locationCoords?.longitude ?? 0,
        })
        
        // 3. Actualizar estado local
        setEventData((prev: any) => ({
          ...prev,
          zone,
          exactAddress: exact,
          officialAddress: exact,
          sharedAddress: exact,
          addressMatched: true,
          locationVerified: true,
          locationChangeCount: (prev?.locationChangeCount ?? 0) + 1,
        }))
        
        // 4. Recargar evento para obtener datos actualizados del backend
        await loadEvent()
        
        toast.success(te("Ubicación publicada en el chat y guardada como oficial", "Location published in chat and saved as official"))
        setLocationExact("")
        setLocationZone("")
        setLocationCoords(null)
      } catch (groupError: any) {
        // Si el grupo no existe (404), solo guardar como oficial
        if (groupError?.status === 404 || groupError?.message?.includes("grupo")) {
          setEventData((prev: any) => ({
            ...prev,
            zone,
            exactAddress: exact,
            officialAddress: exact,
          }))
          toast.info(
            te(
              "Ubicación guardada. Para publicarla en el chat, primero aprueba participantes en la pestaña 'Solicitudes'.",
              "Location saved. To publish it in chat, first approve participants in the 'Requests' tab."
            ),
            { duration: 6000 }
          )
          setLocationExact("")
          setLocationZone("")
          setLocationCoords(null)
        } else {
          throw groupError
        }
      }
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo guardar la ubicación", "Could not save location"))
    } finally {
      setIsUpdatingLocation(false)
    }
  }

  useEffect(() => {
    if (isLoading || !myUserId || !eventId || isAdmin) return
    if (activeTab !== "requests" && !joinDialogOpen) return
    let cancelled = false
    ;(async () => {
      setEligibleInviteesLoading(true)
      try {
        const memberIds = new Set(members.map((m) => String(m.userId)))
        const fromApi = await eventService.groupJoinRequests.listEligibleInvitees(eventId)
        if (cancelled) return
        if (fromApi !== null) {
          setEligibleInviteesPool(
            fromApi.filter((u) => u.userId !== myUserId && !memberIds.has(u.userId))
          )
          return
        }
        const [matchesRows, followersRows, followingRows] = await Promise.all([
          api.get<unknown[]>("/api/matches/my/matches").catch(() => []),
          followService.getFollowers(myUserId).catch(() => []),
          followService.getFollowing(myUserId).catch(() => []),
        ])
        if (cancelled) return
        const merged = mergeEligibleInviteUsers(myUserId, memberIds, matchesRows, followersRows, followingRows)

        // Batch-fetch profiles for users whose username looks synthetic (no real data from API)
        const synthetic = merged.filter(u => !u.username || /^user-[a-f0-9-]{4,}$/i.test(u.username))
        if (synthetic.length > 0 && !cancelled) {
          const results = await Promise.allSettled(
            synthetic.map(u => api.get<any>(`/api/profile/${encodeURIComponent(u.userId)}`))
          )
          if (!cancelled) {
            const resolved = [...merged]
            for (let i = 0; i < synthetic.length; i++) {
              const res = results[i]
              if (res.status !== "fulfilled" || !res.value) continue
              const p = res.value
              const idx = resolved.findIndex(u => u.userId === synthetic[i].userId)
              if (idx < 0) continue
              const pUsername = String(p?.username || "").trim()
              const pNames = [p?.nombres, p?.nombre, p?.apellidos].filter(Boolean).join(" ").trim()
              const pPhoto = p?.profilePictureUrl || p?.photoUrl || p?.photo
              const derivedUsername = pNames
                ? pNames.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").toLowerCase().slice(0, 24)
                : ""
              resolved[idx] = {
                ...resolved[idx],
                username: pUsername || derivedUsername || resolved[idx].username,
                fullName: resolved[idx].fullName || pNames || undefined,
                photo: resolved[idx].photo || pPhoto || undefined,
              }
            }
            setEligibleInviteesPool(resolved)
            return
          }
        }
        setEligibleInviteesPool(merged)
      } catch {
        if (!cancelled) setEligibleInviteesPool([])
      } finally {
        if (!cancelled) setEligibleInviteesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeTab, eventId, isAdmin, isLoading, joinDialogOpen, members, myUserId])

  const filteredEligibleInvitees = useMemo(() => {
    const q = inviteeQuery.trim().toLowerCase()
    const selectedIds = new Set(selectedInvitees.map((s) => s.userId))
    const list = eligibleInviteesPool.filter((u) => !selectedIds.has(u.userId))
    if (!q) return list
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.fullName && u.fullName.toLowerCase().includes(q))
    )
  }, [eligibleInviteesPool, inviteeQuery, selectedInvitees])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-10 py-12 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
          <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">{te("Cargando evento…", "Loading event…")}</p>
        </div>
      </div>
    )
  }

  const approvedCount = Number(capacity?.currentApprovedCount ?? eventData?.currentApprovedCount ?? 0)
  const maxGuests = Number(capacity?.maxGuests ?? eventData?.maxGuests ?? 0)
  const officialAddressSaved = String(
    (eventData as any)?.officialAddress || (eventData as any)?.exactAddress || ""
  ).trim()
  const sharedAddressSaved = String((eventData as any)?.sharedAddress || "").trim()
  const backendMatched = (eventData as any)?.addressMatched
  const isAddressMatched = typeof backendMatched === "boolean"
    ? backendMatched
    : normalizeAddress(officialAddressSaved) !== "" &&
      normalizeAddress(officialAddressSaved) === normalizeAddress(sharedAddressSaved)
  
  // Permitir aprobar si hay dirección oficial, aunque no esté publicada en chat
  const canApproveByAddress = Boolean(officialAddressSaved)
  const canViewAddress = isAdmin || isModerator || isGuest
  const locationStatus: "pending" | "matched" | "mismatch" =
    !officialAddressSaved
      ? "pending"
      : !sharedAddressSaved
        ? "pending"
        : isAddressMatched
          ? "matched"
          : "mismatch"

  const rawEv = eventData as any
  const zoneDisplay = String(
    rawEv?.zone || rawEv?.locationZone || rawEv?.location_zone || rawEv?.addressZone || ""
  ).trim()
  const countryDisplay = String(rawEv?.country || rawEv?.countryCode || "").trim()
  const eventPlaceDisplay =
    officialAddressSaved ||
    zoneDisplay ||
    countryDisplay ||
    te("Por definir", "To be confirmed")

  const startsAtIso = String(rawEv?.startsAt ?? rawEv?.eventDate ?? "").trim()
  const endsAtIso = String(rawEv?.endsAt ?? "").trim()
  const eventChatPhase = deriveEventChatPhase({
    startsAt: startsAtIso || undefined,
    endsAt: endsAtIso || undefined,
    status: rawEv?.status,
  })
  const moderatorCount = members.filter((m) => {
    const r = String(m.role || "").toUpperCase()
    return r === "MODERATOR" || r === "ADMIN"
  }).length

  let startsAtFormatted: string | null = null
  if (startsAtIso) {
    try {
      startsAtFormatted = new Date(startsAtIso).toLocaleString(language === "en" ? "en-US" : "es", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      startsAtFormatted = null
    }
  }
  const rawPrice = Number(rawEv?.price ?? NaN)
  const showPaidBadge = rawEv?.free === false || (Number.isFinite(rawPrice) && rawPrice > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-primary/[0.09] via-background to-secondary/[0.06]">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/20 blur-3xl dark:bg-primary/15" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 -left-12 size-56 rounded-full bg-secondary/18 blur-2xl dark:bg-secondary/12" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit rounded-xl border-border/60 bg-background/85 shadow-sm backdrop-blur-sm dark:bg-card/80"
              onClick={() => router.push("/events")}
            >
              <ArrowLeft className="mr-2 size-4" aria-hidden />
              {te("Eventos", "Events")}
            </Button>
            {!isAdmin && !isModerator && !isGuest && !myPendingInvitation && (
              <Button type="button" onClick={() => setJoinDialogOpen(true)} className="shrink-0 rounded-xl sm:ml-auto">
                {te("Unirme", "Join")}
              </Button>
            )}
          </div>

          {/* Banner: invitación de grupo pendiente */}
          {myPendingInvitation && (
            <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/8 px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">
                {te(
                  `@${myPendingInvitation.inviterUsername} te invitó a unirte en grupo`,
                  `@${myPendingInvitation.inviterUsername} invited you to join as a group`
                )}
              </p>
              {myPendingInvitation.message ? (
                <p className="mt-1 text-sm italic text-muted-foreground">"{myPendingInvitation.message}"</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {te(
                  "Si aceptas, esperamos a que todos acepten antes de notificar al organizador. Si alguien rechaza, la solicitud se cancela.",
                  "If you accept, we wait for everyone to accept before notifying the organizer. If anyone declines, the request is cancelled."
                )}
              </p>
              {/* Other invitees and their statuses */}
              {myPendingInvitation.members.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {te("Participantes del grupo", "Group participants")}
                  </p>
                  {myPendingInvitation.members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2 text-sm">
                      {m.status === "ACCEPTED" ? (
                        <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
                      ) : m.status === "DECLINED" ? (
                        <XCircle className="size-3.5 shrink-0 text-destructive" aria-hidden />
                      ) : (
                        <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      )}
                      <span className={m.status === "DECLINED" ? "text-muted-foreground line-through" : "text-foreground"}>
                        @{m.username}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {m.status === "ACCEPTED"
                          ? te("Aceptó", "Accepted")
                          : m.status === "DECLINED"
                          ? te("Rechazó", "Declined")
                          : te("Pendiente", "Pending")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleRespondToInvitation(myPendingInvitation.id, true)}
                  disabled={isRespondingToInvitation}
                  className="flex-1 rounded-xl"
                >
                  {isRespondingToInvitation ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
                  {te("Aceptar", "Accept")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespondToInvitation(myPendingInvitation.id, false)}
                  disabled={isRespondingToInvitation}
                  className="flex-1 rounded-xl"
                >
                  {te("Rechazar", "Decline")}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-lg border-border/70 font-semibold uppercase tracking-wide">
              {String(eventData?.status || "OPEN")}
            </Badge>
            {eventData?.category && (
              <Badge className="rounded-lg border-0 bg-primary/15 font-semibold text-primary">{eventData.category}</Badge>
            )}
            {showPaidBadge ? (
              <Badge className="rounded-lg border-0 bg-amber-500/15 font-semibold text-amber-900 dark:text-amber-300">
                {Number.isFinite(rawPrice) && rawPrice > 0 ? `${rawPrice} · ` : ""}
                {te("De pago", "Paid")}
              </Badge>
            ) : (
              <Badge className="rounded-lg border-0 bg-emerald-500/15 font-semibold text-emerald-800 dark:text-emerald-400">
                {te("Gratis", "Free")}
              </Badge>
            )}
          </div>

          <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {eventData?.title || eventData?.name || te("Evento", "Event")}
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground">
            {eventData?.description || te("Sin descripción", "No description")}
          </p>

          <div
            className={cn(
              "mt-8 grid grid-cols-1 gap-3",
              startsAtFormatted ? "md:grid-cols-3" : "md:grid-cols-2"
            )}
          >
            {startsAtFormatted ? (
              <div className="flex min-h-[5.25rem] items-start gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/45 dark:ring-white/[0.06]">
                <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {te("Cuándo", "When")}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-foreground">{startsAtFormatted}</p>
                </div>
              </div>
            ) : null}
            <div className="flex min-h-[5.25rem] items-start gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/45 dark:ring-white/[0.06]">
              <Users className="mt-0.5 size-5 shrink-0 text-secondary" aria-hidden />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {te("Cupos", "Spots")}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {maxGuests ? `${approvedCount} / ${maxGuests}` : approvedCount}
                  {!maxGuests ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      · {te("sin tope", "unlimited")}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            {/* Rating (desde backend PET BY FRONT) */}
            {eventData?.averageRating !== undefined && (
              <div className="flex min-h-[5.25rem] items-start gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/45 dark:ring-white/[0.06]">
                <Star className="mt-0.5 size-5 shrink-0 text-yellow-500" aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {te("Valoración", "Rating")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {eventData.averageRating.toFixed(1)}/5
                    {eventData.ratingCount > 0 && (
                      <span className="font-normal text-muted-foreground">
                        {" · "}{eventData.ratingCount} {eventData.ratingCount === 1 ? "voto" : "votos"}
                      </span>
                    )}
                  </p>
                  {eventData.status === "FINISHED" && !eventData.myRating && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">{te("Tu valoración", "Your rating")}:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-primary/10"
                          onClick={async () => {
                            try {
                              await eventService.rate(eventId, n)
                              toast.success(te("Gracias por valorar", "Thanks for rating"))
                              const refreshed = await eventService.getById(eventId)
                              setEventData(refreshed)
                            } catch {
                              toast.error(te("No se pudo enviar la valoración", "Could not submit rating"))
                            }
                          }}
                        >
                          {n}★
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex min-h-[5.25rem] items-start gap-3 rounded-2xl border border-border/50 bg-card/70 px-4 py-3 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/45 dark:ring-white/[0.06]">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {te("Ubicación", "Location")}
                </p>
                <p className="mt-1 break-words text-sm font-medium leading-snug text-foreground">{eventPlaceDisplay}</p>
              </div>
              {locationStatus === "matched" || locationStatus === "mismatch" ? (
                <Badge
                  className={cn(
                    "shrink-0 border-0 text-[10px]",
                    locationStatus === "matched"
                      ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-600/20 text-rose-700 dark:text-rose-400"
                  )}
                >
                  {locationStatus === "matched"
                    ? te("Verificada", "Verified")
                    : te("No coincide", "Mismatch")}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border/55 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-black/[0.03] dark:bg-muted/15 dark:ring-white/[0.05]">
            <p>
              {canApproveByAddress
                ? te(
                    "Dirección oficial lista: puedes aprobar solicitudes. Publica la ubicación en el chat desde Ajustes.",
                    "Official address is set: you can approve requests. Publish the location in chat from Settings."
                  )
                : te(
                    "Configura la dirección oficial en Ajustes para aprobar participantes.",
                    "Set the official address in Settings to approve participants."
                  )}
            </p>
            {canViewAddress && isAddressMatched && sharedAddressSaved ? (
              <p className="mt-2 font-medium text-foreground">
                {te("Ubicación en el chat", "Chat location")}: {sharedAddressSaved}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <EventMutualPlansInline eventId={eventId} />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(next) => {
            if (next === "settings" && !isEventOwner) return
            setActiveTab(next)
          }}
        >
          <TabsList
            className={cn(
              "grid h-auto min-h-11 w-full gap-1 rounded-2xl border border-border/60 bg-muted/35 p-1.5 shadow-inner ring-1 ring-black/[0.03] dark:bg-muted/25 dark:ring-white/[0.06]",
              isEventOwner ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
            )}
          >
            <TabsTrigger value="chat" className={cn(EVENT_TAB_TRIGGER, "gap-1")}>
              <MessageCircle className="size-3.5 opacity-80" aria-hidden />
              {te("Chat", "Chat")}
            </TabsTrigger>
            <TabsTrigger value="members" className={cn(EVENT_TAB_TRIGGER, "gap-1")}>
              <Users className="size-3.5 opacity-80" aria-hidden />
              {t("common.members")}
            </TabsTrigger>
            <TabsTrigger value="requests" className={cn(EVENT_TAB_TRIGGER, "gap-1")}>
              <Inbox className="size-3.5 opacity-80" aria-hidden />
              {t("common.requests")}
            </TabsTrigger>
            {isEventOwner && (
              <TabsTrigger value="settings" className={cn(EVENT_TAB_TRIGGER, "gap-1")}>
                <Settings className="size-3.5 opacity-80" aria-hidden />
                {t("common.settings")}
              </TabsTrigger>
            )}
          </TabsList>

        <TabsContent value="chat" className="mt-6 space-y-4">
          <Card className="gap-0 overflow-hidden rounded-2xl border-border/55 py-0 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
            <CardHeader className="border-b border-border/50 bg-muted/20 px-4 py-4 dark:bg-muted/10">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MessageCircle className="size-4 text-primary" aria-hidden />
                {te("Chat del evento", "Event chat")}
              </CardTitle>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">
                {isMuted
                  ? te(`Silenciado hasta ${mutedUntil?.toLocaleString()}`, `Muted until ${mutedUntil?.toLocaleString()}`)
                  : groupSettings.adminOnlyMode && !isAdmin
                    ? te("Solo el administrador puede escribir", "Only the admin can write")
                    : groupSettings.slowMode && isGuest
                      ? te("Solo moderadores pueden escribir", "Only moderators can write")
                      : te("Escribí abajo; los mensajes son en tiempo real.", "Write below; messages are real-time.")}
              </p>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-sm dark:bg-background/35">
                <Shield className="mt-0.5 size-3.5 shrink-0 text-primary/90" aria-hidden />
                <span>
                  {te(
                    "Por seguridad, coordiná aquí. Fuera de Spark no podemos verificar ubicación ni asistencia.",
                    "For safety, coordinate here. Outside Spark we cannot verify location or attendance."
                  )}
                </span>
              </div>
            </CardHeader>
            {/* Banner de invitación grupal pendiente (visible desde el chat) */}
            {myPendingInvitation && (
              <div className="mx-4 mb-0 mt-3 rounded-xl border border-primary/30 bg-primary/8 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {te(
                    `@${myPendingInvitation.inviterUsername} te invitó a unirte en grupo`,
                    `@${myPendingInvitation.inviterUsername} invited you to join as a group`
                  )}
                </p>
                {myPendingInvitation.message ? (
                  <p className="mt-1 text-xs italic text-muted-foreground">"{myPendingInvitation.message}"</p>
                ) : null}
                {myPendingInvitation.members.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {myPendingInvitation.members.map((m) => (
                      <span key={m.userId} className="inline-flex items-center gap-1 text-xs">
                        {m.status === "ACCEPTED" ? (
                          <CheckCircle2 className="size-3 text-emerald-500" aria-hidden />
                        ) : m.status === "DECLINED" ? (
                          <XCircle className="size-3 text-destructive" aria-hidden />
                        ) : (
                          <Clock className="size-3 text-muted-foreground" aria-hidden />
                        )}
                        <span className={m.status === "DECLINED" ? "text-muted-foreground line-through" : "text-foreground"}>
                          @{m.username}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespondToInvitation(myPendingInvitation.id, true)}
                    disabled={isRespondingToInvitation}
                    className="flex-1 rounded-xl"
                  >
                    {isRespondingToInvitation ? <Loader2 className="mr-1 size-3 animate-spin" aria-hidden /> : null}
                    {te("Aceptar", "Accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespondToInvitation(myPendingInvitation.id, false)}
                    disabled={isRespondingToInvitation}
                    className="flex-1 rounded-xl"
                  >
                    {te("Rechazar", "Decline")}
                  </Button>
                </div>
              </div>
            )}
            <CardContent className="px-4 pb-4 pt-4">
              <Tabs
                value={isEventOwner ? chatSubTab : "chat-messages"}
                onValueChange={(v) => {
                  if (isEventOwner) setChatSubTab(v as "chat-messages" | "chat-poll")
                }}
                className="w-full"
              >
                {isEventOwner && (
                  <TabsList className="mb-4 grid h-auto w-full grid-cols-2 gap-1 rounded-xl border border-border/60 bg-muted/35 p-1 shadow-inner dark:bg-muted/25">
                    <TabsTrigger value="chat-messages" className={CHAT_SUB_TAB}>
                      <MessageCircle className="size-3.5 opacity-80" aria-hidden />
                      {te("Mensajes", "Messages")}
                    </TabsTrigger>
                    <TabsTrigger value="chat-poll" className={CHAT_SUB_TAB}>
                      <BarChart3 className="size-3.5 opacity-80" aria-hidden />
                      {te("Nueva encuesta", "New poll")}
                    </TabsTrigger>
                  </TabsList>
                )}

                <TabsContent value="chat-messages" className="mt-0 space-y-4 outline-none">
                  <PreEventChatHub
                    te={te}
                    phase={eventChatPhase}
                    venueLabel={eventPlaceDisplay}
                    approvedRsvpCount={approvedCount}
                    pendingInterestCount={pendingParticipants.length}
                    inChatMemberCount={members.length}
                    moderatorCount={moderatorCount}
                    maxGuests={maxGuests > 0 ? maxGuests : undefined}
                    onInsertPrompt={(text) => {
                      const t = String(text || "").trim()
                      if (!t) return
                      setMessageText((prev) => {
                        const p = prev.trim()
                        return p ? `${p} ${t}` : t
                      })
                    }}
                    canHostPresetPolls={isEventOwner || isModerator}
                    onPresetPoll={(question, options) => submitEventPoll(question, options)}
                  />

              {/* Foto de fondo en todo el bloque (lista + compositor); velo bajo para que se note la imagen */}
              <div className="relative min-h-[min(320px,45vh)] overflow-hidden rounded-xl border border-border/55 shadow-inner ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                <img
                  src={`https://picsum.photos/id/${chatBgPicsumId}/1600/1000`}
                  alt=""
                  width={1600}
                  height={1000}
                  loading="eager"
                  decoding="async"
                  className="pointer-events-none absolute inset-0 z-0 size-full min-h-[280px] object-cover"
                />
                <div
                  className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/12 via-background/8 to-background/14 backdrop-blur-[0.5px] dark:from-background/20 dark:via-background/14 dark:to-background/24"
                  aria-hidden
                />
                <div className="relative z-[2] max-h-[min(560px,72vh)] min-h-[min(280px,38vh)] space-y-3 overflow-y-auto overflow-x-hidden p-4">
                  {hasMoreMessages && (
                    <div className="flex justify-center pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadOlderMessages}
                        disabled={isLoadingOlderMessages}
                        className="h-7 rounded-full bg-background/70 px-3 text-xs backdrop-blur-sm hover:bg-background/90"
                      >
                        {isLoadingOlderMessages
                          ? <Loader2 className="size-3 animate-spin" aria-hidden />
                          : te("Cargar mensajes anteriores", "Load older messages")}
                      </Button>
                    </div>
                  )}
                {sortedMessages.map((m, idx) => {
                  const mine = String(m.senderId || "") === myUserId
                  const isSystemMessage = Boolean(m.system)
                  const key = normalizeMessageId(m) || `${m.senderId || "system"}-${m.sentAt}-${idx}`
                  
                  // Renderizado especial para mensajes de sistema
                  if (isSystemMessage) {
                    const isPinned = Boolean(m.pinned)
                    return (
                      <div key={key} className="flex justify-center">
                        <div className={cn(
                          "max-w-[90%] rounded-lg border px-4 py-2 text-center shadow-sm backdrop-blur-sm",
                          isPinned
                            ? "border-emerald-400/40 bg-emerald-500/10 dark:bg-emerald-500/15"
                            : "border-border/60 bg-muted/90 dark:bg-muted/85"
                        )}>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                            {isPinned ? (
                              <span className="font-semibold text-emerald-500">📌 {te("Fijado", "Pinned")}</span>
                            ) : (
                              <span>{te("Sistema", "System")}</span>
                            )}
                            <span>· {formatTime(m.sentAt)}</span>
                          </p>
                          <p className="text-sm font-medium">
                            {m.deleted ? te("Mensaje eliminado", "Message deleted") : m.content || ""}
                          </p>
                        </div>
                      </div>
                    )
                  }
                  
                  // Renderizado normal para mensajes de usuarios (barra tipo chat 1:1: hover / tap)
                  const replySnippet =
                    getEventMessageCopyText(m).slice(0, 120) || te("(mensaje)", "(message)")
                  const tbOpacity =
                    activeEventMsgKey === key ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
                  const tbBtn =
                    "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  const tbBtnDanger =
                    "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-muted/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"

                  const actionBar = (
                    <div className={cn("mb-1 flex items-center gap-0.5 transition-opacity", tbOpacity)}>
                      <button
                        type="button"
                        className={cn(tbBtn, "reactions-button")}
                        title={te("Reaccionar", "React")}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowEventReactionKey(showEventReactionKey === key ? null : key)
                        }}
                      >
                        <Smile className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={tbBtn}
                        title={te("Responder", "Reply")}
                        onClick={(e) => {
                          e.stopPropagation()
                          setReplyToEventMessage({
                            messageId: normalizeMessageId(m),
                            username: m.senderUsername || te("Usuario", "User"),
                            snippet: replySnippet,
                          })
                          setShowEventReactionKey(null)
                        }}
                      >
                        <Reply className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={tbBtn}
                        title={t("common.copy")}
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleCopyEventMessage(m, key)
                        }}
                      >
                        {copiedEventMsgKey === key ? (
                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" aria-hidden />
                        ) : (
                          <Copy className="h-3.5 w-3.5" aria-hidden />
                        )}
                      </button>
                      {canEditMessage(m) && (
                        <button
                          type="button"
                          className={tbBtn}
                          title={t("common.edit")}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditMessage(m)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        className={tbBtn}
                        title={te("Fijar", "Pin")}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventComingSoon()
                        }}
                      >
                        <Pin className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      {canDeleteMessage(m) && (
                        <button
                          type="button"
                          className={tbBtnDanger}
                          title={t("common.delete")}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMessage(normalizeMessageId(m))
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                      <button
                        type="button"
                        className={tbBtn}
                        title={te("Destacar", "Highlight")}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventComingSoon()
                        }}
                      >
                        <Star className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  )

                  const senderLabel = m.senderUsername || te("Usuario", "User")
                  const memberPic = members.find((mem) => String(mem.userId) === String(m.senderId || ""))?.profilePictureUrl
                  const avatarSrc =
                    (mine ? user?.profilePictureUrl : undefined) ||
                    m.senderProfilePictureUrl ||
                    memberPic ||
                    undefined
                  const initials =
                    senderLabel
                      .replace(/^@/, "")
                      .trim()
                      .slice(0, 2)
                      .toUpperCase() || "?"

                  return (
                    <div
                      key={key}
                      className={cn(
                        "relative flex items-end gap-2 group/msg",
                        mine ? "justify-end" : "justify-start"
                      )}
                    >
                      {!mine && (
                        <Avatar
                          className="order-1 mb-1 h-9 w-9 min-h-9 min-w-9 shrink-0 ring-1 ring-border/50"
                          aria-hidden
                        >
                          {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                          <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                      )}
                      {!mine && !m.deleted && <div className="order-3">{actionBar}</div>}
                      <div className="relative order-2 w-56 max-w-full min-w-0 shrink">
                        {showEventReactionKey === key && (
                          <div className="absolute left-0 right-0 top-full z-[60] mt-2 flex justify-center px-0">
                            <div
                              role="group"
                              className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-2xl border border-primary/20 bg-background px-2 py-1.5 shadow-lg dark:bg-card"
                            >
                              {(Object.keys(reactionEmojiMap) as ReactionType[]).map((rt) => (
                                <button
                                  key={rt}
                                  type="button"
                                  className="cursor-pointer rounded-lg p-1.5 text-lg leading-none transition-transform hover:scale-110 hover:bg-muted/60"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    void handleReact(normalizeMessageId(m), rt)
                                    setShowEventReactionKey(null)
                                  }}
                                >
                                  {reactionEmojiMap[rt]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <div
                          className={cn(
                            "relative rounded-2xl border px-3 py-2 shadow-md backdrop-blur-[2px] sm:px-4 sm:py-2.5",
                            mine
                              ? "border-primary/50 bg-primary/30 text-foreground dark:border-primary/45 dark:bg-primary/26"
                              : "border-border bg-card text-foreground shadow-sm"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveEventMsgKey(activeEventMsgKey === key ? null : key)
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation()
                            setActiveEventMsgKey(activeEventMsgKey === key ? null : key)
                          }}
                        >
                          <div
                            className={cn(
                              !m.deleted && m.reactions && m.reactions.length > 0 ? "pb-1.5" : "pb-0.5"
                            )}
                          >
                            <p className="mb-1 flex min-w-0 items-center gap-1 text-xs leading-tight sm:text-[13px]">
                              {!m.system && (
                                <Zap
                                  className="size-3 shrink-0 animate-pulse text-purple-600 drop-shadow-[0_0_6px_rgba(147,51,234,0.65)] dark:text-purple-400 dark:drop-shadow-[0_0_8px_rgba(192,132,252,0.55)]"
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                              )}
                              <span
                                className={cn(
                                  "min-w-0 truncate tracking-tight",
                                  m.system
                                    ? "font-medium text-amber-700 dark:text-amber-400"
                                    : mine
                                      ? "font-semibold text-purple-800 dark:text-purple-200"
                                      : "font-medium text-violet-700 dark:text-violet-300"
                                )}
                              >
                                {m.system ? te("Sistema", "System") : m.senderUsername || te("Usuario", "User")}
                              </span>
                            </p>
                            {/* Con encuesta el backend suele mandar la pregunta también en content (ej. "📊 …") — evitamos duplicar */}
                            {(!m.poll || m.deleted) && (
                              <p
                                className={cn(
                                  "break-words text-sm font-medium leading-relaxed sm:text-[15px]",
                                  m.deleted
                                    ? "text-muted-foreground"
                                    : mine
                                      ? "text-slate-900 dark:text-white dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.55)]"
                                      : "text-slate-900 dark:text-zinc-100"
                                )}
                              >
                                {m.deleted ? te("Mensaje eliminado", "Message deleted") : m.content || ""}
                              </p>
                            )}
                            {m.mediaType === "IMAGE" && m.mediaUrl && !m.deleted && (
                              <img src={m.mediaUrl} alt="" className="mt-2 max-h-56 rounded-md object-cover" />
                            )}
                            {m.mediaType === "VIDEO" && m.mediaUrl && !m.deleted && (
                              <video controls src={m.mediaUrl} className="mt-2 max-h-56 w-full rounded-md" />
                            )}
                            {m.mediaType === "AUDIO" && m.mediaUrl && !m.deleted && (
                              <audio controls src={m.mediaUrl} className="mt-2 w-full" />
                            )}
                            {m.poll && (
                              <div
                                className={cn(
                                  "space-y-1.5 rounded-xl border border-primary/25 bg-muted/25 p-2.5 dark:border-primary/30 dark:bg-muted/20",
                                  !m.deleted && "mt-1"
                                )}
                              >
                                <p className="flex items-center gap-1.5 text-xs font-semibold leading-snug text-foreground">
                                  <BarChart3 className="size-3.5 shrink-0 text-primary" aria-hidden />
                                  {m.poll.question}
                                </p>
                                {(m.poll.options?.length ?? 0) === 0 ? (
                                  <p className="rounded-md bg-muted/40 px-2 py-1.5 text-[11px] text-muted-foreground">
                                    {te(
                                      "No se recibieron opciones en la respuesta.",
                                      "No poll options were returned."
                                    )}
                                  </p>
                                ) : (
                                  m.poll.options.map((opt, i) => (
                                    <button
                                      key={opt.id || `poll-opt-${m.poll!.id}-${i}`}
                                      type="button"
                                      className={`w-full rounded px-2 py-1 text-left text-xs ${opt.votedByMe ? "bg-primary/15" : "bg-muted/60 hover:bg-muted"}`}
                                      disabled={m.poll?.expired}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleVotePoll(opt.id, m.poll!.id)
                                      }}
                                    >
                                      {opt.optionText || te("(opción)", "(option)")} · {opt.voteCount}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                            <div
                              className={cn(
                                "flex shrink-0 justify-end",
                                !m.deleted && m.reactions && m.reactions.length > 0 ? "mt-1" : "mt-2"
                              )}
                            >
                              <time
                                dateTime={m.sentAt}
                                className={cn(
                                  "text-[11px] tabular-nums leading-none text-muted-foreground/90 sm:text-xs",
                                  mine && "text-muted-foreground/80"
                                )}
                              >
                                {formatTime(m.sentAt)}
                                {m.editedAt ? (
                                  <span className="ml-1 opacity-75">{te("· (editado)", "· (edited)")}</span>
                                ) : null}
                              </time>
                            </div>
                          </div>
                          {!m.deleted && m.reactions && m.reactions.length > 0 ? (
                            <div
                              className={cn(
                                "pointer-events-none absolute bottom-0 z-[5] flex translate-y-1/2 items-center gap-1",
                                /* Propios: hora a la derecha → reacciones abajo a la izquierda para no dejar hueco */
                                "left-2 flex-row"
                              )}
                              aria-hidden
                            >
                              {(Object.keys(reactionEmojiMap) as ReactionType[]).map((rt) => {
                                const list = m.reactions!.filter((r) => r.reaction === rt)
                                if (!list.length) return null
                                const n = list.length
                                return (
                                  <span
                                    key={`${normalizeMessageId(m)}-${rt}`}
                                    className={cn(
                                      "inline-flex items-center gap-px text-[18px] leading-none tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]",
                                      mine && "drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                                    )}
                                  >
                                    <span>{reactionEmojiMap[rt]}</span>
                                    {n > 1 ? (
                                      <span
                                        className={cn(
                                          "text-[11px] font-semibold tabular-nums text-foreground",
                                          "[text-shadow:_0_1px_2px_rgba(255,255,255,0.85)] dark:[text-shadow:_0_1px_2px_rgba(0,0,0,0.9)]",
                                          mine &&
                                            "[text-shadow:_0_1px_2px_rgba(255,255,255,0.65)] dark:[text-shadow:_0_1px_2px_rgba(0,0,0,0.75)]"
                                        )}
                                      >
                                        {n}
                                      </span>
                                    ) : null}
                                  </span>
                                )
                              })}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {mine && !m.deleted && <div className="order-1">{actionBar}</div>}
                      {mine && (
                        <Avatar
                          className="order-3 mb-1 h-9 w-9 min-h-9 min-w-9 shrink-0 ring-1 ring-border/50"
                          aria-hidden
                        >
                          {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                          <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}
                </div>
              <div className="relative z-[2] space-y-3 border-t border-white/10 bg-card/55 px-4 pb-4 pt-3 shadow-[0_-8px_28px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/5 dark:bg-card/45 dark:shadow-[0_-8px_36px_-10px_rgba(0,0,0,0.55)]">
                {replyToEventMessage && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted px-3 py-2 text-xs dark:bg-muted/90">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {te("Respondiendo a", "Replying to")}{" "}
                      <span className="font-medium text-foreground">{replyToEventMessage.username}</span>
                      <span className="block truncate opacity-80">«{replyToEventMessage.snippet}»</span>
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setReplyToEventMessage(null)}
                      aria-label={te("Cancelar respuesta", "Cancel reply")}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  ref={chatFileInputRef}
                  id="event-group-chat-file"
                  type="file"
                  accept="image/*,video/*,audio/*"
                  className="sr-only"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  disabled={!canSend}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-2 rounded-xl border-border/60"
                    disabled={!canSend}
                    onClick={() => chatFileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" aria-hidden />
                    {te("Adjuntar", "Attach")}
                  </Button>
                  {mediaFile ? (
                    <div className="flex min-h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/80 px-3 py-1.5 text-xs sm:flex-initial sm:max-w-md dark:bg-muted/70">
                      <span className="truncate font-medium text-foreground">{mediaFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                        aria-label={te("Quitar archivo", "Remove attachment")}
                        onClick={() => {
                          setMediaFile(null)
                          if (chatFileInputRef.current) chatFileInputRef.current.value = ""
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-end gap-2">
                  <Textarea
                    id="event-group-chat-message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={te("Escribe un mensaje", "Write a message")}
                    disabled={!canSend}
                    className={cn(
                      FORM_CONTROL_TEXTAREA,
                      "min-h-11 max-h-40 min-w-0 flex-1 resize-y bg-background/95 py-2 dark:bg-background/90"
                    )}
                  />
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={(!messageText.trim() && !mediaFile) || isSending || !canSend}
                    className="h-11 shrink-0 gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 font-bold text-black shadow-sm sm:px-5"
                  >
                    {isSending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4 shrink-0" aria-hidden />}
                    <span className="whitespace-nowrap">{isSending ? te("Enviando...", "Sending...") : te("Enviar", "Send")}</span>
                  </Button>
                </div>
              </div>
              </div>
                </TabsContent>

                {isEventOwner && (
                  <TabsContent value="chat-poll" className="mt-0 space-y-4 outline-none">
                    <div className="rounded-2xl border border-border/55 bg-gradient-to-br from-card to-primary/[0.04] p-4 ring-1 ring-black/[0.04] dark:to-primary/[0.07] dark:ring-white/[0.06]">
                      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                        {te(
                          "La encuesta aparece como mensaje en este chat.",
                          "The poll appears as a message in this chat."
                        )}
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="event-poll-q" className={FORM_LABEL}>
                            {te("Pregunta", "Question")}
                          </Label>
                          <Input
                            id="event-poll-q"
                            className={FORM_CONTROL_INPUT}
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            placeholder={te("¿Qué preferís hacer?", "What should we do?")}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <p className={FORM_LABEL}>{te("Opciones", "Options")}</p>
                          <div className="space-y-2">
                            {pollOptionRows.map((opt, i) => (
                              <div key={i} className="flex gap-2">
                                <Input
                                  id={i === 0 ? "event-poll-opt-0" : undefined}
                                  className={cn(FORM_CONTROL_INPUT, "min-w-0 flex-1")}
                                  value={opt}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setPollOptionRows((prev) => {
                                      const next = [...prev]
                                      next[i] = v
                                      return next
                                    })
                                  }}
                                  placeholder={te(`Opción ${i + 1}`, `Option ${i + 1}`)}
                                />
                                {pollOptionRows.length > 2 ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 shrink-0 rounded-xl border-border/60"
                                    aria-label={te("Quitar opción", "Remove option")}
                                    onClick={() =>
                                      setPollOptionRows((prev) =>
                                        prev.length <= 2 ? prev : prev.filter((_, j) => j !== i)
                                      )
                                    }
                                  >
                                    <Trash2 className="size-4" aria-hidden />
                                  </Button>
                                ) : (
                                  <span className="w-10 shrink-0 sm:block" aria-hidden />
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-1 gap-1.5 rounded-xl border-border/60"
                            onClick={() => setPollOptionRows((prev) => [...prev, ""])}
                          >
                            <Plus className="size-4" aria-hidden />
                            {te("Agregar opción", "Add option")}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreatePoll}
                          className="h-11 w-full rounded-xl bg-gradient-to-r from-primary to-secondary font-bold text-black shadow-sm"
                        >
                          {te("Publicar encuesta", "Publish poll")}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <Card className="rounded-2xl border-border/55 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="size-4 text-primary" aria-hidden />
                {t("common.members")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((m) => {
                const targetMuted = Boolean(m.mutedUntil && new Date(m.mutedUntil).getTime() > Date.now())
                return (
                  <div key={m.userId} className="rounded-lg border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{m.username}</p>
                      <p className="text-xs text-muted-foreground">{m.role}{targetMuted ? te(" · Silenciado", " · Muted") : ""}</p>
                    </div>
                    {(isAdmin || isModerator) && m.role !== "ADMIN" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleMuteToggle(m)}>
                          {targetMuted ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
                          {targetMuted ? te("Activar audio", "Unmute") : te("Silenciar", "Mute")}
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="destructive" onClick={() => handleKick(m.userId)}>
                            <UserMinus className="h-3.5 w-3.5 mr-1" />
                            {te("Expulsar", "Kick")}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6 space-y-4">
          {!isAdmin && (
            <Card className="rounded-2xl border-border/55 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Inbox className="size-4 text-secondary" aria-hidden />
                  {te("Solicitud al grupo", "Group join request")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {te(
                    "Puedes pedir entrar solo tú, o invitar a tus matches y a personas con las que tengáis seguimiento mutuo (los dos os seguís). Es lo mismo que valida el servidor.",
                    "You can join alone, or invite your matches and people you mutually follow (both follow each other). That matches what the server allows."
                  )}
                </p>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {te("Mensaje para el organizador (opcional)", "Message to organizer (optional)")}
                  </label>
                  <Textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder={te("Escribe algo sobre ti o tu grupo…", "Tell the organizer something about you or your group…")}
                    maxLength={500}
                    rows={2}
                    className={FORM_CONTROL_TEXTAREA}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2 rounded-xl sm:w-auto"
                  onClick={handleSoloGroupJoinRequest}
                  disabled={isCreatingSoloJoin || isCreatingGroupInvite}
                >
                  {isCreatingSoloJoin ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <UserPlus className="size-4 shrink-0" aria-hidden />
                  )}
                  {te("Solicitar unirme (solo yo)", "Request to join (just me)")}
                </Button>

                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-medium">
                    {te("Invitar desde tu lista", "Invite from your list")}
                  </p>
                  <Input
                    value={inviteeQuery}
                    onChange={(e) => setInviteeQuery(e.target.value)}
                    placeholder={te("Filtrar por nombre o @usuario…", "Filter by name or @username…")}
                    className={FORM_CONTROL_INPUT}
                  />
                  {eligibleInviteesLoading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                      {te("Cargando matches y seguidores mutuos…", "Loading matches and mutual followers…")}
                    </div>
                  ) : filteredEligibleInvitees.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      {eligibleInviteesPool.length === 0
                        ? te(
                            "No tienes matches ni seguidores mutuos para invitar, o ya están en el grupo.",
                            "You have no matches or mutual followers to invite, or they are already in the group."
                          )
                        : te("Nadie coincide con el filtro.", "No one matches the filter.")}
                    </p>
                  ) : (
                    <div className="max-h-52 divide-y divide-border overflow-auto rounded-xl border border-border">
                      {filteredEligibleInvitees.map((u) => (
                        <button
                          key={u.userId}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/80"
                          onClick={() => {
                            setSelectedInvitees((prev) => [...prev, u])
                            setInviteeQuery("")
                          }}
                        >
                          <Avatar className="size-9 shrink-0">
                            {u.photo ? (
                              <AvatarImage src={u.photo} alt="" className="object-cover" />
                            ) : null}
                            <AvatarFallback className="text-xs font-semibold">
                              {(u.username || u.userId).slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {u.fullName || `@${u.username}`}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">@{u.username}</p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-primary">
                            {te("Añadir", "Add")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedInvitees.length > 0 && (
                    <div className="space-y-3 pt-1">
                      <p className="text-xs text-muted-foreground">
                        {te("Se incluirán en la solicitud grupal:", "Included in the group request:")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedInvitees.map((u) => (
                          <Badge
                            key={u.userId}
                            variant="secondary"
                            className="cursor-pointer gap-1"
                            onClick={() =>
                              setSelectedInvitees((prev) => prev.filter((p) => p.userId !== u.userId))
                            }
                          >
                            @{u.username} ×
                          </Badge>
                        ))}
                      </div>
                      <Button
                        type="button"
                        onClick={handleCreateGroupJoinRequest}
                        disabled={isCreatingGroupInvite || isCreatingSoloJoin}
                        className="h-11 w-full rounded-xl sm:w-auto"
                      >
                        {isCreatingGroupInvite ? (
                          <Loader2 className="mr-2 size-4 shrink-0 animate-spin" aria-hidden />
                        ) : null}
                        {te("Crear solicitud con invitados", "Create request with invitees")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isAdmin && (
            <>
              <Card className="rounded-2xl border-border/55 shadow-sm">
                <CardHeader><CardTitle className="text-base">{te("Pendientes individuales", "Individual pending")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {!canApproveByAddress && (
                    <p className="text-xs text-amber-500">
                      {te(
                        "Configura la dirección oficial en 'Settings' para poder aprobar.",
                        "Set official address in 'Settings' to approve."
                      )}
                    </p>
                  )}
                  {pendingParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{te("No hay solicitudes pendientes.", "No pending requests.")}</p>
                  ) : pendingParticipants.map((p) => (
                    <div key={p.userId} className="rounded-lg border border-border p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.username}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveParticipant(p.userId)}
                          disabled={!canApproveByAddress}
                          title={
                            canApproveByAddress
                              ? undefined
                              : te(
                                  "Configura dirección oficial en Settings",
                                  "Set official address in Settings"
                                )
                          }
                        >
                          {te("Aprobar", "Approve")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectParticipant(p.userId)}>{te("Rechazar", "Reject")}</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/55 shadow-sm">
                <CardHeader><CardTitle className="text-base">{te("Solicitudes grupales", "Group requests")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {!canApproveByAddress && (
                    <p className="text-xs text-amber-500">
                      {te(
                        "Configura la dirección oficial en 'Settings' para poder aprobar solicitudes grupales.",
                        "Set official address in 'Settings' to approve group requests."
                      )}
                    </p>
                  )}
                  {pendingGroupRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{te("No hay solicitudes grupales pendientes.", "No pending group requests.")}</p>
                  ) : pendingGroupRequests.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      {/* Inviter */}
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-9 shrink-0">
                          {r.inviterProfilePictureUrl ? (
                            <AvatarImage src={r.inviterProfilePictureUrl} alt="" className="object-cover" />
                          ) : null}
                          <AvatarFallback className="text-xs font-bold">
                            {(r.inviterUsername || "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">@{r.inviterUsername}</p>
                          <p className="text-xs text-muted-foreground">
                            {te("Solicitud grupal", "Group request")} · {r.members.length} {te("persona(s)", "person(s)")}
                          </p>
                        </div>
                      </div>

                      {/* Message from inviter */}
                      {r.message ? (
                        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm italic text-foreground/80">
                          &ldquo;{r.message}&rdquo;
                        </p>
                      ) : null}

                      {/* Member photo collage */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {te("Integrantes del grupo", "Group members")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {r.members.map((m) => (
                            <div key={m.userId} className="flex items-center gap-1.5">
                              <Avatar className="size-7 shrink-0">
                                {m.profilePictureUrl ? (
                                  <AvatarImage src={m.profilePictureUrl} alt="" className="object-cover" />
                                ) : null}
                                <AvatarFallback className="text-[10px] font-bold">
                                  {(m.username || "?")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">@{m.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleApproveGroupRequest(r.id)}
                          disabled={!canApproveByAddress}
                          title={canApproveByAddress ? undefined : te("Configura dirección oficial en Settings", "Set official address in Settings")}
                        >
                          {te("Aprobar grupo", "Approve group")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectGroupRequest(r.id)}>
                          {te("Rechazar", "Reject")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {isEventOwner && (
        <TabsContent value="settings" className="mt-6 space-y-4">
          {isAdmin ? (
            <>
              <Card className="rounded-2xl border-border/55 shadow-sm">
                <CardHeader><CardTitle className="text-base">{te("Ajustes del grupo", "Group settings")}</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant={groupSettings.slowMode ? "default" : "outline"}
                    onClick={() => handleUpdateSettings(!groupSettings.slowMode, groupSettings.adminOnlyMode)}
                  >
                    {groupSettings.slowMode ? te("Modo lento activado", "Slow mode ON") : te("Modo lento desactivado", "Slow mode OFF")}
                  </Button>
                  <Button
                    variant={groupSettings.adminOnlyMode ? "default" : "outline"}
                    onClick={() => handleUpdateSettings(groupSettings.slowMode, !groupSettings.adminOnlyMode)}
                  >
                    {groupSettings.adminOnlyMode ? te("Solo admin activado", "Admin only ON") : te("Solo admin desactivado", "Admin only OFF")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/55 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">{te("Links de invitación", "Invite links")}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {te(
                      "Se genera un enlace automáticamente. Usá el QR o los botones para copiar o compartir.",
                      "An invite link is created automatically. Use the QR or the buttons to copy or share."
                    )}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inviteLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {te("No se pudo crear el enlace. Reintentá más tarde.", "Could not create invite link. Try again later.")}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {inviteLinks.map((link) => {
                        const fullUrl = buildEventInviteUrl(inviteOrigin, link.token)
                        const qrSrc = inviteQrById[link.inviteId]
                        return (
                          <div
                            key={link.inviteId}
                            className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/10 p-4 dark:bg-muted/5 sm:flex-row sm:items-stretch"
                          >
                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="text-xs">
                                <p className="font-medium text-foreground">
                                  {link.targetRole} · {link.usedCount}/{link.maxUses === 0 ? "∞" : link.maxUses}
                                </p>
                                <p className="mt-1 break-all font-mono text-[11px] leading-snug text-muted-foreground">
                                  {fullUrl || te("Cargando URL…", "Loading URL…")}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-border/60"
                                  onClick={() => copyEventInviteUrl(link.token)}
                                >
                                  <Copy className="mr-1 size-3.5" aria-hidden />
                                  {t("common.copy")}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-border/60"
                                  onClick={() => shareEventInviteUrl(link.token)}
                                >
                                  <Share2 className="mr-1 size-3.5" aria-hidden />
                                  {te("Compartir", "Share")}
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="rounded-xl"
                                  onClick={() => handleDeleteInvite(link.inviteId)}
                                >
                                  <UserX className="mr-1 size-3.5" aria-hidden />
                                  {t("common.disable")}
                                </Button>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-center justify-center gap-2 sm:border-l sm:border-border/50 sm:pl-4">
                              {qrSrc ? (
                                <img
                                  src={qrSrc}
                                  alt=""
                                  className="size-36 rounded-xl border border-border/60 bg-background p-1.5 shadow-sm"
                                />
                              ) : (
                                <div className="flex size-36 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/50">
                                  <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
                                </div>
                              )}
                              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                <QrCode className="size-3" aria-hidden />
                                QR
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <details className="group rounded-xl border border-border/55 bg-background/40 px-3 py-2 dark:bg-background/20">
                    <summary className="cursor-pointer list-none py-2 text-sm font-medium outline-none marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center justify-between gap-2">
                        {te("Crear otro enlace (rol / cupos)", "Create another link (role / uses)")}
                        <span className="text-xs font-normal text-muted-foreground group-open:rotate-180">▼</span>
                      </span>
                    </summary>
                    <div className="grid grid-cols-1 gap-2 border-t border-border/40 pb-3 pt-3 sm:grid-cols-3">
                      <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                        <SelectTrigger className="w-full rounded-xl border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GUEST">GUEST</SelectItem>
                          <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={inviteMaxUses}
                        onChange={(e) => setInviteMaxUses(e.target.value)}
                        className="rounded-xl border-border/60"
                        placeholder={te("máx usos (0 ilimitado)", "max uses (0 unlimited)")}
                      />
                      <Button type="button" className="rounded-xl" onClick={handleCreateInvite}>
                        {t("common.createLink")}
                      </Button>
                    </div>
                  </details>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/55 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{te("Ubicación del evento", "Event location")}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {te("Cambios", "Changes")}: {(eventData as any)?.locationChangeCount ?? 0}/2
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {te(
                      "Configura la ubicación del evento. Se publicará automáticamente en el chat del grupo.",
                      "Set the event location. It will be automatically posted in the group chat."
                    )}
                  </p>
                  {members.length === 0 && (
                    <div className="mt-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        ⚠️ {te(
                          "El grupo del evento aún no existe. Primero aprueba participantes en la pestaña 'Solicitudes' para crear el grupo.",
                          "The event group doesn't exist yet. First approve participants in the 'Requests' tab to create the group."
                        )}
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {(eventData as any)?.locationChangeCount >= 2 ? (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
                      <p className="text-sm font-medium text-destructive">
                        {te("Límite de cambios alcanzado (2/2)", "Change limit reached (2/2)")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {te("No puedes cambiar más la ubicación de este evento.", "You cannot change this event's location anymore.")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="event-settings-address" className={FORM_LABEL}>
                          {te("Dirección exacta", "Exact address")}
                        </Label>
                        <LocationInput
                          id="event-settings-address"
                          value={locationExact}
                          onChange={(value, coords) => {
                            setLocationExact(value)
                            if (coords) setLocationCoords(coords)
                            if (!locationZone) setLocationZone(value.split(",")[0]?.trim() || "")
                          }}
                          placeholder={te("Dirección exacta del evento", "Exact event address")}
                          valueFormat="full"
                          countryCode={countryCode}
                          biasCoordinates={locationCoords ?? undefined}
                          maxLength={280}
                        />
                      </div>
                      <AddressMapPicker
                        bootstrapCountryCode={countryCode}
                        latitude={locationCoords?.latitude ?? null}
                        longitude={locationCoords?.longitude ?? null}
                        onLocationChange={(c, addressLine) => {
                          setLocationCoords({ latitude: c.latitude, longitude: c.longitude })
                          setLocationExact(addressLine)
                          setLocationZone((z) => z.trim() || addressLine.split(",")[0]?.trim() || "")
                        }}
                        labels={{
                          myLocation: te("Mi ubicación", "My location"),
                          syncHint: te(
                            "Toca el mapa o arrastra el pin; se actualiza la dirección.",
                            "Tap the map or drag the pin; the address updates."
                          ),
                          locatingGps: te("Ubicando…", "Locating…"),
                        }}
                        helperText={te(
                          "Prioriza resultados en tu país y usa tu GPS como punto inicial.",
                          "Results favor your country; GPS seeds the initial pin when allowed."
                        )}
                        className="mt-2"
                      />
                      <div className="space-y-1.5">
                        <Label htmlFor="event-settings-zone" className={FORM_LABEL}>
                          {te("Zona / barrio", "Zone / neighborhood")}
                        </Label>
                        <Input
                          id="event-settings-zone"
                          className={FORM_CONTROL_INPUT}
                          value={locationZone}
                          onChange={(e) => setLocationZone(e.target.value)}
                          placeholder={te("Ej: Chapinero, Bogotá", "e.g. Downtown, NYC")}
                          autoComplete="off"
                        />
                      </div>
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          ℹ️ {te(
                            "Al publicar, la ubicación se guardará como oficial y se compartirá automáticamente en el chat. Máximo 2 cambios por evento.",
                            "When published, the location will be saved as official and automatically shared in chat. Max 2 changes per event."
                          )}
                        </p>
                      </div>
                      <Button
                        onClick={handleUpdateLocation}
                        disabled={isUpdatingLocation || !locationExact.trim()}
                        className="w-full"
                      >
                        {isUpdatingLocation ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {te("Publicando...", "Publishing...")}
                          </>
                        ) : (
                          te("Publicar ubicación en el chat", "Publish location in chat")
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
        )}
      </Tabs>
      </div>

      <JoinMeetupDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        availableSpots={maxGuests > 0 ? Math.max(0, maxGuests - approvedCount) : null}
        eligiblePool={eligibleInviteesPool as JoinEligibleUser[]}
        eligibleLoading={eligibleInviteesLoading}
        te={te}
        onSoloJoin={async (msg) => {
          setIsCreatingSoloJoin(true)
          try {
            await eventService.groupJoinRequests.create(eventId, [], msg)
            toast.success(te("Solicitud enviada", "Request sent"))
            await loadEvent()
          } finally {
            setIsCreatingSoloJoin(false)
          }
        }}
        onGroupJoin={async (invitees, msg) => {
          setIsCreatingGroupInvite(true)
          try {
            const ids = invitees.map((u) => u.userId)
            await eventService.groupJoinRequests.create(eventId, ids, msg)
            toast.success(
              te(
                "Solicitud grupal enviada. Todos deben aceptar antes de que llegue al organizador.",
                "Group request sent. Everyone must accept before it reaches the organizer."
              )
            )
          } finally {
            setIsCreatingGroupInvite(false)
          }
        }}
      />
    </div>
  )
}
