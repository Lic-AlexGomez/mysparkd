# 📌 Card Trello: Mensajes fijados en grupos (backend)

## Título
`Groups - Mensajes fijados persistentes`

## Contexto
En frontend ya existe UX de "fijar/desfijar" mensajes dentro del grupo, pero actualmente es local (no persistente, por navegador).  
Necesitamos soporte backend para que el pin sea compartido para todos los miembros y sobreviva recargas/dispositivos.

## Endpoints propuestos
- `POST /api/groups/{groupId}/messages/{messageId}/pin` (ADMIN/MOD)
- `DELETE /api/groups/{groupId}/messages/{messageId}/pin` (ADMIN/MOD)
- `GET /api/groups/{groupId}/pinned-messages` (Miembro)

## Reglas
- Solo `ADMIN` y `MODERATOR` pueden fijar/desfijar.
- No fijar mensajes eliminados.
- Máximo recomendado: 10 mensajes fijados por grupo.
- Si se elimina un mensaje fijado, debe salir automáticamente de pinned.

## WebSocket
- Broadcast en `/topic/group/{groupId}`:
  - `type: MESSAGE_PINNED`
  - `type: MESSAGE_UNPINNED`

## Criterio de aceptación
- Todos los miembros ven la misma lista de fijados.
- Refrescar sesión mantiene los fijados.
- Eventos en tiempo real actualizan UI sin recargar.
