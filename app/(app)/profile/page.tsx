"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { Sex } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { reputationService } from "@/lib/services/reputation"
import { followService } from "@/lib/services/follow"
import { bookmarkService } from "@/lib/services/bookmark"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Pencil, Loader2, Camera, Newspaper, Bookmark, Heart, Crown, MapPin, Globe, Zap, Settings, Trash2, Mic, MicOff } from "lucide-react"
import { toast } from "sonner"
import { PostCard } from "@/components/feed/post-card"
import { useRouter } from "next/navigation"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { VoiceNotePlayer } from "@/components/ui/voice-note"
import { DialogTitle } from "@/components/ui/dialog"

export default function ProfilePage() {
  const { user, refreshProfile, isLoading } = useAuth()
  const router = useRouter()

  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localPhotos, setLocalPhotos] = useState(user?.photos || [])
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)

  const showPremiumBadge = typeof window !== 'undefined'
    ? localStorage.getItem(`sparkd_show_premium_${user?.userId}`) !== 'false'
    : true

  const profileInterests = Array.isArray(user?.interests) ? (user.interests as string[]) : []

  useEffect(() => { setLocalPhotos(user?.photos || []) }, [user?.photos])
  useEffect(() => { setCoverPhoto(user?.coverPictureUrl || null) }, [user?.coverPictureUrl])

  const handleDragStart = (index: number) => setDraggedIndex(index)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return
    const photos = [...localPhotos]
    const [draggedPhoto] = photos.splice(draggedIndex, 1)
    photos.splice(dropIndex, 0, draggedPhoto)
    setLocalPhotos(photos)
    setDraggedIndex(null)
    try {
      await api.put('/api/photos/reorder', { photoIds: photos.map(p => p.photoId || p.id) })
      toast.success('Fotos reordenadas')
    } catch {
      toast.error('Error al guardar orden')
      setLocalPhotos(user?.photos || [])
    }
  }

  const primaryPhoto = user?.profilePictureUrl
    ? { url: user.profilePictureUrl }
    : user?.photos?.find((p) => p.isPrimary || p.primary)
  const initials = user ? `${user.nombres?.[0] || ""}${user.apellidos?.[0] || ""}`.toUpperCase() : "?"
  const reputation = user?.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)
  const followersCount = user?.followersCount ?? (user?.userId ? followService.getFollowersCount(user.userId) : 0)
  const followingCount = user?.followingCount ?? (user?.userId ? followService.getFollowingCount(user.userId) : 0)
  const savedPostsCount = user?.userId ? bookmarkService.getBookmarkedPosts(user.userId).length : 0
  const location = user?.location && user.location !== "Unknown location"
    ? (user.location.split(',').length > 2 ? user.location.split(',').slice(-2).map(p => p.trim()).join(', ') : user.location)
    : null

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
    <div className="mx-auto max-w-2xl pb-10">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Cover */}
        <div className="relative h-56 overflow-hidden group">
          {coverPhoto
            ? <img src={coverPhoto} alt="Portada" className="h-full w-full object-cover" />
            : <div className="h-full bg-gradient-to-br from-primary via-secondary/70 to-primary/40" />
          }
          {/* Overlay degradado hacia abajo */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <button
            onClick={() => document.getElementById('cover-upload')?.click()}
            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium"
          >
            <Camera className="h-5 w-5 mr-2" /> Cambiar portada
          </button>
          <input id="cover-upload" type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return
              const toastId = toast.loading('Subiendo portada...')
              try {
                const fd = new FormData(); fd.append('file', file)
                const data = await api.post<{ url: string }>('/api/photos/cover-picture', fd)
                setCoverPhoto(data.url); await refreshProfile()
                toast.dismiss(toastId); toast.success('Portada actualizada')
              } catch { toast.dismiss(toastId); toast.error('Error al subir portada') }
              e.target.value = ''
            }}
          />
        </div>

        {/* Avatar flotando sobre el cover */}
        <div className="absolute left-5 bottom-0 translate-y-1/2">
          <div className="relative group">
            {/* Anillo animado */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary blur-md opacity-60 scale-110" />
            <div className="relative p-1 rounded-full bg-background">
              <Avatar className="h-24 w-24 border-2 border-background shadow-2xl">
                <AvatarImage src={primaryPhoto?.url} alt={user.nombres} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-foreground text-2xl font-black">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return
                const toastId = toast.loading('Subiendo foto...')
                try {
                  const fd = new FormData(); fd.append('file', file)
                  await api.post('/api/photos/profile-picture', fd)
                  await refreshProfile()
                  toast.dismiss(toastId); toast.success('Foto actualizada')
                } catch { toast.dismiss(toastId); toast.error('Error al subir foto') }
                e.target.value = ''
              }}
            />
            {/* Badge reputación */}
            <div
              className="mb-5 absolute -bottom-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black text-black shadow-lg border-2 border-background"
              style={{ backgroundColor: reputationColor }}
            >
              {reputation}
            </div>
          </div>
        </div>

        {/* Botones top-right */}
        <div className="absolute right-4 bottom-0 translate-y-1/2 flex gap-2">
          <button
            onClick={() => router.push('/profile/edit')}
            className="flex items-center gap-1.5 px-4 h-9 rounded-full bg-background border border-border text-sm font-semibold hover:bg-muted transition-colors shadow-lg"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="h-9 w-9 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-lg"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── INFO ─────────────────────────────────────────────────────── */}
      <div className="px-5 mt-16">
        {/* Nombre + badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mt-5">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                {user.nombres} {user.apellidos}
              </h1>
              {user.premium && showPremiumBadge && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-500 border border-yellow-500/30">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              )}
              {user.profileCompleted && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                  <Zap className="h-3 w-3" /> Verificado
                </span>
              )}
            </div>
            {user.username && (
              <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-3 text-sm text-foreground leading-relaxed">{user.bio}</p>
        )}

        {/* Voice note */}
        {(user.voiceIntroUrl || user.voiceNoteUrl) && (
          <div className="mt-3 flex items-center gap-2">
            <VoiceNotePlayer url={(user.voiceIntroUrl || user.voiceNoteUrl)!} />
            <button
              onClick={async () => {
                try {
                  await api.delete('/api/profile/delete/voice')
                  await refreshProfile()
                  toast.success('Nota de voz eliminada')
                } catch {
                  toast.error('Error al eliminar nota de voz')
                }
              }}
              className="h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive shrink-0"
              title="Eliminar nota de voz"
            >
              <MicOff className="h-4 w-4" />
            </button>
          </div>
        )}
        {!user.voiceIntroUrl && !user.voiceNoteUrl && (
          <div className="mt-3">
            <input type="file" accept="audio/*" id="voice-upload" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return
                const toastId = toast.loading('Subiendo nota de voz...')
                try {
                  const fd = new FormData(); fd.append('file', file)
                  await api.post('/api/profile/voice-note', fd)
                  await refreshProfile()
                  toast.dismiss(toastId); toast.success('Nota de voz guardada')
                } catch { toast.dismiss(toastId); toast.error('Error al subir nota de voz') }
                e.target.value = ''
              }}
            />
            <button
              onClick={() => document.getElementById('voice-upload')?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary text-xs"
            >
              <Mic className="h-4 w-4" /> Agregar nota de voz
            </button>
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-col gap-1 gap-x-4 gap-y-1 mt-3">
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </div>
          )}
          {user.website || user.url ? (
            <a href={user.url || user.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Globe className="h-3.5 w-3.5" /> {(user.url || user.website || '').replace(/^https?:\/\//, '')}
            </a>
          ) : null}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {user.sex === "MALE" ? "👨" : "👩"} {user.sex === "MALE" ? "Hombre" : "Mujer"}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 flex items-center gap-6">
          {[
            { value: user.totalPosts, label: "Posts" },
            { value: followersCount, label: "Seguidores" },
            { value: followingCount, label: "Siguiendo" },
          ].map(stat => (
            <button key={stat.label} className="flex flex-col items-start hover:opacity-70 transition-opacity">
              <span className="text-lg font-black text-foreground leading-none">{stat.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Intereses */}
        {profileInterests.length > 0 && (
          <div className="mt-5">
            <div className="flex flex-wrap gap-1.5">
              {profileInterests.slice(0, 8).map((interest, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-foreground">
                  {interest}
                </span>
              ))}
              {profileInterests.length > 8 && (
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  +{profileInterests.length - 8}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOTOS ────────────────────────────────────────────────────── */}
      {localPhotos.length > 0 && (
        <div className="mt-6 px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Fotos</h2>
            <span className="text-xs text-muted-foreground">{localPhotos.length}/6</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {localPhotos.map((photo, index) => (
              <div
                key={photo.photoId || photo.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                className={`aspect-square overflow-hidden rounded-xl relative group cursor-pointer ${draggedIndex === index ? 'opacity-50' : ''}`}
                onClick={() => setViewPhotoUrl(photo.url)}
              >
                <img src={photo.url} alt="Foto" className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (confirm('¿Eliminar esta foto?')) {
                      try {
                        await api.delete(`/api/photos/delete/${photo.photoId || photo.id}`)
                        await refreshProfile(); toast.success('Foto eliminada')
                      } catch { toast.error('Error al eliminar foto') }
                    }
                  }}
                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-destructive transition-opacity opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  title="Eliminar foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {localPhotos.length < 6 && (
              <button
                onClick={() => document.getElementById('add-photo-upload')?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[10px] font-medium">Agregar</span>
              </button>
            )}
          </div>
          <input id="add-photo-upload" type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return
              const toastId = toast.loading('Subiendo foto...')
              try {
                const imageUrl = await uploadToCloudinary(file)
                await api.post('/api/photos/add', { url: imageUrl, position: user.photos.length, primary: false })
                await refreshProfile(); toast.dismiss(toastId); toast.success('Foto agregada')
              } catch { toast.dismiss(toastId); toast.error('Error al subir foto') }
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* Sin fotos */}
      {(!user.photos || user.photos.length === 0) && (
        <div className="mt-6 px-5">
          <button
            onClick={() => document.getElementById('first-photo-upload')?.click()}
            className="w-full h-32 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
          >
            <Camera className="h-8 w-8" />
            <p className="text-sm font-medium">Agrega tu primera foto</p>
          </button>
          <input id="first-photo-upload" type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return
              const toastId = toast.loading('Subiendo foto...')
              try {
                const imageUrl = await uploadToCloudinary(file)
                await api.post('/api/photos/add', { url: imageUrl, position: 0, primary: true })
                await refreshProfile(); toast.dismiss(toastId); toast.success('Foto agregada')
              } catch { toast.dismiss(toastId); toast.error('Error al subir foto') }
              e.target.value = ''
            }}
          />
        </div>
      )}

      {/* ── ACCESOS RÁPIDOS ──────────────────────────────────────────── */}
      <div className="mt-6 px-5 grid grid-cols-3 gap-3">
        {[
          { icon: Bookmark, label: "Guardados", value: savedPostsCount, path: '/saved', color: "text-primary", bg: "bg-primary/10" },
          { icon: Heart, label: "Matches", value: "", path: '/matches', color: "text-secondary", bg: "bg-secondary/10" },
          { icon: Heart, label: "Likes", value: "", path: '/likes', color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
          >
            <div className={`h-10 w-10 rounded-full ${item.bg} flex items-center justify-center`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div className="text-center">
              {item.value !== "" && <p className="text-sm font-black text-foreground">{item.value}</p>}
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── POSTS ────────────────────────────────────────────────────── */}
      <div className="mt-6 px-5">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Posts</h2>
          <span className="text-xs text-muted-foreground ml-auto">{user.totalPosts}</span>
        </div>
        {user.posts && user.posts.length > 0 ? (
          user.posts.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Newspaper className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No has publicado nada aún</p>
          </div>
        )}
      </div>

      {/* ── PHOTO VIEWER ─────────────────────────────────────────────── */}
      <Dialog open={!!viewPhotoUrl} onOpenChange={() => setViewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Vista de foto</DialogTitle>
          <div className="relative">
            {viewPhotoUrl && <img src={viewPhotoUrl} alt="Vista completa" className="w-full h-auto max-h-[90vh] object-contain" />}
            <button
              onClick={() => setViewPhotoUrl(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
            >✕</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
