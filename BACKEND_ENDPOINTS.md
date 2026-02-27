# Endpoints del Backend - Sparkd API

Base URL: `https://sparkd1-0.onrender.com`

## 🔐 Autenticación

### POST `/auth/register`
Registro de usuario
```json
{
  "username": "string",
  "password": "string",
  "email": "string"
}
```

### POST `/auth/login`
Inicio de sesión
```json
{
  "username": "string",
  "password": "string"
}
```

### POST `/auth/forgot-password`
Solicitud de restablecimiento de contraseña

### POST `/auth/reset-password`
Restablecer contraseña

### GET `/auth/ping`
Verificar estado del servicio

---

## 📝 Posts

### POST `/api/posts/new`
Crear un nuevo post
- **Content-Type**: `multipart/form-data`
- **Campos**:
  - `post` (string): JSON con `{body, permanent, durationHours}`
  - `file` (file, opcional): Imagen del post

```javascript
const formData = new FormData()
formData.append('post', JSON.stringify({
  body: "Contenido del post",
  permanent: true
}))
formData.append('file', imageFile) // opcional
```

### PUT `/api/posts/update/{postId}`
Actualizar un post propio

### DELETE `/api/posts/delete/{postId}`
Eliminar un post propio

### GET `/api/posts/me`
Listar mis posts

### GET `/api/posts/feed`
Ver feed global

---

## 📸 Fotos de Perfil

### POST `/api/photos/add`
Agregar foto al perfil
```json
{
  "url": "https://res.cloudinary.com/...",
  "position": 0,
  "primary": true
}
```

### PUT `/api/photos/update/{id}`
Actualizar foto del perfil

### DELETE `/api/photos/delete/{id}`
Eliminar foto del perfil

### GET `/api/photos/profile/{profileId}`
Obtener fotos de un perfil

---

## 👤 Perfil de Usuario

### POST `/api/profile`
Crear perfil

### PUT `/api/profile`
Actualizar perfil
```json
{
  "nombres": "string",
  "apellidos": "string",
  "sex": "MALE|FEMALE",
  "telefono": "string"
}
```

### GET `/api/profile/me`
Obtener mi perfil

### GET `/api/profile/{userId}`
Obtener perfil por usuario

### DELETE `/api/profile`
Eliminar perfil

---

## 💬 Comentarios

### POST `/api/comments/{postId}`
Crear un nuevo comentario

### POST `/api/comments/reply/{parentId}`
Responder a un comentario

### GET `/api/comments/{postId}/comments`
Obtener comentarios de un post

### GET `/api/comments/getcommentReply/{parentId}`
Obtener comentarios hijos

### PUT `/api/comments/update/{commentId}`
Actualizar el contenido de un comentario

### DELETE `/api/comments/delete/{commentId}`
Eliminar un comentario por su ID

---

## ❤️ Likes

### POST `/api/likes/toggle`
Agregar o remover un like

---

## 👆 Swipes

### POST `/api/swipes/perform/swipe`
Realizar swipe (like/dislike)

---

## 🔔 Notificaciones

### GET `/api/notifications/{userId}`
Obtener notificaciones de un usuario

### PUT `/api/notifications/{notificationId}/read`
Marcar notificación como leída

### DELETE `/api/notifications/{notificationId}`
Eliminar notificación

---

## 💬 Chat

### POST `/api/chat/send`
Enviar mensaje

### POST `/api/chat/open/{userId}`
Abrir o crear un chat

### GET `/api/chat/{chatId}/messages`
Obtener mensajes del chat

### GET `/api/chat/chats`
Obtener mis chats

---

## 🤝 Matches

### GET `/api/matches/my/matches`
Obtener mis matches

### POST `/api/matches/{userId}/unmatch`
Deshacer match

### POST `/api/matches/{userId}/block`
Bloquear match

### POST `/api/matches/matches/{userId}/unblock`
Desbloquear match

---

## 🎯 Intereses

### GET `/api/interests`
Obtener todos los intereses

### GET `/api/interests/me`
Obtener mis intereses

### POST `/api/interests/add/{interestId}`
Agregar interés

### POST `/api/interests/admin/create`
Crear interés (admin)

---

## ⚙️ Preferencias

### GET `/api/preferences/get/my/preferences`
Obtener mis preferencias

### POST `/api/preferences/set/preferences`
Establecer preferencias

---

## 💳 Suscripciones

### POST `/api/subscription/checkout`
Crear checkout de suscripción

### POST `/api/stripe/webhook`
Webhook de Stripe

---

## 📋 Notas Importantes

1. **Autenticación**: Todos los endpoints (excepto auth) requieren header:
   ```
   Authorization: Bearer {token}
   ```

2. **Cloudinary**: 
   - Frontend sube imágenes a Cloudinary
   - Backend recibe URLs de Cloudinary para fotos de perfil
   - Backend recibe archivos para posts (los sube a Cloudinary internamente)

3. **Content-Type**:
   - Posts: `multipart/form-data`
   - Fotos de perfil: `application/json`
   - Otros: `application/json`

4. **Errores Comunes**:
   - 401: Token inválido o expirado
   - 415: Content-Type incorrecto
   - 500: Error del servidor (revisar logs)
