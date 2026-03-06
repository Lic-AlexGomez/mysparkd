"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ReactionType } from "@/lib/types"
import { getReactionEmoji } from "./reaction-picker"
import Link from "next/link"

interface ReactionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  postId: string
}

interface ReactorUser {
  userId: string
  username: string
  reactionType: ReactionType
}

export function ReactionsModal({ open, onOpenChange, postId }: ReactionsModalProps) {
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<ReactorUser[]>([])
  const [activeTab, setActiveTab] = useState<'all' | ReactionType>('all')

  useEffect(() => {
    if (open) {
      // TODO: Implementar endpoint en backend
      // fetchReactions()
      
      // Mock data para demostración
      setTimeout(() => {
        setReactions([
          { userId: '1', username: 'usuario1', reactionType: 'LOVE' },
          { userId: '2', username: 'usuario2', reactionType: 'HAHA' },
          { userId: '3', username: 'usuario3', reactionType: 'WOW' },
        ])
        setLoading(false)
      }, 500)
    }
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
            {(['LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'] as ReactionType[]).map((type) => {
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
                    href={`/profile/${reactor.userId}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => onOpenChange(false)}
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary">
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
