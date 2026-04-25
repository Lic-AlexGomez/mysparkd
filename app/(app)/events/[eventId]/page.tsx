"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { groupService } from "@/lib/services/group"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Copy, Loader2, MessageCircle, Shield, Trash2, UserMinus, UserX, Volume2, VolumeX } from "lucide-react"
import type { EventCapacityUpdate, EventGroupJoinRequest, EventGroupMember, EventGroupMessage, EventParticipant, ReactionType } from "@/lib/types"
import { toast } from "sonner"

const normalizeEventId = (raw: any) => String(raw?.eventId || raw?.id || "")
const normalizeMessageId = (raw: any) => String(raw?.id || raw?.messageId || "")

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
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
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [inviteeQuery, setInviteeQuery] = useState("")
  const [inviteeSuggestions, setInviteeSuggestions] = useState<Array<{ userId: string; username: string; fullName?: string; photo?: string }>>([])
  const [selectedInvitees, setSelectedInvitees] = useState<Array<{ userId: string; username: string; fullName?: string; photo?: string }>>([])

  const myUserId = String(user?.userId || "")
  const myMember = members.find((m) => String(m.userId) === myUserId)
  const myRole = (myMember?.role || "").toUpperCase()
  const isAdmin = myRole === "ADMIN"
  const isModerator = myRole === "MODERATOR" || isAdmin
  const isGuest = myRole === "GUEST"
  const mutedUntil = myMember?.mutedUntil ? new Date(myMember.mutedUntil) : null
  const isMuted = Boolean(mutedUntil && mutedUntil.getTime() > Date.now())
  const canSend = !isMuted && (!groupSettings.adminOnlyMode || isAdmin) && (!groupSettings.slowMode || isAdmin || isModerator)

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
      const [detail, msgRows, memberRows] = await Promise.all([
        eventService.getById(eventId),
        eventService.groupMessages.list(eventId),
        eventService.groupMembers.list(eventId),
      ])

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
      toast.error(error?.message || "No se pudo cargar el evento")
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
        toast.error("Fuiste expulsado del grupo del evento")
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

  const handleJoin = async () => {
    setIsJoining(true)
    try {
      await eventService.join(eventId)
      toast.success("Solicitud enviada")
      await loadEvent()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo solicitar participación")
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
        const uploaded = await eventService.uploadMedia(mediaFile)
        const mime = mediaFile.type || ""
        const mediaType = mime.startsWith("image/")
          ? "IMAGE"
          : mime.startsWith("video/")
            ? "VIDEO"
            : mime.startsWith("audio/")
              ? "AUDIO"
              : undefined

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
      toast.error(error?.message || "No se pudo enviar el mensaje")
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
      toast.success("Mensaje eliminado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar")
    }
  }

  const handleEditMessage = async (message: EventGroupMessage) => {
    const next = window.prompt("Editar mensaje", message.content || "")
    if (next == null || !next.trim()) return
    try {
      const updated = await eventService.groupMessages.edit(eventId, normalizeMessageId(message), next.trim())
      upsertMessage(updated)
      toast.success("Mensaje editado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo editar")
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
      toast.success("Reacción actualizada")
      const rows = await eventService.groupMessages.list(eventId)
      setMessages(rows.map((m) => ({ ...m, id: normalizeMessageId(m) })))
    } catch (error: any) {
      toast.error(error?.message || "No se pudo reaccionar")
    }
  }

  const handleCreatePoll = async () => {
    const question = pollQuestion.trim()
    const options = pollOptions.split(",").map((v) => v.trim()).filter(Boolean)
    if (!question || options.length < 2) {
      toast.error("Pregunta y al menos 2 opciones")
      return
    }
    try {
      const pollMsg = await eventService.polls.create(eventId, { question, options })
      upsertMessage(pollMsg)
      setPollQuestion("")
      setPollOptions("")
      toast.success("Encuesta creada")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear la encuesta")
    }
  }

  const handleVotePoll = async (optionId: string, pollId: string) => {
    try {
      const updatedPoll = await eventService.polls.vote(eventId, optionId)
      setMessages((prev) =>
        prev.map((m) => (m.poll?.id === pollId ? { ...m, poll: updatedPoll } : m))
      )
    } catch (error: any) {
      toast.error(error?.message || "No se pudo votar")
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
      toast.error(error?.message || "No se pudo actualizar mute")
    }
  }

  const handleKick = async (targetUserId: string) => {
    try {
      await eventService.groupMembers.kick(eventId, targetUserId)
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId))
      toast.success("Miembro expulsado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo expulsar")
    }
  }

  const handleUpdateSettings = async (slowMode: boolean, adminOnlyMode: boolean) => {
    try {
      await eventService.groupSettings.patch(eventId, { slowMode, adminOnlyMode })
      setGroupSettings({ slowMode, adminOnlyMode })
      toast.success("Ajustes actualizados")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar ajustes")
    }
  }

  const handleCreateInvite = async () => {
    try {
      const created = await eventService.inviteLinks.create(eventId, {
        targetRole: inviteRole,
        maxUses: Number(inviteMaxUses || "0"),
      })
      setInviteLinks((prev) => [created, ...prev])
      toast.success("Link creado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear el link")
    }
  }

  const handleDeleteInvite = async (linkId: string) => {
    try {
      await eventService.inviteLinks.remove(eventId, linkId)
      setInviteLinks((prev) => prev.filter((l) => l.inviteId !== linkId))
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar link")
    }
  }

  const handleApproveParticipant = async (userId: string) => {
    try {
      await eventService.approveParticipant(eventId, userId)
      setPendingParticipants((prev) => prev.filter((p) => p.userId !== userId))
      const refreshedMembers = await eventService.groupMembers.list(eventId)
      setMembers(refreshedMembers)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo aprobar")
    }
  }

  const handleRejectParticipant = async (userId: string) => {
    try {
      await eventService.rejectParticipant(eventId, userId)
      setPendingParticipants((prev) => prev.filter((p) => p.userId !== userId))
    } catch (error: any) {
      toast.error(error?.message || "No se pudo rechazar")
    }
  }

  const handleApproveGroupRequest = async (requestId: string) => {
    try {
      await eventService.groupJoinRequests.approve(eventId, requestId)
      setPendingGroupRequests((prev) => prev.filter((r) => r.id !== requestId))
      const refreshedMembers = await eventService.groupMembers.list(eventId)
      setMembers(refreshedMembers)
      toast.success("Solicitud grupal aprobada")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo aprobar solicitud grupal")
    }
  }

  const handleRejectGroupRequest = async (requestId: string) => {
    try {
      await eventService.groupJoinRequests.reject(eventId, requestId)
      setPendingGroupRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success("Solicitud grupal rechazada")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo rechazar solicitud grupal")
    }
  }

  const handleCreateGroupJoinRequest = async () => {
    const inviteeUserIds = selectedInvitees.map((u) => u.userId)
    if (inviteeUserIds.length === 0) {
      toast.error("Agrega al menos un usuario para invitar")
      return
    }
    try {
      await eventService.groupJoinRequests.create(eventId, inviteeUserIds)
      toast.success("Solicitud grupal creada")
      setSelectedInvitees([])
      setInviteeQuery("")
      const mine = await eventService.groupJoinRequests.myPending().catch(() => [])
      setMyPendingGroupRequests(
        (Array.isArray(mine) ? mine : []).filter((r) => String(r.eventId || "") === eventId)
      )
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear solicitud grupal")
    }
  }

  const handleRespondGroupInvite = async (requestId: string, accept: boolean) => {
    try {
      await eventService.groupJoinRequests.respond(requestId, accept)
      setMyPendingGroupRequests((prev) => prev.filter((r) => r.id !== requestId))
      toast.success(accept ? "Invitación aceptada" : "Invitación rechazada")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo responder invitación")
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Button variant="ghost" size="icon" onClick={() => router.push("/events")} className="mb-3">
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{eventData?.title || eventData?.name || "Evento"}</CardTitle>
          <p className="text-sm text-muted-foreground">{eventData?.description || "Sin descripción"}</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{eventData?.status || "OPEN"}</Badge>
          {eventData?.category && <Badge className="bg-primary/10 text-primary border-0">{eventData.category}</Badge>}
          <Badge className="bg-secondary/10 text-secondary border-0">
            Cupos: {maxGuests ? `${approvedCount}/${maxGuests}` : approvedCount}
          </Badge>
          <Button onClick={handleJoin} disabled={isJoining} className="ml-auto">
            {isJoining ? "Enviando..." : "Solicitar participación"}
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="requests">Solicitudes</TabsTrigger>
          <TabsTrigger value="settings">Ajustes</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat del evento
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isMuted
                  ? `Silenciado hasta ${mutedUntil?.toLocaleString()}`
                  : groupSettings.adminOnlyMode && !isAdmin
                    ? "Solo el administrador puede escribir"
                    : groupSettings.slowMode && isGuest
                      ? "Solo moderadores pueden escribir"
                      : "Escribe y participa en tiempo real"}
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
                              {m.system ? "Sistema" : m.senderUsername || "Usuario"} · {formatTime(m.sentAt)}
                              {m.editedAt ? " · (editado)" : ""}
                            </p>
                            <p className="text-sm">
                              {m.deleted ? "Mensaje eliminado" : m.content || ""}
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
                                  Editar
                                </Button>
                              )}
                              {canDeleteMessage(m) && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={() => handleDeleteMessage(normalizeMessageId(m))}>
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Eliminar
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
                placeholder="Escribe un mensaje"
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
                    Quitar archivo
                  </Button>
                )}
              </div>
              <Button onClick={handleSend} disabled={(!messageText.trim() && !mediaFile) || isSending || !canSend} className="w-full">
                {isSending ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </CardContent>
          </Card>

          {(isAdmin || isModerator) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crear encuesta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Pregunta" />
                <Input value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} placeholder="Opciones separadas por coma" />
                <Button onClick={handleCreatePoll}>Crear encuesta</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Miembros</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {members.map((m) => {
                const targetMuted = Boolean(m.mutedUntil && new Date(m.mutedUntil).getTime() > Date.now())
                return (
                  <div key={m.userId} className="rounded-lg border border-border p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{m.username}</p>
                      <p className="text-xs text-muted-foreground">{m.role}{targetMuted ? " · Silenciado" : ""}</p>
                    </div>
                    {(isAdmin || isModerator) && m.role !== "ADMIN" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleMuteToggle(m)}>
                          {targetMuted ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
                          {targetMuted ? "Unmute" : "Mute"}
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="destructive" onClick={() => handleKick(m.userId)}>
                            <UserMinus className="h-3.5 w-3.5 mr-1" />
                            Expulsar
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
            <CardHeader><CardTitle className="text-base">Crear solicitud grupal</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input
                  value={inviteeQuery}
                  onChange={(e) => setInviteeQuery(e.target.value)}
                  placeholder="Busca por @username"
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
                Invita usuarios (matches o seguidores mutuos según reglas backend).
              </p>
              <Button onClick={handleCreateGroupJoinRequest}>Crear solicitud</Button>
            </CardContent>
          </Card>

          {isAdmin ? (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Pendientes individuales</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {pendingParticipants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
                  ) : pendingParticipants.map((p) => (
                    <div key={p.userId} className="rounded-lg border border-border p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.username}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveParticipant(p.userId)}>Aprobar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectParticipant(p.userId)}>Rechazar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Solicitudes grupales</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {pendingGroupRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay solicitudes grupales pendientes.</p>
                  ) : pendingGroupRequests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="font-medium">{r.inviterUsername} · {r.status}</p>
                      <p className="text-xs text-muted-foreground">{r.members.map((m) => `${m.username} (${m.status})`).join(", ")}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveGroupRequest(r.id)}>Aprobar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectGroupRequest(r.id)}>Rechazar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Mis invitaciones pendientes</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {myPendingGroupRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tienes invitaciones pendientes.</p>
                  ) : myPendingGroupRequests.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="font-medium">{r.inviterUsername} · {r.status}</p>
                      <p className="text-xs text-muted-foreground">{r.members.map((m) => `${m.username} (${m.status})`).join(", ")}</p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleRespondGroupInvite(r.id, true)}>Aceptar</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRespondGroupInvite(r.id, false)}>Rechazar</Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Solo ADMIN puede aprobar solicitudes para entrada al grupo.
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-4">
          {isAdmin ? (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Ajustes del grupo</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant={groupSettings.slowMode ? "default" : "outline"}
                    onClick={() => handleUpdateSettings(!groupSettings.slowMode, groupSettings.adminOnlyMode)}
                  >
                    {groupSettings.slowMode ? "Slow mode ON" : "Slow mode OFF"}
                  </Button>
                  <Button
                    variant={groupSettings.adminOnlyMode ? "default" : "outline"}
                    onClick={() => handleUpdateSettings(groupSettings.slowMode, !groupSettings.adminOnlyMode)}
                  >
                    {groupSettings.adminOnlyMode ? "Solo admin ON" : "Solo admin OFF"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Invite links</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUEST">GUEST</SelectItem>
                        <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input value={inviteMaxUses} onChange={(e) => setInviteMaxUses(e.target.value)} placeholder="max uses (0 ilimitado)" />
                    <Button onClick={handleCreateInvite}>Crear link</Button>
                  </div>
                  <div className="space-y-2">
                    {inviteLinks.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay links activos.</p>
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
                              toast.success("Link copiado")
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copiar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteInvite(link.inviteId)}>
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            Desactivar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1" />
                Solo ADMIN puede modificar ajustes e invitaciones.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
