"use client"

import { useState } from "react"
import Link from "next/link"
import type { Post } from "@/lib/types"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  onUpdate?: () => void
}

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth()
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(false)
  const [repostCount, setRepostCount] = useState(post.repostCount || 0)
  const [reposted, setReposted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const isOwn = user?.userId === post.userId
  
  const reputation = post.reputation || 75
  const reputationColor = reputationService.getReputationColor(reputation)

  const toggleLike = async () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    try {
      await api.post(`/api/likes/toggle?targetId=${post.id}`)
      if (!liked && post.userId !== user?.userId) {
        const { notificationService } = await import('@/lib/services/notification')
        notificationService.create(post.userId, 'like', `${user?.nombres || 'Alguien'} le gustó tu post`, user?.userId)
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

  const handleRepost = (comment: string) => {
    setReposted(true)
    setRepostCount(prev => prev + 1)
    toast.success('Post reposteado')
  }

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <>
      <article className="border border-border bg-card p-4 rounded-2xl mb-3 hover:border-primary/30 transition-colors">
        {/* Locked overlay */}
        {post.locked && !post.unlocked && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Contenido premium</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <Link
            href={isOwn ? "/profile" : `/profile/${post.userId}`}
            className="flex items-center gap-3"
          >
            <Avatar className="h-10 w-10 border-2 border-primary ring-2 ring-primary/20">
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
                  <DropdownMenuItem onClick={handleBookmark} className="cursor-pointer">
                    {bookmarked ? '✓ Guardado' : 'Guardar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleReport} className="cursor-pointer text-destructive">
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
                  <DropdownMenuItem className="cursor-pointer">
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
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {post.body}
          </p>
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

        {/* Actions */}
        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={toggleLike}
            className="flex items-center gap-1.5 text-sm transition-colors"
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                liked
                  ? "fill-secondary text-secondary drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]"
                  : "text-muted-foreground hover:text-secondary hover:scale-110"
              }`}
            />
            <span
              className={liked ? "text-secondary" : "text-muted-foreground"}
            >
              {likeCount}
            </span>
          </button>
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
          <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </article>

      <CommentsSheet
        postId={post.id}
        open={showComments}
        onOpenChange={setShowComments}
      />
      <RepostModal
        open={showRepostModal}
        onOpenChange={setShowRepostModal}
        onRepost={handleRepost}
      />
    </>
  )
}
