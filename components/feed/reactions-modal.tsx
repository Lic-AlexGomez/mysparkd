"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ReactionType } from "@/lib/types"
import { getReactionEmoji } from "./reaction-picker"
import { api } from "@/lib/api"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { profileHref } from "@/lib/profile-route"

interface ReactionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
}

interface ReactorUser {
  userId: string
  username: string
  profilePictureUrl?: string
  reactionType: ReactionType
}

export function ReactionsModal({ open, onOpenChange, postId }: ReactionsModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<ReactorUser[]>([])
  const [activeTab, setActiveTab] = useState<'all' | ReactionType>('all')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get<ReactorUser[]>(`/api/reactions/users/${postId}`)
      .then(data => setReactions(Array.isArray(data) ? data : []))
      .catch(() => setReactions([]))
      .finally(() => setLoading(false))
  }, [open, postId])

  const filteredReactions = activeTab === 'all' 
    ? reactions 
    : reactions.filter(r => r.reactionType === activeTab)

  const reactionCounts = reactions.reduce((acc, r) => {
    acc[r.reactionType] = (acc[r.reactionType] || 0) + 1
    return acc
  }, {} as Record<ReactionType, number>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Reacciones</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">
              Todas {reactions.length > 0 && `(${reactions.length})`}
            </TabsTrigger>
            {(['LOVE', 'LAUGH', 'WOW', 'SAD', 'FIRE', 'LIKE'] as ReactionType[]).map((type) => {
              const count = reactionCounts[type] || 0
              if (count === 0) return null
              return (
                <TabsTrigger key={type} value={type}>
                  {getReactionEmoji(type)} {count}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : filteredReactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay reacciones aún
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredReactions.map((reactor) => (
                  <Link
                    key={reactor.userId}
                    href={profileHref(reactor.userId, user?.userId)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => onOpenChange(false)}
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage src={reactor.profilePictureUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {reactor.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {reactor.username}
                      </p>
                    </div>
                    <span className="text-xl">
                      {getReactionEmoji(reactor.reactionType)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
