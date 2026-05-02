# Exportación de conversación — 2026-05-01

Documento generado a partir del hilo en Cursor: decisiones, cambios de código, auditoría FE/BE y tarjetas Trello.

---

## 1. Dashboard / navegación (integración)

**Objetivo:** Reducir altura del header/nav y ocultar el texto técnico largo (APIs).

**Cambios:**
- `components/admin-panel.tsx` — Se quitó el subtítulo bajo el título de sección (`detail` de integración / Sparkd).
- `components/dashboard/integration-banner.tsx` — Ya no se muestra el párrafo `detail`; padding reducido (`py-3.5` → `py-2.5`). La prop `detail` se acepta como `_detail` para no romper llamadas.

---

## 2. Error `MiniBar is not defined` (`admin-content.tsx`)

**Causa:** Uso de `<MiniBar />` sin import desde `./shared` (o bundle antiguo).

**Cambios:**
- `components/dashboard/sections/admin-content.tsx` — Import de `MiniBar`; serie `postsSparkline` (últimos 14 puntos); mini barras bajo “Posts nuevos por día” antes del área chart.
- `components/dashboard/sections/shared.tsx` — `MiniBar`: si `data` vacío retorna `null`; `max = Math.max(...data, 1)` para evitar división por cero.

---

## 3. Proxy de eventos: solo Sparkd

**Objetivo:** Dejar de enviar `GET /api/events*` a un backend externo de solo lectura.

**Cambio:** `app/api/proxy/[...path]/route.ts`
- Comentado `EVENTS_READONLY_BACKEND_URL` / `NEXT_PUBLIC_READONLY_EVENTS_API_URL`.
- Todas las rutas usan `PRIMARY_BACKEND_URL` (`NEXT_PUBLIC_API_URL`).

---

## 4. Evento detalle — `404` en `group/members` y `group/messages`

**Diagnóstico:** El front llama rutas correctas vía proxy. El 404 viene del backend desplegado o permisos; en el repo Sparkd local `EventGroupController` **sí** define `GET .../group/messages` y `GET .../group/members`.

**Cambio FE:** `app/(app)/events/[eventId]/page.tsx`
- Carga `getById` primero.
- Mensajes y miembros en `try/catch`; si `ApiError` con status **404**, listas vacías y `toast.message` con id `event-group-endpoints-missing` (sin redirigir a `/events`).

**Trello (creada en su momento):**  
https://trello.com/c/PuvVbAQf — Si el backend local ya tiene los endpoints, esta card conviene **archivar** o convertir en “verificar despliegue Render”.

---

## 5. Auditoría FE vs backend Sparkd1.0

**Backend de referencia:** `C:\Sparkd1.0-desarrollo (1)\Sparkd1.0` (controladores Java).

**Conclusión:** No abrir cards para analytics admin, admin users, grupo evento (código presente). Huecos reales respecto a lo que el FE llama:

| Tema | FE | BE (ausente o incompleto) |
|------|----|---------------------------|
| Notificaciones | `GET /api/notifications/{userId}/count` | No hay endpoint REST (existe lógica en Java sin mapear) |
| Notificaciones | `POST /api/notifications/create` (`lib/utils/notifications.ts`) | No existe en controller |
| Reacciones | `GET /api/likes/users/{targetId}` | No en `ReactionsController` |
| Fotos | `PUT /api/photos/reorder` (`profile/page.tsx`) | No en `ProfilePhotosController` |

**Script:** `node scripts/trello-fe-be-gap-cards.mjs` — creó 4 cards (la quinta sobre DELETE foto se retiró del script tras el fix FE).

**URLs Trello creadas:**
- https://trello.com/c/uUlWpzTQ — count no leídas  
- https://trello.com/c/KNozyeLR — POST create vs FE  
- https://trello.com/c/fmbAZTLT — likes users por target  
- https://trello.com/c/g1f3wbLk — PUT photos reorder  

---

## 6. Borrado de foto de perfil (alineación con backend)

**Problema:** `app/(app)/profile/[userId]/page.tsx` usaba `DELETE /api/profile/{userId}/photos/{id}` (no existe en `UserProfileController`).

**Fix:** Usar `DELETE /api/photos/delete/{photoId}` como en `profile/page.tsx`.

**Archivo:** `app/(app)/profile/[userId]/page.tsx`

**Trello:** La card https://trello.com/c/Q3bn8zVZ puede archivarse tras verificar en staging/prod.

---

## 7. Pendiente sugerido (sin código nuevo en este hilo)

- Implementar o exponer en backend: count notificaciones, decisión sobre `notifications/create`, `likes/users`, `photos/reorder`.
- Verificar despliegue Sparkd si persisten 404 en rutas de grupo de evento pese al código en repo.

---

## 8. Exportar conversaciones en Cursor

- Menú **⋯** del chat (copiar / exportar según versión).
- Copia manual: seleccionar mensajes → pegar en `.md`.
- Transcripciones crudas en:  
  `C:\Users\Developer\.cursor\projects\c-v0-social\agent-transcripts\` (archivos `.jsonl`).

---

*Fin del export.*
