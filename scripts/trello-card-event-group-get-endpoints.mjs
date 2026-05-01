/**
 * Crea una card en Trello: backend debe exponer GET de grupo del evento (messages + members).
 *
 * Requiere .env.local con TRELLO_API_KEY y TRELLO_TOKEN (igual que trello-bulk-endpoints.mjs).
 *
 * Uso: node scripts/trello-card-event-group-get-endpoints.mjs
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
    "[BE] Eventos — GET /api/events/{eventId}/group/messages y …/group/members (404 Sparkd)",
  labels: ["Backend", "API"],
  desc: `Contexto: el front en \`lib/services/event.ts\` y la página \`app/(app)/events/[eventId]/page.tsx\` llaman al cargar el detalle:

- GET \`/api/events/{eventId}/group/messages\`
- GET \`/api/events/{eventId}/group/members\`

En despliegue Sparkd actual ambos devuelven **404**. El proxy Next solo reenvía; no es bug del proxy.

**Contrato esperado (alineado con Trello #218 Chat grupo / #221 Miembros):**
- Lista de mensajes del grupo del evento (texto/media/polls según modelo existente).
- Lista de miembros con rol ADMIN | MODERATOR | GUEST y \`mutedUntil\` opcional.

**Referencias FE:** \`eventService.groupMessages.list\`, \`eventService.groupMembers.list\`.

Tras implementar, el detalle del evento cargará chat y pestaña miembros sin toast de degradación.`,
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
