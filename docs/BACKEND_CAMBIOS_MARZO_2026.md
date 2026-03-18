# CAMBIOS BACKEND - ADAPTACIÓN FRONTEND

## 📋 Resumen de Cambios del Backend

### 1. Sistema de Reacciones (Reemplaza Likes)
**Antes:** Sistema simple de likes
**Ahora:** Sistema completo de reacciones con 6 tipos

#### Tipos de Reacciones:
```typescript
enum ReactionType {
  LIKE,    // 👍
  LOVE,    // ❤️
  LAUGH,   // 😂
  WOW,     // 😮
  SAD,     // 😢
  FIRE     // 🔥
}

enum ReactionTargetType {
  POST,
  COMMENT,
  REPLY
}
```

#### Endpoints Nuevos:
- `POST /api/reactions/toggle` - Toggle reacción
- `GET /api/reactions/status/{targetId}?targetType=POST` - Estado de reacción del usuario
- `GET /api/reactions/summary/{targetId}?targetType=POST` - Resumen de todas las reacciones
- `GET /api/reactions/users/{targetId}?targetType=POST&reactionType=LIKE` - Usuarios que reaccionaron

#### ⚠️ BREAKING CHANGES:
- **ELIMINADOS:** `/api/likes/*` endpoints
- **ELIMINADO:** `LikeController`
- Todos los componentes que usen likes deben migrar a reacciones

---

### 2. Feed Local con Geolocalización
**Nueva funcionalidad:** Feed basado en ubicación del usuario

#### Endpoints:
- `POST /api/feed/location/{userId}` - Actualizar ubicación del usuario
  ```json
  {
    "latitude": 18.4861,
    "longitude": -69.9312
  }
  ```
- `GET /api/feed/local/{userId}?radiusKm=50` - Obtener feed local (default 50km)
- `GET /api/feed/global/{userId}` - Feed global (existente)

#### Tipos de Feed:
1. **Global** - Todos los posts
2. **Local** - Posts de usuarios cercanos (basado en ubicación)
3. **Following** - Posts de usuarios que sigues

---

### 3. Visibilidad de Posts
**Nuevo campo:** `visibility` (enum)

```typescript
enum PostVisibility {
  PUBLIC,      // Visible para todos
  FOLLOWERS,   // Solo seguidores
  PRIVATE      // Solo el usuario
}
```

#### Campos de Post Actualizados:
```typescript
interface Post {
  body: string
  file: string
  permanent: boolean
  durationHours?: number
  locked: boolean          // Posts borrosos (requieren desbloqueo)
  privat_e: boolean        // DEPRECATED - usar visibility
  visibility: PostVisibility  // NUEVO
  viewCount: number        // NUEVO
  shareCount: number       // NUEVO
}
```

---

### 4. Límite de Swipes Diarios
**Nueva restricción:** 10 swipes diarios para usuarios gratuitos

#### Cambios:
- Usuarios FREE: 10 swipes/día
- Usuarios PREMIUM: Ilimitado
- El backend controla el límite automáticamente

---

### 5. Moderación con OpenAI
**Nueva funcionalidad:** Moderación automática de contenido

#### Aplica a:
- Posts
- Comentarios
- Mensajes de chat

El backend rechaza automáticamente contenido inapropiado.

---

## 🔧 Archivos Creados/Modificados en Frontend

### Archivos Nuevos:
1. ✅ `lib/services/reaction.ts` - Servicio de reacciones
2. ✅ `lib/services/location.ts` - Servicio de geolocalización
3. ✅ `hooks/use-local-feed.ts` - Hook para feed local

### Archivos Modificados:
1. ✅ `lib/types.ts` - Tipos actualizados
   - ReactionType: LIKE, LOVE, LAUGH, WOW, SAD, FIRE
   - ReactionTargetType: POST, COMMENT, REPLY
   - PostVisibility: PUBLIC, FOLLOWERS, PRIVATE
   - Campos nuevos en Post: visibility, viewCount, shareCount

2. ✅ `components/feed/reaction-picker.tsx` - Reacciones actualizadas
   - Agregado LIKE y FIRE
   - Removido ANGRY
   - Cambiado HAHA por LAUGH

3. ✅ `app/(app)/feed/page.tsx` - Tabs de feed actualizados
   - Global
   - Local (nuevo)
   - Siguiendo

---

## 📝 Tareas Pendientes

### Alta Prioridad:
- [ ] Actualizar `PostCard` para usar `reactionService` en lugar de likes
- [ ] Actualizar `CommentsSheet` para usar reacciones en comentarios
- [ ] Implementar lógica de feed local en `feed/page.tsx`
- [ ] Agregar permisos de geolocalización en el onboarding
- [ ] Actualizar `CreatePostDialog` con campos: locked, visibility

### Media Prioridad:
- [ ] Mostrar viewCount y shareCount en posts
- [ ] Implementar funcionalidad de compartir posts
- [ ] Agregar indicador de límite de swipes para usuarios free
- [ ] Actualizar UI para posts locked (efecto blur)

### Baja Prioridad:
- [ ] Migrar todos los componentes que usen el campo `privat_e` a `visibility`
- [ ] Agregar selector de radio de búsqueda para feed local (10km, 25km, 50km, 100km)
- [ ] Implementar caché de ubicación para no pedir permisos constantemente

---

## 🚀 Guía de Implementación

### 1. Migrar de Likes a Reacciones

**Antes:**
```typescript
// ❌ DEPRECATED
await api.post(`/api/likes/${postId}`)
```

**Ahora:**
```typescript
// ✅ CORRECTO
import { reactionService } from '@/lib/services/reaction'

await reactionService.toggleReaction(postId, 'POST', 'LIKE')
```

### 2. Implementar Feed Local

```typescript
import { useLocalFeed } from '@/hooks/use-local-feed'
import { locationService } from '@/lib/services/location'

function FeedPage() {
  const { posts, loading, locationEnabled } = useLocalFeed(50) // 50km radius
  
  // Solicitar permisos de ubicación
  useEffect(() => {
    if (user?.userId) {
      locationService.requestAndUpdateLocation(user.userId)
    }
  }, [user])
}
```

### 3. Crear Post con Visibilidad

```typescript
const createPost = async () => {
  await api.post('/api/posts', {
    body: 'Mi post',
    file: imageUrl,
    permanent: false,
    durationHours: 24,
    locked: false,
    visibility: 'PUBLIC' // o 'FOLLOWERS' o 'PRIVATE'
  })
}
```

---

## ⚠️ Notas Importantes

1. **Compatibilidad:** El campo `privat_e` aún existe pero está deprecated. Usar `visibility` en su lugar.

2. **Geolocalización:** Requiere permisos del navegador. Manejar casos donde el usuario rechace permisos.

3. **Reacciones:** El backend maneja automáticamente el toggle (agregar/quitar reacción).

4. **Límite de Swipes:** El backend retorna error cuando se alcanza el límite. Mostrar mensaje apropiado al usuario.

5. **OpenAI Moderation:** Si un post/comentario es rechazado, el backend retorna error con mensaje descriptivo.

---

## 📞 Contacto Backend

Para dudas sobre endpoints o funcionalidades:
- Programador: Johan M. Jones Mayblue
- Última actualización: 09/03/2026

---

## 🔄 Estado de Migración

- [x] Tipos actualizados
- [x] Servicios creados
- [x] Hooks creados
- [x] Componentes base actualizados
- [ ] Migración completa de likes a reacciones
- [ ] Implementación de feed local
- [ ] Testing completo
