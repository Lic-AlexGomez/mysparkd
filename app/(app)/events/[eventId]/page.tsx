"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { groupService } from "@/lib/services/group"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"

const MAX_VIDEO_DURATION_SECONDS = 180
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LocationInput } from "@/components/ui/location-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, Loader2, MessageCircle, Shield, Star, Trash2, UserMinus, UserX, Volume2, VolumeX } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { EventCapacityUpdate, EventGroupJoinRequest, EventGroupMember, EventGroupMessage, EventParticipant, ReactionType } from "@/lib/types"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"

const normalizeEventId = (raw: any) => String(raw?.eventId || raw?.id || "")
const normalizeMessageId = (raw: any) => String(raw?.id || raw?.messageId || "")

export default function EventDetailPage() {
  const { te, t } = useI18n()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const eventId = String(params.eventId || "")
  const { subscribeToEventGroup, subscribeToEventCapacity } = useWebSocket(user?.userId, {})

  const [activeTab, setActiveTab] = useState("chat")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [eventData, setEventData] = useState<any>(null)
  const [messages, setMessages] = useState<EventGroupMessage[]>([])
  const [members, setMembers] = useState<EventGroupMember[]>([])
  const [pendingParticipants, setPendingParticipants] = useState<EventParticipant[]>([])
  const [pendingGroupRequests, setPendingGroupRequests] = useState<EventGroupJoinRequest[]>([])
  const [myPendingGroupRequests, setMyPendingGroupRequests] = useState<EventGroupJoinRequest[]>([])
  const [groupSettings, setGroupSettings] = useState<{ slowMode: boolean; adminOnlyMode: boolean }>({
    slowMode: false,
    adminOnlyMode: false,
  })
  const [capacity, setCapacity] = useState<EventCapacityUpdate | null>(null)
  const [inviteLinks, setInviteLinks] = useState<any[]>([])
  const [inviteRole, setInviteRole] = useState<"GUEST" | "MODERATOR">("GUEST")
  const [inviteMaxUses, setInviteMaxUses] = useState("0")
  const [officialAddressText, setOfficialAddressText] = useState("")
  const [isSavingOfficialAddress, setIsSavingOfficialAddress] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [shareAddressText, setShareAddressText] = useState("")
  const [isSharingAddress, setIsSharingAddress] = useState(false)
  const [inviteeQuery, setInviteeQuery] = useState("")
  const [inviteeSuggestions, setInviteeSuggestions] = useState<Array<{ userId: string; username: string; fullName?: string; photo?: string }>>([])
  const [selectedInvitees, setSelectedInvitees] = useState<Array<{ userId: string; username: string; fullName?: string; photo?: string }>>([])
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingScore, setRatingScore] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const myUserId = String(user?.userId || "")
  const myMember = members.find((m) => String(m.userId) === myUserId)
  const myRole = (myMember?.role || "").toUpperCase()
  const isAdmin = myRole === "ADMIN"
  const isModerator = myRole === "MODERATOR" || isAdmin
  const isGuest = myRole === "GUEST"
  const mutedUntil = myMember?.mutedUntil ? new Date(myMember.mutedUntil) : null
  const isMuted = Boolean(mutedUntil && mutedUntil.getTime() > Date.now())
  const canSend = !isMuted && (!groupSettings.adminOnlyMode || isAdmin) && (!groupSettings.slowMode || isAdmin || isModerator)
  const normalizeAddress = (value?: string | null) =>
    String(value || "").trim().toLowerCase().replace(/\s+/g, " ")

  const upsertMessage = (incoming: EventGroupMessage) => {
    const incomingId = normalizeMessageId(incoming)
    setMessages((prev) => {
      if (!incomingId) return [...prev, incoming]
      const idx = prev.findIndex((m) => normalizeMessageId(m) === incomingId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...incoming, id: incomingId }
        return next
      }
      return [...prev, { ...incoming, id: incomingId }]
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
        msgRows = await eventService.groupMessages.list(eventId)
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
      setMessages((Array.isArray(msgRows) ? msgRows : []).map((m) => ({ ...m, id: normalizeMessageId(m) })))
      const normalizedMembers = Array.isArray(memberRows) ? memberRows : []
      setMembers(normalizedMembers)

      const me = normalizedMembers.find((m) => String(m.userId) === myUserId)
      const isAdminLoaded = (me?.role || "").toUpperCase() === "ADMIN"
      const groupId = String((detail as any)?.groupId || eventId)
      setGroupSettings({
        slowMode: Boolean((detail as any)?.slowMode),
        adminOnlyMode: Boolean((detail as any)?.adminOnlyMode),
      })

      if (isAdminLoaded) {
        const [links, pendingUsers, pendingRequests] = await Promise.all([
          eventService.inviteLinks.list(eventId).catch(() => []),
          eventService.participants.pending(eventId).catch(() => []),
          eventService.groupJoinRequests.pendingAdmin(eventId).catch(() => []),
        ])
        setInviteLinks(links)
        setPendingParticipants(pendingUsers)
        setPendingGroupRequests(pendingRequests)
      } else {
        setInviteLinks([])
        setPendingParticipants([])
        setPendingGroupRequests([])
      }

      // Solicitudes grupales pendientes para el usuario actual (invitado)
      const mine = await eventService.groupJoinRequests.myPending().catch(() => [])
      setMyPendingGroupRequests(
        (Array.isArray(mine) ? mine : []).filter((r) => {
          const requestEventId = String(r.eventId || "")
          const requestGroupId = String((r as any)?.groupId || "")
          return requestEventId === eventId || requestGroupId === groupId
        })
      )
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

  useEffect(() => {
    const tab = String(searchParams.get("tab") || "").toLowerCase()
    if (tab === "chat" || tab === "members" || tab === "requests" || tab === "settings") {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    const savedOfficial = String((eventData as any)?.officialAddress || "")
    setOfficialAddressText(savedOfficial)
  }, [eventData?.eventId, (eventData as any)?.officialAddress])

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
        setMessages((prev) =>
          prev.map((m) => (m.poll?.id === payload.poll.id ? { ...m, poll: payload.poll } : m))
        )
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
      [...messages].sort(
        (a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()
      ),
    [messages]
  )

  const formatTime = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""

  const clearComposer = () => {
    setMessageText("")
    setMediaFile(null)
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

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      await eventService.join(eventId)
      toast.success(te("Solicitud enviada", "Request sent"))
      await loadEvent()
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo solicitar participación", "Could not request participation"))
    } finally {
      setIsJoining(false)
    }
  }

  const handleSend = async () => {
    const content = messageText.trim()
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

  const handleReact = async (messageId: string, reactionType: ReactionType) => {
    try {
      await eventService.reactions.toggleMessageReaction(messageId, reactionType)
      toast.success(te("Reacción actualizada", "Reaction updated"))
      const rows = await eventService.groupMessages.list(eventId)
      setMessages(rows.map((m) => ({ ...m, id: normalizeMessageId(m) })))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo reaccionar", "Could not react"))
    }
  }

  const handleCreatePoll = async () => {
    const question = pollQuestion.trim()
    const options = pollOptions.split(",").map((v) => v.trim()).filter(Boolean)
    if (!question || options.length < 2) {
      toast.error(te("Pregunta y al menos 2 opciones", "Question and at least 2 options are required"))
      return
    }
    try {
      const pollMsg = await eventService.polls.create(eventId, { question, options })
      upsertMessage(pollMsg)
      setPollQuestion("")
      setPollOptions("")
      toast.success(te("Encuesta creada", "Poll created"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear la encuesta", "Could not create poll"))
    }
  }

  const handleVotePoll = async (optionId: string, pollId: string) => {
    try {
      const updatedPoll = await eventService.polls.vote(eventId, optionId)
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
          setMessages(rows.map((m) => ({ ...m, id: normalizeMessageId(m) })))
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
      setInviteLinks((prev) => prev.filter((l) => l.inviteId !== linkId))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo eliminar link", "Could not delete link"))
    }
  }

  const handleApproveParticipant = async (userId: string) => {
    const officialAddress = String((eventData as any)?.officialAddress || "").trim()
    const sharedAddress = String((eventData as any)?.sharedAddress || "").trim()
    const backendMatched = (eventData as any)?.addressMatched
    const addressMatched = typeof backendMatched === "boolean"
      ? backendMatched
      : normalizeAddress(officialAddress) !== "" && normalizeAddress(officialAddress) === normalizeAddress(sharedAddress)
    if (!officialAddress || !addressMatched) {
      toast.error(
        te(
          "Para aprobar participantes primero configura la dirección oficial y asegúrate de que coincida con la compartida en el chat.",
          "To approve participants, first set the official address and ensure it matches the one shared in chat."
        )
      )
      return
    }
    try {
      await eventService.approveParticipant(eventId, userId)
      setPendingParticipants((prev) => prev.filter((p) => p.userId !== userId))
      const refreshedMembers = await eventService.groupMembers.list(eventId)
      setMembers(refreshedMembers)
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
    const sharedAddress = String((eventData as any)?.sharedAddress || "").trim()
    const backendMatched = (eventData as any)?.addressMatched
    const addressMatched = typeof backendMatched === "boolean"
      ? backendMatched
      : normalizeAddress(officialAddress) !== "" && normalizeAddress(officialAddress) === normalizeAddress(sharedAddress)
    if (!officialAddress || !addressMatched) {
      toast.error(
        te(
          "Para aprobar solicitudes grupales primero valida la dirección del meetup.",
          "To approve group requests, first validate meetup address."
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

  const handleCreateGroupJoinRequest = async () => {
    const inviteeUserIds = selectedInvitees.map((u) => u.userId)
    if (inviteeUserIds.length === 0) {
      toast.error(te("Agrega al menos un usuario para invitar", "Add at least one user to invite"))
      return
    }
    try {
      await eventService.groupJoinRequests.create(eventId, inviteeUserIds)
      toast.success(te("Solicitud grupal creada", "Group request created"))
      setSelectedInvitees([])
      setInviteeQuery("")
      const mine = await eventService.groupJoinRequests.myPending().catch(() => [])
      setMyPendingGroupRequests(
        (Array.isArray(mine) ? mine : []).filter((r) => String(r.eventId || "") === eventId)
      )
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear solicitud grupal", "Could not create group request"))
    }
  }

  const handleRespondGroupInvite = async (requestId: string, accept: boolean) => {
    try {
      await eventService.groupJoinRequests.respond(requestId, accept)
      setMyPendingGroupRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success(accept ? te("Invitación aceptada", "Invitation accepted") : te("Invitación rechazada", "Invitation rejected"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo responder invitación", "Could not respond to invitation"))
    }
  }

  const handleShareAddress = async () => {
    const address = shareAddressText.trim()
    if (!address) {
      toast.error(te("Ingresa una dirección", "Enter an address"))
      return
    }
    const officialAddress = String((eventData as any)?.officialAddress || "").trim()
    if (!officialAddress) {
      toast.error(
        te(
          "Primero debes guardar la dirección oficial del evento.",
          "You must save the event official address first."
        )
      )
      return
    }
    setIsSharingAddress(true)
    try {
      const response = await eventService.shareAddress(eventId, address)
      const matchedFromBackend = response?.matched
      const matched =
        typeof matchedFromBackend === "boolean"
          ? matchedFromBackend
          : normalizeAddress(officialAddress) === normalizeAddress(address)
      setEventData((prev: any) => ({
        ...prev,
        sharedAddress: address,
        officialAddress: prev?.officialAddress || officialAddress,
        addressMatched: matched,
        locationVerified: matched,
      }))
      if (matched) {
        toast.success(
          te(
            "Dirección validada y compartida. Ya puedes aprobar participantes.",
            "Address validated and shared. You can now approve participants."
          )
        )
      } else {
        toast.error(
          response?.message ||
            te(
              "La dirección compartida no coincide con la oficial. Actualízala para poder aprobar participantes.",
              "Shared address does not match official one. Update it before approving participants."
            )
        )
      }
      setShareAddressText("")
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo compartir la dirección", "Could not share address"))
    } finally {
      setIsSharingAddress(false)
    }
  }

  const handleSaveOfficialAddress = async () => {    const next = officialAddressText.trim()
    if (!next) {
      toast.error(
        te(
          "La dirección oficial es obligatoria para crear y moderar el meetup.",
          "Official address is required to create and moderate meetup."
        )
      )
      return
    }
    setIsSavingOfficialAddress(true)
    try {
      await eventService.setOfficialAddress(eventId, next)
      setEventData((prev: any) => ({
        ...prev,
        officialAddress: next,
      }))
      toast.success(
        te(
          "Dirección oficial guardada.",
          "Official address saved."
        )
      )
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo guardar la dirección oficial.", "Could not save official address."))
    } finally {
      setIsSavingOfficialAddress(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const q = inviteeQuery.trim()
      if (q.length < 2) {
        setInviteeSuggestions([])
        return
      }
      try {
        const rows = await groupService.searchUsersByInput(q)
        if (cancelled) return
        setInviteeSuggestions(
          rows.filter((u) =>
            u.userId !== myUserId &&
            !selectedInvitees.some((s) => s.userId === u.userId)
          )
        )
      } catch {
        if (!cancelled) setInviteeSuggestions([])
      }
    }
    const t = setTimeout(() => void run(), 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [inviteeQuery, myUserId, selectedInvitees])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const approvedCount = Number(capacity?.currentApprovedCount ?? eventData?.currentApprovedCount ?? 0)
  const maxGuests = Number(capacity?.maxGuests ?? eventData?.maxGuests ?? 0)
  const officialAddressSaved = String((eventData as any)?.officialAddress || "").trim()
  const sharedAddressSaved = String((eventData as any)?.sharedAddress || "").trim()
  const backendMatched = (eventData as any)?.addressMatched
  const isAddressMatched = typeof backendMatched === "boolean"
    ? backendMatched
    : normalizeAddress(officialAddressSaved) !== "" &&
      normalizeAddress(officialAddressSaved) === normalizeAddress(sharedAddressSaved)
  const canApproveByAddress = Boolean(officialAddressSaved) && isAddressMatched
  const canViewAddress = isAdmin || isModerator || isGuest
  const locationStatus: "pending" | "matched" | "mismatch" =
    !officialAddressSaved || !sharedAddressSaved
      ? "pending"
      : isAddressMatched
        ? "matched"
        : "mismatch"

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="icon" onClick={() => router.push("/events")} className="mb-3">
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{eventData?.title || eventData?.name || te("Evento", "Event")}</CardTitle>
          <p className="text-sm text-muted-foreground">{eventData?.description || te("Sin descripción", "No description")}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{eventData?.status || "OPEN"}</Badge>
          {eventData?.category && <Badge className="bg-primary/10 text-primary border-0">{eventData.category}</Badge>}
          <Badge className="bg-secondary/10 text-secondary border-0">
            {te("Cupos", "Spots")}: {maxGuests ? `${approvedCount}/${maxGuests}` : approvedCount}
          </Badge>
          <Button onClick={handleJoin} disabled={isJoining} className="ml-auto">
            {isJoining ? te("Enviando...", "Sending...") : te("Solicitar participación", "Request participation")}
          </Button>
          <div className="w-full rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
            <div className="mb-2 flex items-center gap-2">
              <Badge
                className={
                  locationStatus === "matched"
                    ? "bg-emerald-500/15 text-emerald-500 border-0"
                    : locationStatus === "mismatch"
                      ? "bg-rose-500/15 text-rose-500 border-0"
                      : "bg-amber-500/15 text-amber-500 border-0"
                }
              >
                {locationStatus === "matched"
                  ? te("Ubicación: Coincide", "Location: Matched")
                  : locationStatus === "mismatch"
                    ? te("Ubicación: No coincide", "Location: Mismatch")
                    : te("Ubicación: Pendiente", "Location: Pending")}
              </Badge>
            </div>
            <p>
              {canApproveByAddress
                ? te(
                    "Ubicación validada: los participantes aprobados verán la dirección del meetup en el chat.",
                    "Location validated: approved participants will see meetup address in chat."
                  )
                : te(
                    "Moderación de ubicación activa: hasta validar la coincidencia de direcciones no se podrán aprobar nuevas personas.",
                    "Location moderation active: new people cannot be approved until address match is validated."
                  )}
            </p>
            {canViewAddress && isAddressMatched && sharedAddressSaved ? (
              <p className="mt-2 font-medium text-foreground">
                {te("Ubicación del meetup", "Meetup location")}: {sharedAddressSaved}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="chat">{te("Chat", "Chat")}</TabsTrigger>
          <TabsTrigger value="members">{t("common.members")}</TabsTrigger>
          <TabsTrigger value="requests">{t("common.requests")}</TabsTrigger>
          <TabsTrigger value="settings">{t("common.settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {te("Chat del evento", "Event chat")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isMuted
                  ? te(`Silenciado hasta ${mutedUntil?.toLocaleString()}`, `Muted until ${mutedUntil?.toLocaleString()}`)
                  : groupSettings.adminOnlyMode && !isAdmin
                    ? te("Solo el administrador puede escribir", "Only the admin can write")
                    : groupSettings.slowMode && isGuest
                      ? te("Solo moderadores pueden escribir", "Only moderators can write")
                      : te("Escribe y participa en tiempo real", "Write and participate in real time")}
              </p>
              <p className="text-xs text-muted-foreground">
                {te(
                  "Por seguridad, mantén la coordinación dentro de este chat. Fuera de Spark no podemos verificar ubicación ni asistencia.",
                  "For safety, keep coordination inside this chat. Outside Spark we cannot verify location or attendance."
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border p-3 space-y-2">
                {sortedMessages.map((m, idx) => {
                  const mine = String(m.senderId || "") === myUserId
                  const key = normalizeMessageId(m) || `${m.senderId || "system"}-${m.sentAt}-${idx}`
                  return (
                    <div key={key} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-xl border p-2.5 ${mine ? "bg-primary/10 border-primary/30" : "bg-card border-border"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {m.system ? te("Sistema", "System") : m.senderUsername || te("Usuario", "User")} · {formatTime(m.sentAt)}
                              {m.editedAt ? te(" · (editado)", " · (edited)") : ""}
                            </p>
                            <p className="text-sm">
                              {m.deleted ? te("Mensaje eliminado", "Message deleted") : m.content || ""}
                            </p>
                            {m.mediaType === "IMAGE" && m.mediaUrl && !m.deleted && (
                              <img src={m.mediaUrl} alt="media" className="mt-2 rounded-md max-h-56 object-cover" />
                            )}
                            {m.mediaType === "VIDEO" && m.mediaUrl && !m.deleted && (
                              <video controls src={m.mediaUrl} className="mt-2 rounded-md max-h-56 w-full" />
                            )}
                            {m.mediaType === "AUDIO" && m.mediaUrl && !m.deleted && (
                              <audio controls src={m.mediaUrl} className="mt-2 w-full" />
                            )}
                            {m.poll && (
                              <div className="mt-2 rounded-lg border border-border p-2 space-y-1">
                                <p className="text-xs font-semibold">{m.poll.question}</p>
                                {m.poll.options.map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`w-full rounded px-2 py-1 text-left text-xs ${opt.votedByMe ? "bg-primary/15" : "bg-muted/60 hover:bg-muted"}`}
                                    disabled={m.poll?.expired}
                                    onClick={() => handleVotePoll(opt.id, m.poll!.id)}
                                  >
                                    {opt.optionText} · {opt.voteCount}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {!m.deleted && (
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap gap-1">
                                {(Object.keys(reactionEmojiMap) as ReactionType[]).map((rt) => (
                                  <Button
                                    key={rt}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => handleReact(normalizeMessageId(m), rt)}
                                  >
                                    {reactionEmojiMap[rt]}
                                  </Button>
                                ))}
                              </div>
                              {canEditMessage(m) && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleEditMessage(m)}>
                                  {t("common.edit")}
                                </Button>
                              )}
                              {canDeleteMessage(m) && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={() => handleDeleteMessage(normalizeMessageId(m))}>
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  {t("common.delete")}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={te("Escribe un mensaje", "Write a message")}
                disabled={!canSend}
                className="min-h-20"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  disabled={!canSend}
                />
                {mediaFile && (
                  <Button type="button" variant="outline" onClick={() => setMediaFile(null)}>
                    {te("Quitar archivo", "Remove file")}
                  </Button>
                )}
              </div>
              <Button onClick={handleSend} disabled={(!messageText.trim() && !mediaFile) || isSending || !canSend} className="w-full">
                {isSending ? te("Enviando...", "Sending...") : te("Enviar mensaje", "Send message")}
              </Button>
            </CardContent>
          </Card>

          {(isAdmin || isModerator) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{te("Crear encuesta", "Create poll")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder={te("Pregunta", "Question")} />
                <Input value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} placeholder={te("Opciones separadas por coma", "Comma-separated options")} />
                <Button onClick={handleCreatePoll}>{te("Crear encuesta", "Create poll")}</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("common.members")}</CardTitle></CardHeader>
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

        <TabsContent value="requests" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{te("Crear solicitud grupal", "Create group request")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input
                  value={inviteeQuery}
                  onChange={(e) => setInviteeQuery(e.target.value)}
                  placeholder={te("Busca por @username", "Search by @username")}
              />
                {inviteeSuggestions.length > 0 && (
                  <div className="rounded-md border border-border max-h-40 overflow-auto">
                    {inviteeSuggestions.map((u) => (
                      <button
                        key={u.userId}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          setSelectedInvitees((prev) => [...prev, u])
                          setInviteeQuery("")
                          setInviteeSuggestions([])
                        }}
                      >
                        @{u.username} {u.fullName ? `· ${u.fullName}` : ""}
                      </button>
                    ))}
                  </div>
                )}
                {selectedInvitees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedInvitees.map((u) => (
                      <Badge key={u.userId} variant="secondary" className="cursor-pointer" onClick={() => setSelectedInvitees((prev) => prev.filter((p) => p.userId !== u.userId))}>
                        @{u.username} ✕
                      </Badge>
                    ))}
                  </div>
                )}
              <p className="text-xs text-muted-foreground">
                {te("Invita usuarios (matches o seguidores mutuos según reglas backend).", "Invite users (matches or mutual followers based on backend rules).")}
              </p>
              <Button onClick={handleCreateGroupJoinRequest}>{te("Crear solicitud", "Create request")}</Button>
            </CardContent>
          </Card>

          {isAdmin ? (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">{te("Pendientes individuales", "Individual pending")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {!canApproveByAddress && (
                    <p className="text-xs text-amber-500">
                      {te(
                        "No puedes aprobar hasta validar coincidencia de ubicación.",
                        "You cannot approve until location match is validated."
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
                                  "Valida dirección oficial y compartida para aprobar",
                                  "Validate official/shared address before approving"
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

              <Card>
                <CardHeader><CardTitle className="text-base">{te("Solicitudes grupales", "Group requests")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {!canApproveByAddress && (
                    <p className="text-xs text-amber-500">
                      {te(
                        "La aprobación grupal está bloqueada hasta validar la ubicación.",
                        "Group approval is blocked until location is validated."
                      )}
                    </p>
                  )}
                  {pendingGroupRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{te("No hay solicitudes grupales pendientes.", "No pending group requests.")}</p>
                  ) : pendingGroupRequests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="font-medium">{r.inviterUsername} · {r.status}</p>
                      <p className="text-xs text-muted-foreground">{r.members.map((m) => `${m.username} (${m.status})`).join(", ")}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveGroupRequest(r.id)}
                          disabled={!canApproveByAddress}
                          title={
                            canApproveByAddress
                              ? undefined
                              : te(
                                  "Valida dirección oficial y compartida para aprobar",
                                  "Validate official/shared address before approving"
                                )
                          }
                        >
                          {te("Aprobar", "Approve")}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectGroupRequest(r.id)}>{te("Rechazar", "Reject")}</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">{te("Mis invitaciones pendientes", "My pending invitations")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {myPendingGroupRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{te("No tienes invitaciones pendientes.", "You have no pending invitations.")}</p>
                  ) : myPendingGroupRequests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="font-medium">{r.inviterUsername} · {r.status}</p>
                      <p className="text-xs text-muted-foreground">{r.members.map((m) => `${m.username} (${m.status})`).join(", ")}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRespondGroupInvite(r.id, true)}>{te("Aceptar", "Accept")}</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRespondGroupInvite(r.id, false)}>{te("Rechazar", "Reject")}</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  {te("Solo ADMIN puede aprobar solicitudes para entrada al grupo.", "Only ADMIN can approve requests to enter the group.")}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          {isAdmin ? (
            <>
              <Card>
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

              <Card>
                <CardHeader><CardTitle className="text-base">{te("Links de invitación", "Invite links")}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUEST">GUEST</SelectItem>
                        <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={inviteMaxUses} onChange={(e) => setInviteMaxUses(e.target.value)} placeholder={te("máx usos (0 ilimitado)", "max uses (0 unlimited)")} />
                    <Button onClick={handleCreateInvite}>{t("common.createLink")}</Button>
                  </div>
                  <div className="space-y-2">
                    {inviteLinks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{te("No hay links activos.", "No active links.")}</p>
                    ) : inviteLinks.map((link) => (
                      <div key={link.inviteId} className="rounded-lg border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs">
                          <p className="font-mono">{link.token}</p>
                          <p className="text-muted-foreground">{link.targetRole} · {link.usedCount}/{link.maxUses === 0 ? "∞" : link.maxUses}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              await navigator.clipboard.writeText(`${window.location.origin}/events?token=${link.token}`)
                              toast.success(te("Link copiado", "Link copied"))
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            {t("common.copy")}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteInvite(link.inviteId)}>
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            {t("common.disable")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">{te("Dirección oficial del meetup", "Official meetup address")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <LocationInput
                    value={officialAddressText}
                    onChange={(value) => setOfficialAddressText(value)}
                    placeholder={te("Ej: Calle 123 #45-67, Bogotá", "Ex: 123 Main St, City")}
                    valueFormat="full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {te(
                      "Obligatoria. Esta dirección es la referencia para moderación y debe coincidir con la compartida en el chat.",
                      "Required. This address is moderation reference and must match the one shared in chat."
                    )}
                  </p>
                  <Button onClick={handleSaveOfficialAddress} disabled={isSavingOfficialAddress || !officialAddressText.trim()}>
                    {isSavingOfficialAddress ? te("Guardando...", "Saving...") : t("common.save")}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">{te("Compartir dirección del evento", "Share event address")}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <LocationInput
                    value={shareAddressText}
                    onChange={(value) => setShareAddressText(value)}
                    placeholder={te("Ej: Calle 123 #45-67, Bogotá", "Ex: 123 Main St, City")}
                    valueFormat="full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {te("Solo ADMIN. El backend valida que coincida con la dirección oficial del evento.", "ADMIN only. Backend validates it matches the official event address.")}
                  </p>
                  <Button onClick={handleShareAddress} disabled={isSharingAddress || !shareAddressText.trim() || !officialAddressSaved}>
                    {isSharingAddress ? te("Compartiendo...", "Sharing...") : te("Compartir en chat", "Share in chat")}
                  </Button>
                  {officialAddressSaved ? (
                    <p className={`text-xs ${isAddressMatched ? "text-emerald-500" : "text-amber-500"}`}>
                      {isAddressMatched
                        ? te("Dirección compartida validada.", "Shared address validated.")
                        : te("Pendiente validar coincidencia entre dirección oficial y compartida.", "Pending address match between official and shared address.")}
                    </p>
                  ) : (
                    <p className="text-xs text-rose-500">
                      {te("Debes guardar la dirección oficial antes de compartirla con el grupo.", "You must save official address before sharing it with the group.")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1" />
                {te("Solo ADMIN puede modificar ajustes e invitaciones.", "Only ADMIN can modify settings and invitations.")}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
