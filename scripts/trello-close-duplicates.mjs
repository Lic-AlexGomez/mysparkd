/**
 * Cierra cards duplicadas en Trello (con comentario).
 *
 * Uso:
 *   node scripts/trello-close-duplicates.mjs 322=321 323=330
 *
 * Requiere en .env.local:
 *   TRELLO_API_KEY=...
 *   TRELLO_TOKEN=...
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")
const BOARD_ID = "69b316a06238dae98730288d"

const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
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

const pairs = process.argv
  .slice(2)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const [dup, keep] = s.split("=")
    return { dup: Number(dup), keep: Number(keep) }
  })
  .filter((p) => Number.isFinite(p.dup) && Number.isFinite(p.keep))

if (pairs.length === 0) {
  console.error("Uso: node scripts/trello-close-duplicates.mjs 322=321 323=330")
  process.exit(1)
}

async function trelloGet(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } })
  const t = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 400)}`)
  return t ? JSON.parse(t) : null
}

async function trelloForm(method, url, form = {}) {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) {
    if (v != null && v !== "") body.set(k, String(v))
  }
  const r = await fetch(url, {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status} ${t.slice(0, 400)}`)
  return t ? JSON.parse(t) : null
}

async function findByShort(idShort) {
  const u = new URL(`https://api.trello.com/1/boards/${BOARD_ID}/cards`)
  u.searchParams.set("fields", "id,idShort,name")
  u.searchParams.set("filter", "all")
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  const cards = await trelloGet(u)
  const rows = Array.isArray(cards) ? cards : []
  return rows.find((c) => Number(c?.idShort) === Number(idShort)) ?? null
}

async function closeDuplicate(dupIdShort, keepIdShort) {
  const card = await findByShort(dupIdShort)
  if (!card?.id) throw new Error(`No se encontró la card #${dupIdShort}`)

  const commentUrl = new URL(`https://api.trello.com/1/cards/${card.id}/actions/comments`)
  commentUrl.searchParams.set("key", key)
  commentUrl.searchParams.set("token", token)
  await trelloForm("POST", commentUrl, {
    text: `Duplicado de #${keepIdShort}. Consolidado y cerrado.`,
  })

  const updateUrl = new URL(`https://api.trello.com/1/cards/${card.id}`)
  updateUrl.searchParams.set("key", key)
  updateUrl.searchParams.set("token", token)
  await trelloForm("PUT", updateUrl, { closed: "true" })

  console.log(`OK: cerrado duplicado #${dupIdShort} (${card.name})`)
}

for (const p of pairs) {
  // eslint-disable-next-line no-await-in-loop
  await closeDuplicate(p.dup, p.keep)
}

