/**
 * Solo lectura: lista cards de "Pendiente de hacer frontend" en Trello Sparkd.
 *
 * Uso:
 *   node scripts/trello-list-pending-fe.mjs
 *
 * Requiere .env.local con:
 *   TRELLO_API_KEY=...
 *   TRELLO_TOKEN=...
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")

const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
const get = (name) => {
  const m = raw.match(new RegExp(`^${name}=(.+)$`, "m"))
  return m ? m[1].trim() : ""
}

const key = get("TRELLO_API_KEY")
const token = get("TRELLO_TOKEN")
const BOARD_ID = "69b316a06238dae98730288d"

if (!key || !token) {
  console.error("Faltan TRELLO_API_KEY / TRELLO_TOKEN en .env.local")
  process.exit(1)
}

async function trelloGet(p, searchParams = {}) {
  const u = new URL(`https://api.trello.com/1/${p}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v))
  })
  const r = await fetch(u, { method: "GET", headers: { Accept: "application/json" } })
  const t = await r.text()
  let j = null
  try {
    j = t ? JSON.parse(t) : null
  } catch {
    /* empty */
  }
  if (!r.ok) throw new Error(`GET ${p} -> ${r.status} ${t.slice(0, 500)}`)
  return j
}

const main = async () => {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, {
    filter: "open",
    fields: "id,name",
  })

  const feList = lists.find((l) => /pendiente de hacer frontend/i.test(l.name))
  if (!feList) {
    console.error(
      "No encontré la lista 'Pendiente de hacer frontend'. Listas abiertas:",
      lists.map((l) => l.name).join(" | ")
    )
    process.exit(1)
  }

  const cards = await trelloGet(`lists/${feList.id}/cards`, {
    fields: "id,name,idShort,shortLink,desc,labels",
  })

  const simplified = (cards || []).map((c) => ({
    idShort: c.idShort,
    name: c.name,
    shortLink: c.shortLink,
    url: c.shortLink ? `https://trello.com/c/${c.shortLink}` : undefined,
    labels: Array.isArray(c.labels) ? c.labels.map((l) => l.name).filter(Boolean) : [],
    hasDesc: Boolean((c.desc || "").trim()),
  }))

  simplified.sort((a, b) => (a.idShort || 0) - (b.idShort || 0))

  console.log(JSON.stringify({ boardId: BOARD_ID, list: { id: feList.id, name: feList.name }, cards: simplified }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

