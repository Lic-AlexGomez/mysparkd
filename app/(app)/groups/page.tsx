"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, Lock, Globe, TrendingUp, RefreshCw, Link2 } from "lucide-react"
import { toast } from "sonner"
import type { Group } from "@/lib/types"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { groupService } from "@/lib/services/group"
import { useI18n } from "@/lib/i18n"

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

export default function GroupsPage() {
  const { te } = useI18n()
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
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([])

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
    if (!token) return
    setJoinToken(token)
  }, [searchParams])

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

  const handleJoinByToken = async () => {
    const raw = joinToken.trim()
    const extractToken = (value: string) => {
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
      return value
    }

    const token = extractToken(raw)
    if (!token) return
    try {
      const group = await groupService.joinByToken(token)
      toast.success(te("Te uniste por invitación", "You joined via invitation"))
      router.push(`/groups/${group.id}`)
    } catch (error: any) {
      toast.error(error?.message || te("Invitación inválida o expirada", "Invitation invalid or expired"))
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {te("Unirse por invitación", "Join by invitation")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {te("Pega el enlace de invitación que te compartieron y te unimos automáticamente.", "Paste the invitation link you received and we will join you automatically.")}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder={te("Pega aquí el link de invitación o el código", "Paste invitation link or code here")}
          />
          <Button onClick={handleJoinByToken} className="w-full sm:w-auto">{te("Unirme al grupo", "Join group")}</Button>
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
                <SelectValue placeholder="Feed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">GLOBAL</SelectItem>
                <SelectItem value="LOCAL">LOCAL</SelectItem>
                <SelectItem value="FOLLOWERS_ONLY">FOLLOWERS_ONLY</SelectItem>
                <SelectItem value="GROUPS_ONLY">GROUPS_ONLY</SelectItem>
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
