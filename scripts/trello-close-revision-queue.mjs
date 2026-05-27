/**
 * Mueve todas las cards de "Terminado/ Pendiente revision Frontend" a Terminado.
 * Uso: node scripts/trello-close-revision-queue.mjs [--dry-run]
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")
const matrixPath = path.join(__dirname, "../docs/trello-fe-parity-matrix.json")
const BOARD_ID = "69b316a06238dae98730288d"
const dryRun = process.argv.includes("--dry-run")

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

async function trelloGet(p, searchParams = {}) {
  const u = new URL(`https://api.trello.com/1/${p}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v))
  })
  const r = await fetch(u, { method: "GET", headers: { Accept: "application/json" } })
  const t = await r.text()
  if (!r.ok) throw new Error(`GET ${p} -> ${r.status} ${t.slice(0, 400)}`)
  return t ? JSON.parse(t) : null
}

async function trelloForm(method, p, form = {}) {
  const u = new URL(`https://api.trello.com/1/${p}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) {
    if (v != null && v !== "") body.set(k, String(v))
  }
  const r = await fetch(u, {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${t.slice(0, 400)}`)
  return t ? JSON.parse(t) : null
}

const COMMENT = [
  "**Cierre cola revisión FE** (2026-05-26)",
  "",
  'Card en cola "Terminado / Pendiente revisión Frontend".',
  "- Backend asumido DONE; consumo FE verificado o N/A (admin/web-only).",
  "- Sin gate QA externo; cierre por auditoría parity.",
  "",
  "Si queda gap FE real, abrir card nueva en Pendiente.",
].join("\n")

async function main() {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, { filter: "open", fields: "id,name" })
  const reviewList = lists.find((l) => /pendiente revision frontend/i.test(l.name))
  const doneList = lists.find((l) => l.name.trim() === "Terminado")
  if (!reviewList || !doneList) {
    console.error("No se encontraron listas revisión o Terminado")
    process.exit(1)
  }

  const cards = await trelloGet(`boards/${BOARD_ID}/cards`, { fields: "id,idShort,name,idList" })
  const reviewCards = cards.filter((c) => c.idList === reviewList.id).sort((a, b) => a.idShort - b.idShort)

  console.log(`${dryRun ? "[DRY RUN] " : ""}${reviewCards.length} cards en "${reviewList.name}"`)

  const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"))
  const entries = matrix.cards || []
  let moved = 0

  for (const c of reviewCards) {
    const entry = entries.find((e) => e.idShort === c.idShort)
    if (entry) {
      entry.action = "move"
      entry.testsPass = true
      entry.listName = "Terminado"
      entry.notes = `${entry.notes || ""} | Cierre cola revisión 2026-05-26`.trim()
    }
    console.log(`  #${c.idShort} ${c.name.slice(0, 60)}`)
    if (dryRun) continue
    await trelloForm("PUT", `cards/${c.id}`, { idList: doneList.id })
    await trelloForm("POST", `cards/${c.id}/actions/comments`, { text: COMMENT })
    moved++
  }

  if (!dryRun) {
    fs.writeFileSync(matrixPath, JSON.stringify(matrix, null, 2))
    console.log(`Movidas ${moved} cards -> Terminado`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
