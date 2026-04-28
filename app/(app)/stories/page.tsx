"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { StoryGroup, StoryResponse, StoryAudience } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Plus, Eye, Heart } from "lucide-react"
import { toast } from "sonner"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { storyService } from "@/lib/services/story"
import { useI18n } from "@/lib/i18n"

interface StoryViewer {
  userId: string
  username: string
  profilePictureUrl?: string
  viewedAt: string
}

interface StoryReaction {
  userId: string
  username: string
  profilePictureUrl?: string
  reaction: string
}

export default function StoriesPage() {
  const { te } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const targetUserId = searchParams.get("targetUserId")?.trim() || ""
  const isTargetFilterEnabled = targetUserId.length > 0
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [audience, setAudience] = useState<StoryAudience>('PUBLIC')
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [viewers, setViewers] = useState<StoryViewer[]>([])
  const [reactions, setReactions] = useState<StoryReaction[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [storyViewCounts, setStoryViewCounts] = useState<Record<string, number>>({})
  const currentGroup = groups[activeGroupIndex]
  const currentStory: StoryResponse | undefined = currentGroup?.stories[activeStoryIndex]
  const isOwnStory = currentGroup?.userId?.toString() === user?.userId?.toString()

  const reactionEmoji: Record<string, string> = {
    LOVE: '❤️', LIKE: '👍', LAUGH: '😂', WOW: '😮', SAD: '😢', FIRE: '🔥'
  }

  useEffect(() => {
    void fetchStories(targetUserId || undefined)
  }, [targetUserId])

  useEffect(() => {
    if (groups.length === 0) return
    if (progressRef.current) clearTimeout(progressRef.current)
    if (!showInsights) {
      progressRef.current = setTimeout(() => advanceStory(), 5000)
    }
    return () => { if (progressRef.current) clearTimeout(progressRef.current) }
  }, [activeGroupIndex, activeStoryIndex, groups.length, showInsights])

  useEffect(() => {
    if (!currentStory?.id) return

    let cancelled = false
    const storyId = currentStory.id

    const loadViewCount = async () => {
      try {
        const count = await storyService.getViewCount(storyId)
        if (!cancelled) {
          setStoryViewCounts((prev) => ({ ...prev, [storyId]: count }))
        }
      } catch {
        if (!cancelled && typeof currentStory.viewCount === 'number') {
          setStoryViewCounts((prev) => ({ ...prev, [storyId]: currentStory.viewCount }))
        }
      }
    }

    void loadViewCount()
    return () => {
      cancelled = true
    }
  }, [currentStory?.id, currentStory?.viewCount])

  async function fetchStories(userIdFilter?: string) {
    setIsLoading(true)
    setLoadError(null)
    try {
      let safeData: StoryGroup[] = []
      if (userIdFilter) {
        try {
          safeData = await storyService.getUserStories(userIdFilter)
        } catch {
          setLoadError(te("No se pudieron cargar stories de este perfil. Mostrando feed general.", "Could not load this profile's stories. Showing general feed."))
          safeData = await storyService.getFeed()
        }
      } else {
        safeData = await storyService.getFeed()
      }

      setGroups(safeData)
      setActiveGroupIndex(0)
      setActiveStoryIndex(0)
      if (safeData.length > 0 && safeData[0].stories?.length > 0) {
        markViewed(safeData[0].stories[0].id)
      }
    } catch {
      setGroups([])
      setLoadError(te("Error al cargar stories", "Error loading stories"))
      toast.error(te("Error al cargar stories", "Error loading stories"))
    } finally {
      setIsLoading(false)
    }
  }

  const markViewed = async (storyId: string) => {
    try { await api.post(`/api/stories/${storyId}/view`) } catch {}
  }

  const fetchInsights = async (storyId: string) => {
    setInsightsLoading(true)
    setShowInsights(true)
    try {
      const [viewersData, reactionsData] = await Promise.all([
        api.get<StoryViewer[]>(`/api/stories/${storyId}/viewers`).catch(() => []),
        api.get<StoryReaction[]>(`/api/stories/${storyId}/reactions`).catch(() => []),
      ])
      setViewers(viewersData || [])
      setReactions(reactionsData || [])
    } catch {
      toast.error(te("Error al cargar estadísticas", "Error loading stats"))
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleDeleteStory = async (storyId: string) => {
    try {
      await api.delete(`/api/stories/${storyId}`)
      toast.success(te('Story eliminada', 'Story deleted'))
      setShowInsights(false)
      fetchStories(targetUserId || undefined)
    } catch {
      toast.error(te('Error al eliminar', 'Error deleting'))
    }
  }

  const handleReactStory = async (storyId: string, reaction: string) => {
    const reactionMap: Record<string, string> = {
      '❤️': 'LOVE', '👍': 'LIKE', '😂': 'LAUGH', '😮': 'WOW', '😢': 'SAD', '🔥': 'FIRE'
    }
    const reactionType = reactionMap[reaction]
    if (!reactionType) return
    try {
      await api.post(`/api/stories/${storyId}/react?reaction=${reactionType}`)
      toast.success(te('Reacción enviada', 'Reaction sent'))
    } catch {
      toast.error(te('Error al reaccionar', 'Error reacting'))
    }
  }

  const advanceStory = () => {
    const group = groups[activeGroupIndex]
    if (!group) return
    if (activeStoryIndex < group.stories.length - 1) {
      const next = activeStoryIndex + 1
      setActiveStoryIndex(next)
      markViewed(group.stories[next].id)
    } else if (activeGroupIndex < groups.length - 1) {
      const nextGroup = activeGroupIndex + 1
      setActiveGroupIndex(nextGroup)
      setActiveStoryIndex(0)
      markViewed(groups[nextGroup].stories[0].id)
    }
  }

  const goBack = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1)
    } else if (activeGroupIndex > 0) {
      const prevGroup = activeGroupIndex - 1
      setActiveGroupIndex(prevGroup)
      setActiveStoryIndex(groups[prevGroup].stories.length - 1)
    }
  }

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const mediaUrl = await uploadToCloudinary(file)
      const mediaType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
      await api.post("/api/stories", { mediaUrl, audience, mediaType })
      toast.success(te("Story publicada", "Story published"))
      fetchStories(targetUserId || undefined)
    } catch {
      toast.error(te("Error al publicar story", "Error publishing story"))
    } finally {
      setIsUploading(false)
    }
  }

  const currentViewCount = currentStory
    ? storyViewCounts[currentStory.id] ?? currentStory.viewCount ?? 0
    : 0

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex items-center justify-center">

        {/* Progress bars */}
        {currentGroup && (
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {currentGroup.stories.map((s, i) => (
              <div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className={`h-full bg-white rounded-full transition-all ${i < activeStoryIndex ? 'w-full' : i === activeStoryIndex ? 'animate-progress' : 'w-0'}`} />
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-30 px-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={currentGroup?.profilePictureUrl} />
                <AvatarFallback>{currentGroup?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold">{currentGroup?.username}</p>
                {isOwnStory && currentStory && (
                  <button
                    onClick={() => fetchInsights(currentStory.id)}
                    className="text-white/70 text-xs flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Eye className="h-3 w-3" /> {currentViewCount} {te("vistas", "views")}
                  </button>
                )}
                {!isOwnStory && currentStory?.viewCount !== undefined && (
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {currentViewCount}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Story content */}
        {currentStory ? (
          currentStory.mediaType === 'VIDEO' ? (
            <video key={currentStory.id} src={currentStory.mediaUrl} autoPlay muted className="max-h-full max-w-full object-contain" onEnded={advanceStory} />
          ) : (
            <img key={currentStory.id} src={currentStory.mediaUrl} alt="Story" className="max-h-full max-w-full object-contain" />
          )
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/60 text-sm">
              {isTargetFilterEnabled ? te("Este usuario no tiene stories activas", "This user has no active stories") : te("No hay stories disponibles", "No stories available")}
            </p>
            {loadError && <p className="text-white/50 text-xs text-center max-w-xs">{loadError}</p>}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchStories(targetUserId || undefined)}
                className="text-white border-white/30 hover:bg-white/10"
              >
                {te("Recargar", "Reload")}
              </Button>
              {isTargetFilterEnabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/stories")}
                  className="text-white hover:bg-white/10"
                >
                  {te("Ver feed general", "View general feed")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Caption */}
        {currentStory?.caption && (
          <div className="absolute bottom-32 left-0 right-0 px-4">
            <p className="text-white text-sm text-center bg-black/40 rounded-lg px-3 py-2">{currentStory.caption}</p>
          </div>
        )}

        {/* Acciones story propia */}
        {isOwnStory && currentStory && (
          <div className="absolute bottom-36 right-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => handleDeleteStory(currentStory.id)}
              className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Reacciones story ajena */}
        {!isOwnStory && currentStory && (
          <div className="absolute bottom-36 right-4 z-20 flex flex-col gap-1">
            {['❤️', '👍', '😂', '😮', '🔥'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReactStory(currentStory.id, emoji)}
                className="h-9 w-9 rounded-full bg-black/60 flex items-center justify-center text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Navigation tap zones */}
        <button className="absolute left-0 top-16 bottom-32 w-1/3 z-10" onClick={goBack} />
        <button className="absolute right-0 top-16 bottom-32 w-1/3 z-10" onClick={advanceStory} />

        {/* Group thumbnails */}
        {groups.length > 1 && (
          <div className="absolute top-20 left-0 right-0 z-10 flex gap-2 px-4 overflow-x-auto">
            {groups.map((g, i) => (
              <button
                key={g.userId}
                onClick={() => { setActiveGroupIndex(i); setActiveStoryIndex(0); setShowInsights(false) }}
                className={`flex-shrink-0 rounded-full border-2 transition-all ${i === activeGroupIndex ? 'border-white scale-110' : g.hasUnread ? 'border-primary' : 'border-white/30'}`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={g.profilePictureUrl} />
                  <AvatarFallback>{g.username?.[0]}</AvatarFallback>
                </Avatar>
              </button>
            ))}
          </div>
        )}

        {/* Create story */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
          <input type="file" accept="image/*,video/*" onChange={handleCreateStory} className="hidden" id="story-upload" />
          <Select value={audience} onValueChange={(v) => setAudience(v as StoryAudience)}>
            <SelectTrigger className="w-44 bg-black/60 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">🌍 {te("Público", "Public")}</SelectItem>
              <SelectItem value="SPARKLING_LIST">✨ Sparkling List</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => document.getElementById('story-upload')?.click()} disabled={isUploading} className="bg-primary text-primary-foreground">
            <Plus className="h-5 w-5 mr-2" />
            {isUploading ? te("Subiendo...", "Uploading...") : te("Crear Story", "Create Story")}
          </Button>
        </div>

        {/* Panel de insights (vistas + reacciones) */}
        {showInsights && (
          <div
            className="absolute bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md rounded-t-2xl max-h-[50vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">{te("Estadísticas", "Stats")}</h3>
              <button onClick={() => setShowInsights(false)} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {insightsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="px-4 py-3 space-y-4">
                {/* Reacciones */}
                {reactions.length > 0 && (
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {te("Reacciones", "Reactions")} ({reactions.length})
                    </p>
                    <div className="space-y-2">
                      {reactions.map((r, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={r.profilePictureUrl} />
                            <AvatarFallback className="text-xs bg-white/10 text-white">{r.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm flex-1">{r.username}</span>
                          <span className="text-lg">{reactionEmoji[r.reaction] || r.reaction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vistas */}
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {te("Vistas", "Views")} ({viewers.length})
                  </p>
                  {viewers.length === 0 ? (
                    <p className="text-white/40 text-sm">{te("Nadie ha visto esta story aún", "No one has viewed this story yet")}</p>
                  ) : (
                    <div className="space-y-2">
                      {viewers.map((v, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={v.profilePictureUrl} />
                            <AvatarFallback className="text-xs bg-white/10 text-white">{v.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-white text-sm">{v.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
