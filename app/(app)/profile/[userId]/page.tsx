"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { followService } from "@/lib/services/follow"
import { notificationService } from "@/lib/services/notification"
import { blockService } from "@/lib/services/block"
import { reportService } from "@/lib/services/report"
import { reputationService } from "@/lib/services/reputation"
import type { UserProfile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, Camera, Newspaper, MoreHorizontal, Shield } from "lucide-react"
import { PostCard } from "@/components/feed/post-card"
import { toast } from "sonner"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

export default function UserProfilePage() {
  const { user } = useAuth()
  const features = useFeatureFlags()
  const params = useParams()
  const userId = params.userId as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user?.userId) {
      setFollowing(followService.isFollowing(user.userId, userId))
    }
  }, [user, userId])

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>(`/api/profile/${userId}`)
      console.log('=== Perfil cargado ===')
      console.log('coverPictureUrl:', data.coverPictureUrl)
      console.log('coverPhoto:', data.coverPhoto)
      console.log('Perfil completo:', data)
      setProfile(data)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleFollow = () => {
    if (!user?.userId) return
    if (following) {
      followService.unfollow(user.userId, userId)
      setFollowing(false)
      toast.success('Dejaste de seguir')
    } else {
      followService.follow(user.userId, userId)
      setFollowing(true)
      notificationService.create(userId, 'follow', `${user.nombres} te ha seguido`, user.userId)
      toast.success('Siguiendo')
    }
  }

  const handleBlock = () => {
    if (!user?.userId) return
    blockService.blockUser(user.userId, userId)
    toast.success('Usuario bloqueado')
  }

  const handleReport = () => {
    if (!user?.userId) return
    const reason = prompt('Motivo del reporte (mínimo 10 caracteres):')
    if (reason && reason.length >= 10) {
      reportService.createReport(user.userId, userId, 'user', reason)
      toast.success('Reporte enviado')
    } else if (reason) {
      toast.error('El motivo debe tener al menos 10 caracteres')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Perfil no encontrado</p>
      </div>
    )
  }

  const primaryPhoto = profile.photos?.find((p) => p.isPrimary || p.primary)
  const initials = `${profile.nombres?.[0] || ""}${profile.apellidos?.[0] || ""}`.toUpperCase()
  const reputation = profile.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)
  const followersCount = followService.getFollowersCount(userId)
  const followingCount = followService.getFollowingCount(userId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Card className="overflow-hidden border-border bg-card">
        {/* Cover Photo */}
        <div 
          className="h-48 bg-gradient-to-r from-secondary/40 via-primary/30 to-secondary/20 relative group cursor-pointer"
          style={{
            backgroundImage: profile.coverPictureUrl ? `url(${profile.coverPictureUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={() => profile.coverPictureUrl && setViewPhotoUrl(profile.coverPictureUrl)}
        >
          {profile.coverPictureUrl && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          )}
        </div>
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-16 mb-4">
            <Avatar className="h-28 w-28 border-4 border-card shadow-lg cursor-pointer" onClick={() => primaryPhoto?.url && setViewPhotoUrl(primaryPhoto.url)}>
              <AvatarImage src={primaryPhoto?.url} alt={profile.nombres} />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">
                    {profile.nombres} {profile.apellidos}
                  </h1>
                  <Badge 
                    className="px-2 py-0.5 text-xs font-bold text-black border-0 flex items-center gap-1" 
                    style={{ backgroundColor: reputationColor }}
                  >
                    <Shield className="h-3 w-3" />
                    {reputation}
                  </Badge>
                </div>
                {features.profileEdit && profile.username && (
                  <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
                )}
                {features.profileEdit && profile.bio && (
                  <p className="text-sm text-foreground mt-2">{profile.bio}</p>
                )}
                {features.profileEdit && profile.location && (
                  <p className="text-xs text-muted-foreground mt-1">📍 {profile.location}</p>
                )}
                {features.profileEdit && profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 block">
                    🔗 {profile.website}
                  </a>
                )}
                <Badge
                  variant="secondary"
                  className="mt-2 bg-primary/10 text-primary border-0 text-xs"
                >
                  {profile.sex === "MALE" ? "Hombre" : "Mujer"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleFollow} variant={following ? "outline" : "default"}>
                  {following ? 'Siguiendo' : 'Seguir'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem onClick={handleReport} className="cursor-pointer">
                      Reportar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock} className="cursor-pointer text-destructive">
                      Bloquear
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-foreground">
                {profile.totalPosts}
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
                {profile.photos?.length || 0}
              </span>
              <span className="text-xs text-muted-foreground">Fotos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {profile.photos && profile.photos.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Camera className="h-4 w-4" /> Fotos
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {profile.photos.map((photo) => (
              <div
                key={photo.photoId}
                className="aspect-square overflow-hidden rounded-lg cursor-pointer"
                onClick={() => setViewPhotoUrl(photo.url)}
              >
                <img
                  src={photo.url}
                  alt="Foto"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.interests && profile.interests.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Intereses</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, index) => {
              const name = typeof interest === 'string' ? interest : interest.name
              const id = typeof interest === 'string' ? interest : (interest.interestId || interest.id || index)
              return (
                <span key={id} className="px-3 py-1.5 rounded-full bg-muted/20 border border-primary/30 text-xs text-foreground">
                  {name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {profile.posts && profile.posts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Newspaper className="h-4 w-4" /> Posts
          </h2>
          <div>
            {profile.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      <Dialog open={!!viewPhotoUrl} onOpenChange={() => setViewPhotoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 bg-black border-0">
          <img
            src={viewPhotoUrl || ''}
            alt="Vista completa"
            className="w-full h-auto max-h-[90vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
