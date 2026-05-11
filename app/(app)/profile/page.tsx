"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { reputationService } from "@/lib/services/reputation"
import { followService } from "@/lib/services/follow"
import { bookmarkService } from "@/lib/services/bookmark"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pencil, Loader2, Camera, Newspaper, Bookmark, Heart, Crown,
  MapPin, Globe, Zap, Settings, Trash2, MicOff, Paperclip, CalendarDays, ChevronRight,
  CalendarClock, Users
} from "lucide-react"
import { toast } from "sonner"
import { PostCard } from "@/components/feed/post-card"
import { useRouter } from "next/navigation"
import { uploadToCloudinary } from "@/lib/cloudinary"
import {
  VoiceNotePlayer, validateVoiceNoteFile, getAudioDurationSeconds,
  voiceNoteDurationExceededMessage, MAX_VOICE_NOTE_SECONDS, VoiceNoteRecorder,
} from "@/components/ui/voice-note"
import { useI18n } from "@/lib/i18n"
import { accountTypeBadgeLabels, toBackendAccountType } from "@/lib/account-type"
import { eventService } from "@/lib/services/event"
import type { Event } from "@/lib/types"
import { useExperienceMode } from "@/hooks/use-experience-mode"

export default function ProfilePage() {
  const { te, t, language } = useI18n()
  const { user, refreshProfile, updateUser, isLoading } = useAuth()
  const router = useRouter()
  const experienceMode = useExperienceMode()

  const [coverPhoto, setCoverPhoto] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [localPhotos, setLocalPhotos] = useState(user?.photos || [])
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)
  const [myCreatedEvents, setMyCreatedEvents] = useState<Event[]>([])
  const [myParticipatingEvents, setMyParticipatingEvents] = useState<Event[]>([])
  const [eventsTab, setEventsTab] = useState<'created' | 'participating'>('created')
  const [eventsLoading, setEventsLoading] = useState(false)

  const showPremiumBadge = typeof window !== 'undefined'
    ? localStorage.getItem(`sparkd_show_premium_${user?.userId}`) !== 'false'
    : true

  const profileInterests = Array.isArray(user?.interests) ? (user.interests as string[]) : []

  useEffect(() => { setLocalPhotos(user?.photos || []) }, [user?.photos])
  useEffect(() => { setCoverPhoto(user?.coverPictureUrl || null) }, [user?.coverPictureUrl])

  useEffect(() => {
    if (!user?.userId) return
    setEventsLoading(true)
    Promise.all([eventService.myCreated(), eventService.myParticipating()])
      .then(([created, participating]) => {
        setMyCreatedEvents(Array.isArray(created) ? created : [])
        setMyParticipatingEvents(Array.isArray(participating) ? participating : [])
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false))
  }, [user?.userId])

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
      toast.success(te('Fotos reordenadas', 'Photos reordered'))
    } catch {
      toast.error(te('Error al guardar orden', 'Error saving order'))
      setLocalPhotos(user?.photos || [])
    }
  }

  const primaryPhoto = user?.profilePictureUrl
    ? { url: user.profilePictureUrl }
    : user?.photos?.find((p) => p.isPrimary || p.primary)
  const initials = user ? `${user.nombres?.[0] || ""}${user.apellidos?.[0] || ""}`.toUpperCase() : "?"
  const reputationNum = user?.reputation
  const showReputation =
    typeof reputationNum === "number" && !Number.isNaN(reputationNum)
  const reputationColor = showReputation
    ? reputationService.getReputationColor(reputationNum)
    : undefined
  const followersCount = user?.followersCount ?? (user?.userId ? followService.getFollowersCount(user.userId) : 0)
  const followingCount = user?.followingCount ?? (user?.userId ? followService.getFollowingCount(user.userId) : 0)
  const savedPostsCount = user?.userId ? bookmarkService.getBookmarkedPosts(user.userId).length : 0
  const formatLocation = (loc: string | undefined) => {
    if (!loc || loc === "Unknown location") return null
    // Remover Plus Codes (formato: A1B2+CD3)
    const withoutPlusCode = loc.replace(/[A-Z0-9]{4}\+[A-Z0-9]{2,3},?\s*/g, '').trim()
    // Limpiar comas múltiples y espacios
    return withoutPlusCode.replace(/,\s*,/g, ',').trim()
  }
  const location = formatLocation(user?.location)

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!user) return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">{te('No se pudo cargar el perfil', 'Could not load profile')}</p>
    </div>
  )

  const totalPostsCount =
    typeof user.totalPosts === "number" ? user.totalPosts
    : Array.isArray(user.posts) ? user.posts.length : 0

  const activeEvents = eventsTab === 'created' ? myCreatedEvents : myParticipatingEvents

  const formatEventCardDate = (iso?: string | null) => {
    const s = iso?.trim()
    if (!s) return null
    try {
      const d = new Date(s)
      if (Number.isNaN(d.getTime())) return null
      return d.toLocaleString(language === "en" ? "en-US" : "es", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return null
    }
  }

  const eventStatusStyles = (status: string) => {
    const u = String(status || "OPEN").toUpperCase()
    switch (u) {
      case "OPEN":
        return "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400"
      case "FULL":
        return "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-400"
      case "CANCELLED":
        return "bg-destructive/12 text-destructive ring-destructive/20"
      case "FINISHED":
        return "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-400"
      case "EXPIRED":
        return "bg-muted text-muted-foreground ring-border"
      default:
        return "bg-muted text-muted-foreground ring-border"
    }
  }

  const eventStatusLabel = (status: string) => {
    const u = String(status || "OPEN").toUpperCase()
    const map: Record<string, string> = {
      OPEN: te("Abierto", "Open"),
      FULL: te("Lleno", "Full"),
      CANCELLED: te("Cancelado", "Cancelled"),
      FINISHED: te("Finalizado", "Finished"),
      EXPIRED: te("Expirado", "Expired"),
    }
    return map[u] || u
  }

  const formatCategoryLabel = (cat?: string) => {
    if (!cat) return ""
    return String(cat).replace(/_/g, " ")
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-gradient-to-b from-background via-muted/[0.35] to-muted/50 pb-24 dark:via-background dark:to-muted/25 lg:max-w-5xl xl:max-w-6xl">

      {/* ── HERO: portada visible + tarjeta con avatar en flujo (sin tapar el nombre) ── */}
      <div className="relative isolate">
        {/* Cover — más altura + menos solape del panel = más foto visible */}
        <div className="group relative h-52 overflow-hidden sm:h-60 md:h-72 lg:h-80">
          {coverPhoto
            ? <img src={coverPhoto} alt="cover" className="h-full w-full object-cover" />
            : <div className="h-full bg-gradient-to-br from-primary via-primary/60 to-secondary/50" />
          }
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent dark:from-black/45" />
          <button
            type="button"
            onClick={() => document.getElementById('cover-upload')?.click()}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-black/35 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Camera className="h-5 w-5" /> {te("Cambiar portada", "Change cover")}
          </button>
          <input id="cover-upload" type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return
              const toastId = toast.loading(te('Subiendo portada...', 'Uploading cover...'))
              try {
                const fd = new FormData(); fd.append('file', file)
                const data = await api.post<{ url: string }>('/api/photos/cover-picture', fd)
                setCoverPhoto(data.url); await refreshProfile()
                toast.dismiss(toastId); toast.success(te('Portada actualizada', 'Cover updated'))
              } catch { toast.dismiss(toastId); toast.error(te('Error al subir portada', 'Error uploading cover')) }
              e.target.value = ''
            }}
          />
          {/* Acciones sobre la portada (no compiten con el nombre) */}
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/profile/edit')}
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/55 sm:text-sm"
            >
              <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
            </button>
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/55"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

      {/* Tarjeta: solape suave para dejar más banda de portada visible */}
      <div className="relative z-[1] -mt-5 rounded-t-[1.85rem] border-x border-t border-border/50 bg-background/95 px-5 pb-2 pt-4 shadow-[0_-6px_28px_-10px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-border/30 dark:bg-background/95 dark:shadow-[0_-10px_36px_-14px_rgba(0,0,0,0.35)] sm:-mt-6 sm:pt-5 md:-mt-7">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Avatar — encaja con el nuevo solape */}
          <div className="-mt-[4.25rem] flex shrink-0 justify-center sm:-mt-[5rem] sm:justify-start md:-mt-[5.5rem]">
            <div className="relative group">
              <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-br from-primary to-secondary opacity-50 blur-md" />
              <div className="relative rounded-full bg-background p-[3px] shadow-xl ring-4 ring-background">
                <Avatar className="h-[5.5rem] w-[5.5rem] sm:h-24 sm:w-24">
                  <AvatarImage src={primaryPhoto?.url} alt={user.nombres} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-2xl font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]; if (!file) return
                  const toastId = toast.loading(te('Subiendo foto...', 'Uploading photo...'))
                  try {
                    const fd = new FormData(); fd.append('file', file)
                    await api.post('/api/photos/profile-picture', fd)
                    await refreshProfile()
                    toast.dismiss(toastId); toast.success(te('Foto actualizada', 'Photo updated'))
                  } catch { toast.dismiss(toastId); toast.error(te('Error al subir foto', 'Error uploading photo')) }
                  e.target.value = ''
                }}
              />
              {showReputation && reputationColor && (
                <div
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[9px] font-black text-black shadow"
                  style={{ backgroundColor: reputationColor }}
                >
                  {Math.round(reputationNum)}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-0.5 text-center sm:pb-1 sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-xl font-black tracking-tight sm:text-2xl">{user.nombres} {user.apellidos}</h1>
              {user.premium && showPremiumBadge && (
                <span className="flex items-center gap-1 self-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-[11px] font-bold text-yellow-500">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              )}
              {user.profileCompleted && (
                <span className="flex items-center gap-1 self-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                  <Zap className="h-3 w-3" /> {te("Verificado", "Verified")}
                </span>
              )}
            </div>
            {user.username && (
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {user.bio && <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>}

        {/* Voice note */}
        {(user.voiceIntroUrl || user.voiceNoteUrl) ? (
          <div className="mt-3 flex items-center gap-2">
            <VoiceNotePlayer url={(user.voiceIntroUrl || user.voiceNoteUrl)!} />
            <button
              onClick={async () => {
                try {
                  await api.delete('/api/profile/delete/voice')
                  await refreshProfile()
                  toast.success('Nota de voz eliminada')
                } catch { toast.error('Error al eliminar nota de voz') }
              }}
              className="h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center text-destructive shrink-0"
            >
              <MicOff className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <VoiceNoteRecorder
              currentUrl={null}
              onSaved={(url) => {
                updateUser({ voiceIntroUrl: url ?? undefined, voiceNoteUrl: url ?? undefined })
                void refreshProfile()
              }}
            />
            <div className="flex items-center pl-0.5">
              <input type="file" id="voice-profile-audio-input" className="sr-only"
                accept="audio/*,.webm,.m4a,.mp3,.ogg,.opus,.aac,.wav,.flac,.mp4,.3gp"
                onChange={async (e) => {
                  const file = e.target.files?.[0]; e.target.value = ""; if (!file) return
                  const check = validateVoiceNoteFile(file)
                  if (!check.ok) { toast.error(check.message); return }
                  let durationSec: number
                  try { durationSec = await getAudioDurationSeconds(file) }
                  catch (err) { toast.error(err instanceof Error ? err.message : "No se pudo leer la duración"); return }
                  if (durationSec > MAX_VOICE_NOTE_SECONDS) { toast.error(voiceNoteDurationExceededMessage()); return }
                  const toastId = toast.loading('Subiendo nota de voz...')
                  try {
                    const fd = new FormData(); fd.append('file', file)
                    await api.post('/api/profile/voice-note', fd)
                    await refreshProfile()
                    toast.dismiss(toastId); toast.success('Nota de voz guardada')
                  } catch { toast.dismiss(toastId); toast.error('Error al subir nota de voz') }
                }}
              />
              <label htmlFor="voice-profile-audio-input"
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                <span>Subir audio</span>
              </label>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </span>
          )}
          {(user.website || user.url) && (
            <a href={user.url || user.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Globe className="h-3.5 w-3.5" /> {(user.url || user.website || '').replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {user.sex === "MALE" ? "👨 Hombre" : "👩 Mujer"}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-5 flex items-center divide-x divide-border/80 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/80 shadow-sm ring-1 ring-black/[0.03] dark:from-card/90 dark:to-muted/20 dark:ring-white/[0.06] overflow-hidden">
          {[
            { value: totalPostsCount, label: "Posts" },
            { value: followersCount, label: "Seguidores" },
            { value: followingCount, label: "Siguiendo" },
          ].map(stat => (
            <button key={stat.label} className="flex-1 flex flex-col items-center py-3.5 transition-colors hover:bg-muted/40">
              <span className="text-xl font-black leading-none tabular-nums tracking-tight">{stat.value}</span>
              <span className="text-[11px] font-medium text-muted-foreground mt-1">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* Reputación (solo si /me incluye número) */}
        {showReputation && reputationColor && (
          <div className="mt-4 rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/20 p-4 shadow-sm ring-1 ring-black/[0.03] dark:from-card/80 dark:to-muted/30 dark:ring-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Reputación</span>
              <span className="text-xs font-black" style={{ color: reputationColor }}>
                {Math.round(reputationNum)}/100
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(0, reputationNum))}%`,
                  backgroundColor: reputationColor,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {reputationNum >= 75
                ? "⭐ Excelente reputación"
                : reputationNum >= 50
                  ? "👍 Buena reputación"
                  : "⚠️ Reputación baja"}
            </p>
          </div>
        )}

        {/* Intereses */}
        {profileInterests.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profileInterests.slice(0, 8).map((interest, i) => (
              <span key={i} className="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium shadow-sm">{interest}</span>
            ))}
            {profileInterests.length > 8 && (
              <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                +{profileInterests.length - 8}
              </span>
            )}
          </div>
        )}
      </div>
      </div>

      {/* ── ACCESOS RÁPIDOS ── */}
      <div className="mt-6 px-5 grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          // Guardados - común para todos
          { icon: Bookmark, label: "Guardados", value: savedPostsCount, path: '/saved', color: "text-primary", bg: "bg-primary/12", modes: ['SOCIAL', 'DATING', 'BOTH'] },
          // Matches - solo DATING y BOTH
          { icon: Heart, label: "Matches", value: null, path: '/matches', color: "text-pink-500", bg: "bg-pink-500/12", modes: ['DATING', 'BOTH'] },
          // Likes - solo DATING y BOTH
          { icon: Heart, label: "Likes", value: null, path: '/likes', color: "text-rose-500", bg: "bg-rose-500/12", modes: ['DATING', 'BOTH'] },
        ].filter(item => item.modes.includes(experienceMode)).map(item => (
          <button key={item.label} onClick={() => router.push(item.path)}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm ring-1 ring-black/[0.03] transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md hover:shadow-primary/5 dark:bg-card/60 dark:ring-white/[0.05] sm:p-4"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg} shadow-inner ring-1 ring-black/5 transition-transform group-hover:scale-105 dark:ring-white/10`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            {item.value !== null && <p className="text-sm font-black tabular-nums">{item.value}</p>}
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{item.label}</p>
          </button>
        ))}
      </div>

      {/* ── FOTOS · MIS EVENTOS · POSTS (tabs) ── */}
      <Tabs defaultValue="photos" className="mt-8 px-5">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-2xl border border-border/50 bg-muted/45 p-1.5 shadow-inner dark:bg-muted/25">
          <TabsTrigger
            value="photos"
            className="rounded-xl py-3 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground sm:text-sm"
          >
            {te("Fotos", "Photos")}
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="rounded-xl py-3 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground sm:text-sm"
          >
            {te("Mis Eventos", "My events")}
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="rounded-xl py-3 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground sm:text-sm"
          >
            {te("Posts", "Posts")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-5 rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/40 dark:ring-white/[0.06]">
          <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{te("Galería", "Gallery")}</span>
            <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">{localPhotos.length}/6</span>
          </div>
          {localPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {localPhotos.map((photo, index) => (
                <div key={photo.photoId || photo.id} draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`aspect-square overflow-hidden rounded-2xl relative group cursor-pointer shadow-sm ring-1 ring-black/[0.04] transition-transform hover:z-10 hover:ring-primary/25 dark:ring-white/[0.08] ${draggedIndex === index ? 'opacity-50' : ''}`}
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
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-destructive transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {localPhotos.length < 6 && (
                <button onClick={() => document.getElementById('add-photo-upload')?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{te("Agregar", "Add")}</span>
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => document.getElementById('first-photo-upload')?.click()}
              className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/70 bg-muted/15 transition-all hover:border-primary hover:bg-primary/5 text-muted-foreground hover:text-primary"
            >
              <Camera className="h-7 w-7" />
              <p className="text-sm font-medium">{te("Agrega tu primera foto", "Add your first photo")}</p>
            </button>
          )}
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
        </TabsContent>

        <TabsContent value="events" className="mt-5 rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/40 dark:ring-white/[0.06]">
          {(experienceMode === 'SOCIAL' || experienceMode === 'BOTH') ? (
            <>
              <div className="mb-4 flex gap-1 rounded-2xl bg-muted/50 p-1 dark:bg-muted/25">
                {(['created', 'participating'] as const).map(tab => (
                  <button key={tab} type="button" onClick={() => setEventsTab(tab)}
                    className={`flex-1 rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition-all sm:text-sm ${
                      eventsTab === tab
                        ? 'bg-background text-foreground shadow-sm ring-1 ring-black/[0.06] dark:bg-card dark:ring-white/10'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'created'
                      ? `${te("Creados", "Created")} (${myCreatedEvents.length})`
                      : `${te("Participando", "Attending")} (${myParticipatingEvents.length})`}
                  </button>
                ))}
              </div>
              {eventsLoading ? (
                <div className="flex justify-center py-14"><Loader2 className="h-7 w-7 animate-spin text-primary/70" /></div>
              ) : activeEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 py-12 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <CalendarDays className="h-7 w-7 text-primary" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {eventsTab === 'created'
                      ? te('No has creado eventos aún', "You haven't created any events yet")
                      : te('No estás participando en eventos', "You're not attending any events")}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {te("Explora meetups en Eventos y únete o crea uno.", "Explore meetups under Events and join or create one.")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {activeEvents.map((ev: any) => {
                    const id = ev.eventId || ev.id
                    const title = ev.title || ev.name || te("Sin título", "Untitled")
                    const cover =
                      ev.coverPhotoUrl ||
                      ev.coverPhoto ||
                      (typeof ev.cover === "string" ? ev.cover : undefined)
                    const zone =
                      ev.zone ||
                      ev.locationZone ||
                      (typeof ev.location === "string" ? ev.location : undefined)
                    const when = formatEventCardDate(ev.startsAt || ev.eventDate || ev.starts_at)
                    const st = String(ev.status || "OPEN").toUpperCase()
                    const approved =
                      typeof ev.currentApprovedCount === "number"
                        ? ev.currentApprovedCount
                        : typeof ev.approvedCount === "number"
                          ? ev.approvedCount
                          : null
                    const cap =
                      typeof ev.maxGuests === "number" && ev.maxGuests > 0 ? ev.maxGuests : null
                    const rawRole = ev.participantRole || ev.role || ev.myRole
                    const participantBadge =
                      eventsTab === "created"
                        ? te("Organizador", "Host")
                        : rawRole
                          ? String(rawRole).toUpperCase() === "ADMIN"
                            ? te("Organizador", "Host")
                            : String(rawRole).toUpperCase() === "MODERATOR"
                              ? te("Moderador", "Moderator")
                              : String(rawRole).toUpperCase() === "GUEST"
                                ? te("Invitado", "Guest")
                                : String(rawRole)
                          : null

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => router.push(`/events/${id}`)}
                        className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 text-left shadow-md shadow-black/[0.04] ring-1 ring-black/[0.05] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-primary/[0.07] dark:from-card/90 dark:via-card/70 dark:to-muted/40 dark:ring-white/[0.08]"
                      >
                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-secondary/[0.08]" />
                        </div>

                        <div className="relative aspect-[5/3] w-full shrink-0 overflow-hidden">
                          {cover ? (
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary/25 via-secondary/20 to-muted">
                              <CalendarDays className="h-9 w-9 text-primary/80" aria-hidden />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />
                          {participantBadge && (
                            <span className="absolute right-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-md border border-white/20 bg-black/45 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                              {participantBadge}
                            </span>
                          )}
                        </div>

                        <div className="relative flex min-h-0 flex-1 flex-col gap-1.5 p-3">
                          <div className="flex items-start gap-1.5">
                            <h3 className="min-w-0 flex-1 text-left text-xs font-bold leading-snug tracking-tight text-foreground line-clamp-2 sm:text-sm">
                              {title}
                            </h3>
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                          </div>

                          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
                            {when && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarClock className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                                <span className="line-clamp-2">{when}</span>
                              </span>
                            )}
                            {zone && (
                              <span className="inline-flex items-start gap-1">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 opacity-80" aria-hidden />
                                <span className="line-clamp-2 break-words">{zone}</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ring-1 ring-inset sm:text-[10px] ${eventStatusStyles(st)}`}
                            >
                              {eventStatusLabel(st)}
                            </span>
                            {ev.category && (
                              <span className="truncate rounded-md bg-muted/80 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                                {formatCategoryLabel(ev.category)}
                              </span>
                            )}
                            {approved != null && cap != null && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                                <Users className="h-3 w-3 opacity-70" aria-hidden />
                                {approved}/{cap}
                              </span>
                            )}
                            {ev.free === false && typeof ev.price === "number" && ev.price > 0 && (
                              <span className="text-[9px] font-semibold text-primary sm:text-[10px]">${ev.price}</span>
                            )}
                            {ev.free === true && (
                              <span className="text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                                {te("Gratis", "Free")}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                <CalendarDays className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">
                {te("Los eventos están disponibles en modo Social o Ambos.", "Events are available in Social or Both mode.")}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-5 rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm ring-1 ring-black/[0.03] dark:bg-card/40 dark:ring-white/[0.06]">
          {(experienceMode === 'SOCIAL' || experienceMode === 'BOTH') ? (
            <>
              <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{te("Tu actividad", "Your activity")}</span>
                <span className="rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {totalPostsCount} {te("publicaciones", "posts")}
                </span>
              </div>
              {user.posts && user.posts.length > 0 ? (
                <div className="space-y-3">
                  {user.posts.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/15 px-5 py-14 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Newspaper className="h-7 w-7 text-primary/80" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-foreground">{te("No has publicado nada aún", "You haven't posted anything yet")}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{te("Comparte algo desde el feed.", "Share something from the feed.")}</p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-5 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                <Newspaper className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <p className="text-sm font-medium text-foreground">
                {te("Los posts están disponibles en modo Social o Ambos.", "Posts are available in Social or Both mode.")}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── PHOTO VIEWER ── */}
      <Dialog open={!!viewPhotoUrl} onOpenChange={() => setViewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0 [&>button]:hidden">
          <DialogTitle className="sr-only">Vista de foto</DialogTitle>
          <div className="relative">
            {viewPhotoUrl && <img src={viewPhotoUrl} alt="Vista completa" className="w-full h-auto max-h-[90vh] object-contain" />}
            <button onClick={() => setViewPhotoUrl(null)}
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
            >✕</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
