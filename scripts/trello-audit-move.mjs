/**
 * Mueve cards de Trello según docs/trello-fe-parity-matrix.json
 * Solo cards con testsPass: true y action: "move".
 *
 * Uso:
 *   node scripts/trello-audit-move.mjs --dry-run
 *   node scripts/trello-audit-move.mjs --to-test
 *   node scripts/trello-audit-move.mjs --to-done
 *   node scripts/trello-audit-move.mjs --mark-tests-pass 257,259,262
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")
const matrixPath = path.join(__dirname, "../docs/trello-fe-parity-matrix.json")
const BOARD_ID = "69b316a06238dae98730288d"

const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : ""
const get = (name) => {
  const m = raw.match(new RegExp(`^${name}=(.+)$`, "m"))
  return m ? m[1].trim() : ""
}
const key = get("TRELLO_API_KEY")
const token = get("TRELLO_TOKEN")

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const toTest = args.includes("--to-test")
const toDone = args.includes("--to-done")
const markIdx = args.findIndex((a) => a.startsWith("--mark-tests-pass"))
const markIds =
  markIdx >= 0 && args[markIdx + 1]
    ? args[markIdx + 1].split(",").map((s) => Number(s.trim())).filter(Boolean)
    : null

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

function buildComment(entry) {
  return [
    `**Cierre QA frontend** (${new Date().toISOString().slice(0, 10)})`,
    "",
    `- Plataforma: **${entry.targetPlatform}**`,
    `- Web: ${entry.web?.status ?? entry.web}`,
    `- Mobile: ${entry.mobile?.status ?? entry.mobile}`,
    `- Backend: ${entry.backend?.status ?? entry.backend}`,
    entry.notes ? `- Notas: ${entry.notes}` : "",
    "",
    "Tests unitarios pasaron antes de mover.",
  ]
    .filter(Boolean)
    .join("\n")
}

async function resolveLists() {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, { filter: "open", fields: "id,name" })
  const testList = lists.find((l) => /en test\/desarrollando\s*\/?\s*frontend/i.test(l.name))
  const doneList = lists.find((l) => l.name.trim() === "Terminado")
  const pendingList = lists.find((l) => /pendiente de hacer frontend/i.test(l.name))
  const reviewList = lists.find((l) => /terminado\/\s*pendiente revision frontend/i.test(l.name))
  return { testList, doneList, pendingList, reviewList, lists }
}

async function findCardByShort(idShort) {
  const card = await trelloGet("cards", {
    idBoard: BOARD_ID,
    fields: "id,idShort,name,idList,shortLink",
    filter: "all",
  })
  return (card || []).find((c) => c.idShort === idShort)
}

async function main() {
  if (!fs.existsSync(matrixPath)) {
    console.error("No existe", matrixPath, "- ejecuta generate-trello-parity-matrix.mjs")
    process.exit(1)
  }

  const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"))
  const cards = matrix.cards || matrix.entries || []

  if (markIds?.length) {
    let updated = 0
    for (const entry of cards) {
      if (markIds.includes(entry.idShort)) {
        entry.testsPass = true
        updated++
      }
    }
    fs.writeFileSync(matrixPath, JSON.stringify(matrix, null, 2))
    console.log(`Marcadas ${updated} cards con testsPass=true`)
    return
  }

  const movable = cards.filter((c) => c.action === "move" && c.testsPass === true)
  if (!movable.length) {
    console.log("No hay cards con action=move y testsPass=true")
    console.log("Usa: node scripts/trello-audit-move.mjs --mark-tests-pass 257,259")
    return
  }

  const { testList, doneList } = await resolveLists()
  const targetList = toDone ? doneList : toTest ? testList : null

  if (!dryRun && !targetList) {
    console.error("Especifica --to-test o --to-done (o --dry-run)")
    process.exit(1)
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Moviendo ${movable.length} cards -> ${targetList?.name ?? "preview"}`)

  for (const entry of movable) {
    const trelloCard = entry.id
      ? { id: entry.id, idShort: entry.idShort, name: entry.name }
      : await findCardByShort(entry.idShort)
    if (!trelloCard?.id) {
      console.warn(`Skip #${entry.idShort}: card no encontrada en Trello`)
      continue
    }
    console.log(`  #${entry.idShort} ${entry.name}`)
    if (dryRun) continue
    await trelloForm("PUT", `cards/${trelloCard.id}`, { idList: targetList.id })
    await trelloForm("POST", `cards/${trelloCard.id}/actions/comments`, {
      text: buildComment(entry),
    })
  }

  console.log("OK")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
