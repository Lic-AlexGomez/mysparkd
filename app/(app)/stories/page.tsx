"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Story } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { toast } from "sonner"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { getFeatureFlags } from "@/lib/utils/feature-flags"

export default function StoriesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const features = getFeatureFlags(user?.email)
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!features.storiesPage) {
      toast.error("Esta funcionalidad no está disponible aún")
      router.push('/feed')
      return
    }
    fetchStories()
  }, [features.storiesPage, router])

  if (!features.storiesPage) {
    return null
  }

  const fetchStories = async () => {
    try {
      const data = await api.get<Story[]>("/api/stories/following")
      setStories(data)
    } catch {
      toast.error("Error al cargar stories")
    }
  }

  const handleCreateStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const mediaUrl = await uploadToCloudinary(file)
      await api.post("/api/stories/create", { mediaUrl })
      toast.success("Story publicada")
      fetchStories()
    } catch {
      toast.error("Error al publicar story")
    } finally {
      setIsUploading(false)
    }
  }

  const currentStory = stories[currentIndex]

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full flex items-center justify-center">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={currentStory?.userPhoto} />
                <AvatarFallback>{currentStory?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold">{currentStory?.username}</p>
                <p className="text-white/80 text-xs">Hace 2h</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Story Content */}
        {currentStory && (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}

        {/* Navigation */}
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentIndex(currentIndex - 1)}
            className="absolute left-4 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
        )}
        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="absolute right-4 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        )}

        {/* Create Story Button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleCreateStory}
            className="hidden"
            id="story-upload"
          />
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
