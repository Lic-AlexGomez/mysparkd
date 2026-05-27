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
  QrCode,
  Share2,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { Group, GroupInviteLink, GroupMember, GroupMessage, GroupMessageMediaType } from "@/lib/types"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { groupService } from "@/lib/services/group"
import { useAuth } from "@/lib/auth-context"
import { useWebSocket } from "@/hooks/use-websocket"
import { useI18n } from "@/lib/i18n"
import QRCode from "qrcode"
import {
  getStoredFallbackStyle,
  GROUP_COVER_FALLBACK_STORAGE_KEY,
  type GroupCoverFallbackStyle,
  resolveGroupCoverUrl,
} from "@/lib/group-cover"

export default function GroupDetailPage() {
  const { te, t } = useI18n()
  const { user } = useAuth()
  const features = useFeatureFlags()
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("messages")
  const [messageContent, setMessageContent] = useState("")
  const [outgoingMediaType, setOutgoingMediaType] = useState<"" | GroupMessageMediaType>("")
  const [outgoingMediaUrl, setOutgoingMediaUrl] = useState("")
  const [outgoingVideoDurationSec, setOutgoingVideoDurationSec] = useState("")
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
  const [sharingInviteId, setSharingInviteId] = useState<string | null>(null)
  const [generatingQrInviteId, setGeneratingQrInviteId] = useState<string | null>(null)
  const [inviteQrById, setInviteQrById] = useState<Record<string, string>>({})
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [pinUpdatingMessageId, setPinUpdatingMessageId] = useState<string | null>(null)
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
  const [coverFallbackStyle, setCoverFallbackStyle] =
    useState<GroupCoverFallbackStyle>("MOMENTS")
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [polls, setPolls] = useState<any[]>([])
  const [isLoadingPolls, setIsLoadingPolls] = useState(false)
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [pollQuestion, setPollQuestion] = useState("")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const groupId = String(params.id)
  const isAdmin = group?.myRole === "ADMIN"
  const isModerator = group?.myRole === "MODERATOR" || isAdmin
  const canModerate = Boolean(isModerator)
  const currentUserId = user?.userId
  const myMember = useMemo(
    () => (currentUserId ? members.find((m) => m.userId === currentUserId) : undefined),
    [members, currentUserId]
  )
  const isMuted = Boolean(myMember?.muted)
  const canSendInChat = useMemo(() => {
    if (!group) return false
    if (isMuted) return false
    const w = group.whoCanTalk || "ALL"
    const role = group.myRole
    if (w === "ALL") return true
    if (w === "MODS_AND_ADMINS") return role === "MODERATOR" || role === "ADMIN"
    if (w === "ONLY_ADMIN") return role === "ADMIN"
    return true
  }, [group, isMuted])
  const whoCanTalkHint = useMemo(() => {
    const w = group?.whoCanTalk || "ALL"
    if (w === "ALL") return te("Cualquier miembro puede escribir en el chat.", "Any member can write in chat.")
    if (w === "MODS_AND_ADMINS") return te("Solo moderadores y administradores pueden escribir en el chat.", "Only moderators and admins can write in chat.")
    return te("Solo el administrador puede escribir en el chat.", "Only admin can write in chat.")
  }, [group?.whoCanTalk])
  const whoCanTalkOptions = useMemo(
    () => [
      {
        value: "ALL" as const,
        label: te("Todos los miembros", "All members"),
      },
      {
        value: "MODS_AND_ADMINS" as const,
        label: te("Solo moderadores y admin", "Moderators and admin only"),
      },
      {
        value: "ONLY_ADMIN" as const,
        label: te("Solo administrador", "Admin only"),
      },
    ],
    [te]
  )
  const roleLabel = useMemo(
    () => ({
      GUEST: te("Miembro", "Member"),
      MODERATOR: te("Moderador", "Moderator"),
    }),
    [te]
  )
  const { subscribeToGroup } = useWebSocket(user?.userId, {})

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
      const pinnedMessages = await groupService.messages.listPinned(groupId).catch(() => [])
      const pinnedMessageIds = pinnedMessages
        .map((m) => normalizeMessageId(m))
        .filter(Boolean)
      setPinnedIds(pinnedMessageIds)
      if (g.myRole === "ADMIN" || g.myRole === "MODERATOR") {
        const links = await groupService.inviteLinks.list(groupId).catch(() => [])
        setInviteLinks(links)
      } else {
        setInviteLinks([])
      }
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo cargar el grupo", "Could not load group"))
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
    if (activeTab !== "polls") return
    if (!groupId || polls.length > 0 || isLoadingPolls) return
    ;(async () => {
      setIsLoadingPolls(true)
      try {
        const rows = await groupService.polls.list(groupId)
        setPolls(Array.isArray(rows) ? rows : [])
      } catch (e: any) {
        toast.error(e?.message || te("No se pudieron cargar las encuestas", "Could not load polls"))
      } finally {
        setIsLoadingPolls(false)
      }
    })()
  }, [activeTab, groupId, polls.length, isLoadingPolls, te])

  useEffect(() => {
    setCoverFallbackStyle(getStoredFallbackStyle())
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== GROUP_COVER_FALLBACK_STORAGE_KEY || !e.newValue) return
      const v = e.newValue
      if (v === "MOMENTS" || v === "AURA" || v === "NIGHT" || v === "MINIMAL") {
        setCoverFallbackStyle(v)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

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
        setPinnedIds((prev) => prev.filter((id) => id !== String(event.messageId)))
        return
      }

      if (event?.type === "MESSAGE_PINNED" && event?.messageId) {
        const messageId = String(event.messageId)
        setPinnedIds((prev) => (prev.includes(messageId) ? prev : [messageId, ...prev]))
        return
      }

      if (event?.type === "MESSAGE_UNPINNED" && event?.messageId) {
        const messageId = String(event.messageId)
        setPinnedIds((prev) => prev.filter((id) => id !== messageId))
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
    const text = messageContent.trim()
    const hasMediaPair = Boolean(outgoingMediaType && outgoingMediaUrl.trim())
    if (!text && !hasMediaPair) {
      toast.error(te("Escribe un mensaje o completa URL y tipo de media", "Write a message or complete URL and media type"))
      return
    }
    if (outgoingMediaType && !outgoingMediaUrl.trim()) {
      toast.error(te("Falta la URL del archivo", "Missing file URL"))
      return
    }
    if (!outgoingMediaType && outgoingMediaUrl.trim()) {
      toast.error(te("Selecciona un tipo de media o borra la URL", "Select a media type or clear the URL"))
      return
    }
    if (outgoingMediaType === "VIDEO") {
      const d = parseInt(outgoingVideoDurationSec, 10)
      if (!Number.isFinite(d) || d < 0 || d > 180) {
        toast.error(te("Para video indica la duración en segundos (0–180)", "For video specify duration in seconds (0-180)"))
        return
      }
    }
    setIsSending(true)
    try {
      const body: {
        content?: string
        mediaType?: GroupMessageMediaType
        mediaUrl?: string
        durationSeconds?: number
      } = {}
      if (text) body.content = text
      if (hasMediaPair && outgoingMediaType) {
        body.mediaType = outgoingMediaType
        body.mediaUrl = outgoingMediaUrl.trim()
        if (outgoingMediaType === "VIDEO") {
          body.durationSeconds = parseInt(outgoingVideoDurationSec, 10)
        }
      }
      const created = await groupService.messages.send(groupId, body)
      setMessages((prev) => dedupeMessages(upsertIncomingMessage(prev, created)))
      setMessageContent("")
      setOutgoingMediaType("")
      setOutgoingMediaUrl("")
      setOutgoingVideoDurationSec("")
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo enviar", "Could not send"))
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
      toast.error(error?.message || te("No se pudo actualizar el rol", "Could not update role"))
    } finally {
      setRoleUpdatingUserId(null)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    setRemovingMemberUserId(userId)
    try {
      await groupService.members.kick(groupId, userId)
      toast.success(te("Miembro removido del grupo", "Member removed from group"))
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo remover el miembro", "Could not remove member"))
    } finally {
      setRemovingMemberUserId(null)
    }
  }

  const handleMuteToggle = async (member: GroupMember) => {
    setMuteUpdatingUserId(member.userId)
    try {
      if (member.muted) {
        await groupService.members.unmute(groupId, member.userId)
        toast.success(te("Silencio removido", "Mute removed"))
      } else {
        await groupService.members.mute(groupId, member.userId)
        toast.success(te("Miembro silenciado", "Member muted"))
      }
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo actualizar el silencio", "Could not update mute"))
    } finally {
      setMuteUpdatingUserId(null)
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      await groupService.settings.patch(groupId, settingsWhoCanTalk)
      setGroup((prev) => (prev ? { ...prev, whoCanTalk: settingsWhoCanTalk } : prev))
      toast.success(te("Configuración actualizada", "Configuration updated"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo actualizar configuración", "Could not update configuration"))
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
      toast.success(te("Link de invitación creado", "Invitation link created"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear el link", "Could not create link"))
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleDeactivateInvite = async (inviteId: string) => {
    setDeactivatingInviteId(inviteId)
    try {
      await groupService.inviteLinks.remove(groupId, inviteId)
      setInviteLinks((prev) => prev.filter((l) => l.inviteId !== inviteId))
      toast.success(te("Link desactivado", "Link disabled"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo desactivar el link", "Could not disable link"))
    } finally {
      setDeactivatingInviteId(null)
    }
  }

  const getInviteUrl = (invite: GroupInviteLink) => {
    const sp = new URLSearchParams()
    sp.set("token", invite.token)
    sp.set("targetRole", invite.targetRole)
    sp.set("maxUses", String(invite.maxUses))
    sp.set("usedCount", String(invite.usedCount))
    if (invite.expiresAt) sp.set("expiresAt", invite.expiresAt)
    return `${window.location.origin}/groups?${sp.toString()}`
  }

  const handleGenerateInviteQr = async (invite: GroupInviteLink) => {
    setGeneratingQrInviteId(invite.inviteId)
    try {
      const inviteUrl = getInviteUrl(invite)
      const dataUrl = await QRCode.toDataURL(inviteUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
      setInviteQrById((prev) => ({ ...prev, [invite.inviteId]: dataUrl }))
      toast.success(te("Código QR generado", "QR code generated"))
    } catch {
      toast.error(te("No se pudo generar el QR", "Could not generate QR"))
    } finally {
      setGeneratingQrInviteId(null)
    }
  }

  const handleShareInviteAsPost = async (invite: GroupInviteLink) => {
    setSharingInviteId(invite.inviteId)
    try {
      const inviteUrl = getInviteUrl(invite)
      const body = te(
        `Invitación al grupo "${group?.name || ""}"\nRol: ${invite.targetRole}\nÚnete aquí: ${inviteUrl}`,
        `Invitation to group "${group?.name || ""}"\nRole: ${invite.targetRole}\nJoin here: ${inviteUrl}`
      )
      const formData = new FormData()
      formData.append("post", JSON.stringify({
        body,
        permanent: true,
        locked: false,
        visibility: "PUBLIC",
      }))

      const token = localStorage.getItem("sparkd_token")
      const response = await fetch("/api/proxy/api/posts/new", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || te("No se pudo compartir en post", "Could not share as post"))
      }

      toast.success(te("Invitación compartida en un post", "Invitation shared as a post"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo compartir en post", "Could not share as post"))
    } finally {
      setSharingInviteId(null)
    }
  }

  const handleAddMember = async () => {
    const input = newMemberId.trim()
    if (!input) return
    setIsAddingMember(true)
    try {
      const resolvedUserId = newMemberResolvedId || await groupService.resolveUserIdInput(input)
      await groupService.members.add(groupId, resolvedUserId, newMemberRole)
      toast.success(te("Miembro agregado", "Member added"))
      setNewMemberId("")
      setNewMemberResolvedId("")
      setMemberSuggestions([])
      setShowMemberDropdown(false)
      await loadGroup()
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo agregar miembro", "Could not add member"))
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
    if (sec < 60) return te("ahora", "now")
    if (sec < 3600) return te(`hace ${Math.floor(sec / 60)} min`, `${Math.floor(sec / 60)} min ago`)
    if (sec < 86400) return te(`hace ${Math.floor(sec / 3600)} h`, `${Math.floor(sec / 3600)} h ago`)
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
    if (diffDays === 0) return te("Hoy", "Today")
    if (diffDays === 1) return te("Ayer", "Yesterday")
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
      toast.success(te("Mensaje editado", "Message edited"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo editar", "Could not edit"))
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
      toast.success(te("Mensaje eliminado", "Message deleted"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo eliminar", "Could not delete"))
    } finally {
      setDeletingMessageId(null)
    }
  }

  const togglePin = async (messageId: string) => {
    if (!canModerate) return
    const isPinned = pinnedIds.includes(messageId)
    setPinUpdatingMessageId(messageId)
    try {
      if (isPinned) {
        await groupService.messages.unpin(groupId, messageId)
        setPinnedIds((prev) => prev.filter((id) => id !== messageId))
      } else {
        await groupService.messages.pin(groupId, messageId)
        setPinnedIds((prev) => (prev.includes(messageId) ? prev : [messageId, ...prev]))
      }
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo actualizar mensaje fijado", "Could not update pinned message"))
    } finally {
      setPinUpdatingMessageId(null)
    }
  }

  const renderedMessages = useMemo(() => dedupeMessages(messages), [messages])
  const groupCover = useMemo(
    () => (group ? resolveGroupCoverUrl(group, coverFallbackStyle) : ""),
    [group, coverFallbackStyle]
  )

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
      toast.success(te("Grupo eliminado", "Group deleted"))
      router.push("/groups")
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo eliminar el grupo", "Could not delete group"))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !group || !isAdmin) return
    if (!file.type.startsWith("image/")) {
      toast.error(te("Selecciona una imagen", "Please select an image"))
      return
    }
    setIsUploadingCover(true)
    try {
      let uploadedUrl = ""
      let updated = null as Group | null
      try {
        const uploaded = await groupService.uploadCover(groupId, file)
        uploadedUrl = uploaded.coverPhotoUrl
        updated = await groupService.getById(groupId)
      } catch {
        const { uploadToCloudinary } = await import("@/lib/cloudinary")
        uploadedUrl = await uploadToCloudinary(file)
        updated = await groupService.update(groupId, { coverPhotoUrl: uploadedUrl })
      }
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              ...(updated || {}),
              coverPhotoUrl: updated?.coverPhotoUrl || uploadedUrl,
              coverPhoto: updated?.coverPhoto || prev.coverPhoto,
            }
          : prev
      )
      toast.success(te("Portada actualizada", "Cover updated"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo subir la portada", "Could not upload cover"))
    } finally {
      setIsUploadingCover(false)
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
    <div className="mx-auto max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <div className="mb-6">
        <div className="mb-4 overflow-hidden rounded-2xl border border-border/60">
          <div className="relative h-40 sm:h-52">
            <img src={groupCover} alt={group.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            {isAdmin && (
              <>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverFileChange}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-3 right-3 shadow-md"
                  disabled={isUploadingCover}
                  onClick={() => coverInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-1.5" />
                  {isUploadingCover
                    ? te("Subiendo…", "Uploading…")
                    : te("Cambiar portada", "Change cover")}
                </Button>
              </>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-muted-foreground mt-1">{group.description || te("Sin descripción", "No description")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{group.memberCount.toLocaleString()} {te("miembros", "members")}</span>
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
                  {te("Moderador", "Moderator")}
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
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {te("Eliminar grupo", "Delete group")}
            </Button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">{te("Miembros", "Members")}</p>
            <p className="text-lg font-bold">{group.memberCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">{te("Mensajes", "Messages")}</p>
            <p className="text-lg font-bold">{messages.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">{te("Tu rol", "Your role")}</p>
            <p className="text-sm font-semibold">
              {group.myRole === "ADMIN"
                ? "Admin"
                : group.myRole === "MODERATOR"
                  ? te("Moderador", "Moderator")
                  : te("Miembro", "Member")}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">{te("Chat", "Chat")}</p>
            <p className="text-sm font-semibold">
              {group.whoCanTalk === "ALL"
                ? te("Abierto", "Open")
                : group.whoCanTalk === "MODS_AND_ADMINS"
                  ? te("Moderado", "Moderated")
                  : te("Solo admin", "Admin only")}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className={`w-full grid ${features.groupRoles ? "grid-cols-4" : "grid-cols-3"}`}
        >
          <TabsTrigger value="messages">{te("Chat", "Chat")}</TabsTrigger>
          <TabsTrigger value="polls">{te("Encuestas", "Polls")}</TabsTrigger>
          <TabsTrigger value="summary">{te("Resumen", "Summary")}</TabsTrigger>
          {features.groupRoles && <TabsTrigger value="members">{t("common.members")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          {!canSendInChat && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
              {isMuted
                ? te("Estás silenciado en este grupo: no puedes enviar mensajes.", "You are muted in this group: you cannot send messages.")
                : whoCanTalkHint}
            </div>
          )}
          {pinnedMessages.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{te("Mensajes fijados", "Pinned messages")}</p>
              {pinnedMessages.map((msg, idx) => (
                <div
                  key={`pin-${normalizeMessageId(msg) || "noid"}-${idx}`}
                  className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{msg.senderUsername || te("Sistema", "System")}</p>
                  <p className="text-sm">{msg.content || te("Mensaje eliminado", "Message deleted")}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 mb-4">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={te("Escribe un mensaje al grupo...", "Write a message to the group...")}
              className="min-h-24 resize-none"
              maxLength={4000}
              disabled={!canSendInChat}
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-end">
              <div className="sm:col-span-1">
                <p className="text-xs text-muted-foreground mb-1">{te("Media (opcional)", "Media (optional)")}</p>
                <Select
                  value={outgoingMediaType || "NONE"}
                  onValueChange={(v) =>
                    setOutgoingMediaType(v === "NONE" ? "" : (v as GroupMessageMediaType))
                  }
                  disabled={!canSendInChat}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={te("Sin archivo", "No file")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{te("Sin archivo", "No file")}</SelectItem>
                    <SelectItem value="IMAGE">{te("Imagen (URL)", "Image (URL)")}</SelectItem>
                    <SelectItem value="VIDEO">{te("Video (URL)", "Video (URL)")}</SelectItem>
                    <SelectItem value="AUDIO">{te("Audio (URL)", "Audio (URL)")}</SelectItem>
                    <SelectItem value="FILE">{te("Archivo (URL)", "File (URL)")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">{te("URL pública (p. ej. Cloudinary)", "Public URL (e.g. Cloudinary)")}</p>
                <Input
                  value={outgoingMediaUrl}
                  onChange={(e) => setOutgoingMediaUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={!canSendInChat}
                />
              </div>
            </div>
            {outgoingMediaType === "VIDEO" && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{te("Duración video (seg, máx. 180)", "Video duration (sec, max 180)")}</p>
                <Input
                  type="number"
                  min={0}
                  max={180}
                  value={outgoingVideoDurationSec}
                  onChange={(e) => setOutgoingVideoDurationSec(e.target.value)}
                  disabled={!canSendInChat}
                />
              </div>
            )}
            <Button
              onClick={handleSendMessage}
              className="w-full"
              disabled={
                isSending ||
                !canSendInChat ||
                (!messageContent.trim() && !(outgoingMediaType && outgoingMediaUrl.trim()))
              }
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? te("Enviando...", "Sending...") : t("common.send")}
            </Button>
          </div>

          {renderedMessages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">{te("No hay mensajes aún", "No messages yet")}</p>
              <p className="text-sm text-muted-foreground mt-2">{te("Sé el primero en escribir", "Be the first to write")}</p>
            </div>
          ) : (
            <ScrollArea className="h-[56vh] sm:h-[420px] rounded-lg border border-border">
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
                              {msg.senderUsername || te("Sistema", "System")} · {formatRelative(msg.sentAt)}
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
                                  {isSavingEdit ? te("Guardando...", "Saving...") : t("common.save")}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingMessageId(null)}>
                                  {t("common.cancel")}
                                </Button>
                              </div>
                            </div>
                          ) : (
                          <div>
                            <p className="text-sm text-foreground">
                              {msg.deleted ? te("Mensaje eliminado", "Message deleted") : (msg.content || "")}
                            </p>
                            {!msg.deleted && msg.mediaUrl && (
                              <div className="mt-2 space-y-2">
                                {msg.mediaType === "IMAGE" && (
                                  <img
                                    src={msg.mediaUrl}
                                    alt=""
                                    className="max-h-60 w-full rounded-md object-contain"
                                  />
                                )}
                                {msg.mediaType === "VIDEO" && (
                                  <video
                                    src={msg.mediaUrl}
                                    className="max-h-60 w-full rounded-md"
                                    controls
                                  />
                                )}
                                {msg.mediaType === "AUDIO" && (
                                  <audio src={msg.mediaUrl} className="w-full" controls />
                                )}
                                {msg.mediaType === "FILE" && (
                                  <a
                                    href={msg.mediaUrl}
                                    className="text-sm text-primary underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {te("Abrir archivo", "Open file")}
                                  </a>
                                )}
                                {!msg.mediaType && (
                                  <a
                                    href={msg.mediaUrl}
                                    className="text-sm text-primary underline"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {te("Abrir enlace", "Open link")}
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                              {formatCompactTime(msg.sentAt)}
                            </p>
                          </div>
                          )}
                        </div>
                        {!msg.deleted && (canModerate || canEditMessage(msg) || canDeleteMessage(msg)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditMessage(msg) && (
                                <DropdownMenuItem onClick={() => startEdit(msg)}>{t("common.edit")}</DropdownMenuItem>
                              )}
                              {canDeleteMessage(msg) && (
                                <DropdownMenuItem
                                  className="text-red-500"
                                  disabled={deletingMessageId === msg.id}
                                  onClick={() => deleteMessage(msg.id)}
                                >
                                  {deletingMessageId === msg.id ? te("Eliminando...", "Deleting...") : t("common.delete")}
                                </DropdownMenuItem>
                              )}
                              {canModerate && (
                                <DropdownMenuItem
                                  disabled={pinUpdatingMessageId === msg.id}
                                  onClick={() => void togglePin(msg.id)}
                                >
                                  <Pin className="h-4 w-4 mr-2" />
                                  {pinUpdatingMessageId === msg.id
                                    ? te("Actualizando...", "Updating...")
                                    : pinnedIds.includes(msg.id)
                                      ? te("Desfijar", "Unpin")
                                      : te("Fijar", "Pin")}
                                </DropdownMenuItem>
                              )}
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

        <TabsContent value="polls" className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-2">{te("Crear encuesta", "Create poll")}</p>
            <Textarea
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder={te("Pregunta…", "Question…")}
              className="min-h-20 resize-none"
              maxLength={240}
            />
            <div className="mt-3 space-y-2">
              {pollOptions.map((opt, idx) => (
                <Input
                  key={idx}
                  value={opt}
                  onChange={(e) => {
                    const v = e.target.value
                    setPollOptions((prev) => prev.map((x, i) => (i === idx ? v : x)))
                  }}
                  placeholder={te(`Opción ${idx + 1}`, `Option ${idx + 1}`)}
                />
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                >
                  {te("Agregar opción", "Add option")}
                </Button>
                <Button
                  type="button"
                  disabled={isCreatingPoll}
                  onClick={async () => {
                    const question = pollQuestion.trim()
                    const options = pollOptions.map((o) => o.trim()).filter(Boolean)
                    if (!question || options.length < 2) {
                      toast.error(te("Ingresa una pregunta y al menos 2 opciones", "Enter a question and at least 2 options"))
                      return
                    }
                    setIsCreatingPoll(true)
                    try {
                      await groupService.polls.create(groupId, { question, options })
                      setPollQuestion("")
                      setPollOptions(["", ""])
                      const rows = await groupService.polls.list(groupId)
                      setPolls(Array.isArray(rows) ? rows : [])
                      toast.success(te("Encuesta creada", "Poll created"))
                    } catch (e: any) {
                      toast.error(e?.message || te("No se pudo crear la encuesta", "Could not create poll"))
                    } finally {
                      setIsCreatingPoll(false)
                    }
                  }}
                >
                  {isCreatingPoll ? te("Creando…", "Creating…") : te("Crear", "Create")}
                </Button>
              </div>
            </div>
          </div>

          {isLoadingPolls ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : polls.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{te("Aún no hay encuestas.", "No polls yet.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map((poll: any, idx: number) => (
                <div key={String(poll?.id || idx)} className="rounded-xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">
                    {String(poll?.question || te("Encuesta", "Poll"))}
                  </p>
                  <div className="mt-3 space-y-2">
                    {(Array.isArray(poll?.options) ? poll.options : []).map((opt: any) => {
                      const votedByMe = Boolean(opt?.votedByMe)
                      const optionId = String(opt?.id || opt?.optionId || "")
                      const text = String(opt?.optionText || opt?.text || opt?.label || "")
                      const voteCount = Number(opt?.voteCount || 0)
                      return (
                        <button
                          key={optionId || text}
                          type="button"
                          className={`w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                            votedByMe ? "border-primary/40 bg-primary/10" : "border-border hover:bg-muted/40"
                          }`}
                          onClick={async () => {
                            if (!optionId) return
                            try {
                              await groupService.polls.vote(groupId, optionId)
                              const rows = await groupService.polls.list(groupId)
                              setPolls(Array.isArray(rows) ? rows : [])
                            } catch (e: any) {
                              toast.error(e?.message || te("No se pudo votar", "Could not vote"))
                            }
                          }}
                        >
                          <span className="text-sm text-foreground">{text || te("Opción", "Option")}</span>
                          <span className="text-xs text-muted-foreground">{voteCount}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary" className="mt-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-2">{te("Categoría y temas", "Category and topics")}</p>
            {group.category ? (
              <p className="text-sm text-muted-foreground">
                {te("Categoría", "Category")}: <span className="text-foreground font-medium">{group.category}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{te("Sin categoría.", "No category.")}</p>
            )}
            {group.topics && group.topics.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.topics.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">{te("Sin temas listados.", "No topics listed.")}</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold mb-2">{te("Reglas de participación (chat)", "Participation rules (chat)")}</p>
            <p className="text-sm text-muted-foreground">{whoCanTalkHint}</p>
            <p className="text-xs text-muted-foreground mt-3">
              {te("Configuración actual", "Current config")}: <span className="font-mono">{group.whoCanTalk || "ALL"}</span>
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">{te("Publicaciones (feed)", "Posts (feed)")}</p>
            <p className="text-sm text-muted-foreground">
              {te("En el backend Sparkd no hay un endpoint de \"posts\" por grupo: el módulo usa mensajes de chat", "In Sparkd backend there is no group posts endpoint: this module uses chat messages")}
              (<code className="rounded bg-muted px-1">/api/groups/:id/messages</code>) y los posts de perfil viven en
              <code className="ml-1 rounded bg-muted px-1">/api/posts</code>. El contenido del grupo se gestiona en la
              {te("pestaña Chat.", "Chat tab.")}
            </p>
          </div>
        </TabsContent>

        {features.groupRoles && (
          <TabsContent value="members" className="mt-6">
          {isAdmin && (
            <div className="mb-6 space-y-4 rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {te("Configuración del grupo", "Group configuration")}
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{te("Quién puede hablar", "Who can talk")}</p>
                  <Select value={settingsWhoCanTalk} onValueChange={(v: any) => setSettingsWhoCanTalk(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {whoCanTalkOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full md:w-auto">
                    {te("Guardar configuración", "Save configuration")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="mb-6 space-y-4 rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-semibold">{te("Agregar miembro directo", "Add member directly")}</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Input
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  onKeyDown={handleMemberInputKeyDown}
                  onFocus={() => {
                    if (memberSuggestions.length > 0) setShowMemberDropdown(true)
                  }}
                  onBlur={() => setShowMemberDropdown(false)}
                  placeholder={te("ID de usuario (UUID) o @usuario", "User ID (UUID) or @username")}
                />
                {showMemberDropdown && (
                  <div className="relative md:col-span-3">
                    <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
                      {isSearchingMembers ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{te("Buscando...", "Searching...")}</div>
                      ) : memberSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{te("Sin resultados", "No results")}</div>
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
                    <SelectItem value="GUEST">{roleLabel.GUEST}</SelectItem>
                    <SelectItem value="MODERATOR">{roleLabel.MODERATOR}</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddMember} disabled={isAddingMember} className="w-full md:w-auto">
                  {isAddingMember ? te("Agregando...", "Adding...") : te("Agregar", "Add")}
                </Button>
              </div>
            </div>
          )}

          {canModerate && (
            <div className="mb-6 space-y-4 rounded-xl border border-border p-4 bg-card">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {te("Enlaces de invitación", "Invitation links")}
              </p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUEST">{roleLabel.GUEST}</SelectItem>
                    <SelectItem value="MODERATOR">{roleLabel.MODERATOR}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={inviteMaxUses}
                  onChange={(e) => setInviteMaxUses(e.target.value)}
                  placeholder={te("Máximo de usos (0 = ilimitado)", "Maximum uses (0 = unlimited)")}
                />
                <Button onClick={handleCreateInvite} disabled={isCreatingInvite} className="w-full md:w-auto">
                  {isCreatingInvite ? te("Creando...", "Creating...") : t("common.createLink")}
                </Button>
              </div>
              <div className="space-y-2">
                {inviteLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{te("No hay links activos.", "No active links.")}</p>
                ) : (
                  inviteLinks.map((link) => (
                    <div key={link.inviteId} className="flex flex-col gap-2 rounded border border-border p-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs">
                        <p className="font-mono">{link.token}</p>
                        <p className="text-muted-foreground">
                          {link.targetRole === "MODERATOR" ? roleLabel.MODERATOR : roleLabel.GUEST} · {link.usedCount}/{link.maxUses === 0 ? "∞" : link.maxUses}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={copyingInviteId === link.inviteId}
                          className="w-full sm:w-auto"
                          onClick={async () => {
                            setCopyingInviteId(link.inviteId)
                            try {
                              await navigator.clipboard.writeText(getInviteUrl(link))
                              toast.success(te("Link copiado", "Link copied"))
                            } finally {
                              setCopyingInviteId(null)
                            }
                          }}
                        >
                          {copyingInviteId === link.inviteId ? te("Copiando...", "Copying...") : t("common.copy")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generatingQrInviteId === link.inviteId}
                          className="w-full sm:w-auto"
                          onClick={() => handleGenerateInviteQr(link)}
                        >
                          <QrCode className="h-3.5 w-3.5 mr-1" />
                          {generatingQrInviteId === link.inviteId
                            ? te("Generando QR...", "Generating QR...")
                            : te("QR", "QR")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sharingInviteId === link.inviteId}
                          className="w-full sm:w-auto"
                          onClick={() => handleShareInviteAsPost(link)}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1" />
                          {sharingInviteId === link.inviteId
                            ? te("Compartiendo...", "Sharing...")
                            : te("Compartir en post", "Share as post")}
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deactivatingInviteId === link.inviteId}
                            className="w-full sm:w-auto"
                            onClick={() => handleDeactivateInvite(link.inviteId)}
                          >
                            {deactivatingInviteId === link.inviteId ? te("Desactivando...", "Disabling...") : t("common.disable")}
                          </Button>
                        )}
                      </div>
                      {inviteQrById[link.inviteId] && (
                        <div className="mt-2 rounded border border-border bg-muted/30 p-3">
                          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
                            <img
                              src={inviteQrById[link.inviteId]}
                              alt={te("QR de invitación", "Invitation QR")}
                              className="h-36 w-36 rounded bg-white p-1"
                            />
                            <div className="text-xs text-muted-foreground">
                              <p>{te("Escanea para unirte al grupo.", "Scan to join the group.")}</p>
                              <p className="mt-1 font-mono break-all">{getInviteUrl(link)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {members.map((member) => {
              const isRowSelf = Boolean(currentUserId && member.userId === currentUserId)
              const canModerateThisRow =
                canModerate && member.role !== "ADMIN" && !isRowSelf
              const canMuteThisMember =
                canModerateThisRow && (isAdmin || member.role !== "MODERATOR")
              return (
              <div
                key={member.userId}
                className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {member.username}
                      {isRowSelf && <span className="text-xs font-normal text-muted-foreground"> (tú)</span>}
                    </p>
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

                {canModerateThisRow && (
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    {isAdmin && member.role === 'GUEST' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roleUpdatingUserId === member.userId}
                        className="w-full sm:w-auto"
                        onClick={() => handleChangeRole(member.userId, 'MODERATOR')}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        {roleUpdatingUserId === member.userId ? te("Guardando...", "Saving...") : te("Hacer moderador", "Make moderator")}
                      </Button>
                    )}
                    {isAdmin && member.role === 'MODERATOR' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={roleUpdatingUserId === member.userId}
                        className="w-full sm:w-auto"
                        onClick={() => handleChangeRole(member.userId, 'GUEST')}
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        {roleUpdatingUserId === member.userId ? te("Guardando...", "Saving...") : te("Quitar moderador", "Remove moderator")}
                      </Button>
                    )}
                    {canMuteThisMember && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={muteUpdatingUserId === member.userId}
                      className="w-full sm:w-auto"
                      onClick={() => handleMuteToggle(member)}
                    >
                      {member.muted ? <Volume2 className="h-3.5 w-3.5 mr-1" /> : <VolumeX className="h-3.5 w-3.5 mr-1" />}
                      {muteUpdatingUserId === member.userId
                        ? te("Guardando...", "Saving...")
                        : member.muted
                          ? te("Quitar silencio", "Unmute")
                          : te("Silenciar", "Mute")}
                    </Button>
                    )}
                    {isAdmin && member.role !== "ADMIN" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={removingMemberUserId === member.userId}
                        className="w-full sm:w-auto"
                        onClick={() => handleRemoveMember(member.userId)}
                      >
                        {removingMemberUserId === member.userId ? te("Removiendo...", "Removing...") : te("Expulsar", "Remove")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
