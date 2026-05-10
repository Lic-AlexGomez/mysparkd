/**
 * Card Trello: backend exponga GET con la lista exacta de usuarios invitables a solicitud grupal
 * (misma regla que POST …/group/join-requests). Evita 403 por desajuste FE vs validación servidor.
 *
 * Requiere .env.local con TRELLO_API_KEY y TRELLO_TOKEN.
 *
 * Uso: node scripts/trello-card-event-join-eligible-users.mjs
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

const CARD = {
  title:
    "[BE] GET /api/events/{eventId}/group/join-eligible-users — lista invitables (solicitud grupal)",
  labels: ["Backend", "API"],
  desc: `## Contexto
El front arma la lista mezclando \`GET /api/matches/my/matches\`, \`/api/follow/followers/{me}\` y \`/api/follow/following/{me}\`, y filtra en cliente. **POST** \`/api/events/{eventId}/group/join-requests\` valida en servidor y devuelve **403** con mensaje tipo *\`{username} no está en tu lista de matches o seguidores\`* — la regla exacta **no coincide** con lo que el FE puede reconstruir (mutuos, bloqueos, evento, etc.).

**Evidencia:** proxy local muestra cuerpo JSON correcto con UUIDs canónicos vía \`GET /api/profile/{id}\`, pero el servidor sigue rechazando a un invitado.

## Pedido
Exponer **una sola fuente de verdad** alineada con la validación de \`POST …/group/join-requests\`:

\`\`\`
GET /api/events/{eventId}/group/join-eligible-users
Authorization: Bearer …
\`\`\`

**Respuesta sugerida (200):** array o wrapper con usuarios ya filtrados (excl. yo, excl. ya miembros del grupo del evento si aplica):

\`\`\`json
{
  "users": [
    {
      "userId": "uuid",
      "username": "string",
      "nombres": "…",
      "apellidos": "…",
      "profilePictureUrl": "…"
    }
  ]
}
\`\`\`

(Aceptar también array raíz si preferís convención actual del proyecto.)

**Contrato:** cualquier \`userId\` devuelto por este GET debe ser **aceptable** en \`inviteeUserIds\` del POST (salvo carreras/race). Documentar regla en OpenAPI o comentario de controller (matches + seguidores mutuos, exclusiones, etc.).

## FE
- \`lib/services/event.ts\` → \`groupJoinRequests.listEligibleInvitees(eventId)\` llama a esta ruta cuando exista (**404** → fallback temporal al armado en cliente: \`app/(app)/events/[eventId]/page.tsx\`).
- Tras implementar BE, el selector de invitados deja de desincronizarse con el POST.

## Referencias
- POST actual: \`/api/events/{eventId}/group/join-requests\` con \`{ "inviteeUserIds": [ … ] }\`.
- Página: pestaña **Solicitudes** → “Invitar desde tu lista”.`,
}

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

  const idLabels = CARD.labels.map((n) => byName.get(n.toLowerCase())).filter(Boolean).join(",")

  const created = await postForm("cards", {
    idList: list.id,
    name: CARD.title,
    desc: CARD.desc,
    ...(idLabels ? { idLabels } : {}),
  })

  console.log("Card creada:", created.shortUrl, "-", created.name)
}

main().catch((e) => {
  console.error(e)
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2))
  process.exit(1)
})
