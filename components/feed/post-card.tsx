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
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
  Check,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { reputationService } from "@/lib/services/reputation"
import { bookmarkService } from "@/lib/services/bookmark"
import { reportService } from "@/lib/services/report"
import { reactionService } from "@/lib/services/reaction"
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
import { usePremiumStatus } from "@/hooks/use-premium-status"
import { Tooltip } from "@/components/ui/tooltip"
import { ReputationStars } from "@/components/ui/reputation-stars"
import { OptimizedImage } from "@/components/ui/optimized-image"

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  onUpdate?: () => void
  highlight?: boolean
  compact?: boolean
}

export function PostCard({ post, onDelete, onUpdate, highlight, compact = false }: PostCardProps) {
  const { user } = useAuth()
  const features = useFeatureFlags()
  const { isPremium } = usePremiumStatus()
  
  // Debug: Ver qué reacción tiene el post
  console.log('=== PostCard Render ===')
  console.log('Post ID:', post.id);
  console.log('post.userReaction:', post.userReaction);
  console.log('typeof post.userReaction:', typeof post.userReaction);
  console.log('post.reactions:', post.reactions);
  
  // Buscar la reacción del usuario en el objeto reactions
  const findUserReaction = (): ReactionType | null => {
    if (post.userReaction) return post.userReaction;
    
    // Si no hay userReaction, buscar en reactions donde userReacted sea true
    const userReactionEntry = Object.entries(post.reactions || {}).find(
      ([_, reaction]) => reaction.userReacted
    );
    
    const found = userReactionEntry ? (userReactionEntry[0] as ReactionType) : null;
    console.log('findUserReaction result:', found);
    return found;
  };
  
  const initialUserReaction = findUserReaction();
  console.log('initialUserReaction:', initialUserReaction);
  console.log('=======================')
  
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(post.liked || false)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction)
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
  const [showImageModal, setShowImageModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBody, setEditedBody] = useState(post.body)
  const [isSaving, setIsSaving] = useState(false)
  const isOwn = user?.userId === post.userId
  const reputation = post.reputation
  const reputationColor = reputation ? reputationService.getReputationColor(reputation) : undefined
  const shouldShowLocked = post.locked && !post.unlocked && !isOwn && !isPremium

  const handleReaction = async (type: ReactionType) => {
    const prevReaction = userReaction
    const prevCounts = { ...reactionCounts }
    
    console.log('=== handleReaction ===')
    console.log('Tipo de reacción:', type)
    console.log('Reacción anterior:', prevReaction)
    console.log('Contadores anteriores:', prevCounts)
    
    // Optimistic update
    if (prevReaction === type) {
      // Remove reaction
      setUserReaction(null)
      setReactionCounts(prev => {
        const updated = { ...prev }
        if (updated[type]) {
          updated[type] = { ...updated[type], count: updated[type].count - 1, userReacted: false }
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
          updated[prevReaction] = { ...updated[prevReaction], count: updated[prevReaction].count - 1, userReacted: false }
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
      // Usar servicio de reacciones
      const result = await reactionService.toggleReaction(post.id, 'POST', type)
      console.log('Resultado del backend:', result)
      
      // Refrescar estado de reacciones desde el backend
      const status = await reactionService.getReactionStatus(post.id, 'POST')
      console.log('Estado de reacciones del backend:', status)
      
      // Actualizar con los datos reales del backend
      if (status && typeof status === 'object') {
        // Si el backend devuelve myReaction y reactions
        if ('myReaction' in status && 'reactions' in status) {
          setUserReaction(status.myReaction || null)
          
          // Convertir array de reacciones a objeto
          const reactionsObj: Record<string, { type: string; count: number; userReacted: boolean }> = {}
          if (Array.isArray(status.reactions)) {
            status.reactions.forEach((r: any) => {
              reactionsObj[r.reaction] = {
                type: r.reaction,
                count: r.count,
                userReacted: status.myReaction === r.reaction
              }
            })
          }
          setReactionCounts(reactionsObj)
          console.log('Reacciones actualizadas:', reactionsObj)
        }
      }
      
      // Notificar al dueño del post
      if (prevReaction !== type && post.userId !== user?.userId) {
        const { createNotification } = await import('@/lib/utils/notifications')
        await createNotification(post.userId, 'reaction', `${user?.nombres || 'Alguien'} reaccionó a tu post`, user?.userId)
      }
    } catch (error) {
      console.error('Error al reaccionar:', error)
      // Revert on error
      setUserReaction(prevReaction)
      setReactionCounts(prevCounts)
      toast.error("Error al reaccionar", {
        description: 'Intenta nuevamente',
        action: {
          label: 'Reintentar',
          onClick: () => handleReaction(type)
        }
      })
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
    if (!confirm('¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.')) {
      return
    }
    try {
      await api.delete(`/api/posts/delete/${post.id}`)
      toast.success("Post eliminado")
      onDelete?.(post.id)
    } catch {
      toast.error("Error al eliminar post", {
        description: 'Intenta nuevamente o recarga la página',
        action: {
          label: 'Recargar',
          onClick: () => window.location.reload()
        }
      })
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

  // Validar y formatear fecha de forma segura
  const getTimeAgo = () => {
    try {
      if (!post.createdAt) return 'Hace un momento'
      const date = new Date(post.createdAt)
      if (isNaN(date.getTime())) return 'Hace un momento'
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es,
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Hace un momento'
    }
  }

  const timeAgo = getTimeAgo()

  return (
    <>
      <article 
        id={`post-${post.id}`}
        className={`border border-border bg-card rounded-2xl mb-3 hover:border-primary/30 transition-all duration-300 hover-lift animate-slide-in ${
          compact ? 'p-3' : 'p-4'
        } ${
          highlight ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
        }`}
      >
        {/* Locked overlay */}
     {/*    {shouldShowLocked && (
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
        )} */}

        {/* Header */}
        <div className="flex items-start justify-between">
          <Link
            href={`/profile/${post.userId}`}
            className="flex items-center gap-3"
          >
            <Avatar className={`border-2 border-primary/50 ring-2 ring-primary/20 ring-offset-2 ring-offset-background ${
              compact ? 'h-8 w-8' : 'h-10 w-10'
            }`}>
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
                {post.verificationLevel && post.verificationLevel > 0 && (
                  <Badge variant="default" className="px-1.5 py-0 text-[10px] bg-blue-500 text-white border-0">
                    <Check className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {reputation && (
                  <Tooltip content={`Reputación: ${reputation}/100`}>
                    <div className="flex items-center gap-1">
                      <ReputationStars reputation={reputation} size="sm" />
                      <Badge 
                        className="px-1.5 py-0 text-[10px] font-bold text-black border-0" 
                        style={{ backgroundColor: reputationColor }}
                      >
                        {reputation}
                      </Badge>
                    </div>
                  </Tooltip>
                )}
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
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {shouldShowLocked ? (
                <p className="text-muted-foreground italic select-none">
                  Este contenido está bloqueado. Desbloquea para ver el contenido completo.
                </p>
              ) : (
                features.hashtagsAndMentions ? parseTextWithLinks(post.body) : post.body
              )}
            </div>
          )}
        </div>

        {/* Image */}
        {post.file && !compact && (
          <div className="mt-3 overflow-hidden rounded-xl relative">
            {shouldShowLocked ? (
              <>
                {/* Imagen con blur de fondo */}
                <div className="relative h-96 bg-muted">
                  <OptimizedImage
                    src={post.file}
                    alt="Post media"
                    className="max-h-96 blur-2xl opacity-30 pointer-events-none select-none"
                  />
                  {/* Overlay con mensaje de bloqueo */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div 
                      onClick={() => setShowUnlockModal(true)}
                      className="flex items-center justify-between rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/30 px-4 py-3 cursor-pointer hover:from-primary/20 hover:to-secondary/20 transition-all backdrop-blur-sm w-full max-w-md"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        <span className="font-medium text-foreground">Contenido Premium Bloqueado</span>
                      </div>
                      <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                        Desbloquear
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div 
                onClick={() => setShowImageModal(true)}
                className="cursor-pointer hover:opacity-95 transition-opacity"
              >
                <OptimizedImage
                  src={post.file}
                  alt="Post media"
                  className="max-h-96"
                />
              </div>
            )}
          </div>
        )}

        {/* Poll */}
        {features.polls && post.poll && (
          <PollComponent poll={post.poll} onVote={handlePollVote} />
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center justify-between">
          {/* Izquierda: Botones de acción */}
          <div className="flex items-center gap-4">
            {features.multipleReactions ? (
              <div className="flex items-center gap-1.5">
                <ReactionPicker onReact={handleReaction}>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Reaccionar"
                  >
                    <Heart
                      className={`h-5 w-5 transition-all hover:scale-110 ${
                        userReaction
                          ? "fill-primary text-primary"
                          : "group-hover:text-primary"
                      }`}
                    />
                  </button>
                </ReactionPicker>
                {Object.keys(reactionCounts).length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {Object.values(reactionCounts).reduce((sum, r) => sum + r.count, 0)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleLike}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={liked ? "Quitar like" : "Dar like"}
                >
                  <Heart
                    className={`h-5 w-5 transition-all hover:scale-110 ${
                      liked
                        ? "fill-primary text-primary"
                        : ""
                    }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">
                  {likeCount}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowComments(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Comentar"
              >
                <MessageCircle className="h-5 w-5 hover:scale-110 transition-all" />
              </button>
              {post.commentsCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {post.commentsCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowRepostModal(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Compartir"
              >
                <Repeat2 className="h-5 w-5 hover:scale-110 transition-all" />
              </button>
              {repostCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {repostCount}
                </span>
              )}
            </div>
            
            {features.shareWithQR && (
              <button
                onClick={handleShare}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Enviar"
              >
                <Share2 className="h-5 w-5 hover:scale-110 transition-all" />
              </button>
            )}
          </div>

          {/* Derecha: Reacciones solapadas */}
          {features.multipleReactions && Object.keys(reactionCounts).length > 0 && (
            <button
              onClick={() => setShowReactionsModal(true)}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="flex items-center -space-x-1.5">
                {Object.entries(reactionCounts)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 3)
                  .map(([type, data], index) => (
                    <span 
                      key={type}
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full  text-sm"
                      style={{ zIndex: 3 - index }}
                    >
                      {getReactionEmoji(type as ReactionType)}
                    </span>
                  ))}
              </div>
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
      
      {/* Image Modal */}
      {post.file && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95 border-0">
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M18 6 6 18"/>
                  <path d="m6 6 12 12"/>
                </svg>
              </button>
              <img
                src={post.file}
                alt="Post media"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
