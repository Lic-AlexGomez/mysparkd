"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, Plus, Lock, Globe, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import type { Group } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

export default function GroupsPage() {
  const { user } = useAuth()
  const features = useFeatureFlags()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC')

  useEffect(() => {
    if (!features.groupsPage) {
      toast.error("Esta funcionalidad no está disponible aún")
      router.push('/feed')
    }
  }, [features.groupsPage, router])

  if (!features.groupsPage) {
    return null
  }

  const groups: Group[] = [
    {
      id: "1",
      name: "Viajeros del Mundo",
      description: "Comparte tus aventuras y descubre nuevos destinos",
      privacy: 'PUBLIC',
      memberCount: 1234,
      createdAt: new Date().toISOString(),
      isMember: true
    },
    {
      id: "2",
      name: "Gamers Unite",
      description: "Comunidad de gaming y esports",
      privacy: 'PUBLIC',
      memberCount: 856,
      createdAt: new Date().toISOString(),
      isMember: false
    },
  ]

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("El nombre es requerido")
      return
    }
    toast.success("Grupo creado")
    setCreateOpen(false)
    setName("")
    setDescription("")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
          <p className="text-muted-foreground">Únete a comunidades con tus intereses</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />
              Crear Grupo
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
              <Button onClick={handleCreate} className="w-full">
                Crear Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Trending Groups */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Grupos Populares
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="border-border hover:border-primary/30 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group.name}
                      {group.privacy === 'PRIVATE' && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.memberCount.toLocaleString()} miembros</span>
                  </div>
                  {group.isMember ? (
                    <Badge className="bg-primary/10 text-primary border-0">
                      Miembro
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => toast.success("Te uniste al grupo")}>
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
          {groups.filter(g => g.isMember).map((group) => (
            <Card
              key={group.id}
              className="border-border hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => router.push(`/groups/${group.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {group.description}
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
