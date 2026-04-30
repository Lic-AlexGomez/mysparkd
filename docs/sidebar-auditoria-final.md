# Auditoria funcional/visual sidebar - cierre

Fecha: 2026-04-30
Repo FE: `C:/v0-social`
Repo BE referencia: `C:/Sparkd1.0-desarrollo (1)/Sparkd1.0`

## Metodo aplicado

- Intento de auditoria browser-use bloqueado por disponibilidad del navegador MCP (`browser_tabs` sin `action` utilizable desde este entorno).
- Auditoria estatica profunda por rutas/componentes/servicios.
- Cruce de endpoints FE vs controladores BE de referencia.
- Verificacion ejecutable final: `tsc`, `lint`, `build`.

## Checklist por opcion principal del sidebar

- [x] `/feed` - **OK**
  - Usa `feedService` + `locationService`.
  - Endpoints base presentes en backend (`FeedController` / perfiles).

- [x] `/swipes` - **FIXED**
  - Fix aplicado: estabilizacion de `fetchProfiles` para evitar recreacion por estado interno y resets/recargas no deseadas.
  - Archivo tocado: `app/(app)/swipes/page.tsx`.
  - Endpoints base presentes en backend (`/api/discover`, `/api/swipes/*`).

- [x] `/events` - **OK**
  - Flujo de listado, crear/join y detalle conectado a `eventService`.
  - Endpoints presentes en backend (`EventController`, `EventGroupController`).

- [x] `/fastdate` - **OK**
  - Flujo conectado a `fastDateService`.
  - Endpoints presentes en backend (`DateInterestController` y relacionados).

- [x] `/likes` - **OK**
  - Flujo premium/paywall + consumo de `/api/swipes/liked-me`.
  - Endpoint presente en backend (`SwipeController`).

- [x] `/matches` - **OK**
  - Flujo de listado/abrir chat/unmatch/block operativo a nivel API.
  - Endpoints presentes en backend (`MatchController`, `ChatController`).

- [x] `/chat` - **OK**
  - Lista de chats + hide/unhide/delete y presencia.
  - Endpoints presentes en backend (`ChatController`, `PresenceController`).

- [x] `/groups` - **OK**
  - Descubrir, detalle, invitaciones, moderacion base, covers.
  - Endpoints presentes en backend (`GroupController`, `GroupJoinRequestController`).

- [x] `/trello` - **OK**
  - Integracion FE via `trelloService` y proxy.
  - Sin bloqueo funcional en el frontend para la opcion.

- [x] `/profile` - **OK**
  - Flujo de perfil/fotos/voz/seguidores con servicios y APIs existentes.

- [x] `/premium` - **BUG-BE**
  - Checkout/status operativos.
  - Bloqueo backend para cancelar suscripcion desde app (el boton FE estaba en "Proximamente").

- [x] Panel condicional `/dashboard` o `/manager` - **OK**
  - Rutas presentes y compilando en build.
  - Manager APIs de actividad/usuarios/moderacion disponibles en backend (`/api/manager/*`).

## Cambios frontend aplicados en este cierre

1. `app/(app)/swipes/page.tsx`
   - Se agregaron refs para gating de paginacion (`hasMoreProfilesRef`, `isFetchingMoreRef`).
   - `fetchProfiles` ahora queda estable (dependencias reducidas) y evita resets por recreacion del callback.

## Bloqueo backend detectado y card creada

- Card creada en Trello (Backend): **#230**
  - Titulo: `[API] Cancelacion de suscripcion Premium desde app (Stripe)`
  - URL: [https://trello.com/c/k1cYXkxX/230-api-cancelacion-de-suscripcion-premium-desde-app-stripe](https://trello.com/c/k1cYXkxX/230-api-cancelacion-de-suscripcion-premium-desde-app-stripe)
  - Endpoint faltante solicitado: `POST /api/subscription/cancel` (o equivalente)
  - Incluye impacto FE y criterios de aceptacion.

## Verificacion final post-cambios

- `npx tsc --noEmit` -> OK
- `npm run lint` -> OK
- `npm run build` -> OK

