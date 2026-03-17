"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { followService } from "@/lib/services/follow"
import { notificationService } from "@/lib/services/notification"
import { blockService } from "@/lib/services/block"
import { reportService } from "@/lib/services/report"
import { reputationService } from "@/lib/services/reputation"
import type { UserProfile, Chat, SwipeResponse } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, MessageCircle, UserPlus, UserCheck, ArrowLeft, Heart, Crown, Sparkles } from "lucide-react"
import { PostCard } from "@/components/feed/post-card"
import { toast } from "sonner"

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
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)
  const [isMessaging, setIsMessaging] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [liked, setLiked] = useState(false)
  const [interests, setInterests] = useState<any[]>([])

  useEffect(() => {
    if (user?.userId) setFollowing(followService.isFollowing(user.userId, userId))
  }, [user, userId])

  const fetchProfile = useCallback(async () => {
    try {
      const [data, interestsData] = await Promise.allSettled([
        api.get<UserProfile>(`/api/profile/${userId}`),
        api.get<any[]>(`/api/interests/me`),
      ])
      if (data.status === "fulfilled") {
        console.log('Perfil:', data.value)
        setProfile(data.value)
      }
      // intereses del perfil visitado no hay endpoint, usamos los del perfil si vienen
    } catch {} finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleFollow = () => {
    if (!user?.userId) return
    if (following) {
      followService.unfollow(user.userId, userId)
      setFollowing(false)
      toast.success("Dejaste de seguir")
    } else {
      followService.follow(user.userId, userId)
      setFollowing(true)
      notificationService.create(userId, "follow", `${user.nombres} te ha seguido`, user.userId)
      toast.success("Siguiendo")
    }
  }

  const handleMessage = async () => {
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
  const profileInterests = profile.interests && profile.interests.length > 0 ? profile.interests : []

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
              <DropdownMenuItem onClick={() => {
                if (!user?.userId) return
                const reason = prompt("Motivo del reporte (mínimo 10 caracteres):")
                if (reason && reason.length >= 10) {
                  reportService.createReport(user.userId, userId, "user", reason)
                  toast.success("Reporte enviado")
                }
              }} className="cursor-pointer">Reportar</DropdownMenuItem>
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
            {profile.premium && (
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
              disabled={isLiking || liked}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all ${
                liked
                  ? "bg-secondary/20 border-secondary text-secondary"
                  : "border-border hover:bg-secondary/10 hover:border-secondary"
              }`}
              title="Dar like"
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-secondary text-secondary" : "text-foreground"}`} />
            </button>
            {/* Message button */}
            <button
              onClick={handleMessage}
              disabled={isMessaging}
              className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              {isMessaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4 text-foreground" />}
            </button>
            {/* Follow button */}
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold transition-all ${
                following
                  ? "border border-border text-foreground hover:bg-muted"
                  : "bg-gradient-to-r from-primary to-secondary text-black"
              }`}
            >
              {following ? <><UserCheck className="h-4 w-4" /> Siguiendo</> : <><UserPlus className="h-4 w-4" /> Seguir</>}
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
            {profile.premium && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                <Crown className="h-3 w-3" /> Premium
              </span>
            )}
          </div>

          {profile.username && <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>}
          {profile.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{profile.bio}</p>}
          {profile.location && <p className="text-xs text-muted-foreground mt-1">📍 {profile.location}</p>}

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

      {/* Intereses */}
      {profileInterests.length > 0 && (
        <div className="px-4 mt-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Intereses</h2>
          <div className="flex flex-wrap gap-2">
            {profileInterests.map((interest, index) => {
              const name = typeof interest === "string" ? interest : interest.name
              const icon = typeof interest === "object" ? interest.icon : null
              return (
                <span key={index} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-foreground">
                  {icon && <span>{icon}</span>}{name}
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
                key={photo.photoId}
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

      {/* Photo viewer */}
      <Dialog open={!!viewPhotoUrl} onOpenChange={() => setViewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0">
          <img src={viewPhotoUrl || ""} alt="Vista completa" className="w-full h-auto max-h-[90vh] object-contain" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
