/**
 * Mueve cards completadas a "Terminado" y deja comentario de cierre FE.
 *
 * Uso:
 *   node scripts/trello-mark-fe-done.mjs 360 365 366 ...
 *   node scripts/trello-mark-fe-done.mjs --file docs/trello-done-batch.txt
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

const NOTE = process.argv.includes("--note")
  ? process.argv[process.argv.indexOf("--note") + 1]
  : "Frontend implementado y verificado en codebase (2026-05-30)."

function parseIds(argv) {
  const ids = []
  const fileIdx = argv.indexOf("--file")
  if (fileIdx >= 0) {
    const fp = argv[fileIdx + 1]
    const lines = fs.readFileSync(fp, "utf8").split(/\r?\n/)
    for (const line of lines) {
      const m = line.match(/#?(\d+)/)
      if (m) ids.push(Number(m[1]))
    }
  }
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("-")) continue
    if (fileIdx >= 0 && argv[fileIdx + 1] === arg) continue
    const n = Number(arg.replace(/^#/, ""))
    if (Number.isFinite(n) && n > 0) ids.push(n)
  }
  return [...new Set(ids)]
}

async function main() {
  const idShorts = parseIds(process.argv)
  if (!idShorts.length) {
    console.error("Pasa idShort de cards: node scripts/trello-mark-fe-done.mjs 360 365 ...")
    process.exit(1)
  }

  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, { filter: "open", fields: "id,name" })
  const doneList = lists.find((l) => l.name.trim() === "Terminado")
  if (!doneList) throw new Error('Lista "Terminado" no encontrada')

  const cards = await trelloGet(`boards/${BOARD_ID}/cards`, {
    fields: "id,idShort,name,idList,closed",
  })

  let moved = 0
  for (const num of idShorts) {
    const card = cards.find((c) => c.idShort === num && !c.closed)
    if (!card) {
      console.warn(`  skip #${num} — no encontrada o archivada`)
      continue
    }
    if (card.idList === doneList.id) {
      console.log(`  ok  #${num} ya en Terminado`)
      continue
    }
    console.log(`  move #${num} ${card.name.slice(0, 70)}`)
    await trelloForm("PUT", `cards/${card.id}`, { idList: doneList.id })
    await trelloForm("POST", `cards/${card.id}/actions/comments`, {
      text: `**FE completado** (2026-05-30)\n\n${NOTE}`,
    })
    moved++
  }
  console.log(`\nMovidas ${moved}/${idShorts.length} cards → Terminado`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
