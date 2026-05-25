"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { eventService } from "@/lib/services/event"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import type { EventGroupMessage } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FORM_CONTROL_TEXTAREA } from "@/lib/form-field-classes"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
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

const msgId = (m: any) => String(m?.id || m?.messageId || "")

function normPoll(m: EventGroupMessage): EventGroupMessage {
  if (!m.poll) return m
  return { ...m, poll: { ...m.poll, options: (m.poll.options || []).map((o: any) => ({ ...o, votes: Number(o.votes ?? o.voteCount ?? 0) })) } }
}

function fmtTime(iso?: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

async function videoDuration(file: File): Promise<number> {
  return new Promise((res) => {
    const v = document.createElement("video")
    const url = URL.createObjectURL(file)
    v.preload = "metadata"
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); res(v.duration || 0) }
    v.onerror = () => { URL.revokeObjectURL(url); res(0) }
    v.src = url
  })
}

export default function EventChatPage() {
  const { te } = useI18n()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const eventId = params.eventId as string
  const myUserId = String(user?.userId || "")

  const { subscribeToEventGroup } = useWebSocket(user?.userId, {})

  // title from query param — available immediately, no API call needed
  const [title, setTitle] = useState(decodeURIComponent(searchParams.get("title") || "MeetUp"))
  const [coverUrl, setCoverUrl] = useState<string | null>(null)

  const [messages, setMessages] = useState<EventGroupMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [adminOnly, setAdminOnly] = useState(false)
  const [myRole, setMyRole] = useState("")
  const isAdmin = myRole === "ADMIN"
  const canSend = !adminOnly || isAdmin

  // composer
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; name: string; snippet: string } | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const upsert = (incoming: EventGroupMessage) => {
    const n = normPoll(incoming)
    const id = msgId(n)
    setMessages((prev) => {
      if (!id) return [...prev, n]
      const i = prev.findIndex((m) => msgId(m) === id)
      if (i >= 0) { const next = [...prev]; next[i] = { ...next[i], ...n, id }; return next }
      return [...prev, { ...n, id }]
    })
  }

  // load messages only — fast
  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const rows = await eventService.groupMessages.list(eventId, 0, 50)
        if (cancelled) return
        const normalized = rows.map((m) => normPoll({ ...m, id: msgId(m) }))
        setMessages(normalized)
        setHasMore(normalized.length === 50)
        setPage(0)
      } catch {
        if (!cancelled) toast.error(te("No se pudieron cargar los mensajes", "Could not load messages"))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [eventId])

  // load cover + role in background — doesn't block anything
  useEffect(() => {
    if (!eventId || !myUserId) return
    let cancelled = false
    ;(async () => {
      try {
        const detail = await eventService.getById(eventId)
        if (cancelled) return
        const cover = String((detail as any)?.coverPhotoUrl || "").trim()
        if (cover) setCoverUrl(cover)
        const t = String((detail as any)?._title || (detail as any)?.title || "").trim()
        if (t) setTitle(t)
        const roleRaw = String((detail as any)?.myRole || "").toUpperCase()
        setMyRole(roleRaw)
        setAdminOnly(Boolean((detail as any)?.adminOnlyMode))
      } catch { /* silencioso */ }
    })()
    return () => { cancelled = true }
  }, [eventId, myUserId])

  // scroll to bottom on new messages
  useEffect(() => {
    if (!loadingMore) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, loadingMore])

  // WebSocket
  useEffect(() => {
    if (!eventId || !user?.userId) return
    const unsub = subscribeToEventGroup(eventId, (payload: any) => {
      if (!payload) return
      if (!payload.type) { upsert(payload as EventGroupMessage); return }
      if (payload.type === "MESSAGE_DELETED" && payload.messageId) {
        setMessages((prev) => prev.map((m) => msgId(m) === String(payload.messageId) ? { ...m, deleted: true, content: null, mediaUrl: null, poll: null } : m))
      }
      if (payload.type === "SETTINGS_UPDATED") setAdminOnly(Boolean(payload.adminOnlyMode))
      if (payload.type === "MEMBER_KICKED" && String(payload.userId) === myUserId) {
        toast.error(te("Fuiste expulsado del grupo", "You were removed from the group"))
        router.push("/chat")
      }
    })
    return () => { unsub?.() }
  }, [eventId, user?.userId, myUserId, subscribeToEventGroup, router])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = page + 1
      const older = await eventService.groupMessages.list(eventId, next, 50)
      const normalized = older.map((m) => normPoll({ ...m, id: msgId(m) }))
      if (normalized.length < 50) setHasMore(false)
      setMessages((prev) => [...normalized, ...prev])
      setPage(next)
    } catch {
      toast.error(te("No se pudieron cargar mensajes anteriores", "Could not load older messages"))
    } finally {
      setLoadingMore(false)
    }
  }

  const send = async () => {
    let content = text.trim()
    if (replyTo) {
      content = content ? `↪ ${replyTo.name}: «${replyTo.snippet}»\n\n${content}` : `↪ ${replyTo.name}: «${replyTo.snippet}»`
    }
    if (!content && !file) return
    setSending(true)
    try {
      let payload: any = { content }
      if (file) {
        const mime = file.type || ""
        const mediaType = mime.startsWith("image/") ? "IMAGE" : mime.startsWith("video/") ? "VIDEO" : mime.startsWith("audio/") ? "AUDIO" : undefined
        if (mediaType === "VIDEO") {
          const dur = Math.floor(await videoDuration(file))
          if (dur > MAX_VIDEO_DURATION_SECONDS) { toast.error(te("Máximo 3 minutos de video", "Max 3 minutes of video")); return }
          payload.durationSeconds = dur
        }
        const uploaded = await eventService.uploadMedia(file)
        payload = { ...payload, mediaUrl: uploaded.mediaUrl, mediaPublicId: uploaded.mediaPublicId, mediaType }
      }
      const created = await eventService.groupMessages.send(eventId, payload)
      upsert(created)
      setText("")
      setFile(null)
      setReplyTo(null)
      if (fileRef.current) fileRef.current.value = ""
    } catch (e: any) {
      toast.error(e?.message || te("No se pudo enviar", "Could not send"))
    } finally {
      setSending(false)
    }
  }

  const deleteMsg = async (id: string) => {
    try {
      await eventService.groupMessages.remove(eventId, id)
      setMessages((prev) => prev.map((m) => msgId(m) === id ? { ...m, deleted: true, content: null, mediaUrl: null, poll: null } : m))
    } catch (e: any) { toast.error(e?.message || te("No se pudo eliminar", "Could not delete")) }
  }

  const editMsg = async (m: EventGroupMessage) => {
    const next = window.prompt(te("Editar mensaje", "Edit message"), m.content || "")
    if (!next?.trim()) return
    try {
      const updated = await eventService.groupMessages.edit(eventId, msgId(m), next.trim())
      upsert(updated)
    } catch (e: any) { toast.error(e?.message || te("No se pudo editar", "Could not edit")) }
  }

  const copy = async (txt: string, key: string) => {
    try { await navigator.clipboard.writeText(txt) } catch { /* ignore */ }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const sorted = useMemo(
    () => [...messages].sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()),
    [messages]
  )

  const bgId = useMemo(() => { let h = 0; for (let i = 0; i < eventId.length; i++) h = (h * 31 + eventId.charCodeAt(i)) & 0xffff; return 10 + (h % 990) }, [eventId])

  return (
    <div className="flex h-[100dvh] flex-col bg-background">

      {/* ── HEADER ── */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-background px-3 py-2.5 shadow-sm">
        <Button variant="ghost" size="icon" className="shrink-0 rounded-xl" onClick={() => router.back()}>
          <ArrowLeft className="size-5" aria-hidden />
        </Button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-1 text-left hover:bg-muted/60 transition-colors"
          onClick={() => router.push(`/events/${eventId}`)}
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-emerald-500/20 to-teal-600/20">
            {coverUrl
              ? <img src={coverUrl} alt="" className="size-full object-cover" />
              : <div className="flex size-full items-center justify-center"><CalendarDays className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{te("MeetUp · ver detalles", "MeetUp · view details")}</p>
          </div>
        </button>
      </header>

      {/* ── MESSAGES ── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* bg texture */}
        <img src={`https://picsum.photos/id/${bgId}/1200/800`} alt="" aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.12] dark:opacity-[0.07]" />

        <div ref={scrollRef}
          className="absolute inset-0 z-10 flex flex-col overflow-y-auto px-3 py-4 space-y-2"
          onClick={() => setActiveKey(null)}
        >
          {/* load older */}
          {hasMore && (
            <div className="flex justify-center pb-1">
              <Button variant="ghost" size="sm" onClick={loadMore} disabled={loadingMore}
                className="h-7 rounded-full bg-background/80 px-4 text-xs shadow-sm backdrop-blur-sm">
                {loadingMore ? <Loader2 className="size-3 animate-spin" aria-hidden /> : te("Mensajes anteriores", "Load older")}
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="rounded-2xl border border-border/50 bg-background/80 px-5 py-3 text-sm text-muted-foreground backdrop-blur-sm">
                {te("Aún no hay mensajes. ¡Sé el primero!", "No messages yet. Be the first!")}
              </p>
            </div>
          ) : sorted.map((m, idx) => {
            const mine = String(m.senderId || "") === myUserId
            const key = msgId(m) || `${m.senderId}-${m.sentAt}-${idx}`
            const isSystem = Boolean(m.system)
            const copyTxt = m.deleted ? "" : (m.content || "")
            const canEdit = mine && !m.deleted && !m.system
            const canDel = (mine || isAdmin) && !m.deleted && !m.system
            const isActive = activeKey === key

            // system message
            if (isSystem) return (
              <div key={key} className="flex justify-center">
                <div className={cn("max-w-[85%] rounded-2xl border px-4 py-2 text-center text-xs backdrop-blur-sm",
                  m.pinned ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border/50 bg-background/75 text-muted-foreground")}>
                  {m.pinned && <span className="mr-1">📌</span>}
                  {m.deleted ? te("Mensaje eliminado", "Message deleted") : m.content}
                  <span className="ml-2 opacity-60">{fmtTime(m.sentAt)}</span>
                </div>
              </div>
            )

            const senderLabel = m.senderUsername || te("Usuario", "User")
            const avatarSrc = (mine ? user?.profilePictureUrl : m.senderProfilePictureUrl) || undefined
            const initials = senderLabel.replace(/^@/, "").slice(0, 2).toUpperCase() || "?"
            const tbOpacity = isActive ? "opacity-100" : "opacity-0 group-hover/msg:opacity-100"
            const tbBtn = "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-background/90 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
            const tbDanger = "h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-background/90 shadow-sm text-muted-foreground hover:text-destructive transition-colors"

            return (
              <div key={key} className={cn("flex items-end gap-2 group/msg", mine ? "justify-end" : "justify-start")}>
                {/* other user avatar */}
                {!mine && (
                  <Avatar className="mb-1 size-8 shrink-0 ring-1 ring-border/40">
                    {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                    <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
                  </Avatar>
                )}

                {/* action bar — left side for mine, right side for others */}
                {!m.deleted && (
                  <div className={cn("mb-1 flex items-center gap-0.5 transition-opacity", mine ? "order-first" : "order-last", tbOpacity)}>
                    <button type="button" className={tbBtn} onClick={(e) => { e.stopPropagation(); setReplyTo({ id: msgId(m), name: senderLabel, snippet: copyTxt.slice(0, 100) || te("(mensaje)", "(message)") }) }}>
                      <Reply className="size-3.5" aria-hidden />
                    </button>
                    <button type="button" className={tbBtn} onClick={(e) => { e.stopPropagation(); void copy(copyTxt, key) }}>
                      {copiedKey === key ? <Check className="size-3.5 text-emerald-500" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    </button>
                    {canEdit && (
                      <button type="button" className={tbBtn} onClick={(e) => { e.stopPropagation(); void editMsg(m) }}>
                        <Pencil className="size-3.5" aria-hidden />
                      </button>
                    )}
                    {canDel && (
                      <button type="button" className={tbDanger} onClick={(e) => { e.stopPropagation(); void deleteMsg(msgId(m)) }}>
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </div>
                )}

                {/* bubble */}
                <div className="max-w-[72%] min-w-0"
                  onClick={(e) => { e.stopPropagation(); setActiveKey(activeKey === key ? null : key) }}
                >
                  {/* sender name (only for others in group) */}
                  {!mine && !m.system && (
                    <p className="mb-0.5 flex items-center gap-1 pl-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                      <Zap className="size-2.5 text-purple-500" strokeWidth={2.5} aria-hidden />
                      {senderLabel}
                    </p>
                  )}
                  <div className={cn(
                    "rounded-2xl px-3 py-2 shadow-sm",
                    mine
                      ? "rounded-br-sm bg-primary/85 text-primary-foreground"
                      : "rounded-bl-sm border border-border/50 bg-card/95 text-foreground backdrop-blur-sm"
                  )}>
                    {m.deleted ? (
                      <p className="text-sm italic opacity-60">{te("Mensaje eliminado", "Message deleted")}</p>
                    ) : m.mediaUrl ? (
                      <div>
                        {m.mediaType === "IMAGE"
                          ? <img src={m.mediaUrl} alt="" className="max-h-56 w-full rounded-xl object-cover" />
                          : m.mediaType === "VIDEO"
                          ? <video src={m.mediaUrl} controls className="max-h-56 w-full rounded-xl" />
                          : m.mediaType === "AUDIO"
                          ? <audio src={m.mediaUrl} controls className="w-full" />
                          : <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">{te("Ver archivo", "View file")}</a>}
                        {m.content && <p className="mt-1 break-words text-sm">{m.content}</p>}
                      </div>
                    ) : (
                      <p className="break-words text-[15px] leading-relaxed whitespace-pre-wrap">{m.content || ""}</p>
                    )}
                    <p className={cn("mt-0.5 text-[10px] opacity-60", mine ? "text-right" : "text-left")}>
                      {fmtTime(m.sentAt)}
                      {m.editedAt && <span className="ml-1">{te("· editado", "· edited")}</span>}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── COMPOSER ── */}
      <div className="shrink-0 border-t border-border/50 bg-background px-3 pb-4 pt-2">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-3 py-1.5">
            <Reply className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{replyTo.name}:</span> {replyTo.snippet}
            </span>
            <button type="button" onClick={() => setReplyTo(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <XCircle className="size-4" aria-hidden />
            </button>
          </div>
        )}
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-1.5 text-sm">
            <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
            <button type="button" className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = "" }}>
              <XCircle className="size-4" aria-hidden />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
          <Button type="button" variant="ghost" size="icon" disabled={!canSend}
            className="mb-0.5 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => fileRef.current?.click()}>
            <Paperclip className="size-5" aria-hidden />
          </Button>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send() } }}
            placeholder={canSend ? te("Escribe un mensaje…", "Write a message…") : te("Solo admins pueden escribir", "Only admins can write")}
            disabled={!canSend}
            rows={1}
            className={cn(FORM_CONTROL_TEXTAREA, "min-h-10 max-h-36 flex-1 resize-none")}
          />
          <Button type="button" onClick={send}
            disabled={(!text.trim() && !file) || sending || !canSend}
            className="mb-0.5 size-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-secondary p-0 text-black shadow-sm">
            {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </div>
  )
}
