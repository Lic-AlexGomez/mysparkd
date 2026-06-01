# Contact permissions — Social vs Dating

## Problema

Social y Dating comparten `userId` y perfil. Un usuario puede:

1. Ver a alguien en Dating (discover, likes, match list).
2. Buscarlo en Social por nombre, `@username` o ir a `/profile/{userId}`.
3. Seguirse y abrir DM sin match, anulando el valor de premium/swipes.

**La regla madre:** si A descubrió a B por Dating, A no puede iniciar contacto privado por Social con B hasta que exista **match activo**, salvo relación social mutua **anterior** a esa exposición.

**Follow mutuo posterior a la exposición no desbloquea DM.** En SOCIAL no basta con follow mutuo si ya hubo `dating_exposure` y el follow se creó después de `first_seen_at`.

---

## Autoridad y contexto del cliente

| Capa | Rol |
|------|-----|
| **Backend (Spring)** | Fuente de verdad. Decide `canMessage`, redacción de perfil, búsqueda y apertura de chat. |
| **Frontend** | UX: ocultar botones, preflight, registrar exposición. **No es seguridad.** |
| **`context=SOCIAL` / `DATING` (query, header)** | Señal para UX y telemetría. **No confiable** — el usuario puede forzar `context=SOCIAL` en la URL o el header. El servidor **ignora** el context del cliente para autorizar DM y debe calcular exposición/match/follows en servidor. |

---

## Regla final (resumen)

| Caso | ¿Puede DM? |
|------|------------|
| Match activo | Sí |
| Sin exposure dating | Sí si follow mutuo social (+ privacidad) |
| Con exposure dating | Sí solo si match **o** follow mutuo **antes** de `first_seen_at` |
| Follow mutuo **después** de exposure | **No** |

---

## Prioridad de implementación (backend)

1. Tabla `dating_exposure` con `first_seen_at` **inmutable** (solo insert/upsert que no retroceda la fecha).
2. `ContactPermissionService` — misma lógica que `evaluateCanMessage` en `lib/contact-permissions.ts`.
3. Proteger `POST /api/chat/open/{userId}` (y envío de mensajes).
4. Proteger `GET /api/relationships/eligibility`.
5. Redactar `GET /api/profile/{id}` con `context=DATING` **o** cuando haya exposure sin match.
6. Filtrar búsqueda social si hubo exposure sin match ni relación social previa a `first_seen_at`.

---

## Modelo de datos (backend Spring)

### `dating_exposure`

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | PK |
| `viewer_user_id` | UUID | Quien vio |
| `viewed_user_id` | UUID | Visto |
| `first_seen_at` | timestamp | Primera exposición (**inmutable** tras creación) |
| `source` | enum | `dating_feed`, `dating_likes`, `dating_match`, `dating_profile` |
| `status` | enum | `exposed`, `swiped_left`, `swiped_right`, `matched`, `expired` |
| `updated_at` | timestamp | |

Índice único: `(viewer_user_id, viewed_user_id)`.

Registrar exposición en:

- `GET /api/discover` (al devolver tarjeta) o al mostrar tarjeta → `POST /api/dating/exposure`
- `POST /api/swipes/perform/swipe` (actualizar status)
- Match creado → `status = matched`

### `social_follow` (existente)

Usar `created_at` del follow para comparar con `dating_exposure.first_seen_at`.

### `dating_match` (existente)

Match activo = puede mensajear por Dating (y opcionalmente Social si política lo permite).

---

## `canMessage(senderId, receiverId)` — lógica central

```text
FUNCIÓN canMessage(A, B):

  SI existe block(A,B) O block(B,A):
    RETORNAR false, reason=blocked

  SI existe match_activo(A,B):
    RETORNAR true, reason=dating_match

  exposure = dating_exposure(A,B)  // A vio a B
  reverse  = dating_exposure(B,A)  // opcional: B vio a A (solo bloquea inicio desde quien expuso)

  mutual_follow = follow(A,B) AND follow(B,A)
  follow_A_before = follow(A,B).created_at < exposure.first_seen_at  (si exposure existe)
  follow_B_before = follow(B,A).created_at < exposure.first_seen_at

  relación_social_previa = mutual_follow AND follow_A_before AND follow_B_before

  SI exposure existe AND NOT match_activo(A,B):
    SI relación_social_previa:
      RETORNAR true, reason=social_before_dating
    SINO:
      RETORNAR false, reason=dating_exposure_no_match

  // Sin exposición dating: reglas social normales
  SI mutual_follow:
    RETORNAR true, reason=mutual_follow

  SI privacy(B).whoCanSendDM == FOLLOWERS AND follow(A,B):
    RETORNAR true, reason=follower_dm_allowed

  SI privacy(B).whoCanSendDM == EVERYONE:
    RETORNAR true, reason=everyone

  RETORNAR false, reason=privacy_or_no_relation
```

**Importante:** validar en **cada** `POST /api/chat/open/{userId}` y `POST /api/messages/send` usando `ContactPermissionService`, **sin** confiar en `context` del cliente. El frontend solo oculta botones.

### `ContactPermissionService` (Java)

```java
// Pseudocódigo — equivalente a evaluateCanMessage()
boolean canMessage(UUID viewerId, UUID targetId) {
  // Cargar: blocks, match activo, dating_exposure(viewer→target),
  // follow(A→B).createdAt, follow(B→A).createdAt, privacidad DM
  // Comparar follow timestamps con exposure.firstSeenAt (estricto <)
}
```

---

## Búsqueda social

`GET /api/search/users?q=...`

Para cada candidato B y viewer A:

| Política | Comportamiento |
|----------|----------------|
| **Estricta** (recomendada) | Si `exposure(A,B)` sin match → **no incluir** en resultados |
| Intermedia | Incluir pero `canMessage=false`, `canFollow=false` |
| Suave | Incluir, permitir follow, bloquear solo DM |

---

## Perfil público

### Dating surface (`DatingProfile` DTO)

No exponer: `username`, `apellidos`, `email`, `socialProfileUrl`, links externos identificables.

Exponer: `datingProfileId`, `displayName` (primer nombre), `age`, `cityApprox`, `bio`, `photos`, `interests`.

### Social surface (`SocialProfile` DTO)

Perfil completo actual, pero respuesta incluye:

```json
{
  "canMessage": false,
  "canFollow": true,
  "contactBlockReason": "DATING_EXPOSURE_NO_MATCH",
  "datingContext": { "exposed": true, "matched": false }
}
```

---

## Cambiar `accountType` (SOCIAL / DATING / BOTH)

No resetea `dating_exposure`. Las restricciones son por par `(viewer, viewed)`, no por modo UI.

---

## Premium / swipes

Sin swipes **no** implica buscar en Social y escribir a perfiles vistos en Dating. Premium desbloquea swipes/likes/boost, no bypass de `canMessage`.

---

## API propuesta

| Método | Ruta | Uso |
|--------|------|-----|
| `POST` | `/api/dating/exposure` | `{ viewedUserId, source }` |
| `GET` | `/api/contact-permissions/can-message/{userId}` | `{ allowed, reason }` |
| `GET` | `/api/contact-permissions/context/{userId}` | Exposición, match, follow timestamps |
| `GET` | `/api/dating/profile/{datingProfileId}` | Perfil dating sin identificadores social |

---

## Frontend (web + móvil)

- `lib/contact-permissions.ts` — regla pura (`evaluateCanMessage`) + tipos
- `lib/dm-eligibility.ts` — preflight; fallback local usa la misma regla (no solo follow mutuo en SOCIAL)
- `lib/services/contact-permissions.ts` (web) — llamadas API
- Registrar exposición al mostrar tarjeta discover (`POST /api/dating/exposure`)
- Perfil: `fetchEligibility` antes de `openChat`; enviar `X-Sparkd-Context` como hint
- Swipe card: solo primer nombre, sin link a perfil social completo

**Hasta que el backend implemente los 6 pasos anteriores, un atacante puede saltarse la UI. La seguridad real es server-side.**
