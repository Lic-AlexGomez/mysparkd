/**
 * One-shot: mueve tarjeta admin/users a lista backend y añade checklist QA a notificaciones.
 * Lee credenciales de .env.local (no commitear).
 *
 * Uso: node scripts/trello-reorganize-pending-fe.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")
const raw = fs.readFileSync(envPath, "utf8")
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

/** Trello acepta form urlencoded en POST/PUT para la mayoría de recursos. */
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
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })
  const t = await r.text()
  let j = null
  try {
    j = t ? JSON.parse(t) : null
  } catch {
    /* empty */
  }
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${t.slice(0, 500)}`)
  return j
}

const main = async () => {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, {
    filter: "open",
    fields: "id,name",
  })
  const feList = lists.find((l) => /pendiente de hacer frontend/i.test(l.name))
  const beList = lists.find((l) => /^pendiente de hacer backend$/i.test(l.name.trim()))
  if (!feList || !beList) {
    console.error(
      "Listas no encontradas. Abiertas:",
      lists.map((l) => l.name).join(" | ")
    )
    process.exit(1)
  }

  const feCards = await trelloGet(`lists/${feList.id}/cards`, {
    fields: "id,name,idShort,shortLink",
  })

  const adminCard = feCards.find(
    (c) =>
      /admin\/users/i.test(c.name) ||
      /PostgreSQL/i.test(c.name) ||
      /lower\s*\(\s*bytea\s*\)/i.test(c.name)
  )
  const notifCard = feCards.find((c) => /Notifications \(float\)/i.test(c.name))

  const report = { movedAdmin: null, notifChecklist: null }

  if (adminCard) {
    await trelloForm("PUT", `cards/${adminCard.id}`, { idList: beList.id })
    report.movedAdmin = {
      idShort: adminCard.idShort,
      name: adminCard.name,
      toList: beList.name,
    }
  } else {
    report.movedAdmin = { skipped: true, reason: "No matching card in FE list" }
  }

  if (notifCard) {
    const cl = await trelloForm("POST", `cards/${notifCard.id}/checklists`, {
      name: "QA móvil (cerrar con evidencia)",
    })
    const items = [
      "Chrome Android: panel de campana no a media pantalla; backdrop cierra al tocar fuera",
      "Safari iOS: mismo comportamiento",
      "Marcar ítem solo tras captura o nota en la tarjeta",
    ]
    for (const name of items) {
      await trelloForm("POST", `checklists/${cl.id}/checkItems`, { name })
    }
    report.notifChecklist = {
      cardIdShort: notifCard.idShort,
      checklistId: cl.id,
      itemsAdded: items.length,
    }
  } else {
    report.notifChecklist = { skipped: true, reason: "No matching notifications card in FE list" }
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
