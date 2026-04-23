"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { followService } from "@/lib/services/follow"
import { notificationService } from "@/lib/services/notification"
import { blockService } from "@/lib/services/block"
import { reputationService } from "@/lib/services/reputation"
import type { UserProfile, Chat, SwipeResponse } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, MessageCircle, UserPlus, UserCheck, ArrowLeft, Heart, Crown, Sparkles, Lock, Clock } from "lucide-react"
import { PostCard } from "@/components/feed/post-card"
import { ReportModal } from "@/components/feed/report-modal"
import { toast } from "sonner"
import { VoiceNotePlayer } from "@/components/ui/voice-note"

function getAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  const diff = Date.now() - new Date(dateOfBirth).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export default function UserProfilePage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = params.userId as string
  const compatibilityFromUrl = searchParams.get("compatibility")

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [pending, setPending] = useState(false)
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)
  const [isMessaging, setIsMessaging] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [liked, setLiked] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  useEffect(() => {
    if (!user?.userId || !profile) return
    fetchFollowStatus()
  }, [user, userId, profile])

  const fetchFollowStatus = async () => {
    try {
      const status = await api.get<{ following: boolean; followedBy: boolean; requestPending: boolean; followBack: boolean }>(`/api/follow/status/${userId}`)
      setFollowing(status.following)
      setPending(status.requestPending)
    } catch (e) {
      console.error('[follow] error fetching status:', e)
    }
  }

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>(`/api/profile/${userId}`)
      setProfile(data)
    } catch {} finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleFollow = async () => {
    if (!user?.userId) return
    if (following || pending) {
      try {
        await api.delete(`/api/follow/${userId}`)
        setFollowing(false)
        setPending(false)
        toast.success("Dejaste de seguir")
      } catch {
        toast.error("Error al dejar de seguir")
      }
    } else {
      try {
        await api.post(`/api/follow/${userId}`)
        if (profile.visibility === 'PRIVATE') {
          setPending(true)
          toast.success("Solicitud enviada")
        } else {
          setFollowing(true)
          toast.success("Siguiendo")
        }
        notificationService.create(userId, "follow", `${user.nombres} te ha seguido`, user.userId)
      } catch {
        toast.error("Error al seguir")
      }
    }
  }

  const handleMessage = async () => {
    if (profile.visibility === 'PRIVATE' && !following) {
      toast.error("Primero debes seguir a esta cuenta para enviar mensajes")
      return
    }
    setIsMessaging(true)
    try {
      const chat = await api.post<Chat>(`/api/chat/open/${userId}`)
      router.push(`/chat/${chat.chatId}`)
    } catch {
      toast.error("Error al abrir chat")
    } finally {
      setIsMessaging(false)
    }
  }

  const handleLike = async () => {
    if (liked || isLiking) return
    setIsLiking(true)
    try {
      const response = await api.post<SwipeResponse>("/api/swipes/perform/swipe", {
        targetUserId: userId,
        type: "LIKE",
      })
      setLiked(true)
      if (response.match) {
        toast.success(`¡Es un match con ${profile?.nombres}! 🎉`, { duration: 4000 })
      } else {
        toast.success("¡Like enviado!")
      }
    } catch {
      toast.error("Error al enviar like")
    } finally {
      setIsLiking(false)
    }
  }

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!profile) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Perfil no encontrado</p>
    </div>
  )

  const primaryPhoto = profile.profilePictureUrl
    ? { url: profile.profilePictureUrl }
    : profile.photos?.find((p) => p.isPrimary || p.primary)
  const initials = `${profile.nombres?.[0] || ""}${profile.apellidos?.[0] || ""}`.toUpperCase()
  const reputation = profile.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)
  const followersCount = followService.getFollowersCount(userId)
  const followingCount = followService.getFollowingCount(userId)
  const age = getAge(profile.dateOfBirth)
  const compatibility = compatibilityFromUrl ? parseInt(compatibilityFromUrl) : null
  const isPremium = profile.premium || profile.showPremiumBadge || profile.subscriptionStatus === 'ACTIVE'
  const profileInterests: any[] = profile.interests || []

  return (
    <div className="mx-auto max-w-2xl pb-10">
      {/* Cover */}
      <div className="relative">
        <div
          className="h-48 w-full bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/20 cursor-pointer"
          style={profile.coverPictureUrl ? {
            backgroundImage: `url(${profile.coverPictureUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          } : {}}
          onClick={() => profile.coverPictureUrl && setViewPhotoUrl(profile.coverPictureUrl)}
        />
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
              <DropdownMenuItem onClick={() => setShowReportModal(true)} className="cursor-pointer">Reportar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                if (!user?.userId) return
                blockService.blockUser(user.userId, userId)
                toast.success("Usuario bloqueado")
              }} className="cursor-pointer text-destructive">Bloquear</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 mt-2">
        {/* Avatar + botones */}
        <div className="flex items-end justify-between mt-[-40px] mb-4 px-1">
          <div className="relative">
            <Avatar
              className="h-24 w-24 border-4 border-background shadow-xl cursor-pointer"
              onClick={() => primaryPhoto?.url && setViewPhotoUrl(primaryPhoto.url)}
            >
              <AvatarImage src={primaryPhoto?.url} alt={profile.nombres} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">{initials}</AvatarFallback>
            </Avatar>
            {isPremium && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                <Crown className="h-3.5 w-3.5 text-black" />
              </div>
            )}
            <span
              className="absolute -top-1 -right-3 px-2 py-0.5 rounded-full text-xs font-bold text-black shadow-lg"
              style={{ backgroundColor: reputationColor }}
            >
              ★ {reputation}
            </span>
          </div>

          <div className="flex gap-2 mb-1">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={isLiking || liked || profile.visibility === 'PRIVATE' && !following}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all ${
                profile.visibility === 'PRIVATE' && !following
                  ? "border-muted text-muted cursor-not-allowed"
                  : liked
                    ? "bg-secondary/20 border-secondary text-secondary"
                    : "border-border hover:bg-secondary/10 hover:border-secondary text-foreground"
              }`}
              title={profile.visibility === 'PRIVATE' && !following ? "Primero debes seguir a esta cuenta" : "Dar like"}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-secondary text-secondary" : "text-inherit"}`} />
            </button>
            
            {/* Message button */}
            <button
              onClick={handleMessage}
              disabled={isMessaging || profile.visibility === 'PRIVATE' && !following}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors ${
                profile.visibility === 'PRIVATE' && !following
                  ? "border-muted text-muted cursor-not-allowed"
                  : "border-border hover:bg-muted text-foreground"
              }`}
              title={profile.visibility === 'PRIVATE' && !following ? "Primero debes seguir a esta cuenta" : "Enviar mensaje"}
            >
              {isMessaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            </button>
            {/* Follow button */}
            <button
              onClick={handleFollow}
              disabled={pending}
              className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold transition-all ${
                (following || pending)
                  ? "border border-border text-foreground hover:bg-muted"
                  : "bg-gradient-to-r from-primary to-secondary text-black"
              }`}
            >
              {following ? <><UserCheck className="h-4 w-4" /> Siguiendo</> : pending ? <><Clock className="h-4 w-4" /> Solicitado</> : <><UserPlus className="h-4 w-4" /> Seguir</>}
            </button>
          </div>

        </div>

        {/* Nombre + edad + reputación */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">
              {profile.nombres} {profile.apellidos}
              {age && <span className="ml-2 bold font-light text-muted-foreground">{age}</span>}
            </h1>
            {isPremium && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                <Crown className="h-3 w-3" /> Premium
              </span>
            )}
          </div>

          {profile.username && <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>}
          {profile.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{profile.bio}</p>}
          {(profile.voiceIntroUrl || (profile as any).voiceNoteUrl) && (
            <div className="mt-2">
              <VoiceNotePlayer url={profile.voiceIntroUrl || (profile as any).voiceNoteUrl} />
            </div>
          )}
          {profile.location && profile.location !== "Unknown location" && <p className="text-xs text-muted-foreground mt-1">📍 {profile.location.split(',').length > 2 ? profile.location.split(',').slice(-2).map((p: string) => p.trim()).join(', ') : profile.location}</p>}
          {(profile.url || profile.website) && (
            <a
              href={profile.url || profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              🔗 {(profile.url || profile.website || '').replace(/^https?:\/\//, '')}
            </a>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
              {profile.sex === "MALE" ? "Hombre" : "Mujer"}
            </Badge>
            {profile.profileCompleted && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-0 text-xs">✓ Verificado</Badge>
            )}
          </div>

          {/* Compatibilidad */}
          {compatibility && compatibility > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Compatibilidad
                </span>
                <span className="text-sm font-black text-primary">{compatibility}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                  style={{ width: `${compatibility}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 border-t border-border pt-4">
          {[
            { value: profile.totalPosts, label: "Posts" },
            { value: followersCount, label: "Seguidores" },
            { value: followingCount, label: "Siguiendo" },
            { value: profile.photos?.length || 0, label: "Fotos" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {profile.visibility === 'PRIVATE' && !following ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 border-t border-border mt-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">Esta cuenta es privada</p>
          <p className="text-sm text-muted-foreground text-center max-w-[250px]">
            Sigue a esta cuenta para ver sus fotos, posts y más información.
          </p>
        </div>
      ) : (
        <>
          {/* Intereses */}
          {profileInterests.length > 0 && (
            <div className="px-4 mt-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">Intereses</h2>
              <div className="flex flex-wrap gap-2">
                {profileInterests.map((interest, index) => {
                  const name = typeof interest === "string" ? interest : interest.name
                  const icon = typeof interest === "object" ? interest.icon : null
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-xs font-medium text-foreground hover:from-primary/20 hover:to-secondary/20 transition-colors"
                    >
                      {icon && <span>{icon}</span>}
                      {name}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Fotos */}
          {profile.photos && profile.photos.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">Fotos</h2>
              <div className="grid grid-cols-3 gap-1.5">
                {profile.photos.map((photo) => (
                  <div
                    key={photo.photoId || photo.id}
                    className="aspect-square overflow-hidden rounded-xl cursor-pointer"
                    onClick={() => setViewPhotoUrl(photo.url)}
                  >
                    <img src={photo.url} alt="Foto" className="h-full w-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {profile.posts && profile.posts.length > 0 && (
            <div className="mt-6 px-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">Posts</h2>
              {profile.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Photo viewer */}
      <Dialog open={!!viewPhotoUrl} onOpenChange={() => setViewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0 [&>button]:hidden">
          <img src={viewPhotoUrl || ""} alt="Vista completa" className="w-full h-auto max-h-[90vh] object-contain" />
          <button
            onClick={() => setViewPhotoUrl(null)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-sm"
          >
            ✕
          </button>
        </DialogContent>
      </Dialog>

      {user && (
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={userId}
          targetId={userId}
          targetType="USER"
        />
      )}
    </div>
  )
}
