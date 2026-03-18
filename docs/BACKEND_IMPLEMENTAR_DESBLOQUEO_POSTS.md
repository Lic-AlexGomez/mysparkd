# 🔓 Implementación de Desbloqueo de Posts Premium

## 📋 Resumen
Implementar la funcionalidad para que usuarios NO premium puedan desbloquear posts premium individuales mediante dos métodos:
1. **Intercambio**: Compartir un post premium propio para obtener 24h de acceso
2. **Pago individual**: Pagar $0.99 para desbloqueo permanente (opcional)

---

## 🎯 Endpoint Principal Requerido

### POST `/api/posts/{postId}/unlock`

**Descripción**: Desbloquear un post premium bloqueado

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "type": "EXCHANGE" | "PAYMENT"
}
```

**Lógica del Backend**:

#### Opción 1: EXCHANGE (Intercambio)
```java
// Pseudocódigo
if (type == "EXCHANGE") {
    // 1. Verificar que el usuario NO sea premium
    if (user.isPremium()) {
        throw new BadRequestException("Los usuarios premium tienen acceso ilimitado");
    }
    
    // 2. Verificar que el usuario tenga al menos 1 post premium propio
    List<Post> userPremiumPosts = postRepository.findByUserIdAndLocked(userId, true);
    if (userPremiumPosts.isEmpty()) {
        throw new BadRequestException("Debes tener al menos un post premium para intercambiar");
    }
    
    // 3. Crear registro de desbloqueo temporal (24 horas)
    PostUnlock unlock = new PostUnlock();
    unlock.setUserId(userId);
    unlock.setPostId(postId);
    unlock.setUnlockType("EXCHANGE");
    unlock.setExpiresAt(LocalDateTime.now().plusHours(24));
    postUnlockRepository.save(unlock);
    
    return ResponseEntity.ok(Map.of(
        "message", "Post desbloqueado por 24 horas",
        "expiresAt", unlock.getExpiresAt()
    ));
}
```

#### Opción 2: PAYMENT (Pago Individual)
```java
// Pseudocódigo
if (type == "PAYMENT") {
    // 1. Verificar que el usuario NO sea premium
    if (user.isPremium()) {
        throw new BadRequestException("Los usuarios premium tienen acceso ilimitado");
    }
    
    // 2. Integrar con Stripe para cobrar $0.99
    // (Implementación similar a la suscripción premium)
    
    // 3. Crear registro de desbloqueo permanente
    PostUnlock unlock = new PostUnlock();
    unlock.setUserId(userId);
    unlock.setPostId(postId);
    unlock.setUnlockType("PAYMENT");
    unlock.setExpiresAt(null); // null = permanente
    postUnlockRepository.save(unlock);
    
    return ResponseEntity.ok(Map.of(
        "message", "Post desbloqueado permanentemente"
    ));
}
```

**Response Success (200)**:
```json
{
  "message": "Post desbloqueado por 24 horas",
  "expiresAt": "2024-01-15T10:30:00"
}
```

**Response Errors**:
- `400`: Usuario premium o sin posts para intercambiar
- `404`: Post no encontrado
- `409`: Post ya desbloqueado

---

## 🗄️ Nueva Entidad: PostUnlock

```java
@Entity
@Table(name = "post_unlocks")
public class PostUnlock {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false)
    private String postId;
    
    @Column(nullable = false)
    private String unlockType; // "EXCHANGE" o "PAYMENT"
    
    @Column
    private LocalDateTime expiresAt; // null = permanente
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // Getters y Setters
}
```

---

## 🔄 Modificación en GET `/api/posts/feed`

**Agregar lógica para verificar desbloqueos**:

```java
// Pseudocódigo
for (Post post : posts) {
    if (post.isLocked()) {
        boolean isOwner = post.getUserId().equals(currentUserId);
        boolean isPremium = currentUser.isPremium();
        
        // Verificar si el usuario desbloqueó este post
        PostUnlock unlock = postUnlockRepository
            .findByUserIdAndPostId(currentUserId, post.getId())
            .orElse(null);
        
        boolean isUnlocked = false;
        if (unlock != null) {
            // Verificar si no ha expirado
            if (unlock.getExpiresAt() == null || 
                unlock.getExpiresAt().isAfter(LocalDateTime.now())) {
                isUnlocked = true;
            }
        }
        
        // Agregar campos al response
        post.setUnlocked(isOwner || isPremium || isUnlocked);
        post.setCanUnlock(!isPremium && !isOwner && !isUnlocked);
    }
}
```

---

## 📊 Tabla de Base de Datos

```sql
CREATE TABLE post_unlocks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    unlock_type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id),
    
    UNIQUE KEY unique_user_post (user_id, post_id)
);

CREATE INDEX idx_user_unlocks ON post_unlocks(user_id);
CREATE INDEX idx_post_unlocks ON post_unlocks(post_id);
CREATE INDEX idx_expires_at ON post_unlocks(expires_at);
```

---

## 🧪 Casos de Prueba

### Test 1: Intercambio exitoso
```
POST /api/posts/{postId}/unlock
Body: { "type": "EXCHANGE" }
Precondiciones:
- Usuario NO premium
- Usuario tiene al menos 1 post premium
- Post no está desbloqueado
Resultado esperado: 200 OK, post desbloqueado por 24h
```

### Test 2: Usuario sin posts premium
```
POST /api/posts/{postId}/unlock
Body: { "type": "EXCHANGE" }
Precondiciones:
- Usuario NO premium
- Usuario NO tiene posts premium
Resultado esperado: 400 Bad Request
```

### Test 3: Usuario premium intenta desbloquear
```
POST /api/posts/{postId}/unlock
Body: { "type": "EXCHANGE" }
Precondiciones:
- Usuario ES premium
Resultado esperado: 400 Bad Request (no necesita desbloquear)
```

### Test 4: Verificar expiración
```
GET /api/posts/feed
Precondiciones:
- Usuario desbloqueó post hace 25 horas (expirado)
Resultado esperado: post.unlocked = false
```

---

## 🚀 Prioridad de Implementación

### Fase 1 (Esencial) ✅
1. Crear entidad `PostUnlock`
2. Implementar endpoint POST `/api/posts/{postId}/unlock` con tipo EXCHANGE
3. Modificar GET `/api/posts/feed` para verificar desbloqueos
4. Agregar limpieza automática de desbloqueos expirados (cron job)

### Fase 2 (Opcional) 🔄
1. Implementar tipo PAYMENT con integración Stripe
2. Agregar límites (ej: máximo 3 intercambios por día)
3. Agregar estadísticas de desbloqueos

---

## 📝 Notas Adicionales

1. **Limpieza de datos**: Crear un cron job que elimine registros expirados:
   ```java
   @Scheduled(cron = "0 0 * * * *") // Cada hora
   public void cleanExpiredUnlocks() {
       postUnlockRepository.deleteByExpiresAtBefore(LocalDateTime.now());
   }
   ```

2. **Límites de intercambio**: Considerar agregar límite de intercambios por día para evitar abuso

3. **Notificaciones**: Cuando alguien desbloquea tu post, podrías notificar al creador

4. **Analytics**: Trackear qué posts son más desbloqueados para insights

---

## ✅ Checklist de Implementación

- [ ] Crear entidad `PostUnlock` y repositorio
- [ ] Crear tabla `post_unlocks` en base de datos
- [ ] Implementar endpoint POST `/api/posts/{postId}/unlock`
- [ ] Modificar GET `/api/posts/feed` para incluir estado de desbloqueo
- [ ] Agregar validaciones (usuario no premium, tiene posts, etc.)
- [ ] Implementar cron job de limpieza
- [ ] Crear tests unitarios
- [ ] Crear tests de integración
- [ ] Documentar en Swagger/OpenAPI
- [ ] Actualizar BACKEND_ENDPOINTS.md

---

## 🔗 Referencias

- Documento original: `TODO_POSTS_PREMIUM_BLOQUEADOS.txt`
- Endpoints actuales: `BACKEND_ENDPOINTS.md`
- Frontend implementado en: `components/feed/unlock-post-modal.tsx`
