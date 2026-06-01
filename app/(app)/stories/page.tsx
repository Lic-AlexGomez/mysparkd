"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { StoryGroup, StoryResponse, StoryAudience } from "@/lib/types"
import { toast } from "sonner"
import { uploadMediaToCloudinary } from "@/lib/cloudinary"
import { storyService } from "@/lib/services/story"
import { useI18n } from "@/lib/i18n"
import { StoriesViewer } from "@/components/stories/stories-viewer"

const STORY_DURATION_MS = 5000

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
  const { te, t } = useI18n()
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
  const [audience, setAudience] = useState<StoryAudience>("PUBLIC")
  const [paused, setPaused] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const progressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [viewers, setViewers] = useState<StoryViewer[]>([])
  const [reactions, setReactions] = useState<StoryReaction[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [storyViewCounts, setStoryViewCounts] = useState<Record<string, number>>({})
  const [closing, setClosing] = useState(false)

  const currentGroup = groups[activeGroupIndex]
  const currentStory: StoryResponse | undefined = currentGroup?.stories[activeStoryIndex]
  const isOwnStory = currentGroup?.userId?.toString() === user?.userId?.toString()

  const reactionEmoji: Record<string, string> = {
    LOVE: "❤️",
    LIKE: "👍",
    LAUGH: "😂",
    WOW: "😮",
    SAD: "😢",
    FIRE: "🔥",
  }

  const clearProgressTimer = useCallback(() => {
    if (progressRef.current) {
      clearTimeout(progressRef.current)
      progressRef.current = null
    }
  }, [])

  const markViewed = useCallback(async (storyId: string) => {
    try {
      await api.post(`/api/stories/${storyId}/view`)
    } catch {
      /* ignore */
    }
  }, [])

  const closeStories = useCallback(() => {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => router.back(), 200)
  }, [closing, router])

  const advanceStory = useCallback(() => {
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
    } else {
      closeStories()
    }
  }, [activeGroupIndex, activeStoryIndex, groups, markViewed, closeStories])

  const goBack = useCallback(() => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1)
    } else if (activeGroupIndex > 0) {
      const prevGroup = activeGroupIndex - 1
      setActiveGroupIndex(prevGroup)
      setActiveStoryIndex(groups[prevGroup].stories.length - 1)
    }
  }, [activeGroupIndex, activeStoryIndex, groups])

  const scheduleAdvance = useCallback(() => {
    clearProgressTimer()
    if (paused || showInsights || showComposer || !currentStory) return
    progressRef.current = setTimeout(() => advanceStory(), STORY_DURATION_MS)
  }, [
    advanceStory,
    clearProgressTimer,
    currentStory,
    paused,
    showInsights,
    showComposer,
  ])

  async function fetchStories(userIdFilter?: string) {
    setIsLoading(true)
    setLoadError(null)
    try {
      let safeData: StoryGroup[] = []
      if (userIdFilter) {
        try {
          safeData = await storyService.getUserStories(userIdFilter)
        } catch {
          setLoadError(
            te(
              "No se pudieron cargar stories de este perfil.",
              "Could not load this profile's stories."
            )
          )
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

  useEffect(() => {
    void fetchStories(targetUserId || undefined)
  }, [targetUserId])

  useEffect(() => {
    if (searchParams.get("compose") === "1") setShowComposer(true)
  }, [searchParams])

  useEffect(() => {
    scheduleAdvance()
    return clearProgressTimer
  }, [activeGroupIndex, activeStoryIndex, groups.length, scheduleAdvance, clearProgressTimer])

  useEffect(() => {
    if (!currentStory?.id) return

    let cancelled = false
    const storyId = currentStory.id

    void storyService.getViewCount(storyId).then((count) => {
      if (!cancelled) setStoryViewCounts((prev) => ({ ...prev, [storyId]: count }))
    }).catch(() => {
      if (!cancelled && typeof currentStory.viewCount === "number") {
        setStoryViewCounts((prev) => ({ ...prev, [storyId]: currentStory.viewCount }))
      }
    })

    return () => {
      cancelled = true
    }
  }, [currentStory?.id, currentStory?.viewCount])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeStories()
      if (e.key === "ArrowRight") advanceStory()
      if (e.key === "ArrowLeft") goBack()
      if (e.key === " ") {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [advanceStory, closeStories, goBack])

  const fetchInsights = async (storyId: string) => {
    setInsightsLoading(true)
    setShowInsights(true)
    setPaused(true)
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

  const handleDeleteStory = async () => {
    if (!currentStory?.id) return
    try {
      await api.delete(`/api/stories/${currentStory.id}`)
      toast.success(te("Story eliminada", "Story deleted"))
      setShowInsights(false)
      setPaused(false)
      fetchStories(targetUserId || undefined)
    } catch {
      toast.error(te("Error al eliminar", "Error deleting"))
    }
  }

  const handleReactStory = async (emoji: string) => {
    if (!currentStory?.id) return
    const reactionMap: Record<string, string> = {
      "❤️": "LOVE",
      "👍": "LIKE",
      "😂": "LAUGH",
      "😮": "WOW",
      "😢": "SAD",
      "🔥": "FIRE",
    }
    const reactionType = reactionMap[emoji]
    if (!reactionType) return
    try {
      await api.post(`/api/stories/${currentStory.id}/react?reaction=${reactionType}`)
    } catch {
      toast.error(te("Error al reaccionar", "Error reacting"))
    }
  }

  const switchGroup = (index: number) => {
    setActiveGroupIndex(index)
    setActiveStoryIndex(0)
    setShowInsights(false)
    const g = groups[index]
    if (g?.stories?.[0]) markViewed(g.stories[0].id)
  }

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const { url: mediaUrl } = await uploadMediaToCloudinary(file)
      const mediaType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE"
      await api.post("/api/stories", { mediaUrl, audience, mediaType })
      toast.success(te("Story publicada", "Story published"))
      setShowComposer(false)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    )
  }

  return (
    <StoriesViewer
      groups={groups}
      activeGroupIndex={activeGroupIndex}
      activeStoryIndex={activeStoryIndex}
      currentStory={currentStory}
      currentGroup={currentGroup}
      isOwnStory={isOwnStory}
      viewerUserId={user?.userId}
      viewCount={currentViewCount}
      paused={paused}
      isLoadingInsights={insightsLoading}
      showInsights={showInsights}
      insights={{ viewers, reactions }}
      showComposer={showComposer}
      isUploading={isUploading}
      audience={audience}
      loadError={loadError}
      isTargetFilter={isTargetFilterEnabled}
      reactionEmoji={reactionEmoji}
      te={te}
      t={t}
      onClose={closeStories}
      onPause={setPaused}
      onBack={goBack}
      onNext={advanceStory}
      onOpenInsights={() => currentStory && fetchInsights(currentStory.id)}
      onCloseInsights={() => {
        setShowInsights(false)
        setPaused(false)
      }}
      onDelete={handleDeleteStory}
      onReact={handleReactStory}
      onAudienceChange={setAudience}
      onToggleComposer={() => setShowComposer((v) => !v)}
      onUpload={handleUpload}
      onReload={() => fetchStories(targetUserId || undefined)}
      onViewAll={() => router.push("/stories")}
      onSwitchGroup={switchGroup}
    />
  )
}
