"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

import type { Comment as CommentType, CommentReply, ReactionType } from "@/lib/types"
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
import { Heart, Send, ChevronDown, ChevronUp, Trash2, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ReactionPicker, getReactionEmoji } from "./reaction-picker"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { reactionService } from "@/lib/services/reaction"

interface CommentsSheetProps {
  postId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function CommentsSheet({ postId, open, onOpenChange, onUpdate }: CommentsSheetProps) {
  const { user } = useAuth()
  const features = useFeatureFlags()
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

  const handleReaction = async (targetId: string, type: ReactionType, isReply: boolean = false) => {
    const targetType = isReply ? 'REPLY' : 'COMMENT'
    
    try {
      // Usar servicio de reacciones
      await reactionService.toggleReaction(targetId, targetType, type)
      
      // Refrescar resumen de reacciones
      const summary = await reactionService.getReactionSummary(targetId, targetType)
      
      if (isReply) {
        setExpandedReplies(prev => {
          const updated = { ...prev }
          Object.keys(updated).forEach(parentId => {
            updated[parentId] = updated[parentId].map(reply => {
              if (reply.commentReplyId === targetId) {
                const userReacted = Object.values(summary).find(r => r.userReacted)
                return { 
                  ...reply, 
                  userReaction: userReacted ? type : null,
                  reactions: summary
                }
              }
              return reply
            })
          })
          return updated
        })
      } else {
        setComments(prev => prev.map(comment => {
          if (comment.commentsId === targetId) {
            const userReacted = Object.values(summary).find(r => r.userReacted)
            return { 
              ...comment, 
              userReaction: userReacted ? type : null,
              reactions: summary
            }
          }
          return comment
        }))
      }
    } catch (error) {
      toast.error("Error al reaccionar", {
        description: 'Intenta nuevamente',
        action: {
          label: 'Reintentar',
          onClick: () => handleReaction(targetId, type, isReply)
        }
      })
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
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] flex flex-col p-0">
        {/* Header mejorado */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Comentarios</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido con scroll */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 px-2 flex flex-col gap-6">
            {loadingComments ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Sin comentarios aún</p>
                  <p className="text-xs text-muted-foreground mt-1">Sé el primero en comentar</p>
                </div>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.commentsId} className="flex flex-col gap-3">
                  {/* Comment mejorado */}
                  <div className="flex gap-3 group">
                    <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-sm font-semibold">
                        {comment.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted/50 rounded-2xl px-4 py-3 hover:bg-muted/70 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/profile/${comment.userId}`}
                            className="text-sm font-bold text-foreground hover:underline"
                          >
                            {comment.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-4 px-2">
                        {features.multipleReactions ? (
                        <ReactionPicker onReact={(type) => handleReaction(comment.commentsId, type)}>
                          <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary group/btn transition-colors">
                            {comment.userReaction ? (
                              <span className="text-base group-hover/btn:scale-125 transition-transform">
                                {getReactionEmoji(comment.userReaction)}
                              </span>
                            ) : (
                              <Heart className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                            )}
                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                          </button>
                        </ReactionPicker>
                        ) : (
                          <button
                            onClick={() => toggleLike(comment.commentsId)}
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-secondary transition-colors"
                          >
                            <Heart className={`h-4 w-4 ${comment.liked ? 'fill-secondary text-secondary' : ''}`} />
                            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.commentsId
                                ? null
                                : comment.commentsId
                            )
                          }
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Responder
                        </button>
                        {user?.userId === comment.userId && (
                          <button
                            onClick={() => deleteComment(comment.commentsId)}
                            className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors ml-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Reply input mejorado */}
                      {replyingTo === comment.commentsId && (
                        <div className="mt-3 ml-2 flex gap-2">
                          <Input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="h-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground rounded-full"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault()
                                handleSubmitReply(comment.commentsId)
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="icon"
                            onClick={() => handleSubmitReply(comment.commentsId)}
                            disabled={isLoading || !replyText.trim()}
                            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* View replies toggle mejorado */}
                      {comment.commentReplies > 0 && (
                        <button
                          onClick={() => toggleReplies(comment.commentsId)}
                          className="mt-2 ml-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          {showReplies[comment.commentsId] ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {showReplies[comment.commentsId] ? 'Ocultar' : 'Ver'}{" "}
                          {comment.commentReplies}{" "}
                          {comment.commentReplies === 1
                            ? "respuesta"
                            : "respuestas"}
                        </button>
                      )}

                      {/* Replies mejoradas */}
                      {showReplies[comment.commentsId] &&
                        expandedReplies[comment.commentsId]?.map((reply) => (
                          <div
                            key={reply.commentReplyId}
                            className="mt-3 ml-6 flex gap-3 group/reply"
                          >
                            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-border">
                              <AvatarFallback className="bg-gradient-to-br from-secondary/20 to-primary/20 text-secondary text-xs font-semibold">
                                {reply.username?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-muted/30 rounded-2xl px-3 py-2.5 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link
                                    href={`/profile/${reply.userId}`}
                                    className="text-xs font-bold text-foreground hover:underline"
                                  >
                                    {reply.username}
                                  </Link>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(reply.createdAt),
                                      { addSuffix: true, locale: es }
                                    )}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground leading-relaxed">
                                  {reply.body}
                                </p>
                              </div>
                              <div className="mt-1.5 flex items-center gap-3 px-2">
                                {features.multipleReactions ? (
                                <ReactionPicker onReact={(type) => handleReaction(reply.commentReplyId, type, true)}>
                                  <button className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-primary group/btn transition-colors">
                                    {reply.userReaction ? (
                                      <span className="text-sm group-hover/btn:scale-125 transition-transform">
                                        {getReactionEmoji(reply.userReaction)}
                                      </span>
                                    ) : (
                                      <Heart className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
                                    )}
                                    {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
                                  </button>
                                </ReactionPicker>
                                ) : (
                                  <button
                                    onClick={() => toggleLike(reply.commentReplyId)}
                                    className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-secondary transition-colors"
                                  >
                                    <Heart className={`h-3.5 w-3.5 ${reply.liked ? 'fill-secondary text-secondary' : ''}`} />
                                    {reply.likeCount > 0 && <span>{reply.likeCount}</span>}
                                  </button>
                                )}
                                {user?.userId === reply.userId && (
                                  <button
                                    onClick={() => deleteComment(reply.commentReplyId)}
                                    className="text-[10px] font-medium text-muted-foreground hover:text-destructive transition-colors ml-auto"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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

        {/* Comment input mejorado */}
        <div className="border-t border-border/50 px-6 py-4 bg-muted/30">
          <div className="flex gap-3 items-center">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-sm font-semibold">
                {user?.nombres?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-full h-11"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmitComment()
                }
              }}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={isLoading || !newComment.trim()}
              size="icon"
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
              <span className="sr-only">Enviar comentario</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
