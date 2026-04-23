# Memoria del Proyecto Sparkd

Última actualización: 2026-04-22

---

## Arquitectura del Proyecto

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS + Radix UI
- **Backend:** Spring Boot (Java) + PostgreSQL + Redis
- **Tiempo real:** WebSocket STOMP
- **Hosting:** Frontend en Render/Netlify, Backend en Render

---

## Sesión Actual: 2026-04-22

**Tema:** Sistema de Follows con cuentas privadas

**Problema:** Al seguir una cuenta privada, el botón seguía diciendo "Siguiendo" en lugar de "Solicitado"

**Solución implementada:**
1. Agregado estado `pending` en `[userId]/page.tsx`
2. Agregado método `isPending()` en `follow.ts`
3. Botón muestra:
   - "Seguir" (cuenta pública, no sigues)
   - "Siguiendo" (ya seguiste)
   - "Solicitado" (cuenta privada, enviaste solicitud) con ícono 🕒 Clock
4. Restringido Like y Message para cuentas privadas sin aceptación

---

## Decisiones Importantes

| Fecha | Decisión |
|-------|---------|
| 2026-04-22 | Botón "Solicitado" para cuentas privadas |
| 2026-04-18 | Voice note: fix duración (3:46 → 0:03) |
| 2026-04-18 | Perfil visibility: switch PUBLIC/PRIVATE |
| 2026-04-12 | Workaround coords null (fallback 0.0) |
| 2026-03-23 | Présencia online via REST + WS |

---

## Pendientes del Backend (Trello)

1. **Contadores de followers** → `UserProfileResponseDTO` necesita `followersCount` y `followingCount`
2. **Lista de requests** → `GET /api/follow/requests`
3. **Lista de followers** → `GET /api/follow/followers/{userId}`
4. **Lista de following** → `GET /api/follow/following/{userId}`
5. **Campo `read` en mensaje** → `MessageResponseDTO` para ticks ✓✓ azul

---

## Bugs Conocidos

- [ ] Bio no se guarda (falta `setBio()` en backend)
- [ ] Ticks leído no funciona (backend no expone `read`)
- [ ] Contadores de followers simulados en localStorage

---

## Notas para Próxima Sesión

1. El botón "Solicitado" ya está implementado
2. Para probar: crear cuenta privada, seguir desde otra cuenta, ver el botón
3. El backend guarda follow como PENDING para cuentas privadas

---

## Estructura de Archivos Clave

```
Frontend (v0-social/):
├── app/(app)/profile/[userId]/page.tsx  ← perfil público
├── app/(app)/profile/edit/page.tsx    ← edición perfil
├── lib/services/follow.ts             ← servicio de follows
├── components/ui/voice-note.tsx         ← nota de voz
├── hooks/use-websocket.ts             ← WebSocket
└── q-dev-chat-*.md                 ← historial de sesiones

Backend (Sparkd1.0/):
├── Controllers/FollowController.java
├── Service/FollowService.java
├── DTOs/UserProfileResponseDTO.java
└── Service/UserProfileService.java
```

---

*Actualizar este archivo al final de cada sesión*