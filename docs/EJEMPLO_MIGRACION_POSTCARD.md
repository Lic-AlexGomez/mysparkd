# 📝 EJEMPLO: Migración de PostCard a Sistema de Reacciones

## Código ANTES (Sistema de Likes)

```typescript
// ❌ CÓDIGO VIEJO - NO USAR
const handleLike = async () => {
  try {
    await api.post(`/api/likes/${post.id}`)
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  } catch (error) {
    toast.error('Error al dar like')
  }
}

// En el JSX
<Button onClick={handleLike}>
  <Heart className={liked ? 'fill-red-500' : ''} />
  {likeCount}
</Button>
```

---

## Código DESPUÉS (Sistema de Reacciones)

```typescript
// ✅ CÓDIGO NUEVO - USAR ESTE
import { reactionService } from '@/lib/services/reaction'
import { ReactionPicker, getReactionEmoji } from '@/components/feed/reaction-picker'
import type { ReactionType } from '@/lib/types'

// Estado
const [userReaction, setUserReaction] = useState<ReactionType | null>(post.userReaction || null)
const [reactions, setReactions] = useState(post.reactions || {})

// Calcular total de reacciones
const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0)

// Handler de reacción
const handleReaction = async (reactionType: ReactionType) => {
  try {
    const response = await reactionService.toggleReaction(
      post.id,
      'POST',
      reactionType
    )
    
    // Actualizar estado local
    setUserReaction(response.userReacted ? reactionType : null)
    
    // Refrescar resumen de reacciones
    const summary = await reactionService.getReactionSummary(post.id, 'POST')
    setReactions(summary)
    
    toast.success(response.userReacted ? 'Reacción agregada' : 'Reacción removida')
  } catch (error) {
    toast.error('Error al reaccionar')
  }
}

// En el JSX
<ReactionPicker onReact={handleReaction}>
  <Button variant="ghost" size="sm" className="gap-2">
    {userReaction ? (
      <>
        <span className="text-lg">{getReactionEmoji(userReaction)}</span>
        <span className="text-primary">{totalReactions}</span>
      </>
    ) : (
      <>
        <Heart className="h-5 w-5" />
        <span>{totalReactions}</span>
      </>
    )}
  </Button>
</ReactionPicker>

{/* Mostrar resumen de reacciones */}
{totalReactions > 0 && (
  <div className="flex gap-1 items-center">
    {Object.entries(reactions).map(([type, data]) => (
      data.count > 0 && (
        <div key={type} className="flex items-center gap-1 text-xs">
          <span>{getReactionEmoji(type as ReactionType)}</span>
          <span className="text-muted-foreground">{data.count}</span>
        </div>
      )
    ))}
  </div>
)}
```

---

## Componente Completo de Ejemplo

```typescript
'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReactionPicker, getReactionEmoji } from '@/components/feed/reaction-picker'
import { reactionService } from '@/lib/services/reaction'
import type { Post, ReactionType } from '@/lib/types'
import { toast } from 'sonner'

interface PostCardProps {
  post: Post
  onUpdate?: () => void
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    post.userReaction || null
  )
  const [reactions, setReactions] = useState(post.reactions || {})
  const [isReacting, setIsReacting] = useState(false)

  const totalReactions = Object.values(reactions).reduce(
    (sum, r) => sum + (r.count || 0), 
    0
  )

  const handleReaction = async (reactionType: ReactionType) => {
    if (isReacting) return
    
    setIsReacting(true)
    try {
      const response = await reactionService.toggleReaction(
        post.id,
        'POST',
        reactionType
      )
      
      // Si el usuario ya tenía esta reacción, se quita
      // Si tenía otra reacción, se cambia
      // Si no tenía reacción, se agrega
      const newUserReaction = response.userReacted ? reactionType : null
      setUserReaction(newUserReaction)
      
      // Refrescar resumen
      const summary = await reactionService.getReactionSummary(post.id, 'POST')
      setReactions(summary)
      
      onUpdate?.()
    } catch (error) {
      toast.error('Error al reaccionar')
      console.error(error)
    } finally {
      setIsReacting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Contenido del post */}
        <p className="mb-4">{post.body}</p>
        
        {/* Resumen de reacciones */}
        {totalReactions > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {Object.entries(reactions).map(([type, data]) => (
              data.count > 0 && (
                <button
                  key={type}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  onClick={() => {
                    // TODO: Mostrar modal con usuarios que reaccionaron
                    console.log('Ver usuarios con reacción:', type)
                  }}
                >
                  <span className="text-sm">{getReactionEmoji(type as ReactionType)}</span>
                  <span className="text-xs text-muted-foreground">{data.count}</span>
                </button>
              )
            ))}
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {/* Botón de reacción */}
          <ReactionPicker onReact={handleReaction}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2 flex-1"
              disabled={isReacting}
            >
              {userReaction ? (
                <>
                  <span className="text-lg">{getReactionEmoji(userReaction)}</span>
                  <span className="text-primary font-medium">
                    {totalReactions > 0 && totalReactions}
                  </span>
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5" />
                  <span>{totalReactions > 0 ? totalReactions : 'Reaccionar'}</span>
                </>
              )}
            </Button>
          </ReactionPicker>
          
          {/* Botón de comentarios */}
          <Button variant="ghost" size="sm" className="gap-2 flex-1">
            <MessageCircle className="h-5 w-5" />
            <span>{post.commentsCount || 0}</span>
          </Button>
          
          {/* Botón de compartir */}
          <Button variant="ghost" size="sm" className="gap-2 flex-1">
            <Share2 className="h-5 w-5" />
            <span>{post.shareCount || 0}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## Migración de Comentarios

```typescript
// Similar para comentarios
const handleCommentReaction = async (commentId: string, reactionType: ReactionType) => {
  try {
    await reactionService.toggleReaction(
      commentId,
      'COMMENT',  // ← Cambiar targetType
      reactionType
    )
    // Actualizar estado...
  } catch (error) {
    toast.error('Error al reaccionar')
  }
}
```

---

## Migración de Respuestas

```typescript
// Similar para respuestas a comentarios
const handleReplyReaction = async (replyId: string, reactionType: ReactionType) => {
  try {
    await reactionService.toggleReaction(
      replyId,
      'REPLY',  // ← Cambiar targetType
      reactionType
    )
    // Actualizar estado...
  } catch (error) {
    toast.error('Error al reaccionar')
  }
}
```

---

## Modal de Usuarios que Reaccionaron

```typescript
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { reactionService } from '@/lib/services/reaction'
import { getReactionEmoji } from '@/components/feed/reaction-picker'
import type { ReactionType } from '@/lib/types'

interface ReactionsModalProps {
  postId: string
  open: boolean
  onClose: () => void
}

export function ReactionsModal({ postId, open, onClose }: ReactionsModalProps) {
  const [selectedReaction, setSelectedReaction] = useState<ReactionType>('LIKE')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && postId) {
      fetchUsers()
    }
  }, [open, postId, selectedReaction])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await reactionService.getUsersByReaction(
        postId,
        'POST',
        selectedReaction
      )
      setUsers(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reacciones</DialogTitle>
        </DialogHeader>
        
        {/* Tabs de reacciones */}
        <div className="flex gap-2 mb-4">
          {(['LIKE', 'LOVE', 'LAUGH', 'WOW', 'SAD', 'FIRE'] as ReactionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedReaction(type)}
              className={`px-3 py-2 rounded-lg ${
                selectedReaction === type ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              {getReactionEmoji(type)}
            </button>
          ))}
        </div>
        
        {/* Lista de usuarios */}
        <div className="space-y-2">
          {loading ? (
            <p>Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground">Nadie ha reaccionado con {getReactionEmoji(selectedReaction)}</p>
          ) : (
            users.map((user: any) => (
              <div key={user.userId} className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg">
                <img src={user.photoUrl} alt={user.username} className="w-10 h-10 rounded-full" />
                <span>{user.username}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Notas Importantes

1. **Toggle Automático**: El backend maneja automáticamente:
   - Si el usuario no tiene reacción → Agrega la reacción
   - Si el usuario tiene la misma reacción → Quita la reacción
   - Si el usuario tiene otra reacción → Cambia a la nueva reacción

2. **Optimistic Updates**: Considera actualizar el UI inmediatamente y revertir si falla:
```typescript
// Actualización optimista
setUserReaction(reactionType)
try {
  await reactionService.toggleReaction(...)
} catch {
  setUserReaction(previousReaction) // Revertir
}
```

3. **Performance**: Usa React.memo para evitar re-renders innecesarios:
```typescript
export const PostCard = React.memo(PostCardComponent)
```

4. **Caché**: Considera cachear el resumen de reacciones para evitar llamadas repetidas.
