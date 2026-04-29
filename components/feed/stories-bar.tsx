"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { StoryGroup } from "@/lib/types"
import { useI18n } from "@/lib/i18n"

export function StoriesBar() {
  const { t } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const [groups, setGroups] = useState<StoryGroup[]>([])

  useEffect(() => {
    api.get<StoryGroup[]>("/api/stories/feed")
      .then(data => {
        const safe = Array.isArray(data) ? data : []
        setGroups(safe)
      })
      .catch(() => setGroups([]))
  }, [user?.userId])

  // Siempre mostrar el propio usuario primero
  const ownPhoto = user?.profilePictureUrl || user?.photos?.find((p: any) => p.isPrimary || p.primary)?.url
  const ownGroup = groups.find(g => g.userId?.toString().toLowerCase() === user?.userId?.toString().toLowerCase())
  const otherGroups = groups.filter(g => g.userId?.toString().toLowerCase() !== user?.userId?.toString().toLowerCase())

  return (
    <div className="border-b border-border py-4">
      <div className="flex gap-4 overflow-x-auto px-4 scrollbar-hide">

        {/* Own story */}
        <button
          onClick={() => router.push('/stories')}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div className="relative">
            <div className={`rounded-full p-0.5 ${ownGroup ? 'bg-gradient-to-tr from-primary to-secondary' : 'bg-muted'}`}>
              <div className="bg-card rounded-full p-0.5">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={ownGroup?.stories?.[ownGroup.stories.length - 1]?.mediaUrl || ownPhoto} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.nombres?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-card">
              <Plus className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <span className="text-xs text-foreground font-medium truncate max-w-[70px]">{t("storiesBar.yourStory")}</span>
        </button>

        {/* Stories de otros */}
        {otherGroups.map((group) => (
          <button
            key={group.userId}
            onClick={() => router.push(`/stories?targetUserId=${encodeURIComponent(group.userId)}`)}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="relative">
              <div className={`rounded-full p-0.5 ${group.hasUnread ? 'bg-gradient-to-tr from-primary to-secondary' : 'bg-muted'}`}>
                <div className="bg-card rounded-full p-0.5">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={group.profilePictureUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {group.username?.[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
            <span className="text-xs text-foreground font-medium truncate max-w-[70px]">{group.username}</span>
          </button>
        ))}

      </div>
    </div>
  )
}
