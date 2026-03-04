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
  const [loadingComments, setLoadingComments] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Record<string, CommentReply[]>>({})
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({})

  const fetchComments = useCallback(async () => {
    try {
      setLoadingComments(true)
      const data = await api.get<CommentType[]>(`/api/comments/get/${postId}`)
      
      // Mostrar comentarios inmediatamente sin likes
      setComments(data.map(c => ({ ...c, liked: false })))
      setLoadingComments(false)
      
      // Fetch like status en background
      Promise.all(
        data.map(async (comment) => {
          try {
            const likeStatus = await api.get<{ likedByMe: boolean }>(`/api/likes/status/${comment.commentsId}`)
            return { id: comment.commentsId, liked: likeStatus.likedByMe }
          } catch {
            return { id: comment.commentsId, liked: false }
          }
        })
      ).then(likeStatuses => {
        setComments(prev => prev.map(comment => {
          const status = likeStatuses.find(s => s.id === comment.commentsId)
          return status ? { ...comment, liked: status.liked } : comment
        }))
      })
    } catch (error) {
      console.error('Error fetching comments:', error)
      setComments([])
      setLoadingComments(false)
    }
  }, [postId])

  useEffect(() => {
    if (open) {
      setLoadingComments(true)
      fetchComments()
    }
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
      await api.post(`/api/comments/reply/${parentId}`, { body: replyText.trim() })
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
      
      // Mostrar respuestas inmediatamente
      setExpandedReplies((prev) => ({ ...prev, [parentId]: data.map(r => ({ ...r, liked: false })) }))
      setShowReplies((prev) => ({ ...prev, [parentId]: true }))
      
      // Fetch like status en background
      Promise.all(
        data.map(async (reply) => {
          try {
            const likeStatus = await api.get<{ likedByMe: boolean }>(`/api/likes/status/${reply.commentReplyId}`)
            return { id: reply.commentReplyId, liked: likeStatus.likedByMe }
          } catch {
            return { id: reply.commentReplyId, liked: false }
          }
        })
      ).then(likeStatuses => {
        setExpandedReplies((prev) => ({
          ...prev,
          [parentId]: prev[parentId]?.map(reply => {
            const status = likeStatuses.find(s => s.id === reply.commentReplyId)
            return status ? { ...reply, liked: status.liked } : reply
          }) || []
        }))
      })
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
      
      // Actualizar comentarios
      setComments(prev => prev.map(comment => {
        if (comment.commentsId === targetId) {
          return {
            ...comment,
            liked: !comment.liked,
            likeCount: comment.liked ? comment.likeCount - 1 : comment.likeCount + 1
          }
        }
        return comment
      }))
      
      // Actualizar respuestas
      setExpandedReplies(prev => {
        const updated = { ...prev }
        Object.keys(updated).forEach(parentId => {
          updated[parentId] = updated[parentId].map(reply => {
            if (reply.commentReplyId === targetId) {
              return {
                ...reply,
                liked: !reply.liked,
                likeCount: reply.liked ? reply.likeCount - 1 : reply.likeCount + 1
              }
            }
            return reply
          })
        })
        return updated
      })
    } catch {
      // silent
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await api.delete(`/api/comments/delete/${commentId}`)
      toast.success("Comentario eliminado")
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error("No se puede eliminar este comentario")
      return
    }
    
    // Actualizar comentarios
    setComments(prev => prev.filter(c => c.commentsId !== commentId))
    
    // Actualizar respuestas
    setExpandedReplies(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(parentId => {
        updated[parentId] = updated[parentId].filter(r => r.commentReplyId !== commentId)
      })
      return updated
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-border">
          <DialogTitle className="text-foreground">Comentarios</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="py-2 flex flex-col gap-4">
            {loadingComments ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Cargando comentarios...
              </p>
            ) : comments.length === 0 ? (
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
                          <Heart className={`h-3.5 w-3.5 ${comment.liked ? 'fill-secondary text-secondary' : ''}`} />
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
                            key={reply.commentReplyId}
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
                                {reply.body}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <button
                                  onClick={() => toggleLike(reply.commentReplyId)}
                                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-secondary"
                                >
                                  <Heart className={`h-3 w-3 ${reply.liked ? 'fill-secondary text-secondary' : ''}`} />
                                  {reply.likeCount}
                                </button>
                                {user?.userId === reply.userId && (
                                  <button
                                    onClick={() => deleteComment(reply.commentReplyId)}
                                    className="text-[10px] text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
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
