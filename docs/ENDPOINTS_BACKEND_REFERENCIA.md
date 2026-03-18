# 🔌 ENDPOINTS DEL BACKEND - REFERENCIA RÁPIDA

## 🎭 REACCIONES (NUEVO)

### Toggle Reacción
```http
POST /api/reactions/toggle
Content-Type: application/json

{
  "targetId": "post-123",
  "targetType": "POST",        // POST | COMMENT | REPLY
  "reactionType": "LIKE"       // LIKE | LOVE | LAUGH | WOW | SAD | FIRE
}

Response:
{
  "userReacted": true,
  "message": "Reacción agregada"
}
```

### Obtener Estado de Reacción del Usuario
```http
GET /api/reactions/status/{targetId}?targetType=POST

Response:
{
  "userReacted": true,
  "reactionType": "LOVE"
}
```

### Obtener Resumen de Reacciones
```http
GET /api/reactions/summary/{targetId}?targetType=POST

Response:
{
  "LIKE": { "count": 10, "userReacted": false },
  "LOVE": { "count": 5, "userReacted": true },
  "LAUGH": { "count": 2, "userReacted": false },
  "WOW": { "count": 1, "userReacted": false },
  "SAD": { "count": 0, "userReacted": false },
  "FIRE": { "count": 3, "userReacted": false }
}
```

### Obtener Usuarios que Reaccionaron
```http
GET /api/reactions/users/{targetId}?targetType=POST&reactionType=LIKE

Response:
[
  {
    "userId": "user-123",
    "username": "johndoe",
    "photoUrl": "https://...",
    "reactionType": "LIKE",
    "reactedAt": "2026-03-09T12:00:00Z"
  }
]
```

---

## 📍 FEED LOCAL (NUEVO)

### Actualizar Ubicación del Usuario
```http
POST /api/feed/location/{userId}
Content-Type: application/json

{
  "latitude": 18.4861,
  "longitude": -69.9312
}

Response:
{
  "message": "Ubicación actualizada",
  "latitude": 18.4861,
  "longitude": -69.9312
}
```

### Obtener Feed Local
```http
GET /api/feed/local/{userId}?radiusKm=50

Response:
[
  {
    "id": "post-123",
    "body": "Post de alguien cerca",
    "userId": "user-456",
    "username": "nearby_user",
    "distance": 12.5,  // km
    "createdAt": "2026-03-09T12:00:00Z",
    // ... resto de campos del post
  }
]
```

### Obtener Feed Global (Existente)
```http
GET /api/feed/global/{userId}

Response:
[
  {
    "id": "post-123",
    "body": "Post global",
    // ... campos del post
  }
]
```

---

## 📝 POSTS (ACTUALIZADO)

### Crear Post
```http
POST /api/posts
Content-Type: application/json

{
  "body": "Mi nuevo post",
  "file": "https://cloudinary.com/image.jpg",  // opcional
  "permanent": false,
  "durationHours": 24,                         // opcional, si permanent=false
  "locked": false,                             // NUEVO
  "privat_e": false,                           // DEPRECATED
  "visibility": "PUBLIC"                       // NUEVO: PUBLIC | FOLLOWERS | PRIVATE
}

Response:
{
  "id": "post-123",
  "body": "Mi nuevo post",
  "file": "https://cloudinary.com/image.jpg",
  "permanent": false,
  "expiresAt": "2026-03-10T12:00:00Z",
  "locked": false,
  "visibility": "PUBLIC",
  "viewCount": 0,
  "shareCount": 0,
  "likeCount": 0,
  "commentsCount": 0,
  "reactions": {},
  "userReaction": null,
  "createdAt": "2026-03-09T12:00:00Z",
  "userId": "user-123",
  "username": "johndoe"
}
```

### Obtener Posts del Usuario
```http
GET /api/posts/user/{userId}

Response:
[
  {
    "id": "post-123",
    "body": "Post del usuario",
    "visibility": "PUBLIC",
    "locked": false,
    "viewCount": 150,
    "shareCount": 10,
    "reactions": {
      "LIKE": { "count": 20, "userReacted": true },
      "LOVE": { "count": 5, "userReacted": false }
    },
    // ... resto de campos
  }
]
```

---

## 💬 COMENTARIOS (ACTUALIZADO)

### Crear Comentario
```http
POST /api/comments/{postId}
Content-Type: application/json

{
  "text": "Mi comentario"
}

Response:
{
  "commentsId": "comment-123",
  "text": "Mi comentario",
  "userId": "user-123",
  "username": "johndoe",
  "likeCount": 0,
  "reactions": {},
  "userReaction": null,
  "createdAt": "2026-03-09T12:00:00Z"
}
```

### Obtener Comentarios
```http
GET /api/comments/{postId}

Response:
[
  {
    "commentsId": "comment-123",
    "text": "Comentario",
    "reactions": {
      "LIKE": { "count": 5, "userReacted": false },
      "LOVE": { "count": 2, "userReacted": true }
    },
    "userReaction": "LOVE",
    "commentReplies": 3,
    // ... resto de campos
  }
]
```

---

## 👥 SWIPES (ACTUALIZADO)

### Hacer Swipe
```http
POST /api/swipes
Content-Type: application/json

{
  "targetUserId": "user-456",
  "type": "LIKE"  // LIKE | DISLIKE
}

Response (Usuario Free - Límite alcanzado):
{
  "error": "Límite de swipes diarios alcanzado",
  "remainingSwipes": 0,
  "resetAt": "2026-03-10T00:00:00Z",
  "isPremium": false
}

Response (Swipe exitoso):
{
  "match": true,
  "message": "¡Es un match!",
  "remainingSwipes": 7,
  "matchId": "match-123"
}
```

### Obtener Swipes Restantes
```http
GET /api/swipes/remaining/{userId}

Response:
{
  "remainingSwipes": 7,
  "totalSwipes": 10,
  "isPremium": false,
  "resetAt": "2026-03-10T00:00:00Z"
}
```

---

## 🔐 AUTENTICACIÓN (Sin cambios)

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "username": "johndoe",
  "message": "Usuario registrado exitosamente"
}
```

---

## 👤 PERFIL (Sin cambios importantes)

### Obtener Perfil
```http
GET /api/profile

Headers:
Authorization: Bearer {token}

Response:
{
  "userId": "user-123",
  "username": "johndoe",
  "nombres": "John",
  "apellidos": "Doe",
  "premium": false,
  "photos": [...],
  "posts": [...],
  // ... resto de campos
}
```

### Actualizar Perfil
```http
PUT /api/profile
Content-Type: application/json

{
  "nombres": "John",
  "apellidos": "Doe",
  "sex": "MALE",
  "telefono": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "coverPhoto": "https://cloudinary.com/cover.jpg"  // opcional
}

Response:
{
  "message": "Perfil actualizado",
  "user": { ... }
}
```

---

## 📊 ESTADÍSTICAS (NUEVO)

### Obtener Estadísticas de Post
```http
GET /api/posts/{postId}/stats

Response:
{
  "viewCount": 150,
  "shareCount": 10,
  "reactions": {
    "LIKE": 20,
    "LOVE": 5,
    "LAUGH": 3,
    "WOW": 1,
    "SAD": 0,
    "FIRE": 7
  },
  "commentsCount": 15,
  "totalEngagement": 211
}
```

---

## ⚠️ ENDPOINTS ELIMINADOS

Estos endpoints YA NO FUNCIONAN:

```
❌ POST /api/likes/{postId}
❌ DELETE /api/likes/{postId}
❌ GET /api/likes/{postId}
❌ GET /api/likes/user/{userId}
❌ POST /api/post-likes/{postId}
```

**Usar en su lugar:** `/api/reactions/*`

---

## 🔑 HEADERS REQUERIDOS

Todos los endpoints (excepto auth) requieren:

```http
Authorization: Bearer {token}
Content-Type: application/json
```

---

## 🌐 BASE URL

```
Desarrollo: http://localhost:8080
Producción: https://api.sparkd.app
```

---

## 📝 NOTAS IMPORTANTES

1. **Reacciones**: El toggle es automático. Si el usuario ya tiene esa reacción, se quita. Si tiene otra, se cambia.

2. **Feed Local**: Requiere que el usuario haya compartido su ubicación primero con `POST /api/feed/location/{userId}`

3. **Visibilidad**: Posts con `visibility: PRIVATE` solo son visibles para el creador.

4. **Swipes**: El límite se resetea a medianoche (00:00 hora del servidor).

5. **OpenAI**: Si un post/comentario es rechazado por moderación, el backend retorna error 400 con mensaje descriptivo.

---

## 🧪 EJEMPLOS DE USO

### Ejemplo 1: Dar Like a un Post
```typescript
import { reactionService } from '@/lib/services/reaction'

await reactionService.toggleReaction('post-123', 'POST', 'LIKE')
```

### Ejemplo 2: Obtener Feed Local
```typescript
import { locationService } from '@/lib/services/location'

// 1. Actualizar ubicación
await locationService.updateLocation('user-123', {
  latitude: 18.4861,
  longitude: -69.9312
})

// 2. Obtener feed local (50km)
const posts = await locationService.getLocalFeed('user-123', 50)
```

### Ejemplo 3: Crear Post con Visibilidad
```typescript
import { api } from '@/lib/api'

await api.post('/api/posts', {
  body: 'Mi post privado',
  permanent: false,
  durationHours: 24,
  locked: false,
  visibility: 'FOLLOWERS'
})
```

---

## 🆘 ERRORES COMUNES

### Error 401: Unauthorized
- Token expirado o inválido
- Solución: Hacer login nuevamente

### Error 400: Límite de swipes alcanzado
- Usuario free sin swipes restantes
- Solución: Mostrar mensaje y ofrecer premium

### Error 400: Contenido rechazado por moderación
- OpenAI detectó contenido inapropiado
- Solución: Mostrar mensaje al usuario

### Error 404: Post no encontrado
- Post eliminado o no existe
- Solución: Refrescar feed

---

Última actualización: 09/03/2026
