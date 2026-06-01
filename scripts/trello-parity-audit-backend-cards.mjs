/**
 * Cards Trello — huecos BE detectados en auditoría paridad (2026-05).
 * FE web + móvil ya consumen estas rutas; implementar en Sparkd1.0.
 *
 * Uso: node scripts/trello-parity-audit-backend-cards.mjs
 */
import fs from "fs"

const envPaths = [
  new URL("../.env.local", import.meta.url),
  new URL("../.env", import.meta.url),
]
let raw = ""
for (const p of envPaths) {
  try {
    raw = fs.readFileSync(p, "utf8")
    break
  } catch {
    /* try next */
  }
}
const get = (name) => {
  const m = raw.match(new RegExp(`^${name}=(.+)$`, "m"))
  return m ? m[1].trim() : ""
}
const key = get("TRELLO_API_KEY")
const token = get("TRELLO_TOKEN")
if (!key || !token) {
  console.error("Faltan TRELLO_API_KEY / TRELLO_TOKEN en .env.local o .env")
  process.exit(1)
}

const BOARD_ID = "69b316a06238dae98730288d"
const PREFERRED_LIST_NAME = /pendiente de hacer backend/i

const LABELS_TO_ENSURE = [
  { name: "Backend", color: "blue" },
  { name: "API", color: "green" },
]

const AUDIT =
  "Auditoría paridad 2026-05: cruce Sparkd1.0 + v0-social + v0-social-mobile. Matriz: docs/ENDPOINT-PARITY-MATRIX.csv"

const CARDS = [
  {
    title: "[BE] GET /api/posts/user/{userId} — listar posts de otro usuario",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** Móvil usaba \`GET /api/posts/user/{userId}\` (no existe). **Workaround FE:** posts vía \`GET /api/profile/{userId}\`. Opcional en BE para paginación dedicada.

**Contrato sugerido:**
\`\`\`
GET /api/posts/user/{userId}?page=0&size=20
→ Page<PostResponseDTO> (misma forma que GET /api/posts/me)
\`\`\`

**Alternativa:** documentar que \`/api/profile/{id}\` ya incluye \`posts[]\` y no duplicar endpoint.`,
  },
  {
    title: "[BE] Pre-event chat — GET/POST /api/events/{eventId}/chat",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** Web \`lib/services/pre-event-chat.ts\` llama sala/metadata de chat por evento; no hay controller.

\`\`\`
POST /api/events/{eventId}/chat     → idempotente, crea o revive sala
GET  /api/events/{eventId}/chat     → metadata (lifecycle, archive)
POST /api/events/{eventId}/chat/message → opcional si no se reusa grupo
\`\`\`

**Referencia:** \`docs/sparkd-pre-event-chat-trello.md\` en v0-social.`,
  },
  {
    title: "[BE] DELETE /api/interests/remove/{interestId} — quitar interés del usuario",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** Web (\`settings/page.tsx\`) y móvil (\`lib/services/interests.ts\`) llaman \`DELETE /api/interests/remove/{interestId}\`. \`InterestController\` solo tiene \`POST /add/{interestId}\`.

**Contrato:**
\`\`\`
DELETE /api/interests/remove/{interestId}
Authorization: Bearer JWT
→ 200 OK (sin body) | 404 si no estaba asignado
\`\`\`

---

### UserInterestRepository.java — añadir método

\`\`\`java
Optional<UserInterest> findByProfileAndInterest(UserProfile profile, Interest interest);
\`\`\`

---

### InterestService.java — añadir método

\`\`\`java
public void removeInterestFromUser(UUID interestId, UUID userId) {
    Users user = usersRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

    UserProfile profile = user.getProfile();
    if (profile == null) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El usuario no tiene perfil");
    }

    Interest interest = interestRepository.findById(interestId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Interés no encontrado"));

    UserInterest userInterest = userInterestRepository
            .findByProfileAndInterest(profile, interest)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "El interés no está asignado al usuario"));

    profile.getInterests().remove(userInterest);
    userInterestRepository.delete(userInterest);
}
\`\`\`

---

### InterestController.java — añadir endpoint

\`\`\`java
@Operation(summary = "Quitar interés del usuario autenticado")
@DeleteMapping("/remove/{interestId}")
public ResponseEntity<Void> removeInterest(
        @PathVariable UUID interestId,
        @AuthenticationPrincipal Jwt jwt) {
    UUID userId = UUID.fromString(jwt.getClaim("uuid"));
    interestService.removeInterestFromUser(interestId, userId);
    return ResponseEntity.ok().build();
}
\`\`\``,
  },
  {
    title: "[BE] Módulo tickets eventos — /api/events/payment/* (Stripe)",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** Web y móvil implementados (\`lib/services/event-payment.ts\`, pestaña Tickets en perfil, QR). **No existe** controller Java.

**Rutas requeridas:**

| Método | Ruta | Response |
|--------|------|----------|
| POST | \`/api/events/payment/{eventId}/checkout\` | \`{ "checkoutUrl": "https://checkout.stripe.com/..." }\` |
| GET | \`/api/events/payment/tickets/me\` | \`EventTicket[]\` |
| GET | \`/api/events/payment/tickets/{ticketId}\` | \`EventTicket\` |

**EventTicket (campos FE):**
\`ticketId, eventId, eventTitle, eventCoverPhotoUrl, eventDate, eventZone, creatorUsername, amountPaid, currency, used, purchasedAt\`

**Stripe:**
- \`success_url\` web: \`/events/{eventId}/ticket/success\`
- \`success_url\` móvil: deep link / universal link → \`event-ticket-success\` (scheme app)
- Webhook o session.completed para marcar ticket válido

**Referencia FE:** \`c:/v0-social/lib/services/event-payment.ts\`, \`c:/v0-social-mobile/lib/services/event-payment.ts\``,
  },
  {
    title: "[BE] API Mutual Plans — /api/mutual-plans/*",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** Pantallas completas web + móvil (\`mutual-plans\`, \`lib/services/mutual-plans.ts\`) llaman rutas **inexistentes**.

**Rutas:**
\`\`\`
GET  /api/mutual-plans/user/{userId}     → connections[], sharedPlans[]
GET  /api/mutual-plans/event/{eventId}   → overlaps en evento
POST /api/mutual-plans/interest          → { planId, ... }
POST /api/mutual-plans/join-event       → { eventId, ... }
\`\`\`

**Tipos FE:** \`lib/types/mutual-plans.ts\`

**Doc previa:** \`docs/sparkd-mutual-plans-trello.md\` (si existe en web)`,
  },
  {
    title: "[BE] Contact permissions + dating exposure — DM eligibility",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** \`lib/dm-eligibility.ts\` y \`lib/services/contact-permissions.ts\` (web + móvil) llaman:

\`\`\`
GET  /api/contact-permissions/can-message/{targetUserId}  → { allowed, reason?, ... }
GET  /api/contact-permissions/context/{targetUserId}      → relationship context
POST /api/dating/exposure                                 → { viewedUserId, source }
GET  /api/relationships/eligibility                     → (documentado, sin controller)
\`\`\`

**Sin backend** el flujo dating (quién puede escribir, exposure tracking) falla en silencio o usa heurística local.

**Referencia:** \`c:/v0-social/docs/CONTACT_PERMISSIONS.md\``,
  },
  {
    title: "[BE] GET /api/events/{eventId}/group/join-eligible-users",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Problema:** FE (\`event.ts\`, \`group.ts\`) llama \`GET /api/events/{eventId}/group/join-eligible-users\`. El POST \`…/group/join-requests\` valida en servidor y puede 403 si el FE armó mal la lista (matches + followers).

**Pedido:** misma regla que validación del POST → lista filtrada:

\`\`\`
GET /api/events/{eventId}/group/join-eligible-users
→ { "users": [{ userId, username, nombres, apellidos, profilePictureUrl }] }
\`\`\`

Cualquier userId devuelto debe ser aceptable en \`inviteeUserIds\` del POST.

**Script previo:** \`scripts/trello-card-event-join-eligible-users.mjs\` (mismo spec).`,
  },
  {
    title: "[BE] GET /api/search/users y GET /api/search/posts (opcional)",
    labels: ["Backend", "API"],
    desc: `${AUDIT}

**Estado:** FE web ya migrado a \`/api/search/general\` e \`/api/search/intelligent\` como fallback. Opcional exponer rutas dedicadas paginadas:

\`\`\`
GET /api/search/users?query=&page=&size=
GET /api/search/posts?query=&page=&size=
\`\`\`

**SearchController actual:** general, intelligent, autocomplete, hashtags.`,
  },
]

async function tget(path, query = {}) {
  const u = new URL(`https://api.trello.com/1/${path}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  for (const [k, v] of Object.entries(query)) {
    u.searchParams.set(k, String(v))
  }
  const r = await fetch(u)
  const text = await r.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!r.ok) {
    const err = new Error(`Trello GET ${path} -> ${r.status}`)
    err.detail = data
    throw err
  }
  return data
}

function postForm(path, form) {
  const u = new URL(`https://api.trello.com/1/${path}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) {
    if (v != null && v !== "") body.set(k, String(v))
  }
  return fetch(u, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).then(async (r) => {
    const text = await r.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    if (!r.ok) {
      const err = new Error(`Trello POST ${path} -> ${r.status}`)
      err.detail = data
      throw err
    }
    return data
  })
}

async function main() {
  const labelsOnBoard = await tget(`boards/${BOARD_ID}/labels`)
  const byName = new Map(labelsOnBoard.map((l) => [l.name.trim().toLowerCase(), l.id]))

  for (const { name, color } of LABELS_TO_ENSURE) {
    if (!byName.has(name.toLowerCase())) {
      const created = await postForm("labels", {
        idBoard: BOARD_ID,
        name,
        color,
      })
      byName.set(name.toLowerCase(), created.id)
      console.log("Etiqueta creada:", name, created.id)
    }
  }

  const listsOpen = await tget(`boards/${BOARD_ID}/lists`, { filter: "open" })
  const list =
    listsOpen.find((l) => PREFERRED_LIST_NAME.test(l.name)) || listsOpen[0]
  if (!list) throw new Error("no list")
  console.log("Lista:", list.name, list.id)

  const existing = await tget(`lists/${list.id}/cards`, { fields: "name,shortUrl" })
  const names = new Set(existing.map((c) => c.name.trim()))

  const urls = []
  for (const card of CARDS) {
    if (names.has(card.title.trim())) {
      console.log("Skip (ya existe):", card.title.slice(0, 60))
      continue
    }
    const idLabels = card.labels
      .map((n) => byName.get(n.toLowerCase()))
      .filter(Boolean)
      .join(",")
    const created = await postForm("cards", {
      idList: list.id,
      name: card.title,
      desc: card.desc,
      ...(idLabels ? { idLabels } : {}),
    })
    urls.push(created.shortUrl)
    console.log("Card:", created.shortUrl)
  }

  console.log("\nCreadas:", urls.length)
  urls.forEach((u) => console.log(" ", u))
}

main().catch((e) => {
  console.error(e)
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2))
  process.exit(1)
})
