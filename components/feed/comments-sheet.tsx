"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

import type { Comment as CommentType, CommentReply } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, Send, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

interface CommentsSheetProps {
  postId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function CommentsSheet({ postId, open, onOpenChange, onUpdate }: CommentsSheetProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentType[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Record<string, CommentReply[]>>({})
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})

  const fetchComments = useCallback(async () => {
    try {
      const data = await api.get<CommentType[]>(`/api/comments/get/${postId}`)
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
      setComments([])
    }
  }, [postId])

  useEffect(() => {
    if (open) fetchComments()
  }, [open, fetchComments])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return
    setIsLoading(true)
    try {
      await api.post(`/api/comments/${postId}`, { text: newComment.trim() })
      const { createNotification } = await import('@/lib/utils/notifications')
      await createNotification('post-owner-id', 'comment', `${user.nombres} comentó tu post`, user.userId)
      setNewComment("")
      fetchComments()
      onUpdate?.()
      toast.success('Comentario publicado')
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error('Error al publicar comentario')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim()) return
    setIsLoading(true)
    try {
      await api.post(`/api/comments/reply/${parentId}`, { text: replyText.trim() })
      setReplyText("")
      setReplyingTo(null)
      fetchReplies(parentId)
      fetchComments()
    } catch {
      toast.error("Error al responder")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReplies = async (parentId: string) => {
    try {
      const data = await api.get<CommentReply[]>(`/api/comments/getcommentReply/${parentId}`)
      setExpandedReplies((prev) => ({ ...prev, [parentId]: data }))
      setShowReplies((prev) => ({ ...prev, [parentId]: true }))
    } catch {
      // silent
    }
  }

  const toggleReplies = (parentId: string) => {
    if (showReplies[parentId]) {
      setShowReplies((prev) => ({ ...prev, [parentId]: false }))
    } else {
      fetchReplies(parentId)
    }
  }

  const toggleLike = async (targetId: string) => {
    try {
      await api.post(`/api/likes/toggle?targetId=${targetId}`)
      fetchComments()
    } catch {
      // silent
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/api/comments/delete/${commentId}`)
      fetchComments()
      toast.success("Comentario eliminado")
    } catch {
      toast.error("Error al eliminar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-border">
          <DialogTitle className="text-foreground">Comentarios</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="py-2 flex flex-col gap-4">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin comentarios aun
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.commentsId} className="flex flex-col gap-2">
                  {/* Comment */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {comment.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {comment.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-0.5">
                        {comment.text}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <button
                          onClick={() => toggleLike(comment.commentsId)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          {comment.likeCount}
                        </button>
                        <button
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.commentsId
                                ? null
                                : comment.commentsId
                            )
                          }
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Responder
                        </button>
                        {user?.userId === comment.userId && (
                          <button
                            onClick={() => deleteComment(comment.commentsId)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Reply input */}
                      {replyingTo === comment.commentsId && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="h-8 text-sm bg-muted border-border text-foreground placeholder:text-muted-foreground"
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                handleSubmitReply(comment.commentsId)
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(comment.commentsId)}
                            disabled={isLoading}
                            className="h-8 bg-primary text-primary-foreground"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* View replies toggle */}
                      {comment.commentReplies > 0 && (
                        <button
                          onClick={() => toggleReplies(comment.commentsId)}
                          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {showReplies[comment.commentsId] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          {comment.commentReplies}{" "}
                          {comment.commentReplies === 1
                            ? "respuesta"
                            : "respuestas"}
                        </button>
                      )}

                      {/* Replies */}
                      {showReplies[comment.commentsId] &&
                        expandedReplies[comment.commentsId]?.map((reply) => (
                          <div
                            key={reply.id}
                            className="mt-2 ml-4 flex gap-2 border-l-2 border-border pl-3"
                          >
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="bg-secondary/20 text-secondary text-[10px]">
                                {reply.username?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                  {reply.username}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDistanceToNow(
                                    new Date(reply.createdAt),
                                    { addSuffix: true, locale: es }
                                  )}
                                </span>
                              </div>
                              <p className="text-xs text-foreground mt-0.5">
                                {reply.text}
                              </p>
                              <button
                                onClick={() => toggleLike(reply.id)}
                                className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-secondary"
                              >
                                <Heart className="h-3 w-3" />
                                {reply.likeCount}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Comment input */}
        <div className="border-t border-border px-4 py-3">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmitComment()
              }}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={isLoading || !newComment.trim()}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar comentario</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
