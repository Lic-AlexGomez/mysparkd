"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Users,
  Shield,
  Crown,
  Send,
  Loader2,
  Trash2,
  MoreVertical,
  Settings,
  Link2,
  Pin,
  VolumeX,
  Volume2,
  UserMinus,
  UserPlus,
} from "lucide-react"
import { toast } from "sonner"
import type { Group, GroupInviteLink, GroupMember, GroupMessage } from "@/lib/types"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { groupService } from "@/lib/services/group"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"

export default function GroupDetailPage() {
  const { user } = useAuth()
  const features = useFeatureFlags()
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("messages")
  const [messageContent, setMessageContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState<string | null>(null)
  const [muteUpdatingUserId, setMuteUpdatingUserId] = useState<string | null>(null)
  const [removingMemberUserId, setRemovingMemberUserId] = useState<string | null>(null)
  const [deactivatingInviteId, setDeactivatingInviteId] = useState<string | null>(null)
  const [copyingInviteId, setCopyingInviteId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [settingsWhoCanTalk, setSettingsWhoCanTalk] = useState<"ALL" | "MODS_AND_ADMINS" | "ONLY_ADMIN">("ALL")
  const [inviteRole, setInviteRole] = useState<"MODERATOR" | "GUEST">("GUEST")
  const [inviteMaxUses, setInviteMaxUses] = useState("0")
  const [newMemberId, setNewMemberId] = useState("")
  const [newMemberResolvedId, setNewMemberResolvedId] = useState("")
  const [memberSuggestions, setMemberSuggestions] = useState<Array<{ userId: string; username: string; fullName?: string; photo?: string }>>([])
  const [isSearchingMembers, setIsSearchingMembers] = useState(false)
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)
  const [newMemberRole, setNewMemberRole] = useState<"MODERATOR" | "GUEST">("GUEST")
  const [inviteLinks, setInviteLinks] = useState<GroupInviteLink[]>([])
  const [pinnedIds, setPinnedIds] = useState<string[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const groupId = String(params.id)
  const isAdmin = group?.myRole === "ADMIN"
  const isModerator = group?.myRole === "MODERATOR" || isAdmin
  const canModerate = Boolean(isModerator)
  const currentUserId = user?.userId
  const { subscribeToGroup } = useWebSocket(user?.userId, {})

  const pinnedStorageKey = `sparkd_group_pins_${groupId}`

  const normalizeMessageId = (msg: Partial<GroupMessage>) =>
    (msg.id || (msg as any).messageId || "").toString()

  const dedupeMessages = (list: GroupMessage[]) => {
    const byId = new Map<string, GroupMessage>()
    const withoutId: GroupMessage[] = []

    for (const msg of list) {
      const id = normalizeMessageId(msg)
      if (id) {
        byId.set(id, { ...msg, id })
      } else {
        withoutId.push(msg)
      }
    }

    return [...byId.values(), ...withoutId]
      .sort((a, b) => {
        const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0
        const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0
        return ta - tb
      })
  }

  const upsertIncomingMessage = (prev: GroupMessage[], incoming: GroupMessage) => {
    const incomingId = normalizeMessageId(incoming)

    if (incomingId) {
      const idx = prev.findIndex((m) => normalizeMessageId(m) === incomingId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], ...incoming, id: incomingId }
        return next
      }
    }

    // Fallback dedupe: same sender/content around same timestamp.
    const incomingTs = incoming.sentAt ? new Date(incoming.sentAt).getTime() : 0
    const nearDuplicateIdx = prev.findIndex((m) => {
      const ts = m.sentAt ? new Date(m.sentAt).getTime() : 0
      return (
        (m.senderId || "") === (incoming.senderId || "") &&
        (m.content || "") === (incoming.content || "") &&
        Math.abs(ts - incomingTs) <= 1500
      )
    })

    if (nearDuplicateIdx >= 0) {
      const next = [...prev]
      next[nearDuplicateIdx] = {
        ...next[nearDuplicateIdx],
        ...incoming,
        id: normalizeMessageId(next[nearDuplicateIdx]) || incomingId || next[nearDuplicateIdx].id,
      }
      return next
    }

    return dedupeMessages([...prev, { ...incoming, id: incomingId || incoming.id }])
  }

  const loadGroup = async () => {
    setIsLoading(true)
    try {
      const [g, ms, mb] = await Promise.all([
        groupService.getById(groupId),
        groupService.messages.list(groupId),
        groupService.members.list(groupId),
      ])
      setGroup(g)
      setSettingsWhoCanTalk((g.whoCanTalk as any) || "ALL")
      setMessages(dedupeMessages(ms))
      setMembers(mb)
      if (g.myRole === "ADMIN" || g.myRole === "MODERATOR") {
        const links = await groupService.inviteLinks.list(groupId).catch(() => [])
        setInviteLinks(links)
      } else {
        setInviteLinks([])
      }
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cargar el grupo")
      router.push("/groups")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!features.groupsPage) return
    void loadGroup()
  }, [features.groupsPage, groupId])

  useEffect(() => {
    const value = newMemberId.trim()
    setNewMemberResolvedId("")
    if (!value) {
      setMemberSuggestions([])
      setShowMemberDropdown(false)
      setActiveSuggestionIndex(0)
      return
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(value)) {
      setNewMemberResolvedId(value)
      setMemberSuggestions([])
      setShowMemberDropdown(false)
      setActiveSuggestionIndex(0)
      return
    }

    const t = setTimeout(async () => {
      setIsSearchingMembers(true)
      try {
        const suggestions = await groupService.searchUsersByInput(value)
        setMemberSuggestions(suggestions)
        setShowMemberDropdown(true)
        setActiveSuggestionIndex(0)
      } catch {
        setMemberSuggestions([])
        setActiveSuggestionIndex(0)
      } finally {
        setIsSearchingMembers(false)
      }
    }, 300)

    return () => clearTimeout(t)
  }, [newMemberId])

  useEffect(() => {
    const maxIdx = Math.max(0, Math.min(activeSuggestionIndex, Math.max(memberSuggestions.slice(0, 8).length - 1, 0)))
    if (maxIdx !== activeSuggestionIndex) {
      setActiveSuggestionIndex(maxIdx)
    }
  }, [memberSuggestions, activeSuggestionIndex])

  useEffect(() => {
    if (!groupId) return
    const raw = localStorage.getItem(pinnedStorageKey)
    setPinnedIds(raw ? JSON.parse(raw) : [])
  }, [groupId])

  useEffect(() => {
    localStorage.setItem(pinnedStorageKey, JSON.stringify(pinnedIds))
  }, [pinnedIds, pinnedStorageKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  useEffect(() => {
    if (!groupId || !user?.userId) return
    const unsub = subscribeToGroup(groupId, (event: any) => {
      if (!event) return

      if (event?.type === "MESSAGE_DELETED" && event?.messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId ? { ...m, deleted: true, content: null } : m
          )
        )
        return
      }

      if (event?.type === "SETTINGS_UPDATED" && event?.whoCanTalk) {
        setGroup((prev) => (prev ? { ...prev, whoCanTalk: event.whoCanTalk } : prev))
        return
      }

      // backend broadcast de mensaje dto
      if (event?.id && event?.groupId) {
        setMessages((prev) => dedupeMessages(upsertIncomingMessage(prev, event as GroupMessage)))
      }
    })
    return () => unsub?.()
  }, [groupId, user?.userId, subscribeToGroup])

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error("Escribe algo")
      return
    }
    setIsSending(true)
    try {
      const created = await groupService.messages.send(groupId, messageContent.trim())
      setMessages((prev) => dedupeMessages(upsertIncomingMessage(prev, created)))
      setMessageContent("")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo enviar")
    } finally {
      setIsSending(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: "MODERATOR" | "GUEST") => {
    setRoleUpdatingUserId(userId)
    try {
      await groupService.members.changeRole(groupId, userId, newRole)
      toast.success(`Rol actualizado a ${newRole}`)
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar el rol")
    } finally {
      setRoleUpdatingUserId(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    setRemovingMemberUserId(userId)
    try {
      await groupService.members.kick(groupId, userId)
      toast.success("Miembro removido del grupo")
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo remover el miembro")
    } finally {
      setRemovingMemberUserId(null)
    }
  }

  const handleMuteToggle = async (member: GroupMember) => {
    setMuteUpdatingUserId(member.userId)
    try {
      if (member.muted) {
        await groupService.members.unmute(groupId, member.userId)
        toast.success("Silencio removido")
      } else {
        await groupService.members.mute(groupId, member.userId)
        toast.success("Miembro silenciado")
      }
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar el silencio")
    } finally {
      setMuteUpdatingUserId(null)
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      await groupService.settings.patch(groupId, settingsWhoCanTalk)
      setGroup((prev) => (prev ? { ...prev, whoCanTalk: settingsWhoCanTalk } : prev))
      toast.success("Configuración actualizada")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo actualizar configuración")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true)
    try {
      const link = await groupService.inviteLinks.create(groupId, {
        targetRole: inviteRole,
        maxUses: Number(inviteMaxUses || "0"),
      })
      setInviteLinks((prev) => [link, ...prev])
      toast.success("Link de invitación creado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear el link")
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleDeactivateInvite = async (inviteId: string) => {
    setDeactivatingInviteId(inviteId)
    try {
      await groupService.inviteLinks.remove(groupId, inviteId)
      setInviteLinks((prev) => prev.filter((l) => l.inviteId !== inviteId))
      toast.success("Link desactivado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo desactivar el link")
    } finally {
      setDeactivatingInviteId(null)
    }
  }

  const handleAddMember = async () => {
    const input = newMemberId.trim()
    if (!input) return
    setIsAddingMember(true)
    try {
      const resolvedUserId = newMemberResolvedId || await groupService.resolveUserIdInput(input)
      await groupService.members.add(groupId, resolvedUserId, newMemberRole)
      toast.success("Miembro agregado")
      setNewMemberId("")
      setNewMemberResolvedId("")
      setMemberSuggestions([])
      setShowMemberDropdown(false)
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || "No se pudo agregar miembro")
    } finally {
      setIsAddingMember(false)
    }
  }

  const pickMemberSuggestion = (u: { userId: string; username: string }) => {
    setNewMemberId(`@${u.username}`)
    setNewMemberResolvedId(u.userId)
    setShowMemberDropdown(false)
    setActiveSuggestionIndex(0)
  }

  const handleMemberInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const visibleSuggestions = memberSuggestions.slice(0, 8)
    if (visibleSuggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!showMemberDropdown) setShowMemberDropdown(true)
      setActiveSuggestionIndex((prev) => (prev + 1) % visibleSuggestions.length)
      return
    }

    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!showMemberDropdown) setShowMemberDropdown(true)
      setActiveSuggestionIndex((prev) => (prev - 1 + visibleSuggestions.length) % visibleSuggestions.length)
      return
    }

    if (e.key === "Enter") {
      if (!showMemberDropdown) return
      e.preventDefault()
      const selected = visibleSuggestions[activeSuggestionIndex]
      if (selected) pickMemberSuggestion(selected)
      return
    }

    if (e.key === "Escape") {
      e.preventDefault()
      setShowMemberDropdown(false)
      return
    }
  }

  const canEditMessage = (msg: GroupMessage) => {
    if (!currentUserId || msg.deleted || !msg.senderId) return false
    if (msg.senderId !== currentUserId) return false
    const sentAtMs = new Date(msg.sentAt).getTime()
    return Date.now() - sentAtMs <= 15 * 60 * 1000
  }

  const canDeleteMessage = (msg: GroupMessage) => {
    if (isAdmin) return true
    return canEditMessage(msg)
  }

  const formatRelative = (iso?: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    const sec = Math.floor((Date.now() - d.getTime()) / 1000)
    if (sec < 60) return "ahora"
    if (sec < 3600) return `hace ${Math.floor(sec / 60)} min`
    if (sec < 86400) return `hace ${Math.floor(sec / 3600)} h`
    return d.toLocaleString()
  }

  const formatCompactTime = (iso?: string | null) => {
    if (!iso) return ""
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  }

  const dayKey = (iso?: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }

  const formatDayLabel = (iso?: string | null) => {
    if (!iso) return ""
    const d = new Date(iso)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const that = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const diffDays = Math.round((today - that) / 86400000)
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Ayer"
    return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })
  }

  const startEdit = (msg: GroupMessage) => {
    setEditingMessageId(msg.id)
    setEditingContent(msg.content || "")
  }

  const saveEdit = async () => {
    if (!editingMessageId) return
    setIsSavingEdit(true)
    try {
      const updated = await groupService.messages.edit(groupId, editingMessageId, editingContent)
      setMessages((prev) => prev.map((m) => (m.id === editingMessageId ? updated : m)))
      setEditingMessageId(null)
      setEditingContent("")
      toast.success("Mensaje editado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo editar")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const deleteMessage = async (messageId: string) => {
    setDeletingMessageId(messageId)
    try {
      await groupService.messages.remove(groupId, messageId)
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deleted: true, content: null } : m))
      )
      toast.success("Mensaje eliminado")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar")
    } finally {
      setDeletingMessageId(null)
    }
  }

  const togglePin = (messageId: string) => {
    setPinnedIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [messageId, ...prev]
    )
  }

  const renderedMessages = useMemo(() => dedupeMessages(messages), [messages])

  const pinnedMessages = useMemo(() => {
    const pinnedSet = new Set(pinnedIds)
    return dedupeMessages(renderedMessages.filter((m) => pinnedSet.has(normalizeMessageId(m))))
  }, [renderedMessages, pinnedIds])

  const handleDeleteGroup = async () => {
    if (!group) return
    const ok = window.confirm(`¿Seguro que deseas eliminar el grupo "${group.name}"?`)
    if (!ok) return

    setIsDeleting(true)
    try {
      await groupService.remove(groupId)
      toast.success("Grupo eliminado")
      router.push("/groups")
    } catch (error: any) {
      toast.error(error?.message || "No se pudo eliminar el grupo")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!features.groupsPage) return null

  if (isLoading || !group) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted-foreground mt-1">{group.description || "Sin descripción"}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{group.memberCount.toLocaleString()} miembros</span>
              </div>
              {isAdmin && (
                <Badge className="bg-primary/10 text-primary border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
              {isModerator && !isAdmin && (
                <Badge className="bg-secondary/10 text-secondary border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  Moderador
                </Badge>
              )}
            </div>
          </div>
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar grupo
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="messages">Chat</TabsTrigger>
          {features.groupRoles && (
            <TabsTrigger value="members">Miembros</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          {pinnedMessages.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensajes fijados</p>
              {pinnedMessages.map((msg, idx) => (
                <div
                  key={`pin-${normalizeMessageId(msg) || "noid"}-${idx}`}
                  className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{msg.senderUsername || "Sistema"}</p>
                  <p className="text-sm">{msg.content || "Mensaje eliminado"}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 mb-4">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Escribe un mensaje al grupo..."
              className="min-h-24 resize-none"
              maxLength={4000}
            />
            <Button onClick={handleSendMessage} className="w-full" disabled={!messageContent.trim() || isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Enviando..." : "Enviar"}
            </Button>
          </div>

          {renderedMessages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No hay mensajes aún</p>
              <p className="text-sm text-muted-foreground mt-2">Sé el primero en escribir</p>
            </div>
          ) : (
            <ScrollArea className="h-[420px] rounded-lg border border-border">
              <div className="space-y-3 p-3">
                {renderedMessages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUserId
                  const prev = idx > 0 ? renderedMessages[idx - 1] : null
                  const next = idx < renderedMessages.length - 1 ? renderedMessages[idx + 1] : null
                  const showDayDivider = !prev || dayKey(prev.sentAt) !== dayKey(msg.sentAt)
                  const prevTs = prev?.sentAt ? new Date(prev.sentAt).getTime() : 0
                  const currTs = msg.sentAt ? new Date(msg.sentAt).getTime() : 0
                  const showGapDivider = Boolean(prev && prevTs > 0 && currTs > 0 && currTs - prevTs > 15 * 60 * 1000)
                  const sameAsPrev =
                    prev &&
                    prev.senderId === msg.senderId &&
                    !prev.deleted &&
                    !msg.deleted
                  const sameAsNext =
                    next &&
                    next.senderId === msg.senderId &&
                    !next.deleted &&
                    !msg.deleted

                  return (
                  <div className="contents" key={`row-${normalizeMessageId(msg) || `${msg.senderId || "system"}-${msg.sentAt || "na"}-${idx}`}`}>
                  {showDayDivider && (
                    <div
                      className="flex justify-center py-2"
                    >
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        {formatDayLabel(msg.sentAt)}
                      </span>
                    </div>
                  )}
                  {!showDayDivider && showGapDivider && (
                    <div className="flex justify-center py-2">
                      <span className="text-[10px] px-2 py-1 rounded-full bg-muted/60 text-muted-foreground">
                        {formatRelative(msg.sentAt)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isMine ? "justify-end" : "justify-start"} ${sameAsPrev ? "mt-1" : "mt-3"}`}
                  >
                    {!isMine && (
                      <div className="mr-2 flex w-8 items-end">
                        {!sameAsNext ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={msg.senderProfilePictureUrl} />
                            <AvatarFallback>{(msg.senderUsername || "S")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-8 w-8" />
                        )}
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] p-3 border ${
                        isMine
                          ? "bg-primary/15 border-primary/40"
                          : "bg-card border-border"
                      } ${
                        isMine
                          ? sameAsPrev
                            ? "rounded-2xl rounded-tr-md"
                            : "rounded-2xl"
                          : sameAsPrev
                            ? "rounded-2xl rounded-tl-md"
                            : "rounded-2xl"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {!sameAsPrev && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {msg.senderUsername || "Sistema"} · {formatRelative(msg.sentAt)}
                            </p>
                          )}
                          {editingMessageId === msg.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="min-h-20"
                                maxLength={4000}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEdit} disabled={isSavingEdit}>
                                  {isSavingEdit ? "Guardando..." : "Guardar"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                          <div>
                            <p className="text-sm text-foreground">
                              {msg.deleted ? "Mensaje eliminado" : (msg.content || "")}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                              {formatCompactTime(msg.sentAt)}
                            </p>
                          </div>
                          )}
                        </div>
                        {!msg.deleted && canModerate && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditMessage(msg) && (
                                <DropdownMenuItem onClick={() => startEdit(msg)}>Editar</DropdownMenuItem>
                              )}
                              {canDeleteMessage(msg) && (
                                <DropdownMenuItem
                                  className="text-red-500"
                                  disabled={deletingMessageId === msg.id}
                                  onClick={() => deleteMessage(msg.id)}
                                >
                                  {deletingMessageId === msg.id ? "Eliminando..." : "Eliminar"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => togglePin(msg.id)}>
                                <Pin className="h-4 w-4 mr-2" />
                                {pinnedIds.includes(msg.id) ? "Desfijar" : "Fijar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                  </div>
                )})}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {features.groupRoles && (
          <TabsContent value="members" className="mt-6">
          {isAdmin && (
            <div className="mb-6 space-y-4 rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración del grupo
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Quién puede hablar</p>
                  <Select value={settingsWhoCanTalk} onValueChange={(v: any) => setSettingsWhoCanTalk(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ALL</SelectItem>
                      <SelectItem value="MODS_AND_ADMINS">MODS_AND_ADMINS</SelectItem>
                      <SelectItem value="ONLY_ADMIN">ONLY_ADMIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                    Guardar settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="mb-6 space-y-4 rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-semibold">Agregar miembro directo</p>
              <div className="grid md:grid-cols-3 gap-2">
                <Input
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  onKeyDown={handleMemberInputKeyDown}
                  onFocus={() => {
                    if (memberSuggestions.length > 0) setShowMemberDropdown(true)
                  }}
                  onBlur={() => setShowMemberDropdown(false)}
                  placeholder="UUID o @username"
                />
                {showMemberDropdown && (
                  <div className="relative md:col-span-3">
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                      {isSearchingMembers ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Buscando...</div>
                      ) : memberSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                      ) : (
                        memberSuggestions.slice(0, 8).map((u, idx) => (
                          <button
                            key={u.userId}
                            type="button"
                            className={`w-full px-3 py-2 text-left hover:bg-muted/60 flex items-center gap-2 ${idx === activeSuggestionIndex ? "bg-muted/70" : ""}`}
                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              pickMemberSuggestion(u)
                            }}
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={u.photo} />
                              <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">@{u.username}</p>
                              {u.fullName && <p className="text-xs text-muted-foreground">{u.fullName}</p>}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
                <Select value={newMemberRole} onValueChange={(v: any) => setNewMemberRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUEST">GUEST</SelectItem>
                    <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddMember} disabled={isAddingMember}>
                  {isAddingMember ? "Agregando..." : "Agregar"}
                </Button>
              </div>
            </div>
          )}

          {canModerate && (
            <div className="mb-6 space-y-4 rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Links de invitación
              </p>
              <div className="grid md:grid-cols-3 gap-2">
                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                  <SelectTrigger>
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
                  placeholder="max uses (0 = ilimitado)"
                />
                <Button onClick={handleCreateInvite} disabled={isCreatingInvite}>
                  {isCreatingInvite ? "Creando..." : "Crear link"}
                </Button>
              </div>
              <div className="space-y-2">
                {inviteLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay links activos.</p>
                ) : (
                  inviteLinks.map((link) => (
                    <div key={link.inviteId} className="flex items-center justify-between gap-3 rounded border border-border p-2">
                      <div className="text-xs">
                        <p className="font-mono">{link.token}</p>
                        <p className="text-muted-foreground">
                          {link.targetRole} · {link.usedCount}/{link.maxUses === 0 ? "∞" : link.maxUses}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={copyingInviteId === link.inviteId}
                          onClick={async () => {
                            setCopyingInviteId(link.inviteId)
                            try {
                              await navigator.clipboard.writeText(`${window.location.origin}/groups?token=${link.token}`)
                              toast.success("Link copiado")
                            } finally {
                              setCopyingInviteId(null)
                            }
                          }}
                        >
                          {copyingInviteId === link.inviteId ? "Copiando..." : "Copiar"}
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deactivatingInviteId === link.inviteId}
                            onClick={() => handleDeactivateInvite(link.inviteId)}
                          >
                            {deactivatingInviteId === link.inviteId ? "Desactivando..." : "Desactivar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{member.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {member.role === 'ADMIN' && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {member.role === 'MODERATOR' && (
                        <Badge className="bg-secondary/10 text-secondary border-0 text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Moderador
                        </Badge>
                      )}
                      {member.role === 'GUEST' && (
                        <Badge variant="outline" className="text-xs">Miembro</Badge>
                      )}
                      {member.muted && (
                        <Badge variant="destructive" className="text-xs">Silenciado</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {canModerate && member.role !== 'ADMIN' && (
                  <div className="flex gap-2">
                    {isAdmin && member.role === 'GUEST' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roleUpdatingUserId === member.userId}
                        onClick={() => handleChangeRole(member.userId, 'MODERATOR')}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        {roleUpdatingUserId === member.userId ? "Guardando..." : "Hacer MOD"}
                      </Button>
                    )}
                    {isAdmin && member.role === 'MODERATOR' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roleUpdatingUserId === member.userId}
                        onClick={() => handleChangeRole(member.userId, 'GUEST')}
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        {roleUpdatingUserId === member.userId ? "Guardando..." : "Quitar MOD"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={muteUpdatingUserId === member.userId}
                      onClick={() => handleMuteToggle(member)}
                    >
                      {member.muted ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
                      {muteUpdatingUserId === member.userId ? "Guardando..." : member.muted ? "Quitar mute" : "Silenciar"}
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={removingMemberUserId === member.userId}
                        onClick={() => handleRemoveMember(member.userId)}
                      >
                        {removingMemberUserId === member.userId ? "Removiendo..." : "Remover"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
