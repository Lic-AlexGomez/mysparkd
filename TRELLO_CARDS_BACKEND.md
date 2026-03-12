# 📋 CARDS PARA TRELLO - BACKEND SPARKD

Basado en el análisis completo del frontend, estas son las funcionalidades que necesitan implementación en el backend.

---

## 🔴 COLUMNA: CRÍTICO - PRIORIDAD ALTA

### 1. 📍 Feed Local por Geolocalización

**Descripción:**
Implementar endpoints para feed basado en ubicación del usuario.

**Endpoints necesarios:**
- `POST /api/feed/location` - Actualizar ubicación del usuario
- `GET /api/feed/local?radiusKm={radius}` - Obtener posts cercanos

**Detalles técnicos:**
- Agregar campos `latitude` y `longitude` a tabla `user_profile`
- Usar PostGIS o cálculo de distancia con fórmula Haversine
- Filtrar posts por distancia en kilómetros
- Retornar posts con campo `distance` (distancia en km)

**Frontend ya implementado:** ✅
- Hook `use-local-feed.ts`
- Service `location.ts`
- UI en `feed/page.tsx` con tab "Local"

---

### 2. 🎯 Sistema de Reacciones Múltiples
**Descripción:**
Implementar sistema completo de reacciones (LIKE, LOVE, LAUGH, WOW, SAD, FIRE) para posts, comentarios y respuestas.

**Endpoints necesarios:**
- `POST /api/reactions/toggle` - Agregar/cambiar/quitar reacción
  ```json
  {
    "targetId": "uuid",
    "targetType": "POST|COMMENT|REPLY",
    "reactionType": "LIKE|LOVE|LAUGH|WOW|SAD|FIRE"
  }
  ```
- `GET /api/reactions/{targetId}?targetType={type}` - Obtener estado de reacciones
  ```json
  {
    "myReaction": "LIKE",
    "reactions": [
      {"reaction": "LIKE", "count": 5},
      {"reaction": "LOVE", "count": 3}
    ]
  }
  ```
- `GET /api/reactions/{targetId}/users?reactionType={type}` - Ver quién reaccionó

**Detalles técnicos:**
- Crear tabla `reactions` con campos: `id`, `user_id`, `target_id`, `target_type`, `reaction_type`, `created_at`
- Constraint UNIQUE en (`user_id`, `target_id`, `target_type`)
- Enum `ReactionType` con valores: LIKE, LOVE, LAUGH, WOW, SAD, FIRE
- Enum `TargetType` con valores: POST, COMMENT, REPLY

**Frontend ya implementado:** ✅
- Componente `reaction-picker.tsx`
- Componente `reactions-modal.tsx`
- Service `reaction.ts`
- Integrado en `post-card.tsx` y `comments-sheet.tsx`

---

### 3. 🔍 Sistema de Búsqueda Completo
**Descripción:**
Implementar búsqueda de usuarios, posts y hashtags.

**Endpoints necesarios:**
- `GET /api/search/users?query={query}&page={page}&size={size}` - Buscar usuarios
- `GET /api/search/posts?query={query}&page={page}&size={size}` - Buscar posts por contenido
- `GET /api/search/hashtags?query={query}` - Buscar hashtags
- `GET /api/hashtags/{tag}/posts?page={page}&size={size}` - Posts por hashtag
- `GET /api/hashtags/trending?limit={limit}` - Hashtags trending

**Detalles técnicos:**
- Búsqueda case-insensitive con ILIKE o LOWER()
- Crear tabla `hashtags` con campos: `id`, `tag`, `usage_count`, `last_used_at`
- Crear tabla `post_hashtags` para relación many-to-many
- Extraer hashtags automáticamente al crear/editar posts
- Incrementar `usage_count` al usar hashtag

**Frontend ya implementado:** ✅
- Página `search/page.tsx` con tabs
- Parser de texto con detección de hashtags en `text-parser.tsx`
- Service `search.ts`

---

### 4. 📊 Encuestas (Polls)
**Descripción:**
Implementar sistema de encuestas en posts.

**Endpoints necesarios:**
- `POST /api/polls/vote` - Votar en encuesta
  ```json
  {
    "pollId": "uuid",
    "optionId": "uuid"
  }
  ```
- `GET /api/polls/{pollId}/results` - Obtener resultados

**Detalles técnicos:**
- Crear tabla `polls`: `id`, `post_id`, `question`, `expires_at`, `allow_multiple`
- Crear tabla `poll_options`: `id`, `poll_id`, `text`, `vote_count`
- Crear tabla `poll_votes`: `id`, `user_id`, `poll_option_id`, `voted_at`
- Agregar campo `poll` en `CreatePostRequest`
- Validar que usuario no vote dos veces (si `allow_multiple` es false)

**Frontend ya implementado:** ✅
- Componente `poll-component.tsx`
- Componente `create-poll-dialog.tsx`
- Integrado en `post-card.tsx`

---

### 5. 📝 Campos Adicionales de Perfil
**Descripción:**
Agregar campos faltantes al perfil de usuario.

**Campos a agregar:**
- `username` (VARCHAR 30, UNIQUE) - Nombre de usuario único
- `bio` (VARCHAR 500) - Biografía
- `location` (VARCHAR 100) - Ubicación/ciudad
- `website` (VARCHAR 200) - Sitio web personal

**Endpoints a modificar:**
- `PUT /api/profile` - Actualizar perfil (incluir nuevos campos)
- `GET /api/profile/{userId}` - Retornar nuevos campos
- `GET /api/profile/me` - Retornar nuevos campos

**Detalles técnicos:**
- Migración SQL para agregar columnas
- Validar que `username` sea único
- Validar formato de `website` (URL válida)
- Actualizar DTOs y Mappers

**Frontend ya implementado:** ✅
- Tipos en `types.ts`
- Página `profile/edit/page.tsx` lista para usar estos campos

---

## 🟡 COLUMNA: IMPORTANTE - PRIORIDAD MEDIA

### 6. 📖 Stories - Funcionalidades Adicionales
**Descripción:**
Mejorar sistema de stories existente.

**Endpoints necesarios:**
- `POST /api/stories/{storyId}/view` - Marcar story como vista
- `GET /api/stories/{storyId}/viewers` - Ver quién vio la story
- `POST /api/stories/{storyId}/react` - Reaccionar a story
- `DELETE /api/stories/{storyId}` - Eliminar story propia

**Detalles técnicos:**
- Crear tabla `story_views`: `id`, `story_id`, `user_id`, `viewed_at`
- Agregar campo `view_count` a tabla `stories`
- Agregar campo `reaction` a tabla `story_views` (opcional)

**Frontend ya implementado:** ✅
- Página `stories/page.tsx`
- Componente `stories-bar.tsx`

---

### 7. 👥 Grupos - Posts y Roles
**Descripción:**
Implementar posts dentro de grupos y sistema de roles.

**Endpoints necesarios:**
- `POST /api/groups/{groupId}/posts` - Crear post en grupo
- `GET /api/groups/{groupId}/posts?page={page}&size={size}` - Posts del grupo
- `PUT /api/groups/{groupId}/members/{userId}/role` - Cambiar rol de miembro
  ```json
  {
    "role": "ADMIN|MODERATOR|MEMBER"
  }
  ```
- `DELETE /api/groups/{groupId}/members/{userId}` - Expulsar miembro (solo admin)

**Detalles técnicos:**
- Agregar campo `group_id` a tabla `posts`
- Agregar campo `role` a tabla `group_members` (enum: ADMIN, MODERATOR, MEMBER)
- Validar permisos según rol
- Filtrar posts por grupo

**Frontend ya implementado:** ✅
- Página `groups/page.tsx`
- Página `groups/[id]/page.tsx`

---

### 8. 🔔 Notificaciones - Marcar como Leída
**Descripción:**
Implementar endpoint para marcar notificaciones como leídas.

**Endpoints necesarios:**
- `PUT /api/notifications/{notificationId}/read` - Marcar como leída
- `PUT /api/notifications/read-all` - Marcar todas como leídas

**Detalles técnicos:**
- Actualizar campo `read` a `true`
- Retornar notificación actualizada

**Frontend ya implementado:** ✅
- Página `notifications/page.tsx`
- Service `notification.ts`

---

### 9. 🎮 Feed Personalizado
**Descripción:**
Implementar algoritmo de feed personalizado.

**Endpoints necesarios:**
- `GET /api/feed/foryou?page={page}&size={size}` - Feed "Para Ti" (algoritmo)
- `GET /api/feed/following?page={page}&size={size}` - Feed de seguidos

**Detalles técnicos:**
- Algoritmo básico considerando:
  - Intereses del usuario
  - Compatibilidad
  - Engagement del post (likes, comentarios)
  - Reputación del autor
  - Recencia del post
- Feed following: solo posts de usuarios que sigue

**Frontend ya implementado:** ✅
- Tabs en `feed/page.tsx` (Global, Local, Siguiendo)
- Hook `use-feed.ts` con modos de ordenamiento

---

### 10. 🔓 Sistema de Desbloqueo de Posts Premium
**Descripción:**
Implementar desbloqueo de posts bloqueados para usuarios no premium.

**Endpoints necesarios:**
- `POST /api/posts/{postId}/unlock` - Desbloquear post (pago)
  ```json
  {
    "paymentMethodId": "stripe_pm_xxx"
  }
  ```
- `GET /api/posts/{postId}/unlock-status` - Verificar si usuario desbloqueó

**Detalles técnicos:**
- Crear tabla `post_unlocks`: `id`, `user_id`, `post_id`, `unlocked_at`, `payment_id`
- Integrar con Stripe para cobro
- Precio configurable por post o fijo
- Validar que post esté `locked`

**Frontend ya implementado:** ✅
- Componente `unlock-post-modal.tsx`
- Lógica en `post-card.tsx`

---

## 🟢 COLUMNA: MEJORAS - PRIORIDAD BAJA

### 11. 📈 Analytics Avanzado
**Descripción:**
Endpoints para estadísticas detalladas del usuario.

**Endpoints necesarios:**
- `GET /api/analytics/profile` - Estadísticas de perfil
  ```json
  {
    "profileViews": 1234,
    "profileViewsGrowth": 12,
    "followerGrowth": [{"date": "2024-01", "count": 50}],
    "topPosts": [...]
  }
  ```
- `GET /api/analytics/posts/{postId}` - Estadísticas de post específico
- `GET /api/analytics/engagement` - Engagement rate

**Frontend ya implementado:** ✅
- Página `analytics/page.tsx`

---

### 12. 🔐 Configuración de Privacidad
**Descripción:**
Implementar configuración de privacidad del usuario.

**Endpoints necesarios:**
- `GET /api/settings/privacy` - Obtener configuración
- `PUT /api/settings/privacy` - Actualizar configuración
  ```json
  {
    "whoCanSeeMyPosts": "EVERYONE|FOLLOWERS|NOBODY",
    "whoCanComment": "EVERYONE|FOLLOWERS|NOBODY",
    "whoCanSendDM": "EVERYONE|FOLLOWERS|MATCHES",
    "showOnlineStatus": true,
    "showLastSeen": false
  }
  ```

**Detalles técnicos:**
- Crear tabla `privacy_settings`
- Aplicar filtros según configuración en endpoints de posts, comentarios, chat

**Frontend:** Parcialmente implementado en `settings/page.tsx`

---

### 13. 🚫 Sistema de Reportes
**Descripción:**
Implementar sistema de reportes de contenido.

**Endpoints necesarios:**
- `POST /api/reports` - Crear reporte
  ```json
  {
    "targetId": "uuid",
    "targetType": "POST|COMMENT|USER",
    "reason": "SPAM|HARASSMENT|INAPPROPRIATE|OTHER",
    "description": "string"
  }
  ```
- `GET /api/reports` - Listar reportes (admin)
- `PUT /api/reports/{reportId}/resolve` - Resolver reporte (admin)

**Detalles técnicos:**
- Crear tabla `reports`
- Enum `ReportReason`
- Sistema de moderación básico

**Frontend ya implementado:** ✅
- Service `report.ts`
- Opción en menú de posts

---

### 14. 💾 Guardados/Bookmarks
**Descripción:**
Implementar guardado de posts en el backend.

**Endpoints necesarios:**
- `POST /api/bookmarks/toggle` - Guardar/quitar guardado
  ```json
  {
    "postId": "uuid"
  }
  ```
- `GET /api/bookmarks?page={page}&size={size}` - Obtener posts guardados

**Detalles técnicos:**
- Crear tabla `bookmarks`: `id`, `user_id`, `post_id`, `created_at`
- Constraint UNIQUE en (`user_id`, `post_id`)

**Frontend ya implementado:** ✅
- Página `saved/page.tsx`
- Service `bookmark.ts` (actualmente usa localStorage)

---

### 15. 🔄 Sistema de Repost
**Descripción:**
Implementar repost de contenido.

**Endpoints necesarios:**
- `POST /api/posts/{postId}/repost` - Hacer repost
  ```json
  {
    "comment": "string (opcional)"
  }
  ```
- `DELETE /api/posts/{postId}/repost` - Quitar repost
- `GET /api/posts/{postId}/reposts` - Ver quién hizo repost

**Detalles técnicos:**
- Crear tabla `reposts`: `id`, `user_id`, `post_id`, `comment`, `created_at`
- Agregar campo `repost_count` a tabla `posts`
- Incluir reposts en feed

**Frontend ya implementado:** ✅
- Componente `repost-modal.tsx`
- Botón en `post-card.tsx`

---

## 📊 RESUMEN DE PRIORIDADES

### 🔴 CRÍTICO (Implementar primero - 2-3 semanas)
1. Feed Local por Geolocalización
2. Sistema de Reacciones Múltiples
3. Sistema de Búsqueda Completo
4. Encuestas (Polls)
5. Campos Adicionales de Perfil

### 🟡 IMPORTANTE (Implementar después - 2-3 semanas)
6. Stories - Funcionalidades Adicionales
7. Grupos - Posts y Roles
8. Notificaciones - Marcar como Leída
9. Feed Personalizado
10. Sistema de Desbloqueo de Posts Premium

### 🟢 MEJORAS (Implementar al final - 2-3 semanas)
11. Analytics Avanzado
12. Configuración de Privacidad
13. Sistema de Reportes
14. Guardados/Bookmarks
15. Sistema de Repost

---

## 📝 NOTAS IMPORTANTES

### Frontend Completado ✅
El frontend tiene implementadas TODAS estas funcionalidades con:
- UI/UX completa
- Componentes React
- Hooks personalizados
- Services para API calls
- Manejo de estados
- Validaciones
- Mensajes de error/éxito

### Lo que falta es SOLO Backend
Cada card necesita:
- Endpoints REST
- Modelos/Entidades JPA
- Repositories
- Services
- Controllers
- Migraciones SQL
- Validaciones
- Tests

### Estimación Total
- **Crítico:** 2-3 semanas (5 cards)
- **Importante:** 2-3 semanas (5 cards)
- **Mejoras:** 2-3 semanas (5 cards)
- **TOTAL:** 6-9 semanas de desarrollo backend

---

## 🎯 RECOMENDACIÓN

Empezar por las **5 cards CRÍTICAS** ya que:
1. Son las más solicitadas por usuarios
2. Mejoran significativamente la experiencia
3. El frontend ya está 100% listo
4. Tienen mayor impacto en engagement

Una vez completadas las críticas, evaluar feedback de usuarios para priorizar entre IMPORTANTE y MEJORAS.
