"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Camera, Newspaper } from "lucide-react"
import { PostCard } from "@/components/feed/post-card"

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.userId as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>(`/api/profile/${userId}`)
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

  const primaryPhoto = profile.photos?.find((p) => p.isPrimary)
  const initials = `${profile.nombres?.[0] || ""}${profile.apellidos?.[0] || ""}`.toUpperCase()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Card className="overflow-hidden border-border bg-card">
        <div className="h-32 bg-gradient-to-r from-secondary/40 via-primary/30 to-secondary/20" />
        <CardContent className="relative px-6 pb-6">
          <div className="-mt-16 mb-4">
            <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
              <AvatarImage src={primaryPhoto?.url} alt={profile.nombres} />
              <AvatarFallback className="bg-primary/20 text-primary text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {profile.nombres} {profile.apellidos}
            </h1>
            <Badge
              variant="secondary"
              className="mt-1 bg-primary/10 text-primary border-0 text-xs"
            >
              {profile.sex === "MALE" ? "Hombre" : "Mujer"}
            </Badge>
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
                className="aspect-square overflow-hidden rounded-lg"
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

      {profile.posts && profile.posts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Newspaper className="h-4 w-4" /> Posts
          </h2>
          <div className="rounded-xl overflow-hidden border border-border">
            {profile.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
