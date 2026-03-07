"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Sex } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { reputationService } from "@/lib/services/reputation"
import { followService } from "@/lib/services/follow"
import { bookmarkService } from "@/lib/services/bookmark"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Loader2, Camera, Newspaper, Shield, Bookmark, Heart } from "lucide-react"
import { toast } from "sonner"
import { PostCard } from "@/components/feed/post-card"
import { useRouter } from "next/navigation"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

export default function ProfilePage() {
  const { user, refreshProfile, isLoading } = useAuth()
  const router = useRouter()
  const features = useFeatureFlags()
  
  const [editOpen, setEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [nombres, setNombres] = useState(user?.nombres || "")
  const [apellidos, setApellidos] = useState(user?.apellidos || "")
  const [sex, setSex] = useState<Sex>(user?.sex || "MALE")
  const [telefono, setTelefono] = useState(user?.telefono || "")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localPhotos, setLocalPhotos] = useState(user?.photos || [])

  useEffect(() => {
    setLocalPhotos(user?.photos || [])
  }, [user?.photos])

  useEffect(() => {
    setCoverPhoto(user?.coverPhoto || null)
  }, [user?.coverPhoto])

  const handleSaveProfile = async () => {
    setIsSaving(true)
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
      setIsSaving(false)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return
    
    const photos = [...localPhotos]
    const [draggedPhoto] = photos.splice(draggedIndex, 1)
    photos.splice(dropIndex, 0, draggedPhoto)
    
    setLocalPhotos(photos)
    setDraggedIndex(null)
    
    // Enviar al backend
    try {
      await api.put('/api/photos/reorder', {
        photoIds: photos.map(p => p.photoId || p.id)
      })
      toast.success('Fotos reordenadas')
    } catch {
      toast.error('Error al guardar orden')
      // Revertir cambios
      setLocalPhotos(user?.photos || [])
    }
  }

  const primaryPhoto = user?.photos?.find((p) => p.isPrimary || p.primary)
  const initials = user
    ? `${user.nombres?.[0] || ""}${user.apellidos?.[0] || ""}`.toUpperCase()
    : "?"
  
  const reputation = user?.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)
  const followersCount = user?.userId ? followService.getFollowersCount(user.userId) : 0
  const followingCount = user?.userId ? followService.getFollowingCount(user.userId) : 0
  const savedPostsCount = user?.userId ? bookmarkService.getBookmarkedPosts(user.userId).length : 0

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!user) return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">No se pudo cargar el perfil</p>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Profile header */}
      <Card className="overflow-hidden border-border bg-card">
        {/* Cover photo */}
        <div className="relative h-32 group">
          {coverPhoto ? (
            <img src={coverPhoto} alt="Portada" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-r from-secondary/40 via-primary/30 to-secondary/20" />
          )}
          <button
            onClick={() => document.getElementById('cover-upload')?.click()}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium"
          >
            <Camera className="h-5 w-5 mr-2" />
            Cambiar portada
          </button>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              
              const toastId = toast.loading('Subiendo portada...')
              
              try {
                const imageUrl = await uploadToCloudinary(file)
                await api.put('/api/profile', { coverPhoto: imageUrl })
                setCoverPhoto(imageUrl)
                await refreshProfile()
                toast.dismiss(toastId)
                toast.success('Portada actualizada')
              } catch (error) {
                toast.dismiss(toastId)
                toast.error('Error al subir portada')
                console.error(error)
              }
              e.target.value = ''
            }}
          />
        </div>
        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-16 mb-4 flex items-end justify-between">
            <div className="relative group">
              <div className="p-1 rounded-full border-4 border-primary/30 bg-card">
                <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
                  <AvatarImage
                    src={primaryPhoto?.url}
                    alt={user.nombres}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-4 w-4 text-black" />
              </button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  const toastId = toast.loading('Subiendo foto...')
                  
                  try {
                    const imageUrl = await uploadToCloudinary(file)
                    console.log('Imagen subida a Cloudinary:', imageUrl)
                    
                    try {
                      await api.post('/api/photos/add', {
                        url: imageUrl,
                        position: 0,
                        primary: true
                      })
                      await refreshProfile()
                      toast.dismiss(toastId)
                      toast.success('Foto actualizada')
                    } catch (apiError) {
                      console.error('Error del backend:', apiError)
                      // Actualizar localmente como fallback
                      if (user) {
                        const updatedUser = {
                          ...user,
                          photos: [
                            { photoId: Date.now().toString(), url: imageUrl, isPrimary: true },
                            ...(user.photos?.filter(p => !p.isPrimary && !p.primary) || [])
                          ]
                        }
                        localStorage.setItem('sparkd_user', JSON.stringify(updatedUser))
                        await refreshProfile()
                        toast.dismiss(toastId)
                        toast.success('Foto actualizada (guardada localmente)')
                      }
                    }
                  } catch (error) {
                    toast.dismiss(toastId)
                    toast.error('Error al subir foto')
                    console.error(error)
                  }
                }}
              />
              <div className="absolute top-0 right-0 h-7 w-7 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-xs font-bold text-white shadow-lg border-2 border-card">
                {user.verificationLevel || 1}
              </div>
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.preventDefault()
                    if (features.profileEdit) {
                      router.push('/profile/edit')
                    } else {
                      setEditOpen(true)
                    }
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
                    disabled={isSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSaving ? (
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
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">
                {user.nombres} {user.apellidos}
              </h1>
              <Badge 
                className="px-2 py-0.5 text-xs font-bold text-black border-0 flex items-center gap-1" 
                style={{ backgroundColor: reputationColor }}
              >
                <Shield className="h-3 w-3" />
                {reputation}
              </Badge>
            </div>
            {features.profileEdit && user.username && (
              <p className="text-sm text-muted-foreground mb-1">@{user.username}</p>
            )}
            {features.profileEdit && user.bio && (
              <p className="text-sm text-foreground mb-2">{user.bio}</p>
            )}
            {features.profileEdit && user.location && (
              <p className="text-xs text-muted-foreground mb-1">📍 {user.location}</p>
            )}
            {features.profileEdit && user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mb-2 block">
                🔗 {user.website}
              </a>
            )}
            <p className="text-sm text-muted-foreground mb-2">Nivel {user.verificationLevel || 1} verificado</p>
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
                {followersCount}
              </span>
              <span className="text-xs text-muted-foreground">Seguidores</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">
                {followingCount}
              </span>
              <span className="text-xs text-muted-foreground">Siguiendo</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">
                {savedPostsCount}
              </span>
              <span className="text-xs text-muted-foreground">Guardados</span>
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
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground px-4">
            <Camera className="h-4 w-4" />
            Fotos ({user.photos.length}/6)
          </h2>
          <div className="grid grid-cols-3 gap-2 px-4">
            {localPhotos.map((photo, index) => (
              <div
                key={photo.photoId || photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`aspect-square overflow-hidden rounded-lg border border-border relative group cursor-move ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <img
                  src={photo.url}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover pointer-events-none"
                  loading="lazy"
                />
                <button
                  onClick={async () => {
                    if (confirm('¿Eliminar esta foto?')) {
                      try {
                        await api.delete(`/api/photos/delete/${photo.photoId || photo.id}`)
                        await refreshProfile()
                        toast.success('Foto eliminada')
                      } catch {
                        toast.error('Error al eliminar foto')
                      }
                    }
                  }}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {localPhotos.length < 6 && (
              <button
                onClick={() => document.getElementById('add-photo-upload')?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
              >
                <Camera className="h-6 w-6" />
                <span className="text-xs">Agregar</span>
              </button>
            )}
          </div>
          <input
            id="add-photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              
              const toastId = toast.loading('Subiendo foto...')
              
              try {
                const imageUrl = await uploadToCloudinary(file)
                await api.post('/api/photos/add', {
                  url: imageUrl,
                  position: user.photos.length,
                  primary: false
                })
                await refreshProfile()
                toast.dismiss(toastId)
                toast.success('Foto agregada')
              } catch (error) {
                toast.dismiss(toastId)
                toast.error('Error al subir foto')
                console.error(error)
              }
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* Add first photo if none */}
      {(!user.photos || user.photos.length === 0) && (
        <div className="mt-6 px-4">
          <Card className="border-dashed border-2 border-border hover:border-primary transition-colors">
            <CardContent className="py-12">
              <button
                onClick={() => document.getElementById('first-photo-upload')?.click()}
                className="w-full flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <Camera className="h-12 w-12" />
                <div className="text-center">
                  <p className="font-semibold text-foreground">Agrega tu primera foto</p>
                  <p className="text-sm">Puedes agregar hasta 6 fotos</p>
                </div>
              </button>
              <input
                id="first-photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  
                  const toastId = toast.loading('Subiendo foto...')
                  
                  try {
                    const imageUrl = await uploadToCloudinary(file)
                    await api.post('/api/photos/add', {
                      url: imageUrl,
                      position: 0,
                      primary: true
                    })
                    await refreshProfile()
                    toast.dismiss(toastId)
                    toast.success('Foto agregada')
                  } catch (error) {
                    toast.dismiss(toastId)
                    toast.error('Error al subir foto')
                    console.error(error)
                  }
                  e.target.value = ''
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interests */}
      {user.interests && user.interests.length > 0 && (
        <div className="mt-6 px-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Intereses</h2>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest, index) => {
              const name = typeof interest === 'string' ? interest : interest.name
              return (
                <span key={index} className="px-3 py-1.5 rounded-full bg-muted/20 border border-primary/30 text-xs text-foreground">
                  {name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="mt-6 px-4 space-y-3">
        <button
          onClick={() => router.push('/saved')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-primary/30 hover:bg-card/80 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Posts Guardados</p>
            <p className="text-xs text-muted-foreground">{savedPostsCount} posts guardados</p>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => router.push('/matches')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-primary/30 hover:bg-card/80 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center">
            <Heart className="h-5 w-5 text-secondary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Mis Matches</p>
            <p className="text-xs text-muted-foreground">Ver conexiones</p>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-primary/30 hover:bg-card/80 transition-colors"
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Reputación Detallada</p>
            <p className="text-xs text-muted-foreground">Ver tus métricas completas</p>
          </div>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* User posts */}
      <div className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Newspaper className="h-4 w-4" />
          Mis posts
        </h2>
        {user.posts && user.posts.length > 0 ? (
          <div>
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
