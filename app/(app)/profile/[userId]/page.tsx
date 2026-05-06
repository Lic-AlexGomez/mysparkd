"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { followService } from "@/lib/services/follow"
import { blockService } from "@/lib/services/block"
import { reputationService } from "@/lib/services/reputation"
import { privacyService } from "@/lib/services/privacy"
import type { UserProfile, Photo, Chat, SwipeResponse } from "@/lib/types"
import { normalizeProfilePosts } from "@/lib/normalize-profile-posts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, MessageCircle, UserPlus, UserCheck, ArrowLeft, Heart, Crown, Trash2, Lock, Clock, Star, X, Clapperboard } from "lucide-react"
import { PostCard } from "@/components/feed/post-card"
import { ReportModal } from "@/components/feed/report-modal"
import { toast } from "sonner"
import { VoiceNotePlayer } from "@/components/ui/voice-note"
import { useI18n } from "@/lib/i18n"
import { accountTypeBadgeLabels, toBackendAccountType } from "@/lib/account-type"
import { useExperienceMode } from "@/hooks/use-experience-mode"

function getAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null
  const diff = Date.now() - new Date(dateOfBirth).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

interface FollowerUser {
  userId: string
  username: string
  profilePictureUrl?: string
}

export default function UserProfilePage() {
  const { te, t } = useI18n()
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = params.userId as string
  const compatibilityFromUrl = searchParams.get("compatibility")
  const experienceMode = useExperienceMode()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [pending, setPending] = useState(false)
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)
  const [isMessaging, setIsMessaging] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [liked, setLiked] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null)
  const [inSparklingList, setInSparklingList] = useState(false)
  const [followListModal, setFollowListModal] = useState<'followers' | 'following' | null>(null)
  const [followList, setFollowList] = useState<FollowerUser[]>([])
  const [followListLoading, setFollowListLoading] = useState(false)

  useEffect(() => {
    if (!user?.userId || !profile) return
    fetchFollowStatus()
  }, [user, userId, profile])

  const fetchFollowStatus = async () => {
    try {
      const status = await api.get<{ following: boolean; followedBy: boolean; requestPending: boolean; followBack: boolean }>(`/api/follow/status/${userId}`)
      setFollowing(status.following)
      setPending(status.requestPending)
    } catch {}
  }

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>(`/api/profile/${userId}`)
      setProfile({ ...data, posts: normalizeProfilePosts(data.posts) })
    } catch {} finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  // Verificar si está en sparkling list
  useEffect(() => {
    if (!user?.userId) return
    privacyService.getSparklingList().then(list => {
      setInSparklingList(list.some(m => m.userId === userId))
    }).catch(() => {})
  }, [userId, user?.userId])

  const openFollowList = async (type: 'followers' | 'following') => {
    setFollowListModal(type)
    setFollowListLoading(true)
    try {
      const data = await api.get<FollowerUser[]>(`/api/follow/${type}/${userId}`)
      setFollowList(data || [])
    } catch {
      setFollowList([])
    } finally {
      setFollowListLoading(false)
    }
  }

  const handleRemoveFollower = async (followerId: string) => {
    try {
      await api.delete(`/api/follow/follower/${followerId}`)
      setFollowList(prev => prev.filter(u => u.userId !== followerId))
      toast.success(te('Seguidor eliminado', 'Follower removed'))
    } catch {
      toast.error(te('Error al eliminar seguidor', 'Error removing follower'))
    }
  }

  const handleFollow = async () => {
    if (!user?.userId) return
    if (pending) {
      // Cancelar solicitud pendiente
      try {
        await api.delete(`/api/follow/cancel/${userId}`)
        setPending(false)
        toast.success(te("Solicitud cancelada", "Request cancelled"))
      } catch {
        toast.error(te("Error al cancelar solicitud", "Error cancelling request"))
      }
    } else if (following) {
      try {
        await api.delete(`/api/follow/${userId}`)
        setFollowing(false)
        toast.success(te("Dejaste de seguir", "You unfollowed"))
      } catch {
        toast.error(te("Error al dejar de seguir", "Error unfollowing"))
      }
    } else {
      try {
        await api.post(`/api/follow/${userId}`)
        if (profile!.visibility === 'PRIVATE') {
          setPending(true)
          toast.success(te("Solicitud enviada", "Request sent"))
        } else {
          setFollowing(true)
          toast.success(t("common.following"))
        }
      } catch {
        toast.error(te("Error al seguir", "Error following"))
      }
    }
  }

  const handleToggleSparklingList = async () => {
    try {
      if (inSparklingList) {
        await privacyService.removeFromSparklingList(userId)
        setInSparklingList(false)
        toast.success(te("Eliminado de Sparkling List", "Removed from Sparkling List"))
      } else {
        await privacyService.addToSparklingList(userId)
        setInSparklingList(true)
        toast.success(te("Agregado a Sparkling List ✨", "Added to Sparkling List ✨"))
      }
    } catch {
      toast.error(te("Error al actualizar Sparkling List", "Error updating Sparkling List"))
    }
  }

  const handleMessage = async () => {
    if (profile!.visibility === 'PRIVATE' && !following) {
      toast.error(te("Primero debes seguir a esta cuenta para enviar mensajes", "You must follow this account first to send messages"))
      return
    }
    setIsMessaging(true)
    try {
      const chat = await api.post<Chat>(`/api/chat/open/${userId}`)
      router.push(`/chat/${chat.chatId}`)
    } catch {
      toast.error(te("Error al abrir chat", "Error opening chat"))
    } finally {
      setIsMessaging(false)
    }
  }

  const handleLike = async () => {
    if (liked || isLiking) return
    setIsLiking(true)
    try {
      const response = await api.post<SwipeResponse>("/api/swipes/perform/swipe", { targetUserId: userId, type: "LIKE" })
      setLiked(true)
      if (response.match) {
        toast.success(te(`¡Es un match con ${profile?.nombres}! 🎉`, `It's a match with ${profile?.nombres}! 🎉`), { duration: 4000 })
      } else {
        toast.success(te("¡Like enviado!", "Like sent!"))
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 429 || error.status === 403)) {
        toast.error(
          error.message ||
            te("Límite diario de swipes alcanzado. Mejora a premium.", "Daily swipe limit reached. Upgrade to premium."),
        )
      } else {
        toast.error(te("Error al enviar like", "Error sending like"))
      }
    } finally {
      setIsLiking(false)
    }
  }

  const deletePhoto = (photo: Photo) => {
    if (photo.isPrimary || photo.primary) {
      toast.error(te("No puedes eliminar la foto principal", "You cannot delete the main photo"))
      return
    }
    setPhotoToDelete(photo)
    setConfirmOpen(true)
  }

  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return
    const pid = photoToDelete.photoId ?? photoToDelete.id
    if (!pid) { setConfirmOpen(false); return }
    try {
      await api.delete(`/api/photos/delete/${pid}`)
      await fetchProfile()
    } catch {
      toast.error(te("Error al eliminar la foto", "Error deleting photo"))
    } finally {
      setConfirmOpen(false)
      setPhotoToDelete(null)
    }
  }

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!profile) return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">{te("Perfil no encontrado", "Profile not found")}</p>
    </div>
  )

  const primaryPhoto = profile.profilePictureUrl
    ? { url: profile.profilePictureUrl }
    : profile.photos?.find((p) => p.isPrimary || p.primary)
  const initials = `${profile.nombres?.[0] || ""}${profile.apellidos?.[0] || ""}`.toUpperCase()
  const reputation = profile.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)
  const followersCount = profile.followersCount ?? followService.getFollowersCount(userId)
  const followingCount = profile.followingCount ?? followService.getFollowingCount(userId)
  const age = getAge(profile.dateOfBirth)
  const compatibility = compatibilityFromUrl ? parseInt(compatibilityFromUrl) : null
  const isPremium = profile.premium || profile.showPremiumBadge || profile.subscriptionStatus === 'ACTIVE'
  const profileInterests: any[] = profile.interests || []
  const totalPostsDisplay =
    typeof profile.totalPosts === "number"
      ? profile.totalPosts
      : profile.posts?.length ?? 0
  const accountModeLabel = accountTypeBadgeLabels(toBackendAccountType(profile.accountType))
  const profileExperienceMode = profile.accountType?.toUpperCase() === 'SOCIAL' ? 'SOCIAL'
    : profile.accountType?.toUpperCase() === 'DATING' ? 'DATING'
    : 'BOTH'

  return (
    <div className="mx-auto max-w-2xl pb-10">
      {/* Cover */}
      <div className="relative">
        <div
          className="h-48 w-full bg-gradient-to-br from-primary/40 via-secondary/30 to-primary/20 cursor-pointer"
          style={profile.coverPictureUrl ? { backgroundImage: `url(${profile.coverPictureUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
          onClick={() => profile.coverPictureUrl && setViewPhotoUrl(profile.coverPictureUrl)}
        />
        <button onClick={() => router.back()} className="absolute top-4 left-4 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
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
              <DropdownMenuItem onClick={handleToggleSparklingList} className="cursor-pointer">
                <Star className={`h-4 w-4 mr-2 ${inSparklingList ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {inSparklingList ? te('Quitar de Sparkling List', 'Remove from Sparkling List') : te('Agregar a Sparkling List', 'Add to Sparkling List')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReportModal(true)} className="cursor-pointer">{te("Reportar", "Report")}</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                if (!user?.userId) return
                await blockService.blockUser(user.userId, userId)
                toast.success(te("Usuario bloqueado", "User blocked"))
              }} className="cursor-pointer text-destructive">{te("Bloquear", "Block")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 mt-2">
        <div className="flex items-end justify-between mt-[-40px] mb-4 px-1">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl cursor-pointer" onClick={() => primaryPhoto?.url && setViewPhotoUrl(primaryPhoto.url)}>
              <AvatarImage src={primaryPhoto?.url} alt={profile.nombres} className="object-cover" />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">{initials}</AvatarFallback>
            </Avatar>
            {isPremium && (
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg">
                <Crown className="h-3.5 w-3.5 text-black" />
              </div>
            )}
            <span className="absolute -top-1 -right-3 px-2 py-0.5 rounded-full text-xs font-bold text-black shadow-lg" style={{ backgroundColor: reputationColor }}>
              ★ {reputation}
            </span>
          </div>

          <div className="flex gap-2 mb-1">
            <button
              onClick={handleLike}
              disabled={isLiking || liked || (profile.visibility === 'PRIVATE' && !following)}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all ${
                profile.visibility === 'PRIVATE' && !following ? "border-muted text-muted cursor-not-allowed"
                  : liked ? "bg-secondary/20 border-secondary text-secondary"
                  : "border-border hover:bg-secondary/10 hover:border-secondary text-foreground"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-secondary text-secondary" : "text-inherit"}`} />
            </button>
            <button
              onClick={handleMessage}
              disabled={isMessaging || (profile.visibility === 'PRIVATE' && !following)}
              className={`h-9 w-9 rounded-full border flex items-center justify-center transition-colors ${
                profile.visibility === 'PRIVATE' && !following ? "border-muted text-muted cursor-not-allowed" : "border-border hover:bg-muted text-foreground"
              }`}
            >
              {isMessaging ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            </button>
            <button
              onClick={() => router.push(`/stories?targetUserId=${encodeURIComponent(userId)}`)}
              className="h-9 w-9 rounded-full border border-border flex items-center justify-center transition-colors text-foreground hover:bg-muted"
              title={te("Ver stories", "View stories")}
            >
              <Clapperboard className="h-4 w-4" />
            </button>
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold transition-all ${
                following ? "border border-border text-foreground hover:bg-muted"
                  : pending ? "border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  : "bg-gradient-to-r from-primary to-secondary text-black"
              }`}
            >
              {following ? <><UserCheck className="h-4 w-4" /> Siguiendo</>
                : pending ? <><Clock className="h-4 w-4" /> Solicitado</>
                : <><UserPlus className="h-4 w-4" /> Seguir</>}
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground">
              {profile.nombres} {profile.apellidos}
              {age && <span className="ml-2 font-light text-muted-foreground">{age}</span>}
            </h1>
            {isPremium && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                <Crown className="h-3 w-3" /> Premium
              </span>
            )}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground border border-border">
              {accountModeLabel.emoji}{" "}
              {te(accountModeLabel.labelEs, accountModeLabel.labelEn)}
            </span>
          </div>
          {profile.username && <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>}
          {profile.bio && <p className="text-sm text-foreground mt-2 leading-relaxed">{profile.bio}</p>}
          {(profile.voiceIntroUrl || (profile as any).voiceNoteUrl) && (
            <div className="mt-2">
              <VoiceNotePlayer url={profile.voiceIntroUrl || (profile as any).voiceNoteUrl} />
            </div>
          )}
          {profile.location && profile.location !== "Unknown location" && (
            <p className="text-xs text-muted-foreground mt-1">📍 {profile.location}</p>
          )}
          {(profile.url || profile.website) && (
            <a href={profile.url || profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
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
            {inSparklingList && (
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-0 text-xs">✨ Sparkling List</Badge>
            )}
          </div>
          {compatibility && compatibility > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-primary" /> Compatibilidad
                </span>
                <span className="text-sm font-black text-primary">{compatibility}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700" style={{ width: `${compatibility}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Stats — clickeables */}
        <div className="mt-4 flex items-center gap-6 border-t border-border pt-4">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-foreground">{totalPostsDisplay}</span>
            <span className="text-xs text-muted-foreground">Posts</span>
          </div>
          <button onClick={() => openFollowList('followers')} className="flex flex-col items-center hover:opacity-70 transition-opacity">
            <span className="text-lg font-bold text-foreground">{followersCount}</span>
            <span className="text-xs text-muted-foreground">Seguidores</span>
          </button>
          <button onClick={() => openFollowList('following')} className="flex flex-col items-center hover:opacity-70 transition-opacity">
            <span className="text-lg font-bold text-foreground">{followingCount}</span>
            <span className="text-xs text-muted-foreground">Siguiendo</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-foreground">{profile.photos?.length || 0}</span>
            <span className="text-xs text-muted-foreground">Fotos</span>
          </div>
        </div>
      </div>

      {profile.visibility === 'PRIVATE' && !following ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 border-t border-border mt-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">{te("Esta cuenta es privada", "This account is private")}</p>
          <p className="text-sm text-muted-foreground text-center max-w-[250px]">
            {te("Sigue a esta cuenta para ver sus fotos, posts y más información.", "Follow this account to see photos, posts and more information.")}
          </p>
        </div>
      ) : (
        <>
          {profileInterests.length > 0 && (
            <div className="px-4 mt-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">{te("Intereses", "Interests")}</h2>
              <div className="flex flex-wrap gap-2">
                {profileInterests.map((interest, index) => {
                  const name = typeof interest === "string" ? interest : interest.name
                  const icon = typeof interest === "object" ? interest.icon : null
                  return (
                    <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-xs font-medium text-foreground">
                      {icon && <span>{icon}</span>}
                      {name}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {profile.photos && profile.photos.length > 0 && (
            <div className="px-4 mt-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">{te("Fotos", "Photos")}</h2>
              <div className="grid grid-cols-3 gap-1.5">
                {profile.photos.map((photo) => (
                  <div key={photo.photoId || photo.id} className="relative aspect-square overflow-hidden rounded-xl">
                    <img src={photo.url} alt={te("Foto", "Photo")} className="h-full w-full object-cover hover:scale-105 transition-transform" loading="lazy" onClick={() => setViewPhotoUrl(photo.url)} />
                    <button aria-label={te("Eliminar foto", "Delete photo")} onClick={() => deletePhoto(photo)} className="absolute top-1 right-1 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.posts && profile.posts.length > 0 && (profileExperienceMode === 'SOCIAL' || profileExperienceMode === 'BOTH') && (
            <div className="mt-6 px-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">{te("Posts", "Posts")}</h2>
              {profile.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal followers/following */}
      <Dialog open={!!followListModal} onOpenChange={() => setFollowListModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>{followListModal === 'followers' ? te('Seguidores', 'Followers') : te('Siguiendo', 'Following')}</DialogTitle>
          {followListLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : followList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{te("No hay usuarios", "No users")}</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {followList.map(u => (
                <div key={u.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <button onClick={() => { setFollowListModal(null); router.push(`/profile/${u.userId}`) }}
                    className="flex items-center gap-3 flex-1 text-left">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={u.profilePictureUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{u.username}</span>
                  </button>
                  {followListModal === 'followers' && user?.userId === userId && (
                    <button
                      onClick={() => handleRemoveFollower(u.userId)}
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title={te("Eliminar seguidor", "Remove follower")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) setConfirmOpen(false) }}>
        <DialogContent>
          <DialogTitle>{te("Eliminar foto", "Delete photo")}</DialogTitle>
          <p className="text-sm text-foreground">{te("¿Seguro que quieres eliminar esta foto?", "Are you sure you want to delete this photo?")}</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg border border-border text-sm">{t("common.cancel")}</button>
            <button onClick={confirmDeletePhoto} className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm">{t("common.delete")}</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPhotoUrl} onOpenChange={() => setViewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0 [&>button]:hidden">
          <DialogTitle className="sr-only">{te("Vista de foto", "Photo view")}</DialogTitle>
          <img src={viewPhotoUrl || ""} alt={te("Vista completa", "Full view")} className="w-full h-auto max-h-[90vh] object-contain" />
          <button onClick={() => setViewPhotoUrl(null)} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-sm">✕</button>
        </DialogContent>
      </Dialog>

      {user && (
        <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} reportedUserId={userId} targetId={userId} targetType="USER" />
      )}
    </div>
  )
}
