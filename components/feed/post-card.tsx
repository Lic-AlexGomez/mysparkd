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
} from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { CommentsSheet } from "./comments-sheet"

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  onUpdate?: () => void
}

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { user } = useAuth()
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const isOwn = user?.userId === post.userId

  const toggleLike = async () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
    try {
      await api.post(`/api/likes/toggle?targetId=${post.id}`)
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

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <>
      <article className="border-b border-border bg-card p-4">
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
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {post.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {post.username}
              </p>
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
              className={`h-5 w-5 transition-colors ${
                liked
                  ? "fill-secondary text-secondary"
                  : "text-muted-foreground hover:text-secondary"
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
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount}</span>
          </button>
        </div>
      </article>

      <CommentsSheet
        postId={post.id}
        open={showComments}
        onOpenChange={setShowComments}
      />
    </>
  )
}
