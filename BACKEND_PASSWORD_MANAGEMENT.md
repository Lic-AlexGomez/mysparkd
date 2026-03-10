# Sistema de Gestión de Contraseñas

## ✅ Funcionalidades Implementadas

### 1. Recuperación de Contraseña (Forgot Password)

**Backend:**
- Endpoint: `POST /auth/forgot-password`
- Servicio: `AuthService.processForgotPassword(String email)`
- Genera token JWT temporal (15 min)
- Envía email con link de recuperación

**Frontend:**
- Página: `/forgot-password`
- Formulario con campo de email
- Validación y feedback visual
- Redirección a login después de enviar

**Flujo:**
```
Usuario ingresa email
    ↓
Backend valida email existe
    ↓
Genera token JWT (15 min)
    ↓
Envía email con link
    ↓
Usuario recibe email
    ↓
Click en link → /reset-password?token=xxx
```

---

### 2. Restablecer Contraseña (Reset Password)

**Backend:**
- Endpoint: `POST /auth/reset-password`
- Servicio: `AuthService.resetPassword(String token, String newPassword)`
- Valida token JWT
- Actualiza contraseña en DB

**Frontend:**
- Página: `/reset-password?token=xxx`
- Formulario con:
  - Nueva contraseña
  - Confirmar contraseña
- Validaciones:
  - Mínimo 6 caracteres
  - Contraseñas coinciden
- Redirección a login después de actualizar

**Flujo:**
```
Usuario abre link del email
    ↓
Ingresa nueva contraseña (2 veces)
    ↓
Frontend valida (min 6 chars, coinciden)
    ↓
Backend valida token JWT
    ↓
Actualiza contraseña (bcrypt)
    ↓
Redirección a /login
```

---

### 3. Cambiar Contraseña (Change Password) ⭐ NUEVO

**Backend:**
- Endpoint: `POST /api/profile/change-password`
- Servicio: `AuthService.changePassword(Jwt jwt, String currentPassword, String newPassword)`
- Validaciones:
  - Usuario autenticado (JWT)
  - Contraseña actual correcta
  - Nueva contraseña mínimo 6 caracteres

**Frontend:**
- Ubicación: `/settings` (sección Cuenta)
- Botón "Cambiar contraseña" con icono de llave
- Formulario expandible con:
  - Contraseña actual
  - Nueva contraseña
  - Confirmar nueva contraseña
- Validaciones:
  - Todos los campos requeridos
  - Mínimo 6 caracteres
  - Contraseñas coinciden
- Feedback con toast notifications

**Flujo:**
```
Usuario logueado va a Settings
    ↓
Click en "Cambiar contraseña"
    ↓
Ingresa contraseña actual
    ↓
Ingresa nueva contraseña (2 veces)
    ↓
Frontend valida campos
    ↓
Backend verifica contraseña actual
    ↓
Backend actualiza contraseña (bcrypt)
    ↓
Toast de éxito + cierra formulario
```

---

## Endpoints Backend

```java
// Recuperación de contraseña
POST /auth/forgot-password
Body: { "email": "user@example.com" }
Response: "Revisa tu correo para restablecer la contraseña."

// Restablecer contraseña
POST /auth/reset-password
Body: { "token": "jwt-token", "newPassword": "newpass123" }
Response: "Contraseña actualizada correctamente."

// Cambiar contraseña (requiere autenticación)
POST /api/profile/change-password
Headers: Authorization: Bearer <jwt-token>
Body: { "currentPassword": "oldpass", "newPassword": "newpass123" }
Response: { "message": "Contraseña actualizada correctamente" }
```

---

## Seguridad

✅ **Encriptación:** Todas las contraseñas se guardan con BCrypt
✅ **Tokens temporales:** JWT con expiración de 15 minutos para reset
✅ **Validación de contraseña actual:** Requerida para cambiar contraseña
✅ **Autenticación:** Cambio de contraseña requiere JWT válido
✅ **Validación de longitud:** Mínimo 6 caracteres
✅ **Confirmación:** Doble entrada para evitar errores

---

## Mensajes de Error

**Frontend:**
- "Completa todos los campos"
- "La nueva contraseña debe tener al menos 6 caracteres"
- "Las contraseñas no coinciden"
- "Error al cambiar contraseña"

**Backend:**
- "Usuario no encontrado"
- "Token inválido o expirado"
- "Contraseña actual incorrecta"
- "La nueva contraseña debe tener al menos 6 caracteres"

---

## Configuración Requerida

### Backend (application.properties)
```properties
# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

# JWT
jwt.secret=${JWT_SECRET}
jwt.expiration=36000000
```

### Frontend (.env.local)
No requiere configuración adicional, usa el proxy `/api/proxy`

---

## Testing

### Forgot Password
1. Ir a `/forgot-password`
2. Ingresar email registrado
3. Verificar email recibido
4. Click en link del email

### Reset Password
1. Abrir link del email
2. Ingresar nueva contraseña (2 veces)
3. Verificar redirección a login
4. Login con nueva contraseña

### Change Password
1. Login en la app
2. Ir a `/settings`
3. Click en "Cambiar contraseña"
4. Ingresar contraseña actual
5. Ingresar nueva contraseña (2 veces)
6. Verificar toast de éxito
7. Logout y login con nueva contraseña

---

## Archivos Modificados

### Backend
- `AuthService.java` - Agregado método `changePassword()`
- `UserProfileController.java` - Agregado endpoint `/change-password`

### Frontend
- `settings/page.tsx` - Agregado formulario de cambio de contraseña
- `forgot-password/page.tsx` - Ya existente
- `reset-password/page.tsx` - Ya existente

---

## Estado Final

✅ Forgot Password - Implementado y funcionando
✅ Reset Password - Implementado y funcionando
✅ Change Password - Implementado y funcionando
✅ Validaciones - Frontend y Backend
✅ Seguridad - BCrypt + JWT
✅ UX - Feedback visual con toasts
