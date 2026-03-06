"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFeatureFlags } from "@/lib/utils/feature-flags"

export function StoriesBar() {
  const router = useRouter()
  const { user } = useAuth()
  const features = getFeatureFlags(user?.email)

  if (!features.storiesPage) {
    return null
  }

  const stories = [
    { id: "1", username: "Tu historia", photo: user?.photos?.find(p => p.isPrimary)?.url, isOwn: true },
  ]

  return (
    <div className="bg-card border-b border-border py-4">
      <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => router.push('/stories')}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="relative">
              <div className={`rounded-full p-0.5 ${story.isOwn ? 'bg-gradient-to-tr from-primary to-secondary' : 'bg-gradient-to-tr from-secondary to-primary'}`}>
                <div className="bg-card rounded-full p-0.5">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={story.photo} />
                    <AvatarFallback className="bg-primary/10 text-primary">{story.username[0]}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {story.isOwn && (
                <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
                  <Plus className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <span className="text-xs text-foreground font-medium truncate max-w-[70px]">
              {story.isOwn ? 'Tu historia' : story.username}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
