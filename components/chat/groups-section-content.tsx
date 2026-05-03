"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Users, Plus, Lock, Globe, TrendingUp, RefreshCw, Link2, Share2, QrCode, MessageCircle, Copy, Sparkles, LayoutGrid, List, ArrowUpDown, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import type { Chat, Group, GroupInviteLink } from "@/lib/types"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { groupService } from "@/lib/services/group"
import { useI18n } from "@/lib/i18n"
import { chatService } from "@/lib/services/chat"
import {
  getStoredFallbackStyle,
  GROUP_COVER_FALLBACK_STORAGE_KEY,
  type GroupCoverFallbackStyle,
  resolveGroupCoverUrl,
} from "@/lib/group-cover"
import QRCode from "qrcode"

const CATEGORIES = [
  "ENTRETENIMIENTO",
  "DEPORTE",
  "VIAJES",
  "ESTILO_DE_VIDA",
  "CONOCIMIENTO",
  "SOCIAL",
  "ARTE",
  "MUSICA",
  "GASTRONOMIA",
  "NATURALEZA",
  "TECNOLOGIA",
  "NEGOCIOS",
  "BIENESTAR",
  "CULTURA",
  "AVENTURA",
] as const

const extractInviteToken = (value: string) => {
  if (!value) return ""
  try {
    const url = new URL(value)
    const queryToken = url.searchParams.get("token")
    if (queryToken) return queryToken

    const parts = url.pathname.split("/").filter(Boolean)
    const joinIndex = parts.findIndex((p) => p.toLowerCase() === "join")
    if (joinIndex >= 0 && parts[joinIndex + 1]) return parts[joinIndex + 1]
  } catch {
    // Not a URL; fallback to raw token-like input.
  }
  return value.trim()
}

type InvitePreview = {
  token: string
  targetRole?: string
  maxUses?: number
  usedCount?: number
  expiresAt?: string
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  ENTRETENIMIENTO: "from-fuchsia-500/30 via-purple-500/20 to-indigo-500/30",
  DEPORTE: "from-emerald-500/30 via-teal-500/20 to-cyan-500/30",
  VIAJES: "from-sky-500/30 via-blue-500/20 to-indigo-500/30",
  ESTILO_DE_VIDA: "from-rose-500/30 via-pink-500/20 to-fuchsia-500/30",
  CONOCIMIENTO: "from-amber-500/30 via-orange-500/20 to-yellow-500/30",
  SOCIAL: "from-violet-500/30 via-purple-500/20 to-pink-500/30",
}

const getGroupCoverClass = (group: Group) =>
  CATEGORY_GRADIENTS[group.category || ""] || "from-primary/30 via-secondary/20 to-accent/30"

const computeTrendingScore = (group: Group) => {
  const members = Number(group.memberCount || 0)
  const topics = Array.isArray(group.topics) ? group.topics.length : 0
  const hasCategory = group.category ? 1 : 0
  const recencyBoost = group.createdAt
    ? Math.max(0, 20 - Math.floor((Date.now() - new Date(group.createdAt).getTime()) / 86400000))
    : 0
  return members + topics * 4 + hasCategory * 6 + recencyBoost
}

export function GroupsSection() {
  const { te, t } = useI18n()
  const features = useFeatureFlags()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [topics, setTopics] = useState("")
  const [category, setCategory] = useState<string>("")
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')
  const [createCoverFile, setCreateCoverFile] = useState<File | null>(null)
  const [createCoverPreview, setCreateCoverPreview] = useState<string | null>(null)
  const [coverFallbackStyle, setCoverFallbackStyle] =
    useState<GroupCoverFallbackStyle>("MOMENTS")
  const [discoverCategory, setDiscoverCategory] = useState<string>("ALL")
  const [discoverFeed, setDiscoverFeed] = useState<string>("GLOBAL")
  const [discoverSort, setDiscoverSort] = useState<"TRENDING" | "ACTIVE" | "A_TO_Z">("TRENDING")
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID")
  const [searchQuery, setSearchQuery] = useState("")
  const [invitePreviewFromUrl, setInvitePreviewFromUrl] = useState<InvitePreview | null>(null)
  const [isJoiningByToken, setIsJoiningByToken] = useState(false)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([])
  const [shareOpen, setShareOpen] = useState(false)
  const [shareGroup, setShareGroup] = useState<Group | null>(null)
  const [shareInviteByGroupId, setShareInviteByGroupId] = useState<Record<string, GroupInviteLink>>({})
  const [shareInviteLinksByGroupId, setShareInviteLinksByGroupId] = useState<Record<string, GroupInviteLink[]>>({})
  const [isInviteLinksLoadingByGroupId, setIsInviteLinksLoadingByGroupId] = useState<Record<string, boolean>>({})
  const [inviteRoleDraft, setInviteRoleDraft] = useState<"GUEST" | "MODERATOR">("GUEST")
  const [inviteMaxUsesDraft, setInviteMaxUsesDraft] = useState("0")
  const [inviteExpiresAtDraft, setInviteExpiresAtDraft] = useState("")
  const [shareQrByGroupId, setShareQrByGroupId] = useState<Record<string, string>>({})
  const [isPreparingShare, setIsPreparingShare] = useState(false)
  const [isPostingShare, setIsPostingShare] = useState(false)
  const [isSendingChatShare, setIsSendingChatShare] = useState(false)
  const [shareCaption, setShareCaption] = useState("")
  const [includeQrInPost, setIncludeQrInPost] = useState(false)
  const [chatList, setChatList] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState("")
  const autoJoinAttemptedRef = useRef<string | null>(null)
  const createCoverPreviewRef = useRef<string | null>(null)

  useEffect(() => {
    if (!features.groupsPage) {
      toast.error(te("Esta funcionalidad no está disponible aún!", "This feature is not available yet!"))
      router.push('/feed')
    }
  }, [features.groupsPage, router])

  if (!features.groupsPage) {
    return null
  }

  const loadGroups = async (selectedCategory?: string, selectedFeed?: string) => {
    setIsLoading(true)
    try {
      const [mine, discover] = await Promise.all([
        groupService.myGroups(),
        groupService.discover({
          feed: (selectedFeed || discoverFeed) as any,
          category: selectedCategory && selectedCategory !== "ALL" ? selectedCategory : undefined,
        }),
      ])
      const myIds = new Set(mine.map((g) => g.id))
      setMyGroups(mine.map((g) => ({ ...g, isMember: true })))
      setDiscoverGroups(
        discover.map((g) => ({
          ...g,
          isMember: myIds.has(g.id),
          privacy: g.isPublic ? "PUBLIC" : "PRIVATE",
        }))
      )
    } catch (error) {
      toast.error(te("No se pudieron cargar los grupos", "Could not load groups"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadGroups()
  }, [])

  useEffect(() => {
    void loadGroups(discoverCategory, discoverFeed)
  }, [discoverCategory, discoverFeed])

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setInvitePreviewFromUrl(null)
      return
    }
    const extracted = extractInviteToken(token)
    const maxUsesRaw = searchParams.get("maxUses")
    const usedCountRaw = searchParams.get("usedCount")
    const maxUses = maxUsesRaw !== null && maxUsesRaw !== "" ? Number(maxUsesRaw) : undefined
    const usedCount = usedCountRaw !== null && usedCountRaw !== "" ? Number(usedCountRaw) : undefined
    setInvitePreviewFromUrl({
      token: extracted,
      targetRole: searchParams.get("targetRole") || undefined,
      maxUses: Number.isFinite(maxUses as number) ? maxUses : undefined,
      usedCount: Number.isFinite(usedCount as number) ? usedCount : undefined,
      expiresAt: searchParams.get("expiresAt") || undefined,
    })
  }, [searchParams])

  const dismissInviteFromUrl = () => {
    setInvitePreviewFromUrl(null)
    const next = new URLSearchParams(searchParams.toString())
    next.delete("token")
    next.delete("targetRole")
    next.delete("maxUses")
    next.delete("usedCount")
    next.delete("expiresAt")
    const query = next.toString()
    router.replace(query ? `/groups?${query}` : "/groups")
  }

  const resetCreateCover = () => {
    setCreateCoverFile(null)
    if (createCoverPreviewRef.current) {
      URL.revokeObjectURL(createCoverPreviewRef.current)
      createCoverPreviewRef.current = null
    }
    setCreateCoverPreview(null)
  }

  const handleCreateCoverFile = (file: File | null) => {
    resetCreateCover()
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error(te("Selecciona una imagen", "Please select an image"))
      return
    }
    const url = URL.createObjectURL(file)
    createCoverPreviewRef.current = url
    setCreateCoverPreview(url)
    setCreateCoverFile(file)
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(te("El nombre es requerido", "Name is required"))
      return
    }
    const rawTopics = topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (rawTopics.length > 10) {
      toast.error(te("Máximo 10 temas", "Maximum 10 topics"))
      return
    }
    const tooLong = rawTopics.find((t) => t.length > 50)
    if (tooLong) {
      toast.error(te("Cada tema puede tener como máximo 50 caracteres", "Each topic can have a maximum of 50 characters"))
      return
    }
    const normalizedTopics = rawTopics

    setIsCreating(true)
    try {
      const basePayload = {
        name: name.trim(),
        description: description.trim() || undefined,
        feedVisibility: "GLOBAL" as const,
        whoCanTalk: "ALL" as const,
        isPublic: privacy === "PUBLIC",
        category: category || undefined,
        topics: normalizedTopics.length ? normalizedTopics : undefined,
      }
      const created = await groupService.create(basePayload)
      if (createCoverFile) {
        try {
          await groupService.uploadCover(created.id, createCoverFile)
        } catch {
          // Fallback de compatibilidad si el endpoint aún no está desplegado en backend.
          const { uploadToCloudinary } = await import("@/lib/cloudinary")
          const coverPhotoUrl = await uploadToCloudinary(createCoverFile)
          await groupService.update(created.id, { coverPhotoUrl })
        }
      }
      toast.success(te("Grupo creado", "Group created"))
      setCreateOpen(false)
      setName("")
      setDescription("")
      setTopics("")
      setCategory("")
      resetCreateCover()
      await loadGroups(discoverCategory)
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo crear el grupo", "Could not create group"))
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoin = async (groupId: string) => {
    try {
      await groupService.joinPublic(groupId)
      toast.success(te("Te uniste al grupo", "You joined the group"))
      router.push(`/groups/${groupId}`)
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo unir al grupo", "Could not join group"))
    }
  }

  const handleJoinByToken = async (
    tokenInput: string,
    options?: { silent?: boolean }
  ) => {
    const raw = tokenInput.trim()
    const token = extractInviteToken(raw)
    if (!token) return
    setIsJoiningByToken(true)
    try {
      const group = await groupService.joinByToken(token)
      if (!options?.silent) {
        toast.success(te("Te uniste por invitación", "You joined via invitation"))
      }
      router.push(`/groups/${group.id}`)
    } catch (error: any) {
      toast.error(error?.message || te("Invitación inválida o expirada", "Invitation invalid or expired"))
    } finally {
      setIsJoiningByToken(false)
    }
  }

  useEffect(() => {
    const token = invitePreviewFromUrl?.token
    if (!token) return
    if (autoJoinAttemptedRef.current === token) return
    autoJoinAttemptedRef.current = token
    void handleJoinByToken(token, { silent: true })
  }, [invitePreviewFromUrl?.token])

  useEffect(() => {
    const storedSort = localStorage.getItem("sparkd_groups_sort")
    const storedView = localStorage.getItem("sparkd_groups_view")
    if (storedSort === "TRENDING" || storedSort === "ACTIVE" || storedSort === "A_TO_Z") {
      setDiscoverSort(storedSort)
    }
    if (storedView === "GRID" || storedView === "LIST") {
      setViewMode(storedView)
    }
    setCoverFallbackStyle(getStoredFallbackStyle())
  }, [])

  useEffect(() => {
    localStorage.setItem(GROUP_COVER_FALLBACK_STORAGE_KEY, coverFallbackStyle)
  }, [coverFallbackStyle])

  useEffect(() => {
    localStorage.setItem("sparkd_groups_sort", discoverSort)
  }, [discoverSort])

  useEffect(() => {
    localStorage.setItem("sparkd_groups_view", viewMode)
  }, [viewMode])

  const ensureShareInvite = async (group: Group) => {
    const existing = shareInviteByGroupId[group.id]
    if (existing) return existing
    const created = await groupService.inviteLinks.create(group.id, { targetRole: "GUEST", maxUses: 0 })
    setShareInviteByGroupId((prev) => ({ ...prev, [group.id]: created }))
    return created
  }

  const loadInviteLinksForShare = async (groupId: string) => {
    setIsInviteLinksLoadingByGroupId((prev) => ({ ...prev, [groupId]: true }))
    try {
      const links = await groupService.inviteLinks.list(groupId).catch(() => [])
      const normalized = Array.isArray(links) ? links : []
      setShareInviteLinksByGroupId((prev) => ({ ...prev, [groupId]: normalized }))
      if (!shareInviteByGroupId[groupId] && normalized[0]) {
        setShareInviteByGroupId((prev) => ({ ...prev, [groupId]: normalized[0] }))
      }
      return normalized
    } finally {
      setIsInviteLinksLoadingByGroupId((prev) => ({ ...prev, [groupId]: false }))
    }
  }

  const inviteUrlFor = (groupId: string) => {
    const invite = shareInviteByGroupId[groupId]
    if (!invite) return ""
    const sp = new URLSearchParams()
    sp.set("token", invite.token)
    sp.set("targetRole", invite.targetRole)
    sp.set("maxUses", String(invite.maxUses))
    sp.set("usedCount", String(invite.usedCount))
    if (invite.expiresAt) sp.set("expiresAt", invite.expiresAt)
    return `${window.location.origin}/groups?${sp.toString()}`
  }

  const openShareModal = async (group: Group) => {
    setShareGroup(group)
    setShareOpen(true)
    setShareCaption("")
    setIncludeQrInPost(false)
    setIsPreparingShare(true)
    try {
      await Promise.all([
        chatService.getMyChats().then((rows) => {
          setChatList(rows)
          if (!selectedChatId && rows[0]?.chatId) setSelectedChatId(rows[0].chatId)
        }),
        loadInviteLinksForShare(group.id),
      ])
      await ensureShareInvite(group)
    } catch (error: any) {
      toast.error(
        error?.message ||
          te(
            "No se pudo preparar el contenido para compartir",
            "Could not prepare share content"
          )
      )
    } finally {
      setIsPreparingShare(false)
    }
  }

  const generateShareQr = async (groupId: string) => {
    const url = inviteUrlFor(groupId)
    if (!url) return
    const dataUrl = await QRCode.toDataURL(url, {
      width: 260,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
    setShareQrByGroupId((prev) => ({ ...prev, [groupId]: dataUrl }))
  }

  const dataUrlToFile = (dataUrl: string, filename: string) => {
    const [meta, payload] = dataUrl.split(",")
    const mime = meta.match(/data:(.*);base64/)?.[1] || "image/png"
    const bytes = atob(payload)
    const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    return new File([arr], filename, { type: mime })
  }

  const postToGlobalFeed = async (formData: FormData) => {
    const token = localStorage.getItem("sparkd_token")
    const response = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/api/proxy/api/posts/new")
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.onload = () => resolve(new Response(xhr.responseText, { status: xhr.status }))
      xhr.onerror = () => reject(new Error("Network error"))
      xhr.send(formData)
    })
    if (!response.ok) {
      const txt = await response.text()
      throw new Error(txt || "Post failed")
    }
  }

  const shareToFeed = async () => {
    if (!shareGroup) return
    const inviteUrl = inviteUrlFor(shareGroup.id)
    if (!inviteUrl) return
    setIsPostingShare(true)
    try {
      const base = te(
        `Únete al grupo "${shareGroup.name}" en Sparkd.\n${inviteUrl}`,
        `Join the group "${shareGroup.name}" on Sparkd.\n${inviteUrl}`
      )
      const custom = shareCaption.trim()
      const body = custom ? `${custom}\n\n${base}` : base
      const formData = new FormData()
      formData.append(
        "post",
        JSON.stringify({
          body,
          permanent: true,
          locked: false,
          visibility: "PUBLIC",
        })
      )
      if (includeQrInPost) {
        let dataUrl = shareQrByGroupId[shareGroup.id]
        if (!dataUrl) {
          dataUrl = await QRCode.toDataURL(inviteUrl, {
            width: 1200,
            margin: 2,
            color: { dark: "#000000", light: "#ffffff" },
          })
          setShareQrByGroupId((prev) => ({ ...prev, [shareGroup.id]: dataUrl }))
        }
        formData.append("file", dataUrlToFile(dataUrl, `group-invite-${shareGroup.id}.png`))
      }
      await postToGlobalFeed(formData)
      toast.success(te("Grupo compartido en el feed global", "Group shared in global feed"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo compartir en el feed", "Could not share in feed"))
    } finally {
      setIsPostingShare(false)
    }
  }

  const shareToChat = async () => {
    if (!shareGroup || !selectedChatId) return
    const inviteUrl = inviteUrlFor(shareGroup.id)
    if (!inviteUrl) return
    setIsSendingChatShare(true)
    try {
      const custom = shareCaption.trim()
      const base = te(
        `Te comparto este grupo: ${shareGroup.name}\n${inviteUrl}`,
        `Sharing this group with you: ${shareGroup.name}\n${inviteUrl}`
      )
      await chatService.sendMessage({
        chatId: selectedChatId,
        content: custom ? `${custom}\n\n${base}` : base,
      })
      toast.success(te("Grupo compartido por chat", "Group shared via chat"))
    } catch (error: any) {
      toast.error(error?.message || te("No se pudo compartir por chat", "Could not share via chat"))
    } finally {
      setIsSendingChatShare(false)
    }
  }

  const publicGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const filtered = !q
      ? discoverGroups
      : discoverGroups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q) ||
      (g.category || "").toLowerCase().includes(q) ||
      (g.topics || []).some((t) => t.toLowerCase().includes(q))
    )
    const sorted = [...filtered]
    if (discoverSort === "A_TO_Z") {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      return sorted
    }
    if (discoverSort === "ACTIVE") {
      sorted.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
      return sorted
    }
    sorted.sort((a, b) => computeTrendingScore(b) - computeTrendingScore(a))
    return sorted
  }, [discoverGroups, searchQuery, discoverSort])

  const hasEmbeddedInviteMeta = Boolean(
    invitePreviewFromUrl?.targetRole ||
      typeof invitePreviewFromUrl?.maxUses === "number" ||
      invitePreviewFromUrl?.expiresAt
  )
  const discoverCount = publicGroups.length
  const mineCount = myGroups.length

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {te("Grupos", "Groups")}
          </h1>
          <p className="text-muted-foreground">{te("Únete a comunidades con tus intereses", "Join communities based on your interests")}</p>
        </div>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open)
            if (!open) resetCreateCover()
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {te("Crear grupo", "Create group")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{te("Crear Nuevo Grupo", "Create New Group")}</DialogTitle>
              <DialogDescription>
                {te("Define el nombre, temas y privacidad para crear tu comunidad.", "Set name, topics, and privacy to create your community.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{te("Nombre", "Name")}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={te("Nombre del grupo", "Group name")}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{te("Descripción", "Description")}</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={te("Describe tu grupo...", "Describe your group...")}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{te("Categoría", "Category")}</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={te("Selecciona una categoría", "Select a category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">{te("Temas (coma separada, máx. 10, 50 caracteres c/u)", "Topics (comma separated, max. 10, 50 chars each)")}</label>
                <Input
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder={te("ej: Java, Spring, Microservicios", "e.g.: Java, Spring, Microservices")}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{te("Privacidad", "Privacy")}</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={privacy === 'PUBLIC' ? 'default' : 'outline'}
                    onClick={() => setPrivacy('PUBLIC')}
                    className="flex-1"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {te("Público", "Public")}
                  </Button>
                  <Button
                    type="button"
                    variant={privacy === 'PRIVATE' ? 'default' : 'outline'}
                    onClick={() => setPrivacy('PRIVATE')}
                    className="flex-1"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {te("Privado", "Private")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{te("Portada (opcional)", "Cover image (optional)")}</label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="create-group-cover-input"
                    onChange={(e) => handleCreateCoverFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => document.getElementById("create-group-cover-input")?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {te("Elegir imagen", "Choose image")}
                  </Button>
                  {createCoverPreview || createCoverFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCreateCoverFile(null)}
                    >
                      {te("Quitar", "Remove")}
                    </Button>
                  ) : null}
                </div>
                {createCoverPreview ? (
                  <div className="relative mt-2 h-28 overflow-hidden rounded-md border border-border">
                    <img
                      src={createCoverPreview}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {te(
                      "Si el servidor aún no guarda la portada al crear, se aplicará después de crear el grupo.",
                      "If the server does not store the cover on create, it will be applied after the group is created."
                    )}
                  </p>
                )}
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
                {te("Crear Grupo", "Create Group")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border/80 bg-card/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-muted-foreground">
          {te(
            "Portadas por defecto (grupos sin foto en el servidor):",
            "Default covers (groups with no server image):"
          )}
        </p>
        <Select
          value={coverFallbackStyle}
          onValueChange={(v) => setCoverFallbackStyle(v as GroupCoverFallbackStyle)}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MOMENTS">{te("Momentos", "Moments")}</SelectItem>
            <SelectItem value="AURA">{te("Aura", "Aura")}</SelectItem>
            <SelectItem value="NIGHT">{te("Noche", "Night")}</SelectItem>
            <SelectItem value="MINIMAL">{te("Mínimo", "Minimal")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{te("Descubrir", "Discover")}</p>
            <p className="text-xl font-bold">{discoverCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{te("Mis grupos", "My groups")}</p>
            <p className="text-xl font-bold">{mineCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{te("Filtro feed", "Feed filter")}</p>
            <p className="text-sm font-semibold truncate">{discoverFeed}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/60 backdrop-blur">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{te("Categoría", "Category")}</p>
            <p className="text-sm font-semibold truncate">{discoverCategory}</p>
          </CardContent>
        </Card>
      </div>
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="bg-card border-border sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{te("Compartir grupo", "Share group")}</DialogTitle>
            <DialogDescription>
              {te(
                "Comparte en feed global, chat, o con link/QR de acceso automático.",
                "Share in global feed, chat, or with auto-join link/QR."
              )}
            </DialogDescription>
          </DialogHeader>
          {!shareGroup || isPreparingShare ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              {te("Preparando opciones de compartir...", "Preparing sharing options...")}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-sm font-semibold">{shareGroup.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {shareGroup.description || te("Sin descripción", "No description")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={shareToFeed} disabled={isPostingShare}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {isPostingShare ? te("Publicando...", "Posting...") : te("Compartir en feed global", "Share in global feed")}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const url = inviteUrlFor(shareGroup.id)
                    if (!url) return
                    await navigator.clipboard.writeText(url)
                    toast.success(te("Link copiado", "Link copied"))
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {te("Copiar link", "Copy link")}
                </Button>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{te("Links de invitación", "Invite links")}</p>
                    <p className="text-xs text-muted-foreground">
                      {te(
                        "Configura rol, expiración y usos. Puedes desactivar links antiguos.",
                        "Configure role, expiration, and uses. You can deactivate older links."
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => void loadInviteLinksForShare(shareGroup.id)}
                    disabled={Boolean(isInviteLinksLoadingByGroupId[shareGroup.id])}
                  >
                    <RefreshCw className={`h-4 w-4 ${isInviteLinksLoadingByGroupId[shareGroup.id] ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {te("Link activo para compartir", "Active link used for sharing")}
                  </p>
                  <Select
                    value={shareInviteByGroupId[shareGroup.id]?.inviteId || ""}
                    onValueChange={(inviteId) => {
                      const list = shareInviteLinksByGroupId[shareGroup.id] || []
                      const picked = list.find((l) => l.inviteId === inviteId)
                      if (picked) setShareInviteByGroupId((prev) => ({ ...prev, [shareGroup.id]: picked }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={te("Selecciona un link", "Pick a link")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(shareInviteLinksByGroupId[shareGroup.id] || []).map((l) => {
                        const uses =
                          l.maxUses && l.maxUses > 0 ? `${l.usedCount}/${l.maxUses}` : te("ilimitado", "unlimited")
                        const exp = l.expiresAt ? new Date(l.expiresAt).toLocaleString() : te("sin expirar", "no expiry")
                        return (
                          <SelectItem key={l.inviteId} value={l.inviteId}>
                            {`${l.targetRole} · ${uses} · ${exp}`}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const current = shareInviteByGroupId[shareGroup.id]
                        if (!current) return
                        const ok = window.confirm(
                          te("¿Desactivar este link? La invitación dejará de funcionar.", "Deactivate this link? It will stop working.")
                        )
                        if (!ok) return
                        try {
                          await groupService.inviteLinks.remove(shareGroup.id, current.inviteId)
                          toast.success(te("Link desactivado", "Link deactivated"))
                          const list = await loadInviteLinksForShare(shareGroup.id)
                          setShareInviteByGroupId((prev) => {
                            const next = { ...prev }
                            if (next[shareGroup.id]?.inviteId === current.inviteId) {
                              if (list[0]) next[shareGroup.id] = list[0]
                              else delete next[shareGroup.id]
                            }
                            return next
                          })
                        } catch (error: any) {
                          toast.error(error?.message || te("No se pudo desactivar el link", "Could not deactivate link"))
                        }
                      }}
                      disabled={!shareInviteByGroupId[shareGroup.id]}
                    >
                      {te("Desactivar", "Deactivate")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        try {
                          const maxUses = Number(inviteMaxUsesDraft || "0")
                          const expiresAt = inviteExpiresAtDraft
                            ? new Date(inviteExpiresAtDraft).toISOString()
                            : undefined
                          const created = await groupService.inviteLinks.create(shareGroup.id, {
                            targetRole: inviteRoleDraft,
                            maxUses: Number.isFinite(maxUses) ? maxUses : 0,
                            ...(expiresAt ? { expiresAt } : {}),
                          })
                          toast.success(te("Link creado", "Link created"))
                          setShareInviteByGroupId((prev) => ({ ...prev, [shareGroup.id]: created }))
                          await loadInviteLinksForShare(shareGroup.id)
                        } catch (error: any) {
                          toast.error(error?.message || te("No se pudo crear el link", "Could not create link"))
                        }
                      }}
                    >
                      {te("Crear nuevo", "Create new")}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{te("Rol", "Role")}</p>
                    <Select value={inviteRoleDraft} onValueChange={(v) => setInviteRoleDraft(v as any)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GUEST">{te("Invitado", "Guest")}</SelectItem>
                        <SelectItem value="MODERATOR">{te("Moderador", "Moderator")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{te("Máx. usos (0 = ilimitado)", "Max uses (0 = unlimited)")}</p>
                    <Input
                      value={inviteMaxUsesDraft}
                      onChange={(e) => setInviteMaxUsesDraft(e.target.value.replace(/[^\d]/g, ""))}
                      inputMode="numeric"
                      className="h-9"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">{te("Expira (opcional)", "Expires (optional)")}</p>
                    <Input
                      value={inviteExpiresAtDraft}
                      onChange={(e) => setInviteExpiresAtDraft(e.target.value)}
                      className="h-9"
                      type="datetime-local"
                    />
                  </div>
                </div>

                {shareInviteByGroupId[shareGroup.id] ? (
                  <div className="rounded-md border border-border bg-muted/20 p-2">
                    <p className="text-[11px] text-muted-foreground break-all">
                      {inviteUrlFor(shareGroup.id)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {te("No hay link activo todavía. Crea uno para poder copiar/compartir.", "No active link yet. Create one to share/copy.")}
                  </p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{te("Texto opcional", "Optional text")}</p>
                <Textarea
                  value={shareCaption}
                  onChange={(e) => setShareCaption(e.target.value)}
                  placeholder={te("Agrega un mensaje personal...", "Add a personal message...")}
                  className="min-h-20"
                  maxLength={250}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {te("Incluir QR en el post del feed", "Include QR in feed post")}
                  </p>
                  <Button
                    type="button"
                    variant={includeQrInPost ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIncludeQrInPost((prev) => !prev)}
                  >
                    {includeQrInPost ? te("Con QR", "With QR") : te("Sin QR", "Without QR")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{te("Compartir por chat", "Share via chat")}</p>
                <Select value={selectedChatId} onValueChange={setSelectedChatId}>
                  <SelectTrigger>
                    <SelectValue placeholder={te("Selecciona un chat", "Select a chat")} />
                  </SelectTrigger>
                  <SelectContent>
                    {chatList.map((c) => (
                      <SelectItem key={c.chatId} value={c.chatId}>
                        {c.otherUsername}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  variant="secondary"
                  disabled={!selectedChatId || isSendingChatShare || chatList.length === 0}
                  onClick={shareToChat}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {isSendingChatShare ? te("Enviando...", "Sending...") : te("Enviar al chat", "Send to chat")}
                </Button>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{te("Código QR de invitación", "Invitation QR code")}</p>
                  <Button variant="outline" size="sm" onClick={() => void generateShareQr(shareGroup.id)}>
                    <QrCode className="h-4 w-4 mr-1" />
                    {te("Generar QR", "Generate QR")}
                  </Button>
                </div>
                {shareQrByGroupId[shareGroup.id] ? (
                  <img
                    src={shareQrByGroupId[shareGroup.id]}
                    alt={te("QR para unirse al grupo", "QR to join group")}
                    className="mx-auto h-44 w-44 rounded bg-white p-1"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {te("Genera el QR para compartirlo rápidamente.", "Generate QR for quick sharing.")}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {invitePreviewFromUrl && (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{te("Invitación detectada", "Invitation detected")}</p>
                {!hasEmbeddedInviteMeta ? (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help text-[10px]">
                          {te("Info parcial", "Partial info")}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {te(
                          "Este enlace solo incluye el token: no pudimos obtener rol ni límites desde el servidor antes de unirte.",
                          "This link only includes the token: we couldn't fetch role or limits from the server before joining."
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {te(
                  "Abriste un link de invitación. Estamos intentando unirte automáticamente.",
                  "You opened an invitation link. We are trying to auto-join you."
                )}
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {invitePreviewFromUrl.targetRole && (
                  <p>
                    {te("Rol:", "Role:")} <span className="font-medium text-foreground">{invitePreviewFromUrl.targetRole}</span>
                  </p>
                )}
                {hasEmbeddedInviteMeta &&
                  (typeof invitePreviewFromUrl.maxUses === "number" && invitePreviewFromUrl.maxUses > 0 ? (
                    <p>
                      {te("Usos restantes:", "Uses left:")}{" "}
                      <span className="font-medium text-foreground">
                        {Math.max(invitePreviewFromUrl.maxUses - (invitePreviewFromUrl.usedCount ?? 0), 0)}
                      </span>
                    </p>
                  ) : (
                    <p>{te("Usos: ilimitados", "Uses: unlimited")}</p>
                  ))}
                {invitePreviewFromUrl.expiresAt && (
                  <p>
                    {te("Expira:", "Expires:")}{" "}
                    <span className="font-medium text-foreground">
                      {new Date(invitePreviewFromUrl.expiresAt).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                onClick={() => handleJoinByToken(invitePreviewFromUrl.token)}
                disabled={isJoiningByToken}
                className="w-full sm:w-auto"
              >
                {isJoiningByToken ? te("Uniéndote...", "Joining...") : te("Sí, unirme", "Yes, join")}
              </Button>
              <Button
                variant="outline"
                onClick={dismissInviteFromUrl}
                disabled={isJoiningByToken}
                className="w-full sm:w-auto"
              >
                {te("Cancelar", "Cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Trending Groups */}
      <div className="mb-6">
        <div className="mb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {te("Descubrir Grupos", "Discover Groups")}
            </h2>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 rounded-md border border-border bg-card px-1">
                <Button
                  type="button"
                  size="icon"
                  variant={viewMode === "GRID" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("GRID")}
                  className="h-8 w-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={viewMode === "LIST" ? "secondary" : "ghost"}
                  onClick={() => setViewMode("LIST")}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadGroups(discoverCategory, discoverFeed)}
                disabled={isLoading}
                className="h-9 w-9 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select value={discoverFeed} onValueChange={setDiscoverFeed}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={te("Feed", "Feed")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">{t("groups.feedOption.global")}</SelectItem>
                <SelectItem value="LOCAL">{t("groups.feedOption.local")}</SelectItem>
                <SelectItem value="FOLLOWERS_ONLY">{t("groups.feedOption.following")}</SelectItem>
                <SelectItem value="GROUPS_ONLY">{t("groups.feedOption.groupsOnly")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={discoverCategory} onValueChange={setDiscoverCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={te("Categoría", "Category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{te("Todas", "All")}</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={discoverSort} onValueChange={(v: any) => setDiscoverSort(v)}>
              <SelectTrigger className="w-full">
                <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder={te("Orden", "Sort")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRENDING">{te("Tendencia", "Trending")}</SelectItem>
                <SelectItem value="ACTIVE">{te("Más activos", "Most active")}</SelectItem>
                <SelectItem value="A_TO_Z">{te("A-Z", "A-Z")}</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={te("Buscar...", "Search...")}
              className="w-full"
            />
          </div>
        </div>
        <div className={`${viewMode === "GRID" ? "grid md:grid-cols-2 gap-4" : "space-y-3"}`}>
          {isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Card key={`discover-skeleton-${idx}`} className="border-border/70">
                <CardHeader>
                  <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-9 w-28 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          {!isLoading && publicGroups.length === 0 && (
            <Card className="md:col-span-2 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="py-10 text-center">
                <p className="text-base font-semibold">{te("No hay grupos con esos filtros", "No groups match these filters")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {te("Cambia categoría/feed o crea uno nuevo.", "Try another category/feed or create one.")}
                </p>
              </CardContent>
            </Card>
          )}
          {!isLoading && publicGroups.map((group, idx) => (
            <Card
              key={group.id}
              className="animate-slide-in border-border/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all cursor-pointer bg-card/80 backdrop-blur overflow-hidden"
              style={{ animationDelay: `${Math.min(idx * 40, 260)}ms` }}
              onClick={() => {
                if (group.isMember) router.push(`/groups/${group.id}`)
              }}
            >
              <div className="relative h-28 overflow-hidden">
                {group.coverPhotoUrl || group.coverPhoto ? (
                  <img
                    src={resolveGroupCoverUrl(group, coverFallbackStyle)}
                    alt={group.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={resolveGroupCoverUrl(group, coverFallbackStyle)}
                      alt={te("Foto genérica del grupo", "Generic group photo")}
                      className="h-full w-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${getGroupCoverClass(group)}`} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/5 to-transparent" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  {group.category ? (
                    <Badge variant="secondary" className="border-0 bg-black/35 text-white backdrop-blur">
                      {group.category}
                    </Badge>
                  ) : null}
                  {(group.privacy === 'PRIVATE' || group.isPublic === false) ? (
                    <Badge variant="secondary" className="border-0 bg-black/35 text-white backdrop-blur">
                      <Lock className="mr-1 h-3 w-3" />
                      {te("Privado", "Private")}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {group.description || te("Sin descripción", "No description")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {group.topics && group.topics.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {group.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} variant="outline" className="text-[11px]">
                        #{topic}
                      </Badge>
                    ))}
                    {group.topics.length > 4 && (
                      <Badge variant="outline" className="text-[11px]">
                        +{group.topics.length - 4}
                      </Badge>
                    )}
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group.memberCount.toLocaleString()} {te("miembros", "members")}
                    </span>
                    <Badge variant="outline" className="text-[11px]">
                      🔥 {computeTrendingScore(group)}
                    </Badge>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={(e) => {
                        e.stopPropagation()
                        void openShareModal(group)
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      {te("Compartir", "Share")}
                    </Button>
                    {group.isMember ? (
                      <Badge className="bg-primary/10 text-primary border-0">
                        {te("Miembro", "Member")}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleJoin(group.id)
                        }}
                      >
                        {te("Unirse", "Join")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* My Groups */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{te("Mis Grupos", "My Groups")}</h2>
        <div className={`${viewMode === "GRID" ? "grid md:grid-cols-2 gap-4" : "space-y-3"}`}>
          {isLoading &&
            Array.from({ length: 2 }).map((_, idx) => (
              <Card key={`my-skeleton-${idx}`} className="border-border/70">
                <CardHeader>
                  <div className="h-5 w-36 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          {!isLoading && myGroups.length === 0 && (
            <Card className="md:col-span-2 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="py-10 text-center">
                <p className="text-base font-semibold">{te("Aún no te has unido a grupos", "You haven't joined groups yet")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {te("Explora grupos públicos o crea el tuyo en un clic.", "Explore public groups or create your own in one click.")}
                </p>
              </CardContent>
            </Card>
          )}
          {!isLoading && myGroups.map((group, idx) => (
            <Card
              key={group.id}
              className="animate-slide-in border-border/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all cursor-pointer bg-card/80 backdrop-blur overflow-hidden"
              style={{ animationDelay: `${Math.min(idx * 60, 240)}ms` }}
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <div className="relative h-24 overflow-hidden">
                {group.coverPhotoUrl || group.coverPhoto ? (
                  <img
                    src={resolveGroupCoverUrl(group, coverFallbackStyle)}
                    alt={group.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="relative h-full w-full">
                    <img
                      src={resolveGroupCoverUrl(group, coverFallbackStyle)}
                      alt={te("Foto genérica del grupo", "Generic group photo")}
                      className="h-full w-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${getGroupCoverClass(group)}`} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/10 to-transparent" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {group.description || te("Sin descripción", "No description")}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                {group.topics && group.topics.length > 0 ? (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {group.topics.slice(0, 4).map((topic) => (
                      <Badge key={topic} variant="outline" className="text-[11px]">
                        #{topic}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group.memberCount.toLocaleString()} {te("miembros", "members")}
                    </span>
                    <Badge variant="outline" className="text-[11px]">
                      🔥 {computeTrendingScore(group)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      void openShareModal(group)
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    {te("Compartir", "Share")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
