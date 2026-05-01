/**
 * Tarjetas Trello: huecos FE→BE auditados contra Sparkd1.0 (controladores Java).
 * No crea tarjetas para rutas ya definidas en backend (p. ej. EventGroup GET /messages|/members).
 *
 * Uso: node scripts/trello-fe-be-gap-cards.mjs
 */
import fs from "fs"

const envPath = new URL("../.env.local", import.meta.url)
const raw = fs.readFileSync(envPath, "utf8")
const get = (name) => {
  const m = raw.match(new RegExp(`^${name}=(.+)$`, "m"))
  return m ? m[1].trim() : ""
}
const key = get("TRELLO_API_KEY")
const token = get("TRELLO_TOKEN")
if (!key || !token) {
  console.error("Faltan TRELLO_API_KEY / TRELLO_TOKEN en .env.local")
  process.exit(1)
}

const BOARD_ID = "69b316a06238dae98730288d"
const PREFERRED_LIST_NAME = /pendiente de hacer backend/i

const LABELS_TO_ENSURE = [
  { name: "Backend", color: "blue" },
  { name: "API", color: "green" },
]

const AUDIT_NOTE =
  "Auditoría 2026-04-30: cruce FE (`c:/v0-social`) vs BE (`Sparkd1.0` NotificationsController, ReactionsController, ProfilePhotosController, UserProfileController)."

const CARDS = [
  {
    title: "[BE] GET /api/notifications/{userId}/count — contador no leídas",
    labels: ["Backend", "API"],
    desc: `${AUDIT_NOTE}

**Problema:** El front llama \`GET /api/notifications/\${userId}/count\` en \`lib/services/notification.ts\` (\`getUnreadCount\`). En \`NotificationsController\` solo existe GET \`/{userId}\`, PUT read y DELETE; hay método Java \`countUnreadNotifications\` pero **sin @GetMapping**.

**Propuesta:** Exponer p. ej. \`GET /api/notifications/{userId}/count\` → devuelve \`long\` o \`{ "unread": n }\`, con JWT y comprobación de que el solicitante sea el dueño (o ADMIN).`,
  },
  {
    title: "[BE] POST /api/notifications/create vs uso en FE",
    labels: ["Backend", "API"],
    desc: `${AUDIT_NOTE}

**Problema:** \`lib/utils/notifications.ts\` hace \`POST /api/notifications/create\` con \`userId, type, message, relatedUserId\`. Esa ruta **no existe** en \`NotificationsController\`; las notificaciones se crean hoy vía \`NotificationsService\` desde otros servicios.

**Propuesta:** (1) Eliminar o sustituir el uso FE por flujos server-side; o (2) si se necesita cliente, exponer endpoint **muy restringido** (roles, rate limit, tipos permitidos) para evitar spam.`,
  },
  {
    title: "[BE] GET /api/likes/users/{targetId} — quién reaccionó",
    labels: ["Backend", "API"],
    desc: `${AUDIT_NOTE}

**Problema:** \`lib/services/reaction.ts\` (\`getUsersByReaction\`) llama \`GET /api/likes/users/\${targetId}?reaction=\`. \`ReactionsController\` solo tiene \`/toggle\` y \`/status/{targetId}\`.

**Propuesta:** Endpoint paginado opcional para UI “ver reacciones” (lista usuarios por \`ReactionType\`).`,
  },
  {
    title: "[BE] PUT /api/photos/reorder — orden de fotos del perfil",
    labels: ["Backend", "API"],
    desc: `${AUDIT_NOTE}

**Problema:** \`app/(app)/profile/page.tsx\` (drag & drop fotos) usa \`PUT /api/photos/reorder\` con cuerpo \`{ photoIds: [...] }\`. \`ProfilePhotosController\` tiene add/update/delete/profile/upload pero **no reorder**.

**Propuesta:** Implementar reorder en servicio de fotos (validar propiedad del usuario y persistir \`position\`).`,
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

  const urls = []
  for (const card of CARDS) {
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
    console.log("Card:", created.shortUrl, "-", card.title.slice(0, 72))
  }

  console.log("\nTotal:", urls.length)
}

main().catch((e) => {
  console.error(e)
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2))
  process.exit(1)
})
