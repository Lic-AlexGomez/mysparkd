"use client"

import { useState } from "react"
import Link from "next/link"
import type { Post, ReactionType } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Clock,
  Repeat2,
  Share2,
  Bookmark,
  Flag,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { reputationService } from "@/lib/services/reputation"
import { bookmarkService } from "@/lib/services/bookmark"
import { reportService } from "@/lib/services/report"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CommentsSheet } from "./comments-sheet"
import { RepostModal } from "./repost-modal"
import { ReactionPicker, getReactionEmoji } from "./reaction-picker"
import { ReactionsModal } from "./reactions-modal"
import { ShareModal } from "./share-modal"
import { UnlockPostModal } from "./unlock-post-modal"
import { parseTextWithLinks } from "@/lib/utils/text-parser"
import { PollComponent } from "./poll-component"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  onUpdate?: () => void
  highlight?: boolean
}

export function PostCard({ post, onDelete, onUpdate, highlight }: PostCardProps) {
  const { user } = useAuth()
  const features = useFeatureFlags()
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(post.liked || false)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(post.userReaction || null)
  const [reactionCounts, setReactionCounts] = useState(post.reactions || {})
  const [repostCount, setRepostCount] = useState(post.repostCount || 0)
  const [reposted, setReposted] = useState(false)
  const [bookmarked, setBookmarked] = useState(() => {
    if (user?.userId) {
      return bookmarkService.getBookmarkedPosts(user.userId).includes(post.id)
    }
    return false
  })
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBody, setEditedBody] = useState(post.body)
  const [isSaving, setIsSaving] = useState(false)
  const isOwn = user?.userId === post.userId
  const reputation = post.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)

  const handleReaction = async (type: ReactionType) => {
    const prevReaction = userReaction
    const prevCounts = { ...reactionCounts }
    
    // Optimistic update
    if (prevReaction === type) {
      // Remove reaction
      setUserReaction(null)
      setReactionCounts(prev => {
        const updated = { ...prev }
        if (updated[type]) {
          updated[type] = { ...updated[type], count: updated[type].count - 1 }
          if (updated[type].count === 0) delete updated[type]
        }
        return updated
      })
    } else {
      // Add or change reaction
      setUserReaction(type)
      setReactionCounts(prev => {
        const updated = { ...prev }
        // Remove old reaction
        if (prevReaction && updated[prevReaction]) {
          updated[prevReaction] = { ...updated[prevReaction], count: updated[prevReaction].count - 1 }
          if (updated[prevReaction].count === 0) delete updated[prevReaction]
        }
        // Add new reaction
        updated[type] = {
          type,
          count: (updated[type]?.count || 0) + 1,
          userReacted: true
        }
        return updated
      })
    }

    try {
      // TODO: Implementar endpoint de reacciones en backend
      // await api.post(`/api/reactions/toggle`, { targetId: post.id, type })
      if (prevReaction !== type && post.userId !== user?.userId) {
        const { createNotification } = await import('@/lib/utils/notifications')
        await createNotification(post.userId, 'reaction', `${user?.nombres || 'Alguien'} reaccionó a tu post`, user?.userId)
      }
    } catch {
      // Revert on error
      setUserReaction(prevReaction)
      setReactionCounts(prevCounts)
      toast.error("Error al reaccionar")
    }
  }

  const toggleLike = async () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    try {
      await api.post(`/api/likes/toggle?targetId=${post.id}`)
      if (!liked && post.userId !== user?.userId) {
        const { createNotification } = await import('@/lib/utils/notifications')
        await createNotification(post.userId, 'like', `${user?.nombres || 'Alguien'} le gustó tu post`, user?.userId)
      }
    } catch {
      setLiked(!liked)
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1))
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/api/posts/delete/${post.id}`)
      toast.success("Post eliminado")
      onDelete?.(post.id)
    } catch {
      toast.error("Error al eliminar post")
    }
  }

  const handleBookmark = () => {
    if (user?.userId) {
      const isBookmarked = bookmarkService.toggleBookmark(user.userId, post.id)
      setBookmarked(isBookmarked)
      toast.success(isBookmarked ? 'Post guardado' : 'Post removido')
      setShowMenu(false)
      if (!isBookmarked) {
        onDelete?.(post.id)
      }
    }
  }

  const handleReport = () => {
    if (user?.userId) {
      const reason = prompt('Motivo del reporte (mínimo 10 caracteres):')
      if (reason && reason.length >= 10) {
        reportService.createReport(user.userId, post.id, 'post', reason)
        toast.success('Reporte enviado')
        setShowMenu(false)
      } else if (reason) {
        toast.error('El motivo debe tener al menos 10 caracteres')
      }
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleSaveEdit = async () => {
    if (!editedBody.trim() || editedBody.trim().length < 10) {
      toast.error("El contenido debe tener al menos 10 caracteres")
      return
    }
    setIsSaving(true)
    try {
      await api.put(`/api/posts/update/${post.id}`, { body: editedBody.trim() })
      toast.success("Post actualizado")
      setIsEditing(false)
      onUpdate?.()
    } catch {
      toast.error("Error al actualizar post")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedBody(post.body)
    setIsEditing(false)
  }

  const handleRepost = (comment: string) => {
    // TODO: Implementar endpoint de repost en el backend
    // await api.post(`/api/posts/repost/${post.id}`, { comment })
    setReposted(true)
    setRepostCount(prev => prev + 1)
    toast.success('Repost guardado localmente (pendiente implementación en backend)')
  }

  const handlePollVote = async (optionId: string) => {
    try {
      // TODO: Implementar endpoint de votación
      // await api.post(`/api/polls/vote`, { pollId: post.poll?.id, optionId })
      toast.success('Voto registrado (pendiente backend)')
    } catch {
      toast.error('Error al votar')
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <>
      <article 
        id={`post-${post.id}`}
        className={`border border-border bg-card p-4 rounded-2xl mb-3 hover:border-primary/30 transition-colors ${
          highlight ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
        }`}
      >
        {/* Locked overlay */}
        {post.locked && !post.unlocked && (
          <div 
            onClick={() => setShowUnlockModal(true)}
            className="mb-3 flex items-center justify-between rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 px-4 py-3 cursor-pointer hover:from-primary/20 hover:to-secondary/20 transition-all"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Contenido Premium Bloqueado</span>
            </div>
            <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Desbloquear
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <Link
            href={`/profile/${post.userId}`}
            className="flex items-center gap-3"
          >
            <Avatar className="h-10 w-10 border-2 border-primary ring-2 ring-primary/20">
              <AvatarImage src={post.userPhoto} alt={post.username} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {post.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {post.username}
                </p>
                <Badge 
                  className="px-1.5 py-0 text-[10px] font-bold text-black border-0" 
                  style={{ backgroundColor: reputationColor }}
                >
                  {reputation}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {!post.permanent && (
              <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                <Clock className="h-3 w-3" />
                Temporal
              </span>
            )}
            {!isOwn && (
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer flex items-center gap-2">
                    <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                    {bookmarked ? 'Quitar guardado' : 'Guardar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Reportar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Opciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border-border"
                >
                  <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="mt-3">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full min-h-24 p-2 text-sm bg-muted border border-border rounded-lg text-foreground resize-none"
                maxLength={500}
              />
              <span className="text-xs text-muted-foreground text-right">
                {editedBody.length}/500 {editedBody.length < 10 && editedBody.length > 0 && '(mínimo 10)'}
              </span>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="border-border text-foreground"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editedBody.trim() || editedBody.trim().length < 10}
                  className="bg-primary text-primary-foreground"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {features.hashtagsAndMentions ? parseTextWithLinks(post.body) : post.body}
            </p>
          )}
        </div>

        {/* Image */}
        {post.file && (
          <div className="mt-3 overflow-hidden rounded-xl">
            <img
              src={post.file}
              alt="Post media"
              className="w-full object-cover max-h-96"
              loading="lazy"
            />
          </div>
        )}

        {/* Poll */}
        {features.polls && post.poll && (
          <PollComponent poll={post.poll} onVote={handlePollVote} />
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-4">
          {features.multipleReactions ? (
            <ReactionPicker onReact={handleReaction}>
            <button
              className="flex items-center gap-1.5 text-sm transition-colors group"
            >
              {userReaction ? (
                <span className="text-xl group-hover:scale-125 transition-transform">
                  {getReactionEmoji(userReaction)}
                </span>
              ) : (
                <Heart
                  className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:scale-110 transition-all"
                />
              )}
              {Object.values(reactionCounts).reduce((sum, r) => sum + r.count, 0) > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowReactionsModal(true)
                  }}
                  className="text-muted-foreground hover:underline"
                >
                  {Object.values(reactionCounts).reduce((sum, r) => sum + r.count, 0)}
                </button>
              )}
            </button>
          </ReactionPicker>
          ) : (
            <button
              onClick={toggleLike}
              className="flex items-center gap-1.5 text-sm transition-colors group"
            >
              <Heart
                className={`h-5 w-5 transition-all ${
                  liked
                    ? "fill-secondary text-secondary"
                    : "text-muted-foreground group-hover:text-secondary group-hover:scale-110"
                }`}
              />
              <span className={liked ? "text-secondary" : "text-muted-foreground"}>
                {likeCount}
              </span>
            </button>
          )}
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-5 w-5 hover:text-primary hover:scale-110 transition-all" />
            <span>{post.commentsCount}</span>
          </button>
          <button
            onClick={() => setShowRepostModal(true)}
            className="flex items-center gap-1.5 text-sm transition-all"
          >
            <Repeat2
              className={`h-5 w-5 transition-all ${
                reposted
                  ? "text-primary drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]"
                  : "text-muted-foreground hover:text-primary hover:scale-110"
              }`}
            />
            <span className={reposted ? "text-primary" : "text-muted-foreground"}>
              {repostCount}
            </span>
          </button>
          {features.shareWithQR && (
            <button onClick={handleShare} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </article>

      <CommentsSheet
        postId={post.id}
        open={showComments}
        onOpenChange={setShowComments}
        onUpdate={onUpdate}
      />
      <RepostModal
        open={showRepostModal}
        onOpenChange={setShowRepostModal}
        onRepost={handleRepost}
      />
      <ReactionsModal
        open={showReactionsModal}
        onOpenChange={setShowReactionsModal}
        postId={post.id}
      />
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        postId={post.id}
        postContent={post.body}
        username={post.username}
      />
      <UnlockPostModal
        postId={post.id}
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlocked={onUpdate || (() => {})}
      />
    </>
  )
}
