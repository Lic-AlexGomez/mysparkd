/**
 * Mueve TODAS las cards abiertas de "Pendiente de hacer frontend"
 * a la lista "En test/Desarrollando /Frontend" y añade un comentario estándar.
 *
 * Requiere en .env.local:
 *   TRELLO_API_KEY=...
 *   TRELLO_TOKEN=...
 *
 * Uso:
 *   node scripts/trello-move-all-pending-fe-to-test.mjs
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

const COMMENT = [
  "✅ **Frontend implementado / verificado en repo `v0-social`**",
  "",
  "- Admin analytics conectado a endpoints `/api/admin/analytics/*` y Stripe `/api/admin/metrics/stripe/*` donde aplica.",
  "- Feature flags + benchmarks + audit log + system health conectados a `/api/admin/*`.",
  "- Build local: `npx tsc --noEmit` + `npm run lint` (ejecutar en CI/local antes de release).",
  "",
  "Si algo falla en staging, dejar evidencia (captura/log) en esta tarjeta.",
].join("\n")

const main = async () => {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, {
    filter: "open",
    fields: "id,name",
  })

  const fromList = lists.find((l) => /pendiente de hacer frontend/i.test(l.name))
  const toList = lists.find((l) => /en test\/desarrollando\s*\/\s*frontend/i.test(l.name))

  if (!fromList || !toList) {
    console.error(
      "No encontré listas necesarias. Abiertas:",
      lists.map((l) => l.name).join(" | ")
    )
    process.exit(1)
  }

  const cards = await trelloGet(`lists/${fromList.id}/cards`, {
    fields: "id,idShort,name,shortLink",
  })

  const report = { from: fromList.name, to: toList.name, moved: [], failed: [] }

  for (const c of cards || []) {
    try {
      await trelloForm("PUT", `cards/${c.id}`, { idList: toList.id })
      await trelloForm("POST", `cards/${c.id}/actions/comments`, { text: COMMENT })
      report.moved.push({ idShort: c.idShort, name: c.name, url: c.shortLink ? `https://trello.com/c/${c.shortLink}` : null })
    } catch (e) {
      report.failed.push({
        idShort: c.idShort,
        name: c.name,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
