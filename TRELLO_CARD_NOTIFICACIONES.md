# 🔔 CARD TRELLO: Sistema de Notificaciones

## 📋 Título de la Card
**Sistema de Notificaciones - Mejoras y Funcionalidades Faltantes**

---

## 📝 Descripción

Implementar y mejorar el sistema de notificaciones para que sea completamente funcional con el backend. Actualmente el frontend tiene la UI completa pero faltan endpoints y funcionalidades en el backend.

---

## ✅ Estado Actual (Frontend)

### Implementado ✅
- ✅ Página de notificaciones (`/notifications`)
- ✅ UI completa con lista de notificaciones
- ✅ Indicador visual de leído/no leído
- ✅ Navegación según tipo de notificación
- ✅ Botón para eliminar notificaciones
- ✅ Botón para marcar como leída
- ✅ Formato de fecha relativa ("hace 2 horas")
- ✅ Fallback a notificaciones locales si backend falla
- ✅ Tipos de notificaciones: like, comment, follow, match, reaction

### Endpoint Actual
```
GET /api/notifications/{userId}
```

---

## 🔴 Funcionalidades Faltantes en Backend

### 1. Marcar Notificación como Leída
**Endpoint necesario:**
```
PUT /api/notifications/{notificationId}/read
```

**Request:** Ninguno (solo el ID en la URL)

**Response:**
```json
{
  "notificationId": "uuid",
  "read": true
}
```

**Descripción:**
- Marcar una notificación específica como leída
- Actualizar campo `read` a `true` en la base de datos
- Retornar la notificación actualizada

---

### 2. Marcar Todas como Leídas
**Endpoint necesario:**
```
PUT /api/notifications/read-all
```

**Request:** Ninguno (usuario del JWT)

**Response:**
```json
{
  "message": "Todas las notificaciones marcadas como leídas",
  "count": 15
}
```

**Descripción:**
- Marcar todas las notificaciones del usuario como leídas
- Útil para botón "Marcar todas como leídas"

---

### 3. Obtener Contador de No Leídas
**Endpoint necesario:**
```
GET /api/notifications/unread-count
```

**Response:**
```json
{
  "count": 5
}
```

**Descripción:**
- Retornar cantidad de notificaciones no leídas
- Para mostrar badge en el icono de notificaciones
- Actualizar en tiempo real con WebSocket (opcional)

---

### 4. Mejorar Estructura de Respuesta
**Endpoint actual:** `GET /api/notifications/{userId}`

**Problema actual:**
El backend retorna:
```json
{
  "senderId": "uuid",
  "senderUsername": "string",
  "type": "string",
  "data": "string",
  "read": false,
  "createdAt": "timestamp",
  "targetId": "uuid",  // ❌ A veces null
  "targetType": "string"  // ❌ A veces null
}
```

**Mejorar a:**
```json
{
  "notificationId": "uuid",  // ✅ ID único de la notificación
  "type": "LIKE|COMMENT|FOLLOW|MATCH|REACTION",
  "message": "Juan le dio like a tu post",
  "read": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "relatedUserId": "uuid",  // Usuario que generó la notificación
  "relatedUsername": "juan123",
  "relatedUserPhoto": "https://...",  // ✅ Agregar foto
  "targetId": "uuid",  // ✅ Siempre presente (post/comment/user)
  "targetType": "POST|COMMENT|USER"  // ✅ Siempre presente
}
```

---

### 5. Filtrar Notificaciones por Tipo
**Endpoint necesario:**
```
GET /api/notifications?type={type}&read={boolean}
```

**Query params:**
- `type` (opcional): LIKE, COMMENT, FOLLOW, MATCH, REACTION
- `read` (opcional): true/false

**Response:**
```json
[
  {
    "notificationId": "uuid",
    "type": "LIKE",
    ...
  }
]
```

**Descripción:**
- Filtrar notificaciones por tipo
- Filtrar por leídas/no leídas
- Útil para tabs en el frontend

---

### 6. Paginación
**Endpoint mejorado:**
```
GET /api/notifications?page={page}&size={size}
```

**Response:**
```json
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 15,
  "currentPage": 0,
  "size": 10
}
```

**Descripción:**
- Implementar paginación para muchas notificaciones
- Evitar cargar todas a la vez

---

### 7. Notificaciones en Tiempo Real (WebSocket)
**Endpoint WebSocket:**
```
/ws/notifications
```

**Suscripción:**
```
/user/queue/notifications
```

**Mensaje:**
```json
{
  "notificationId": "uuid",
  "type": "LIKE",
  "message": "María le dio like a tu post",
  "createdAt": "2024-01-15T10:30:00Z",
  ...
}
```

**Descripción:**
- Enviar notificaciones en tiempo real vía WebSocket
- Actualizar contador sin recargar página
- Mostrar toast cuando llega nueva notificación

---

## 🗄️ Cambios en Base de Datos

### Tabla `notifications` (si no existe)
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    sender_id UUID REFERENCES users(user_id),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    target_id UUID,
    target_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_read (user_id, read),
    INDEX idx_created_at (created_at DESC)
);
```

### Campos a agregar (si faltan)
- `id` - UUID único de la notificación
- `read` - Boolean para marcar como leída
- `target_id` - ID del objeto relacionado (post, comment, user)
- `target_type` - Tipo del objeto (POST, COMMENT, USER)

---

## 🎯 Prioridad

### 🔴 ALTA (Implementar primero)
1. ✅ Marcar notificación como leída
2. ✅ Mejorar estructura de respuesta (incluir targetId siempre)
3. ✅ Contador de no leídas

### 🟡 MEDIA (Implementar después)
4. ✅ Marcar todas como leídas
5. ✅ Filtrar por tipo
6. ✅ Paginación

### 🟢 BAJA (Opcional)
7. ✅ WebSocket en tiempo real
8. ✅ Notificaciones push (Firebase)

---

## 📱 Mejoras en Frontend (Futuras)

### 1. Badge de Contador
```tsx
<Bell className="h-5 w-5" />
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
    {unreadCount > 9 ? '9+' : unreadCount}
  </span>
)}
```

### 2. Tabs de Filtrado
```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="all">Todas</TabsTrigger>
    <TabsTrigger value="likes">Likes</TabsTrigger>
    <TabsTrigger value="comments">Comentarios</TabsTrigger>
    <TabsTrigger value="follows">Seguidores</TabsTrigger>
  </TabsList>
</Tabs>
```

### 3. Botón "Marcar todas como leídas"
```tsx
<Button onClick={markAllAsRead}>
  <CheckCheck className="h-4 w-4 mr-2" />
  Marcar todas como leídas
</Button>
```

### 4. Toast de Nueva Notificación
```tsx
// Cuando llega notificación por WebSocket
toast.info(notification.message, {
  action: {
    label: 'Ver',
    onClick: () => router.push(getNotificationUrl(notification))
  }
})
```

---

## 🧪 Testing

### Casos de Prueba
1. ✅ Crear notificación cuando alguien da like
2. ✅ Crear notificación cuando alguien comenta
3. ✅ Crear notificación cuando alguien te sigue
4. ✅ Crear notificación cuando hay match
5. ✅ Marcar como leída funciona correctamente
6. ✅ Eliminar notificación funciona
7. ✅ Contador se actualiza correctamente
8. ✅ Navegación a post/perfil funciona
9. ✅ Paginación carga más notificaciones
10. ✅ WebSocket envía notificaciones en tiempo real

---

## 📊 Estimación de Tiempo

- **Marcar como leída:** 2 horas
- **Mejorar estructura:** 3 horas
- **Contador no leídas:** 1 hora
- **Marcar todas:** 1 hora
- **Filtros:** 2 horas
- **Paginación:** 2 horas
- **WebSocket:** 4 horas
- **Testing:** 3 horas

**Total estimado:** 18 horas (2-3 días)

---

## 🔗 Archivos Relacionados

### Frontend
- `app/(app)/notifications/page.tsx` - Página principal
- `lib/services/notification.ts` - Service de notificaciones
- `lib/types.ts` - Tipos de notificaciones

### Backend (a crear/modificar)
- `NotificationsController.java` - Endpoints
- `NotificationsService.java` - Lógica de negocio
- `Notifications.java` - Modelo
- `NotificationsRepository.java` - Repositorio

---

## ✨ Beneficios

✅ **Mejor experiencia de usuario:** Notificaciones en tiempo real
✅ **Engagement:** Los usuarios vuelven cuando reciben notificaciones
✅ **Organización:** Filtros y paginación para muchas notificaciones
✅ **Performance:** Contador sin cargar todas las notificaciones
✅ **Interactividad:** WebSocket para actualizaciones instantáneas

---

## 📌 Notas Adicionales

- El frontend ya está 100% preparado para recibir estas funcionalidades
- Solo se necesita implementar los endpoints en el backend
- La estructura de datos actual del backend necesita mejoras
- WebSocket ya está configurado en el backend para chat, se puede reutilizar
- Firebase Push Notifications ya está integrado, se puede usar para notificaciones móviles

---

## 🎯 Criterios de Aceptación

- [ ] Usuario puede marcar notificación como leída
- [ ] Usuario puede marcar todas como leídas
- [ ] Se muestra contador de no leídas en el icono
- [ ] Notificaciones incluyen foto del usuario
- [ ] targetId y targetType siempre están presentes
- [ ] Navegación a post/perfil funciona correctamente
- [ ] Se pueden filtrar notificaciones por tipo
- [ ] Hay paginación para muchas notificaciones
- [ ] (Opcional) Notificaciones llegan en tiempo real
- [ ] (Opcional) Push notifications en móvil
