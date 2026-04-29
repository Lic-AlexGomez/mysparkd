/**
 * Mueve la card "[Backend] GET /api/admin/users — PostgreSQL..." a la lista Terminado
 * y añade una línea en la descripción como verificación.
 *
 * Uso: node scripts/trello-complete-admin-users-card.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf8")
const get = (name) => {
  const m = raw.match(new RegExp(`^${name}=(.+)$`, "m"))
  return m ? m[1].trim() : ""
}
const key = get("TRELLO_API_KEY")
const token = get("TRELLO_TOKEN")
const BOARD_ID = "69b316a06238dae98730288d"

if (!key || !token) {
  console.error("Faltan TRELLO_API_KEY / TRELLO_TOKEN")
  process.exit(1)
}

async function trelloGet(pathStr, qs = {}) {
  const u = new URL(`https://api.trello.com/1/${pathStr}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  Object.entries(qs).forEach(([k, v]) => u.searchParams.set(k, String(v)))
  const r = await fetch(u)
  const t = await r.text()
  if (!r.ok) throw new Error(`GET ${pathStr} ${r.status} ${t.slice(0, 400)}`)
  return JSON.parse(t)
}

async function trelloForm(method, pathStr, form = {}) {
  const u = new URL(`https://api.trello.com/1/${pathStr}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) {
    if (v != null && v !== "") body.set(k, String(v))
  }
  const r = await fetch(u, {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  const t = await r.text()
  let j = null
  try {
    j = t ? JSON.parse(t) : null
  } catch {
    j = { raw: t }
  }
  if (!r.ok) throw new Error(`${method} ${pathStr} ${r.status} ${t.slice(0, 400)}`)
  return j
}

const DONE_NOTE =
  "\n\n---\n✅ **Hecho (front verificado):** `GET /api/admin/users` responde OK; tipos PostgreSQL alineados / listado admin usable."

async function main() {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, {
    filter: "open",
    fields: "id,name",
  })

  const doneList = lists.find((l) => l.name.trim() === "Terminado")
  if (!doneList) {
    console.error("No se encontró lista «Terminado». Listas:", lists.map((l) => l.name).join(" | "))
    process.exit(1)
  }

  const searchLists = lists.filter((l) =>
    /pendiente de hacer backend/i.test(l.name)
  )

  /** @type {Array<{ id: string; name: string; idShort: number; desc?: string; _fromList?: string }>} */
  let allCards = []
  for (const lst of searchLists) {
    const cards = await trelloGet(`lists/${lst.id}/cards`, {
      fields: "id,name,idShort,desc",
    })
    allCards = allCards.concat(cards.map((c) => ({ ...c, _fromList: lst.name })))
  }

  let card = allCards.find(
    (c) =>
      /admin\/users/i.test(c.name) &&
      (/PostgreSQL|lower|bytea|500/i.test(c.name) || /postgresql/i.test(c.name))
  )

  if (!card) {
    const boardCards = await trelloGet(`boards/${BOARD_ID}/cards`, {
      filter: "open",
      fields: "id,name,idShort,desc,idList",
    })
    card = boardCards.find(
      (c) =>
        /admin\/users/i.test(c.name) &&
        (/PostgreSQL|lower|bytea|500/i.test(c.name) || /postgresql/i.test(c.name))
    )
    if (card) {
      const lstName = lists.find((l) => l.id === card.idList)?.name ?? "?"
      card._fromList = lstName
    }
  }

  if (!card) {
    const fuzzy = allCards.filter((c) => /admin\/users/i.test(c.name))
    console.error(
      JSON.stringify(
        {
          error: "Card no encontrada con el patrón esperado.",
          searchedLists: searchLists.map((l) => l.name),
          fuzzyMatches: fuzzy.map((c) => ({ idShort: c.idShort, name: c.name })),
        },
        null,
        2
      )
    )
    process.exit(1)
  }

  const prev = (card.desc || "").trim()
  const newDesc =
    prev.includes("GET /api/admin/users responde OK") || prev.includes("front verificado")
      ? prev
      : (prev + DONE_NOTE).trim()

  const updated = await trelloForm("PUT", `cards/${card.id}`, {
    idList: doneList.id,
    desc: newDesc,
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        card: { idShort: updated.idShort ?? card.idShort, name: updated.name ?? card.name },
        movedTo: doneList.name,
      },
      null,
      2
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
