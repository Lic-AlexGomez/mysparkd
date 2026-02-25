"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Sex } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Loader2, Camera, Newspaper } from "lucide-react"
import { toast } from "sonner"
import { PostCard } from "@/components/feed/post-card"

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [editOpen, setEditOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [nombres, setNombres] = useState(user?.nombres || "")
  const [apellidos, setApellidos] = useState(user?.apellidos || "")
  const [sex, setSex] = useState<Sex>(user?.sex || "MALE")
  const [telefono, setTelefono] = useState(user?.telefono || "")

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      await api.put("/api/profile", {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        sex,
        telefono: telefono.trim(),
      })
      await refreshProfile()
      toast.success("Perfil actualizado")
      setEditOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar")
    } finally {
      setIsLoading(false)
    }
  }

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary)
  const initials = user
    ? `${user.nombres?.[0] || ""}${user.apellidos?.[0] || ""}`.toUpperCase()
    : "?"

  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Profile header */}
      <Card className="overflow-hidden border-border bg-card">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-r from-primary/40 via-secondary/30 to-primary/20" />
        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-16 mb-4 flex items-end justify-between">
            <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
              <AvatarImage
                src={primaryPhoto?.url}
                alt={user.nombres}
              />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => {
                    setNombres(user.nombres || "")
                    setApellidos(user.apellidos || "")
                    setSex(user.sex || "MALE")
                    setTelefono(user.telefono || "")
                  }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Editar perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    Editar perfil
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Nombres</Label>
                    <Input
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Apellidos</Label>
                    <Input
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Genero</Label>
                    <div className="flex gap-2">
                      {(["MALE", "FEMALE"] as Sex[]).map((s) => (
                        <Button
                          key={s}
                          type="button"
                          variant={sex === s ? "default" : "outline"}
                          onClick={() => setSex(s)}
                          className={
                            sex === s
                              ? "bg-primary text-primary-foreground"
                              : "border-border text-foreground hover:bg-muted"
                          }
                        >
                          {s === "MALE" ? "Hombre" : "Mujer"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-foreground">Telefono</Label>
                    <Input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Guardar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* User info */}
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {user.nombres} {user.apellidos}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-0 text-xs"
              >
                {user.sex === "MALE" ? "Hombre" : "Mujer"}
              </Badge>
              {user.profileCompleted && (
                <Badge
                  variant="secondary"
                  className="bg-success/10 text-success border-0 text-xs"
                >
                  Perfil completo
                </Badge>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">
                {user.totalPosts}
              </span>
              <span className="text-xs text-muted-foreground">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">
                {user.photos?.length || 0}
              </span>
              <span className="text-xs text-muted-foreground">Fotos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo gallery */}
      {user.photos && user.photos.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Camera className="h-4 w-4" />
            Fotos
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {user.photos.map((photo) => (
              <div
                key={photo.photoId}
                className="aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={photo.url}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User posts */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Newspaper className="h-4 w-4" />
          Mis posts
        </h2>
        {user.posts && user.posts.length > 0 ? (
          <div className="rounded-xl overflow-hidden border border-border">
            {user.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No has publicado nada aun
          </p>
        )}
      </div>
    </div>
  )
}
