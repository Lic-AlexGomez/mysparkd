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
import { Users, Plus, Lock, Globe, TrendingUp, RefreshCw, Link2, Share2, QrCode, MessageCircle, SendHorizonal, Copy } from "lucide-react"
import { toast } from "sonner"
import type { Chat, Group, GroupInviteLink } from "@/lib/types"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { groupService } from "@/lib/services/group"
import { useI18n } from "@/lib/i18n"
import { chatService } from "@/lib/services/chat"
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

export default function GroupsPage() {
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
  const [discoverCategory, setDiscoverCategory] = useState<string>("ALL")
  const [discoverFeed, setDiscoverFeed] = useState<string>("GLOBAL")
  const [searchQuery, setSearchQuery] = useState("")
  const [joinToken, setJoinToken] = useState("")
  const [invitePreviewFromUrl, setInvitePreviewFromUrl] = useState<InvitePreview | null>(null)
  const [isJoiningByToken, setIsJoiningByToken] = useState(false)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([])
  const [shareOpen, setShareOpen] = useState(false)
  const [shareGroup, setShareGroup] = useState<Group | null>(null)
  const [shareInviteByGroupId, setShareInviteByGroupId] = useState<Record<string, GroupInviteLink>>({})
  const [shareQrByGroupId, setShareQrByGroupId] = useState<Record<string, string>>({})
  const [isPreparingShare, setIsPreparingShare] = useState(false)
  const [isPostingShare, setIsPostingShare] = useState(false)
  const [isSendingChatShare, setIsSendingChatShare] = useState(false)
  const [chatList, setChatList] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState("")
  const autoJoinAttemptedRef = useRef<string | null>(null)

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
    setJoinToken(token)
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
      await groupService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        feedVisibility: "GLOBAL",
        whoCanTalk: "ALL",
        isPublic: privacy === "PUBLIC",
        category: category || undefined,
        topics: normalizedTopics.length ? normalizedTopics : undefined,
      })
      toast.success(te("Grupo creado", "Group created"))
      setCreateOpen(false)
      setName("")
      setDescription("")
      setTopics("")
      setCategory("")
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

  const handleJoinByToken = async (tokenInput?: string) => {
    const raw = (tokenInput ?? joinToken).trim()
    const token = extractInviteToken(raw)
    if (!token) return
    setIsJoiningByToken(true)
    try {
      const group = await groupService.joinByToken(token)
      toast.success(te("Te uniste por invitación", "You joined via invitation"))
      router.push(`/groups/${group.id}`)
    } catch (error: any) {
      toast.error(error?.message || te("Invitación inválida o expirada", "Invitation invalid or expired"))
    } finally {
      setIsJoiningByToken(false)
    }
  }

  const publicGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return discoverGroups
    return discoverGroups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q) ||
      (g.category || "").toLowerCase().includes(q) ||
      (g.topics || []).some((t) => t.toLowerCase().includes(q))
    )
  }, [discoverGroups, searchQuery])

  const hasEmbeddedInviteMeta = Boolean(
    invitePreviewFromUrl?.targetRole ||
      typeof invitePreviewFromUrl?.maxUses === "number" ||
      invitePreviewFromUrl?.expiresAt
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{te("Grupos", "Groups")}</h1>
          <p className="text-muted-foreground">{te("Únete a comunidades con tus intereses", "Join communities based on your interests")}</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
              <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
                {te("Crear Grupo", "Create Group")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
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
                {te("Abriste un link de invitación. ¿Quieres unirte ahora?", "You opened an invitation link. Do you want to join now?")}
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {te("Unirse por invitación", "Join by invitation")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {te("Pega el enlace de invitación que te compartieron para unirte al grupo.", "Paste the invitation link you received to join the group.")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder={te("Pega aquí el link de invitación o el código", "Paste invitation link or code here")}
          />
          <Button onClick={() => handleJoinByToken()} className="w-full sm:w-auto" disabled={isJoiningByToken}>
            {isJoiningByToken ? te("Uniéndote...", "Joining...") : te("Unirme al grupo", "Join group")}
          </Button>
        </CardContent>
      </Card>

      {/* Trending Groups */}
      <div className="mb-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {te("Descubrir Grupos", "Discover Groups")}
          </h2>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2 lg:grid-cols-[180px_220px_220px_auto]">
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
            <Select
              value={discoverCategory}
              onValueChange={setDiscoverCategory}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={te("Filtrar categoría", "Filter category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{te("Todas", "All")}</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={te("Buscar por nombre/tema", "Search by name/topic")}
              className="w-full"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => loadGroups(discoverCategory, discoverFeed)}
              disabled={isLoading}
              className="w-full sm:w-10"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {publicGroups.map((group) => (
            <Card
              key={group.id}
              className="border-border hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => {
                if (group.isMember) router.push(`/groups/${group.id}`)
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.name}
                      {(group.privacy === 'PRIVATE' || group.isPublic === false) && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {group.description || te("Sin descripción", "No description")}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.memberCount.toLocaleString()} {te("miembros", "members")}</span>
                  </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* My Groups */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{te("Mis Grupos", "My Groups")}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {myGroups.map((group) => (
            <Card
              key={group.id}
              className="border-border hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {group.description || te("Sin descripción", "No description")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.memberCount.toLocaleString()} {te("miembros", "members")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
