"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { EventGroupMessage, EventGroupMember, EventGroupJoinRequest } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FORM_CONTROL_TEXTAREA } from "@/lib/form-field-classes"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Loader2,
  Paperclip,
  Pencil,
  Reply,
  Send,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const MAX_VIDEO_DURATION_SECONDS = 180

const normalizeMessageId = (raw: any) => String(raw?.id || raw?.messageId || "")

function withNormalizedPoll(m: EventGroupMessage): EventGroupMessage {
  if (!m.poll) return m
  return {
    ...m,
    poll: {
      ...m.poll,
      options: (m.poll.options || []).map((o: any) => ({
        ...o,
        votes: Number(o.votes ?? o.voteCount ?? 0),
      })),
    },
  }
}

function isRedundant(m: EventGroupMessage) {
  return Boolean(m.system && m.content && /^📍/.test(m.content) && !m.pinned)
}

function formatTime(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    const url = URL.createObjectURL(file)
    video.preload = "metadata"
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration || 0) }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(0) }
    video.src = url
  })
}

export default function EventChatPage() {
  const { te } = useI18n()
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const eventId = params.eventId as string
  const myUserId = String(user?.userId || "")

  const { subscribeToEventGroup } = useWebSocket(user?.userId, {})

  const [eventTitle, setEventTitle] = useState<string>("")
  const [eventCoverUrl, setEventCoverUrl] = useState<string | null>(null)
  const [messages, setMessages] = useState<EventGroupMessage[]>([])
  const [members, setMembers] = useState<EventGroupMember[]>([])
  const [myPendingInvitation, setMyPendingInvitation] = useState<EventGroupJoinRequest | null>(null)
  const [isRespondingToInvitation, setIsRespondingToInvitation] = useState(false)
  const [groupSettings, setGroupSettings] = useState({ slowMode: false, adminOnlyMode: false })
  const [myRole, setMyRole] = useState("")
  const [messagePage, setMessagePage] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // composer
  const [messageText, setMessageText] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [replyTo, setReplyTo] = useState<{ messageId: string; username: string; snippet: string } | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)


  const chatFileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = myRole === "ADMIN"
  const canSend = !groupSettings.adminOnlyMode || isAdmin

  const upsertMessage = (incoming: EventGroupMessage) => {
    const normalized = withNormalizedPoll(incoming)
    const id = normalizeMessageId(normalized)
    setMessages((prev) => {
      if (!id) return [...prev, normalized]
      const idx = prev.findIndex((m) => normalizeMessageId(m) === id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = withNormalizedPoll({ ...next[idx], ...normalized, id })
        return next
      }
      return [...prev, { ...normalized, id }]
    })
  }

  // initial load
  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const [detail, msgRows] = await Promise.all([
          eventService.getById(eventId),
          eventService.groupMessages.list(eventId, 0, 50).catch(() => []),
        ])
        if (cancelled) return
        setEventTitle(String((detail as any)?._title || (detail as any)?.title || "MeetUp"))
        setEventCoverUrl(String((detail as any)?.coverPhotoUrl || "").trim() || null)
        const normalized = msgRows.map((m) => withNormalizedPoll({ ...m, id: normalizeMessageId(m) }))
        setMessages(normalized)
        setHasMoreMessages(normalized.length === 50)

        // member role
        try {
          const memberList = await eventService.groupMembers.list(eventId)
          if (!cancelled) {
            setMembers(memberList)
            const me = memberList.find((m) => String(m.userId) === myUserId)
            const roleRaw = (me?.role || (detail as any)?.myRole || "").toUpperCase()
            setMyRole(roleRaw)
          }
        } catch { /* endpoint may not exist yet */ }

        // pending invitations
        try {
          const pending = await eventService.groupJoinRequests.myPending()
          if (!cancelled) {
            const mine = (Array.isArray(pending) ? pending : [])
              .find((r) => String(r.eventId) === String(eventId)) ?? null
            setMyPendingInvitation(mine)
          }
        } catch { /* silencioso */ }
      } catch {
        if (!cancelled) toast.error(te("No se pudo cargar el chat", "Could not load chat"))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [eventId, myUserId])

  // scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isLoadingOlderMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length, isLoadingOlderMessages])

  // WebSocket
  useEffect(() => {
    if (!eventId || !user?.userId) return
    const unsub = subscribeToEventGroup(eventId, (payload: any) => {
      if (!payload) return
      if (!payload.type) { upsertMessage(payload as EventGroupMessage); return }
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
        setGroupSettings({ slowMode: Boolean(payload.slowMode), adminOnlyMode: Boolean(payload.adminOnlyMode) })
      }
      if (payload.type === "MEMBER_KICKED" && String(payload.userId) === myUserId) {
        toast.error(te("Fuiste expulsado del grupo del evento", "You were removed from the event group"))
        router.push("/chat")
      }
    })
    return () => { unsub?.() }
  }, [eventId, user?.userId, myUserId, subscribeToEventGroup, router])

  const loadOlderMessages = async () => {
    setIsLoadingOlderMessages(true)
    try {
      const next = messagePage + 1
      const older = await eventService.groupMessages.list(eventId, next, 50)
      const normalized = older.map((m) => withNormalizedPoll({ ...m, id: normalizeMessageId(m) }))
      if (normalized.length < 50) setHasMoreMessages(false)
      setMessages((prev) => [...normalized, ...prev])
      setMessagePage(next)
    } catch {
      toast.error(te("No se pudieron cargar mensajes anteriores", "Could not load older messages"))
    } finally {
      setIsLoadingOlderMessages(false)
    }
  }

  const handleSend = async () => {
    let content = messageText.trim()
    if (replyTo) {
      const snip = replyTo.snippet.replace(/\s+/g, " ").slice(0, 100)
      const head = `↪ ${replyTo.username}: «${snip}»`
      content = content ? `${head}\n\n${content}` : head
    }
    if (!content && !mediaFile) return
    setIsSending(true)
    try {
      let payload: any = { content }
      if (mediaFile) {
        const mime = mediaFile.type || ""
        const mediaType = mime.startsWith("image/") ? "IMAGE" : mime.startsWith("video/") ? "VIDEO" : mime.startsWith("audio/") ? "AUDIO" : undefined
        if (mediaType === "VIDEO") {
          const dur = Math.floor(await getVideoDuration(mediaFile))
          if (dur > MAX_VIDEO_DURATION_SECONDS) {
            toast.error(te("El video no puede durar más de 3 minutos", "Video cannot be longer than 3 minutes"))
            return
          }
          payload.durationSeconds = dur
        }
        const uploaded = await eventService.uploadMedia(mediaFile)
        payload = { ...payload, mediaUrl: uploaded.mediaUrl, mediaPublicId: uploaded.mediaPublicId, mediaType }
      }
      const created = await eventService.groupMessages.send(eventId, payload)
      upsertMessage(created)
      setMessageText("")
      setMediaFile(null)
      setReplyTo(null)
      if (chatFileInputRef.current) chatFileInputRef.current.value = ""
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo enviar el mensaje", "Could not send message"))
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (msgId: string) => {
    try {
      await eventService.groupMessages.remove(eventId, msgId)
      setMessages((prev) => prev.map((m) => normalizeMessageId(m) === msgId ? { ...m, deleted: true, content: null, mediaUrl: null, poll: null } : m))
      toast.success(te("Mensaje eliminado", "Message deleted"))
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo eliminar", "Could not delete"))
    }
  }

  const handleEdit = async (m: EventGroupMessage) => {
    const next = window.prompt(te("Editar mensaje", "Edit message"), m.content || "")
    if (next == null || !next.trim()) return
    try {
      const updated = await eventService.groupMessages.edit(eventId, normalizeMessageId(m), next.trim())
      upsertMessage(updated)
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo editar", "Could not edit"))
    }
  }

  const handleCopy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleRespondToInvitation = async (requestId: string, accept: boolean) => {
    setIsRespondingToInvitation(true)
    try {
      await eventService.groupJoinRequests.respond(requestId, accept)
      setMyPendingInvitation(null)
      toast.success(accept ? te("Aceptaste la invitación", "You accepted the invitation") : te("Rechazaste la invitación", "You declined the invitation"))
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo responder", "Could not respond"))
    } finally {
      setIsRespondingToInvitation(false)
    }
  }

  const sortedMessages = useMemo(
    () => [...messages].filter((m) => !isRedundant(m)).sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()),
    [messages]
  )

  const chatBgId = useMemo(() => {
    let h = 0
    for (let i = 0; i < eventId.length; i++) h = (h * 31 + eventId.charCodeAt(i)) & 0xffff
    return 10 + (h % 990)
  }, [eventId])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* ── HEADER ── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-3 py-2.5 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          onClick={() => router.push("/chat")}
          aria-label={te("Volver", "Back")}
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Button>

        {/* Event avatar → click goes to detail */}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-muted/60"
          onClick={() => router.push(`/events/${eventId}`)}
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
            {eventCoverUrl ? (
              <img src={eventCoverUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <CalendarDays className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{eventTitle}</p>
            <p className="text-xs text-muted-foreground">{te("Toca para ver detalles", "Tap to view details")}</p>
          </div>
        </button>
      </header>

      {/* ── INVITATION BANNER ── */}
      {myPendingInvitation && (
        <div className="shrink-0 border-b border-primary/20 bg-primary/8 px-4 py-3">
          <p className="text-sm font-semibold">
            {te(
              `@${myPendingInvitation.inviterUsername} te invitó a unirte en grupo`,
              `@${myPendingInvitation.inviterUsername} invited you to join as a group`
            )}
          </p>
          {myPendingInvitation.message ? (
            <p className="mt-0.5 text-xs italic text-muted-foreground">"{myPendingInvitation.message}"</p>
          ) : null}
          {myPendingInvitation.members.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {myPendingInvitation.members.map((m) => (
                <span key={m.userId} className="inline-flex items-center gap-1 text-xs">
                  {m.status === "ACCEPTED" ? (
                    <CheckCircle2 className="size-3 text-emerald-500" aria-hidden />
                  ) : m.status === "DECLINED" ? (
                    <XCircle className="size-3 text-destructive" aria-hidden />
                  ) : (
                    <Clock className="size-3 text-muted-foreground" aria-hidden />
                  )}
                  <span className={m.status === "DECLINED" ? "text-muted-foreground line-through" : ""}>@{m.username}</span>
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={() => handleRespondToInvitation(myPendingInvitation.id, true)} disabled={isRespondingToInvitation} className="flex-1 rounded-xl">
              {isRespondingToInvitation ? <Loader2 className="mr-1 size-3 animate-spin" aria-hidden /> : null}
              {te("Aceptar", "Accept")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleRespondToInvitation(myPendingInvitation.id, false)} disabled={isRespondingToInvitation} className="flex-1 rounded-xl">
              {te("Rechazar", "Decline")}
            </Button>
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <img
          src={`https://picsum.photos/id/${chatBgId}/1600/1000`}
          alt=""
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.18] dark:opacity-[0.10]"
        />
        <div className="absolute inset-0 z-[1] flex flex-col overflow-y-auto p-4 space-y-3"
          onClick={() => setActiveKey(null)}
        >
          {/* load older */}
          {hasMoreMessages && (
            <div className="flex justify-center pb-2">
              <Button variant="ghost" size="sm" onClick={loadOlderMessages} disabled={isLoadingOlderMessages}
                className="h-7 rounded-full bg-background/70 px-3 text-xs backdrop-blur-sm hover:bg-background/90">
                {isLoadingOlderMessages ? <Loader2 className="size-3 animate-spin" aria-hidden /> : te("Cargar mensajes anteriores", "Load older messages")}
              </Button>
            </div>
          )}

          {sortedMessages.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <p className="rounded-xl border border-border/50 bg-background/70 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
                {te("Aún no hay mensajes. ¡Sé el primero!", "No messages yet. Be the first!")}
              </p>
            </div>
          )}

          {sortedMessages.map((m, idx) => {
            const mine = String(m.senderId || "") === myUserId
            const isSystem = Boolean(m.system)
            const key = normalizeMessageId(m) || `${m.senderId || "sys"}-${m.sentAt}-${idx}`
            const canEdit = mine && !m.deleted && !m.system
            const canDel = (mine || isAdmin) && !m.deleted && !m.system
            const copyText = m.deleted ? "" : (m.content || "")

            if (isSystem) {
              return (
                <div key={key} className="flex justify-center">
                  <div className={cn(
                    "max-w-[90%] rounded-lg border px-4 py-2 text-center shadow-sm backdrop-blur-sm",
                    m.pinned ? "border-emerald-400/40 bg-emerald-500/10" : "border-border/60 bg-muted/90 dark:bg-muted/85"
                  )}>
                    <p className="mb-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      {m.pinned ? <span className="font-semibold text-emerald-500">📌 {te("Fijado", "Pinned")}</span> : <span>{te("Sistema", "System")}</span>}
                      <span>· {formatTime(m.sentAt)}</span>
                    </p>
                    <p className="text-sm font-medium">{m.deleted ? te("Mensaje eliminado", "Message deleted") : m.content || ""}</p>
                  </div>
                </div>
              )
            }

            const isActive = activeKey === key
            const tbOpacity = isActive ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
            const tbBtn = "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            const tbBtnDanger = "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-muted/80 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"

            const senderLabel = m.senderUsername || te("Usuario", "User")
            const memberPic = members.find((mem) => String(mem.userId) === String(m.senderId || ""))?.profilePictureUrl
            const avatarSrc = (mine ? user?.profilePictureUrl : undefined) || m.senderProfilePictureUrl || memberPic || undefined
            const initials = senderLabel.replace(/^@/, "").slice(0, 2).toUpperCase() || "?"

            return (
              <div key={key} className={cn("relative flex items-end gap-2 group/msg", mine ? "justify-end" : "justify-start")}>
                {!mine && (
                  <Avatar className="order-1 mb-1 h-9 w-9 min-h-9 min-w-9 shrink-0 ring-1 ring-border/50" aria-hidden>
                    {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                    <AvatarFallback className="text-[11px] font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                )}

                {/* action bar */}
                {!m.deleted && (
                  <div className={cn("order-3 mb-1 flex items-center gap-0.5 transition-opacity", !mine && "order-3", mine && "order-1", tbOpacity)}>
                    <button type="button" className={tbBtn} title={te("Responder", "Reply")}
                      onClick={(e) => { e.stopPropagation(); setReplyTo({ messageId: normalizeMessageId(m), username: senderLabel, snippet: copyText.slice(0, 120) || te("(mensaje)", "(message)") }) }}>
                      <Reply className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button type="button" className={tbBtn} title={te("Copiar", "Copy")}
                      onClick={(e) => { e.stopPropagation(); void handleCopy(copyText, key) }}>
                      {copiedKey === key ? <Check className="h-3.5 w-3.5 text-green-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                    </button>
                    {canEdit && (
                      <button type="button" className={tbBtn} title={te("Editar", "Edit")}
                        onClick={(e) => { e.stopPropagation(); handleEdit(m) }}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                    {canDel && (
                      <button type="button" className={tbBtnDanger} title={te("Eliminar", "Delete")}
                        onClick={(e) => { e.stopPropagation(); handleDelete(normalizeMessageId(m)) }}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                )}

                <div className="relative order-2 w-56 max-w-full min-w-0 shrink">
                  <div
                    className={cn(
                      "relative rounded-2xl border px-3 py-2 shadow-md backdrop-blur-[2px] sm:px-4 sm:py-2.5",
                      mine ? "border-primary/50 bg-primary/30 text-foreground dark:border-primary/45 dark:bg-primary/26" : "border-border bg-card text-foreground shadow-sm"
                    )}
                    onClick={(e) => { e.stopPropagation(); setActiveKey(activeKey === key ? null : key) }}
                  >
                    <p className="mb-1 flex min-w-0 items-center gap-1 text-xs leading-tight sm:text-[13px]">
                      {!m.system && <Zap className="size-3 shrink-0 animate-pulse text-purple-600 drop-shadow-[0_0_6px_rgba(147,51,234,0.65)] dark:text-purple-400" strokeWidth={2.5} aria-hidden />}
                      <span className={cn("min-w-0 truncate tracking-tight", mine ? "font-semibold text-purple-800 dark:text-purple-200" : "font-medium text-violet-700 dark:text-violet-300")}>
                        {m.senderUsername || te("Usuario", "User")}
                      </span>
                    </p>

                    {m.deleted ? (
                      <p className="text-sm italic text-muted-foreground">{te("Mensaje eliminado", "Message deleted")}</p>
                    ) : m.mediaUrl ? (
                      <div className="mt-1">
                        {m.mediaType === "IMAGE" ? (
                          <img src={m.mediaUrl} alt="" className="max-h-60 w-full rounded-xl object-cover" />
                        ) : m.mediaType === "VIDEO" ? (
                          <video src={m.mediaUrl} controls className="max-h-60 w-full rounded-xl" />
                        ) : m.mediaType === "AUDIO" ? (
                          <audio src={m.mediaUrl} controls className="w-full" />
                        ) : (
                          <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">{te("Ver archivo", "View file")}</a>
                        )}
                        {m.content && <p className="mt-1 break-words text-sm">{m.content}</p>}
                      </div>
                    ) : (
                      <p className="break-words text-sm font-medium leading-relaxed sm:text-[15px] whitespace-pre-wrap">{m.content || ""}</p>
                    )}

                    <p className={cn("mt-1 text-[10px] text-muted-foreground/70", mine ? "text-right" : "text-left")}>
                      {formatTime(m.sentAt)}
                      {m.editedAt && <span className="ml-1 italic">{te("· editado", "· edited")}</span>}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── COMPOSER ── */}
      <div className="shrink-0 border-t border-border/60 bg-background/95 px-3 pb-safe pt-2 backdrop-blur-sm">
        {/* reply preview */}
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/8 px-3 py-1.5">
            <Reply className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{replyTo.username}</span>: {replyTo.snippet}
            </span>
            <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <XCircle className="size-4" aria-hidden />
            </button>
          </div>
        )}
        {/* file preview */}
        {mediaFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-sm">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{mediaFile.name}</span>
            <Button type="button" variant="ghost" size="icon-sm" className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
              onClick={() => { setMediaFile(null); if (chatFileInputRef.current) chatFileInputRef.current.value = "" }}>
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={chatFileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setMediaFile(f) }}
          />
          <Button type="button" variant="ghost" size="icon" className="mb-0.5 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => chatFileInputRef.current?.click()} disabled={!canSend}>
            <Paperclip className="size-5" aria-hidden />
          </Button>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend() } }}
            placeholder={canSend ? te("Escribe un mensaje…", "Write a message…") : te("Solo moderadores pueden escribir", "Only moderators can write")}
            disabled={!canSend}
            rows={1}
            className={cn(FORM_CONTROL_TEXTAREA, "min-h-10 max-h-36 flex-1 resize-none bg-background/95 py-2 dark:bg-background/90")}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={(!messageText.trim() && !mediaFile) || isSending || !canSend}
            className="mb-0.5 h-10 shrink-0 gap-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 font-bold text-black shadow-sm"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  )
}
