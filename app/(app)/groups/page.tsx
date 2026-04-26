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
      toast.error("Esta funcionalidad no está disponible aún!")
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
      toast.error("No se pudieron cargar los grupos")
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
      toast.error("El nombre es requerido")
      return
    }
    const rawTopics = topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (rawTopics.length > 10) {
      toast.error("Máximo 10 temas")
      return
    }
    const tooLong = rawTopics.find((t) => t.length > 50)
    if (tooLong) {
      toast.error("Cada tema puede tener como máximo 50 caracteres")
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
      toast.success("Grupo creado")
      setCreateOpen(false)
      setName("")
      setDescription("")
      setTopics("")
      setCategory("")
      await loadGroups(discoverCategory)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo crear el grupo")
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoin = async (groupId: string) => {
    try {
      await groupService.joinPublic(groupId)
      toast.success("Te uniste al grupo")
      router.push(`/groups/${groupId}`)
    } catch (error: any) {
      toast.error(error?.message || "No se pudo unir al grupo")
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
      toast.success("Te uniste por invitación")
      router.push(`/groups/${group.id}`)
    } catch (error: any) {
      toast.error(error?.message || "Invitación inválida o expirada")
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
          <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
          <p className="text-muted-foreground">Únete a comunidades con tus intereses</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-primary text-primary-foreground sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Crear grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Grupo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del grupo"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe tu grupo..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Temas (coma separada, máx. 10, 50 caracteres c/u)</label>
                <Input
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder="ej: Java, Spring, Microservicios"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Privacidad</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={privacy === 'PUBLIC' ? 'default' : 'outline'}
                    onClick={() => setPrivacy('PUBLIC')}
                    className="flex-1"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Público
                  </Button>
                  <Button
                    type="button"
                    variant={privacy === 'PRIVATE' ? 'default' : 'outline'}
                    onClick={() => setPrivacy('PRIVATE')}
                    className="flex-1"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Privado
                  </Button>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isCreating}>
                Crear Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Unirse por invitación
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Pega el enlace de invitación que te compartieron y te unimos automáticamente.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={joinToken}
            onChange={(e) => setJoinToken(e.target.value)}
            placeholder="Pega aquí el link de invitación o el código"
          />
          <Button onClick={handleJoinByToken} className="w-full sm:w-auto">Unirme al grupo</Button>
        </CardContent>
      </Card>

      {/* Trending Groups */}
      <div className="mb-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Descubrir Grupos
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
                <SelectValue placeholder="Filtrar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre/tema"
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
                      {group.description || "Sin descripción"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.memberCount.toLocaleString()} miembros</span>
                  </div>
                  {group.isMember ? (
                    <Badge className="bg-primary/10 text-primary border-0">
                      Miembro
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
                      Unirse
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
        <h2 className="text-lg font-semibold mb-3">Mis Grupos</h2>
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
                  {group.description || "Sin descripción"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{group.memberCount.toLocaleString()} miembros</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
