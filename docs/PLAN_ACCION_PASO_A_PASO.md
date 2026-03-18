# 🎯 PLAN DE ACCIÓN PASO A PASO

## 📋 ANTES DE EMPEZAR

### ✅ Archivos que YA están listos:
- [x] `lib/types.ts` - Tipos actualizados
- [x] `lib/services/reaction.ts` - Servicio de reacciones
- [x] `lib/services/location.ts` - Servicio de ubicación
- [x] `hooks/use-local-feed.ts` - Hook de feed local
- [x] `components/feed/reaction-picker.tsx` - Picker actualizado

### 📚 Documentación disponible:
- `RESUMEN_EJECUTIVO_CAMBIOS.md` - Resumen general
- `BACKEND_CAMBIOS_MARZO_2026.md` - Cambios detallados
- `CHECKLIST_MIGRACION.md` - Lista completa de tareas
- `EJEMPLO_MIGRACION_POSTCARD.md` - Ejemplo de código
- `ENDPOINTS_BACKEND_REFERENCIA.md` - Referencia de endpoints

---

## 🚀 FASE 1: SISTEMA DE REACCIONES (DÍA 1)

### Paso 1.1: Actualizar PostCard
**Archivo:** `components/feed/post-card.tsx`

1. Abrir el archivo
2. Importar el servicio de reacciones:
   ```typescript
   import { reactionService } from '@/lib/services/reaction'
   import { ReactionPicker, getReactionEmoji } from '@/components/feed/reaction-picker'
   import type { ReactionType } from '@/lib/types'
   ```

3. Buscar la función `handleLike` (o similar)
4. Reemplazarla con `handleReaction`:
   ```typescript
   const handleReaction = async (reactionType: ReactionType) => {
     try {
       await reactionService.toggleReaction(post.id, 'POST', reactionType)
       // Actualizar estado local
       onUpdate?.() // Refrescar post
     } catch (error) {
       toast.error('Error al reaccionar')
     }
   }
   ```

5. Buscar el botón de like en el JSX
6. Reemplazarlo con ReactionPicker:
   ```typescript
   <ReactionPicker onReact={handleReaction}>
     <Button variant="ghost" size="sm">
       {userReaction ? getReactionEmoji(userReaction) : <Heart />}
       {totalReactions}
     </Button>
   </ReactionPicker>
   ```

7. Guardar y probar

**Tiempo estimado:** 30-45 minutos

---

### Paso 1.2: Actualizar CommentsSheet
**Archivo:** `components/feed/comments-sheet.tsx`

1. Abrir el archivo
2. Importar lo mismo que en PostCard
3. Buscar donde se manejan likes de comentarios
4. Reemplazar con:
   ```typescript
   const handleCommentReaction = async (commentId: string, reactionType: ReactionType) => {
     try {
       await reactionService.toggleReaction(commentId, 'COMMENT', reactionType)
       // Refrescar comentarios
     } catch (error) {
       toast.error('Error al reaccionar')
     }
   }
   ```

5. Actualizar JSX de cada comentario con ReactionPicker
6. Guardar y probar

**Tiempo estimado:** 30-45 minutos

---

### Paso 1.3: Testing de Reacciones
1. Abrir la app en el navegador
2. Ir a un post
3. Probar dar reacciones diferentes
4. Verificar que se actualicen los contadores
5. Probar quitar reacciones
6. Probar cambiar de una reacción a otra
7. Probar reacciones en comentarios

**Tiempo estimado:** 15-20 minutos

---

## 🌍 FASE 2: FEED LOCAL (DÍA 2)

### Paso 2.1: Actualizar Feed Page
**Archivo:** `app/(app)/feed/page.tsx`

1. Abrir el archivo
2. Importar el hook de feed local:
   ```typescript
   import { useLocalFeed } from '@/hooks/use-local-feed'
   import { locationService } from '@/lib/services/location'
   ```

3. Agregar estado para el feed local:
   ```typescript
   const { posts: localPosts, loading: localLoading } = useLocalFeed(50)
   ```

4. Actualizar la lógica de filtrado según el tab activo:
   ```typescript
   const displayPosts = feedTab === 'local' ? localPosts : 
                        feedTab === 'following' ? followingPosts : 
                        posts
   ```

5. Guardar

**Tiempo estimado:** 20-30 minutos

---

### Paso 2.2: Solicitar Permisos de Ubicación
**Archivo:** `app/(app)/feed/page.tsx`

1. Agregar useEffect para solicitar ubicación:
   ```typescript
   useEffect(() => {
     if (feedTab === 'local' && user?.userId) {
       locationService.requestAndUpdateLocation(user.userId)
     }
   }, [feedTab, user?.userId])
   ```

2. Agregar manejo de errores:
   ```typescript
   const [locationError, setLocationError] = useState(false)
   
   // Si no hay permisos, mostrar mensaje
   {feedTab === 'local' && locationError && (
     <div className="p-4 bg-yellow-500/10 text-yellow-500">
       Necesitamos tu ubicación para mostrar el feed local
       <Button onClick={requestLocation}>Permitir ubicación</Button>
     </div>
   )}
   ```

3. Guardar

**Tiempo estimado:** 15-20 minutos

---

### Paso 2.3: Testing de Feed Local
1. Abrir la app
2. Ir al feed
3. Cambiar al tab "Local"
4. Verificar que pida permisos de ubicación
5. Aceptar permisos
6. Verificar que cargue posts locales
7. Probar cambiar entre tabs (Global/Local/Siguiendo)

**Tiempo estimado:** 15-20 minutos

---

## 🔒 FASE 3: VISIBILIDAD DE POSTS (DÍA 3)

### Paso 3.1: Actualizar CreatePostDialog
**Archivo:** `components/feed/create-post-dialog.tsx`

1. Abrir el archivo
2. Agregar estados para visibilidad:
   ```typescript
   const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC')
   const [locked, setLocked] = useState(false)
   ```

3. Agregar selector de visibilidad en el JSX:
   ```typescript
   <Select value={visibility} onValueChange={setVisibility}>
     <SelectTrigger>
       <SelectValue />
     </SelectTrigger>
     <SelectContent>
       <SelectItem value="PUBLIC">🌍 Público</SelectItem>
       <SelectItem value="FOLLOWERS">👥 Solo seguidores</SelectItem>
       <SelectItem value="PRIVATE">🔒 Privado</SelectItem>
     </SelectContent>
   </Select>
   ```

4. Agregar toggle para locked:
   ```typescript
   <div className="flex items-center gap-2">
     <Switch checked={locked} onCheckedChange={setLocked} />
     <Label>Post bloqueado (requiere desbloqueo)</Label>
   </div>
   ```

5. Actualizar el request body al crear post:
   ```typescript
   await api.post('/api/posts', {
     body,
     file,
     permanent,
     durationHours,
     visibility,
     locked
   })
   ```

6. Guardar

**Tiempo estimado:** 30-40 minutos

---

### Paso 3.2: Mostrar Posts Locked
**Archivo:** `components/feed/post-card.tsx`

1. Agregar efecto blur para posts locked:
   ```typescript
   <div className={post.locked && !post.unlocked ? 'blur-md' : ''}>
     {/* Contenido del post */}
   </div>
   
   {post.locked && !post.unlocked && (
     <div className="absolute inset-0 flex items-center justify-center">
       <Button onClick={handleUnlock}>
         🔓 Desbloquear post
       </Button>
     </div>
   )}
   ```

2. Agregar función de desbloqueo:
   ```typescript
   const handleUnlock = async () => {
     try {
       await api.post(`/api/posts/${post.id}/unlock`)
       onUpdate?.()
       toast.success('Post desbloqueado')
     } catch (error) {
       toast.error('Error al desbloquear')
     }
   }
   ```

3. Guardar

**Tiempo estimado:** 20-30 minutos

---

### Paso 3.3: Mostrar Contadores Nuevos
**Archivo:** `components/feed/post-card.tsx`

1. Agregar viewCount y shareCount al JSX:
   ```typescript
   <div className="flex gap-4 text-sm text-muted-foreground">
     <span>👁️ {post.viewCount || 0} vistas</span>
     <span>🔄 {post.shareCount || 0} compartidos</span>
   </div>
   ```

2. Guardar

**Tiempo estimado:** 10 minutos

---

### Paso 3.4: Testing de Visibilidad
1. Crear un post público
2. Crear un post solo para seguidores
3. Crear un post privado
4. Crear un post locked
5. Verificar que se muestren correctamente
6. Probar desbloquear un post locked

**Tiempo estimado:** 20-30 minutos

---

## 🎮 FASE 4: LÍMITE DE SWIPES (DÍA 4)

### Paso 4.1: Mostrar Límite de Swipes
**Archivo:** `app/(app)/swipes/page.tsx`

1. Abrir el archivo
2. Agregar estado para swipes restantes:
   ```typescript
   const [remainingSwipes, setRemainingSwipes] = useState<number | null>(null)
   ```

3. Obtener swipes restantes:
   ```typescript
   useEffect(() => {
     const fetchRemaining = async () => {
       try {
         const data = await api.get(`/api/swipes/remaining/${user?.userId}`)
         setRemainingSwipes(data.remainingSwipes)
       } catch (error) {
         console.error(error)
       }
     }
     fetchRemaining()
   }, [user?.userId])
   ```

4. Mostrar indicador:
   ```typescript
   {!user?.premium && remainingSwipes !== null && (
     <div className="p-4 bg-primary/10 text-center">
       Swipes restantes hoy: {remainingSwipes}/10
       {remainingSwipes === 0 && (
         <Button onClick={() => router.push('/premium')}>
           Obtener Premium
         </Button>
       )}
     </div>
   )}
   ```

5. Guardar

**Tiempo estimado:** 20-30 minutos

---

### Paso 4.2: Manejar Error de Límite
**Archivo:** `app/(app)/swipes/page.tsx`

1. Actualizar función de swipe:
   ```typescript
   const handleSwipe = async (type: SwipeType) => {
     try {
       const response = await api.post('/api/swipes', {
         targetUserId: currentUser.userId,
         type
       })
       
       if (response.match) {
         // Mostrar modal de match
       }
       
       setRemainingSwipes(response.remainingSwipes)
     } catch (error: any) {
       if (error.message.includes('Límite')) {
         toast.error('Has alcanzado el límite de swipes diarios')
         // Mostrar modal de premium
       }
     }
   }
   ```

2. Guardar

**Tiempo estimado:** 15-20 minutos

---

## ✅ TESTING FINAL (DÍA 4)

### Checklist de Testing:
- [ ] Reacciones en posts funcionan
- [ ] Reacciones en comentarios funcionan
- [ ] Feed global carga correctamente
- [ ] Feed local pide permisos y carga posts cercanos
- [ ] Feed siguiendo muestra posts de seguidos
- [ ] Crear post con visibilidad pública
- [ ] Crear post con visibilidad seguidores
- [ ] Crear post con visibilidad privada
- [ ] Crear post locked
- [ ] Desbloquear post locked
- [ ] Contadores de vistas y compartidos se muestran
- [ ] Límite de swipes se muestra correctamente
- [ ] Error de límite de swipes se maneja bien
- [ ] Navegación entre tabs funciona
- [ ] No hay errores en consola

**Tiempo estimado:** 1-2 horas

---

## 📊 RESUMEN DE TIEMPOS

| Fase | Tiempo Estimado |
|------|----------------|
| Fase 1: Reacciones | 2-3 horas |
| Fase 2: Feed Local | 1-2 horas |
| Fase 3: Visibilidad | 2-3 horas |
| Fase 4: Swipes | 1 hora |
| Testing Final | 1-2 horas |
| **TOTAL** | **7-11 horas** |

---

## 🎯 PRIORIDADES

### Si tienes poco tiempo, hacer en este orden:
1. ✅ **Reacciones en PostCard** (crítico)
2. ✅ **Reacciones en CommentsSheet** (crítico)
3. ✅ **Feed Local básico** (importante)
4. ⚠️ **Visibilidad en CreatePost** (importante)
5. ⚠️ **Posts Locked** (medio)
6. ⚠️ **Límite de Swipes** (medio)
7. ℹ️ **Contadores nuevos** (bajo)

---

## 🆘 SI ALGO SALE MAL

### Error: "Cannot find module"
- Verificar que todos los imports sean correctos
- Verificar que los archivos existan en las rutas correctas

### Error: "API endpoint not found"
- Verificar que el backend esté corriendo
- Verificar la URL base en `lib/api.ts`
- Verificar que uses los endpoints correctos (ver `ENDPOINTS_BACKEND_REFERENCIA.md`)

### Error: "Token expired"
- Hacer logout y login nuevamente
- Verificar que el token se esté enviando en los headers

### Posts no cargan
- Verificar que el usuario esté autenticado
- Verificar que el backend esté corriendo
- Revisar la consola del navegador para errores

### Reacciones no funcionan
- Verificar que uses `reactionService` y no `/api/likes`
- Verificar que el targetType sea correcto (POST, COMMENT, REPLY)
- Verificar que el reactionType sea válido

---

## 📞 RECURSOS

- **Documentación completa:** `BACKEND_CAMBIOS_MARZO_2026.md`
- **Ejemplos de código:** `EJEMPLO_MIGRACION_POSTCARD.md`
- **Endpoints:** `ENDPOINTS_BACKEND_REFERENCIA.md`
- **Checklist:** `CHECKLIST_MIGRACION.md`

---

## 🎉 AL TERMINAR

1. Hacer commit de todos los cambios
2. Probar en diferentes navegadores
3. Probar en móvil
4. Documentar cualquier bug encontrado
5. Celebrar! 🎊

---

**¡Éxito con la implementación!** 🚀
