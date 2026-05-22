"use client"

import { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import type { Post, ReactionType, PostVisibility, ReactionSummary } from "@/lib/types"
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Rocket,
  Check,
  Globe,
  Users as UsersIcon,
  LockKeyhole,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { reputationService } from "@/lib/services/reputation"
import { bookmarkService } from "@/lib/services/bookmark"
import { repostService } from "@/lib/services/repost"
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
import { LockedPostMedia } from "./locked-post-media"
import { parseTextWithLinks } from "@/lib/utils/text-parser"
import { PollComponent } from "./poll-component"
import { PostBoostDialog } from "./post-boost-dialog"
import { ReportModal } from "./report-modal"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { usePremiumStatus } from "@/hooks/use-premium-status"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ReputationStars } from "@/components/ui/reputation-stars"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { useI18n } from "@/lib/i18n"

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
  onUpdate?: (postId?: string) => void
  highlight?: boolean
  compact?: boolean
}

export const PostCard = memo(function PostCard({ post, onDelete, onUpdate, highlight, compact = false }: PostCardProps) {
  const normalizedReactions: ReactionSummary = post.reactions || {}
  const { te, t } = useI18n()
  const { user } = useAuth()
  const features = useFeatureFlags()
  const { isPremium } = usePremiumStatus()
  
  // Debug: Ver qué reacción tiene el post
/*   console.log('=== PostCard Render ===')
  console.log('post.reactions:', post.reactions); */
  
  // Buscar la reacción del usuario en el objeto reactions
  const findUserReaction = (): ReactionType | null => {
    if (post.userReaction) return post.userReaction;
    
    // Si no hay userReaction, buscar en reactions donde userReacted sea true
    const userReactionEntry = Object.entries(normalizedReactions).find(
      ([_, reaction]) => reaction.userReacted
    );
    
    const found = userReactionEntry ? (userReactionEntry[0] as ReactionType) : null;
/*     console.log('findUserReaction result:', found); */
    return found;
  };
  
  const initialUserReaction = findUserReaction();
/*   console.log('initialUserReaction:', initialUserReaction);
  console.log('=======================') */
  
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [liked, setLiked] = useState(post.liked || post.likedByCurrentUser || false)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)

  useEffect(() => {
    setCommentsCount(post.commentsCount)
  }, [post.commentsCount])

  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction)
  const [reactionCounts, setReactionCounts] = useState<ReactionSummary>(normalizedReactions)
  const [repostCount, setRepostCount] = useState(post.repostCount || 0)
  const [reposted, setReposted] = useState(post.repostedByCurrentUser || false)

  useEffect(() => {
    setRepostCount(post.repostCount || 0)
  }, [post.repostCount])
  const [bookmarked, setBookmarked] = useState(Boolean(post.saved))
  const [isBookmarkPending, setIsBookmarkPending] = useState(false)
  const [isRepostPending, setIsRepostPending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showBoostDialog, setShowBoostDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedBody, setEditedBody] = useState(post.body || '')
  const [editedVisibility, setEditedVisibility] = useState<PostVisibility>(post.visibility || 'PUBLIC')
  const [isSaving, setIsSaving] = useState(false)
  const isOwn = user?.userId === post.userId
  const canBoost = isOwn && Boolean(post.permanent)
  const feedActive =
    canBoost && post.expiresAt ? new Date(post.expiresAt) > new Date() : false
  const feedExpiryLabel =
    canBoost && post.expiresAt
      ? feedActive
        ? te("En feed", "In feed")
        : te("Fuera del feed", "Off feed")
      : null
  const reputation = post.reputation
  const reputationColor = reputation ? reputationService.getReputationColor(reputation) : undefined
  const shouldShowLocked = post.locked && !post.unlocked && !isOwn && !isPremium
  const isAccessDenied = !post.body && !post.file && !!post.message && !post.locked && !post.canUnlock
  const bodyText = post.body || ''
  const lockedDescription = shouldShowLocked
    ? (post.message?.trim() || bodyText.trim())
    : ""
  const lockedIsVideo =
    Boolean(post.file?.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) ||
    post.media?.mediaType === "VIDEO" ||
    Boolean(post.file?.includes("cloudinary.com") && post.file?.includes("/video/"))

  const handleReaction = useCallback(async (type: ReactionType) => {
    const prevReaction = userReaction
    const prevCounts = { ...reactionCounts }
    
  /*   console.log('=== handleReaction ===')
    console.log('Tipo de reacción:', type)
    console.log('Reacción anterior:', prevReaction)
    console.log('Contadores anteriores:', prevCounts) */
    
    // Optimistic update
    if (prevReaction === type) {
      // Remove reaction
      setUserReaction(null)
      setReactionCounts((prev: ReactionSummary) => {
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
      setReactionCounts((prev: ReactionSummary) => {
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
  /*     console.log('Resultado del backend:', result) */
      
      // Refrescar estado de reacciones desde el backend
      const status = await reactionService.getReactionStatus(post.id, 'POST')
   /*    console.log('Estado de reacciones del backend:', status) */
      
      // Actualizar con los datos reales del backend
      if (status && typeof status === 'object') {
        // Si el backend devuelve myReaction y reactions
        if ('myReaction' in status && 'reactions' in status) {
          setUserReaction((typeof status.myReaction === "string" ? status.myReaction : null) as ReactionType | null)
          
          // Convertir array de reacciones a objeto
          const reactionsObj: ReactionSummary = {}
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
/*           console.log('Reacciones actualizadas:', reactionsObj)
 */        }
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
  }, [userReaction, reactionCounts, post.id, post.userId, user?.userId, user?.nombres])

  const toggleLike = useCallback(async () => {
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
  }, [liked, likeCount, post.id, post.userId, user?.userId, user?.nombres])

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false)
    try {
      await api.delete(`/api/posts/delete/${post.id}`)
    } catch {
      // Ignorar errores del backend (ej: Cloudinary resource type)
      // El post se elimina de la BD aunque falle Cloudinary
    }
    toast.success("Post eliminado")
    onDelete?.(post.id)
  }, [post.id, onDelete])

  const handleBookmark = useCallback(async () => {
    if (!user?.userId) {
      toast.error('Inicia sesión para guardar posts')
      return
    }
    setIsBookmarkPending(true)
    try {
      const isBookmarked = await bookmarkService.toggleBookmark(post.id)
      setBookmarked(isBookmarked)
      toast.success(isBookmarked ? 'Post guardado' : 'Post removido')
      setShowMenu(false)
      if (!isBookmarked) {
        onDelete?.(post.id)
      }
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar guardados')
    } finally {
      setIsBookmarkPending(false)
    }
  }, [user?.userId, post.id, onDelete])

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setShowMenu(false)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!editedBody.trim() || editedBody.trim().length < 10) {
      toast.error("El contenido debe tener al menos 10 caracteres")
      return
    }
    setIsSaving(true)
    try {
      await api.put(`/api/posts/update/${post.id}`, { body: editedBody.trim(), visibility: editedVisibility })
      toast.success("Post actualizado")
      setIsEditing(false)
      onUpdate?.()
    } catch {
      toast.error("Error al actualizar post")
    } finally {
      setIsSaving(false)
    }
  }, [editedBody, editedVisibility, post.id, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditedBody(post.body)
    setEditedVisibility(post.visibility || 'PUBLIC')
    setIsEditing(false)
  }, [post.body, post.visibility])

  const handleRepost = useCallback(async (comment: string) => {
    if (!user?.userId || isRepostPending) {
      return
    }

    const previousCount = repostCount
    const previousState = reposted
    const nextState = !reposted
    const nextCount = Math.max(0, repostCount + (nextState ? 1 : -1))

    setIsRepostPending(true)
    setReposted(nextState)
    setRepostCount(nextCount)

    try {
      if (nextState) {
        await repostService.createRepost(post.id, comment)
        toast.success('Repost publicado')
      } else {
        await repostService.removeRepost(post.id, user.userId)
        toast.success('Repost eliminado')
      }
      onUpdate?.(post.id)
    } catch (error: any) {
      setReposted(previousState)
      setRepostCount(previousCount)
      toast.error(error?.message || 'No se pudo actualizar el repost')
    } finally {
      setIsRepostPending(false)
    }
  }, [user?.userId, post.id, reposted, repostCount, isRepostPending, onUpdate])


  const [pollState, setPollState] = useState<Post["poll"]>(post.poll ?? null)

  useEffect(() => {
    setBookmarked(Boolean(post.saved) || bookmarkService.isSaved(post.id))
  }, [post.id, post.saved])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!user?.userId) {
        if (!cancelled) setReposted(false)
        return
      }
      try {
        const result = await repostService.hasReposted(post.id, user.userId)
        if (!cancelled) setReposted(result)
      } catch {
        if (!cancelled) setReposted(Boolean(post.repostedByCurrentUser))
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [post.id, post.repostedByCurrentUser, user?.userId])

  const handlePollVote = async (optionId: string) => {
    if (!pollState || pollState.userVoted) return

    const prevPoll = pollState
    const newTotalVotes = pollState.totalVotes + 1
    setPollState({
      ...pollState,
      userVoted: optionId,
      totalVotes: newTotalVotes,
      options: pollState.options.map((o) => {
        const newVotes = o.id === optionId ? o.votes + 1 : o.votes
        return { ...o, votes: newVotes, percentage: Math.round((newVotes / newTotalVotes) * 100) }
      })
    })

    try {
      await api.post(`/api/polls/vote/${optionId}`)
    } catch {
      setPollState(prevPoll)
      toast.error('Error al votar')
    }
  }

  const handleShare = useCallback(() => {
    setShowShareModal(true)
  }, [])

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
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <ReputationStars reputation={reputation} size="sm" />
                          <Badge
                            className="px-1.5 py-0 text-[10px] font-bold text-black border-0"
                            style={{ backgroundColor: reputationColor }}
                          >
                            {reputation}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{te("Reputación", "Reputation")}: {reputation}/100</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {!post.permanent && (
              <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                <Clock className="h-3 w-3" />
                {te("Temporal", "Temporary")}
              </span>
            )}
            {feedExpiryLabel ? (
              <button
                type="button"
                onClick={() => setShowBoostDialog(true)}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  feedActive
                    ? "bg-secondary/15 text-secondary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                <Rocket className="h-3 w-3" />
                {feedExpiryLabel}
              </button>
            ) : null}
            {isOwn && post.locked && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                <Lock className="h-3 w-3" />
                {te("Premium", "Premium")}
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
                  <DropdownMenuItem
                    onClick={handleBookmark}
                    disabled={isBookmarkPending}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
                    {isBookmarkPending ? te('Actualizando...', 'Updating...') : bookmarked ? te('Quitar guardado', 'Remove saved') : te('Guardar', 'Save')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowReportModal(true)} className="cursor-pointer text-destructive flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    {te("Reportar", "Report")}
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
                    <span className="sr-only">{te("Opciones", "Options")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border-border"
                >
                  <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("common.edit")}
                  </DropdownMenuItem>
                  {canBoost ? (
                    <DropdownMenuItem
                      onClick={() => setShowBoostDialog(true)}
                      className="cursor-pointer"
                    >
                      <Rocket className="mr-2 h-4 w-4 text-secondary" />
                      {te("Boost del post", "Post boost")}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("common.delete")}
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
                {editedBody.length}/500 {editedBody.length < 10 && editedBody.length > 0 && te('(mínimo 10)', '(minimum 10)')}
              </span>
              <Select value={editedVisibility} onValueChange={(v) => setEditedVisibility(v as PostVisibility)}>
                <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="h-3.5 w-3.5" />
                      {te("Público", "Public")}
                    </div>
                  </SelectItem>
                  <SelectItem value="FOLLOWERS">
                    <div className="flex items-center gap-2 text-xs">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {te("Seguidores", "Followers")}
                    </div>
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    <div className="flex items-center gap-2 text-xs">
                      <LockKeyhole className="h-3.5 w-3.5" />
                      {te("Privado", "Private")}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="border-border text-foreground"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editedBody.trim() || editedBody.trim().length < 10}
                  className="bg-primary text-primary-foreground"
                >
                  {isSaving ? te('Guardando...', 'Saving...') : te('Guardar', 'Save')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
              {shouldShowLocked ? (
                lockedDescription ? (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {features.hashtagsAndMentions
                      ? parseTextWithLinks(lockedDescription)
                      : lockedDescription}
                  </p>
                ) : null
              ) : isAccessDenied ? (
                <p className="text-muted-foreground italic select-none flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  {post.message}
                </p>
              ) : (
                features.hashtagsAndMentions ? parseTextWithLinks(bodyText) : bodyText
              )}
            </div>
          )}
        </div>

        {/* Image/Video */}
        {!compact && shouldShowLocked ? (
          <LockedPostMedia
            uri={post.file}
            isVideo={lockedIsVideo}
            compact={compact}
            onClick={() => setShowUnlockModal(true)}
          />
        ) : post.file && !compact ? (
          <div className="mt-3 overflow-hidden rounded-xl relative">
            {post.file.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) || post.media?.mediaType === 'VIDEO' || (post.file.includes('cloudinary.com') && post.file.includes('/video/')) ? (
              <video
                src={post.file}
                controls
                className="w-full max-h-96 rounded-xl"
              />
            ) : (
              <div 
                onClick={() => setShowImageModal(true)}
                className="cursor-pointer hover:opacity-95 transition-opacity"
              >
                <OptimizedImage
                  src={post.file}
                  alt={post.body ? `Imagen de la publicación de ${post.username}: ${post.body.substring(0, 50)}...` : `Publicación de ${post.username}`}
                  className="max-h-96"
                />
              </div>
            )}
          </div>
        ) : null}

        {/* Poll */}
        {features.polls && pollState && (
          <PollComponent poll={pollState} onVote={handlePollVote} />
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
                    title={te("Reaccionar", "React")}
                    aria-label={te("Reaccionar a esta publicación", "React to this post")}
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
                  title={liked ? te("Quitar like", "Remove like") : te("Dar like", "Like")}
                  aria-label={liked ? te("Quitar me gusta", "Remove like") : te("Dar me gusta", "Like")}
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
                title={te("Comentar", "Comment")}
                aria-label={te("Ver y escribir comentarios", "View and write comments")}
              >
                <MessageCircle className="h-5 w-5 hover:scale-110 transition-all" />
              </button>
              {commentsCount > 0 && (
                <span className="text-sm text-muted-foreground">
                  {commentsCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (isRepostPending) return
                  if (reposted) {
                    void handleRepost("")
                    return
                  }
                  setShowRepostModal(true)
                }}
                disabled={isRepostPending}
                className={`text-muted-foreground hover:text-foreground transition-colors ${isRepostPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={reposted ? te("Quitar repost", "Remove repost") : te("Repostear", "Repost")}
                aria-label={te("Republicar esta publicación", "Repost this post")}
              >
                <Repeat2 className={`h-5 w-5 hover:scale-110 transition-all ${reposted ? 'text-primary' : ''}`} />
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
                title={te("Enviar", "Share")}
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
        onCommentAdded={() => setCommentsCount(prev => prev + 1)}
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
        onUnlocked={() => onUpdate?.(post.id)}
      />
      {user && (
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={post.userId}
          targetId={post.id}
          targetType="POST"
        />
      )}
      
      {canBoost ? (
        <PostBoostDialog
          open={showBoostDialog}
          onOpenChange={setShowBoostDialog}
          postId={post.id}
          onBoostStarted={() => onUpdate?.(post.id)}
        />
      ) : null}

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm bg-card border-border" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{te("Confirmar eliminación", "Confirm deletion")}</DialogTitle>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground text-lg">{te("Eliminar post", "Delete post")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{te("Esta acción no se puede deshacer.", "This action cannot be undone.")}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete}>
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      {post.file && !post.file.match(/\.(mp4|webm|ogg|mov)$/i) && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95 border-0 [&>button]:hidden">
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
})
