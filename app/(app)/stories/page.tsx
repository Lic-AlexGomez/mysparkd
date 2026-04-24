"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { StoryGroup, StoryResponse, StoryAudience } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Plus, Eye } from "lucide-react"
import { toast } from "sonner"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StoriesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [groups, setGroups] = useState<StoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [audience, setAudience] = useState<StoryAudience>('PUBLIC')
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchFeed()
  }, [])

  // Auto-avanzar story cada 5s
  useEffect(() => {
    if (groups.length === 0) return
    if (progressRef.current) clearTimeout(progressRef.current)
    progressRef.current = setTimeout(() => advanceStory(), 5000)
    return () => { if (progressRef.current) clearTimeout(progressRef.current) }
  }, [activeGroupIndex, activeStoryIndex, groups.length])

  const fetchFeed = async () => {
    setIsLoading(true)
    try {
      const data = await api.get<StoryGroup[]>("/api/stories/feed")
      const safeData = Array.isArray(data) ? data : []
      setGroups(safeData)
      setActiveGroupIndex(0)
      setActiveStoryIndex(0)
      if (safeData.length > 0 && safeData[0].stories?.length > 0) {
        markViewed(safeData[0].stories[0].id)
      }
    } catch (e) {
      console.error('[stories] fetchFeed error:', e)
      toast.error("Error al cargar stories")
    } finally {
      setIsLoading(false)
    }
  }

  const markViewed = async (storyId: string) => {
    try { await api.post(`/api/stories/${storyId}/view`) } catch {}
  }

  const handleDeleteStory = async (storyId: string) => {
    try {
      await api.delete(`/api/stories/${storyId}`)
      toast.success('Story eliminada')
      fetchFeed()
    } catch {
      toast.error('Error al eliminar')
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
      toast.success('Reacción enviada')
    } catch {
      toast.error('Error al reaccionar')
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
    const group = groups[activeGroupIndex]
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
      toast.success("Story publicada")
      fetchFeed()
    } catch {
      toast.error("Error al publicar story")
    } finally {
      setIsUploading(false)
    }
  }

  const currentGroup = groups[activeGroupIndex]
  const currentStory: StoryResponse | undefined = currentGroup?.stories[activeStoryIndex]

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
                <div
                  className={`h-full bg-white rounded-full transition-all ${
                    i < activeStoryIndex ? 'w-full' : i === activeStoryIndex ? 'animate-progress' : 'w-0'
                  }`}
                />
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
                {currentStory?.viewCount !== undefined && (
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {currentStory.viewCount}
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
            <video
              key={currentStory.id}
              src={currentStory.mediaUrl}
              autoPlay
              muted
              className="max-h-full max-w-full object-contain"
              onEnded={advanceStory}
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt="Story"
              className="max-h-full max-w-full object-contain"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/60 text-sm">No hay stories disponibles</p>
            <Button variant="outline" size="sm" onClick={fetchFeed} className="text-white border-white/30 hover:bg-white/10">
              Recargar
            </Button>
          </div>
        )}

        {/* Caption */}
        {currentStory?.caption && (
          <div className="absolute bottom-32 left-0 right-0 px-4">
            <p className="text-white text-sm text-center bg-black/40 rounded-lg px-3 py-2">{currentStory.caption}</p>
          </div>
        )}

        {/* Acciones: eliminar (si es propia) + reaccionar */}
        <div className="absolute bottom-36 right-4 z-20 flex flex-col gap-2">
          {currentStory && currentGroup?.userId === user?.userId && (
            <button
              onClick={() => handleDeleteStory(currentStory.id)}
              className="h-10 w-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {currentStory && currentGroup?.userId !== user?.userId && (
            <div className="flex flex-col gap-1">
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
        </div>

        {/* Navigation tap zones */}
        <button className="absolute left-0 top-16 bottom-32 w-1/3 z-10" onClick={goBack} />
        <button className="absolute right-0 top-16 bottom-32 w-1/3 z-10" onClick={advanceStory} />

        {/* Group thumbnails */}
        {groups.length > 1 && (
          <div className="absolute top-20 left-0 right-0 z-10 flex gap-2 px-4 overflow-x-auto">
            {groups.map((g, i) => (
              <button
                key={g.userId}
                onClick={() => { setActiveGroupIndex(i); setActiveStoryIndex(0) }}
                className={`flex-shrink-0 rounded-full border-2 transition-all ${
                  i === activeGroupIndex ? 'border-white scale-110' : g.hasUnread ? 'border-primary' : 'border-white/30'
                }`}
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
                <SelectItem value="PUBLIC">🌍 Público</SelectItem>
                <SelectItem value="SPARKLING_LIST">✨ Sparkling List</SelectItem>
              </SelectContent>
          </Select>
          <Button
            onClick={() => document.getElementById('story-upload')?.click()}
            disabled={isUploading}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-5 w-5 mr-2" />
            {isUploading ? "Subiendo..." : "Crear Story"}
          </Button>
        </div>
      </div>
    </div>
  )
}
