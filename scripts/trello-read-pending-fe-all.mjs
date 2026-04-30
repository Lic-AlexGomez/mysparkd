/**
 * Lee TODAS las cards de la lista "Pendiente de hacer frontend" en Trello Sparkd,
 * incluyendo descripción y comentarios (commentCard).
 *
 * Uso:
 *   node scripts/trello-read-pending-fe-all.mjs
 *
 * Salida:
 *   docs/trello-pendiente-frontend-completo.json
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")
const outputPath = path.join(__dirname, "../docs/trello-pendiente-frontend-completo.json")

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

async function getCardComments(cardId) {
  const actions = await trelloGet(`cards/${cardId}/actions`, {
    filter: "commentCard",
    fields: "id,data,date,idMemberCreator",
    memberCreator_fields: "fullName,username",
    limit: 1000,
  })
  return (actions || [])
    .map((a) => ({
      id: a.id,
      date: a.date,
      text: a?.data?.text || "",
      member: {
        id: a?.memberCreator?.id,
        fullName: a?.memberCreator?.fullName,
        username: a?.memberCreator?.username,
      },
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const main = async () => {
  const lists = await trelloGet(`boards/${BOARD_ID}/lists`, {
    filter: "open",
    fields: "id,name",
  })

  const targetList = lists.find((l) => /pendiente de hacer frontend/i.test(l.name))
  if (!targetList) {
    throw new Error("No encontré la lista 'Pendiente de hacer frontend'")
  }

  const cards = await trelloGet(`lists/${targetList.id}/cards`, {
    fields: "id,idShort,name,desc,shortLink,dateLastActivity,due,closed",
    members: "true",
    member_fields: "fullName,username",
    labels: "true",
    attachments: "false",
  })

  const normalized = []
  for (const c of cards || []) {
    const comments = await getCardComments(c.id)
    normalized.push({
      id: c.id,
      idShort: c.idShort,
      name: c.name,
      shortLink: c.shortLink,
      url: c.shortLink ? `https://trello.com/c/${c.shortLink}` : null,
      desc: c.desc || "",
      dateLastActivity: c.dateLastActivity,
      due: c.due,
      closed: Boolean(c.closed),
      members: (c.members || []).map((m) => ({
        id: m.id,
        fullName: m.fullName,
        username: m.username,
      })),
      labels: (c.labels || []).map((l) => ({
        id: l.id,
        name: l.name || "",
        color: l.color || "",
      })),
      comments,
    })
  }

  normalized.sort((a, b) => (a.idShort || 0) - (b.idShort || 0))

  const result = {
    boardId: BOARD_ID,
    list: {
      id: targetList.id,
      name: targetList.name,
    },
    totalCards: normalized.length,
    generatedAt: new Date().toISOString(),
    cards: normalized,
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8")
  console.log(`OK: ${result.totalCards} cards exportadas en ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

