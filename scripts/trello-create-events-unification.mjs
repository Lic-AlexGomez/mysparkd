import fs from "fs"
const envPath = new URL("../.env.local", import.meta.url)
const raw = fs.readFileSync(envPath, "utf8")
const get = (name) => { const m = raw.match(new RegExp(`^${name}=(.+)$`, "m")); return m ? m[1].trim() : "" }
const key = get("TRELLO_API_KEY")
const token = get("TRELLO_TOKEN")
if (!key || !token) { console.error("Faltan TRELLO_API_KEY / TRELLO_TOKEN en .env.local"); process.exit(1) }

const BOARD_ID = "69b316a06238dae98730288d"
const PREFERRED_LIST_NAME = /pendiente de hacer/i

async function tget(path, query = {}) {
  const u = new URL(`https://api.trello.com/1/${path}`)
  u.searchParams.set("key", key); u.searchParams.set("token", token)
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, String(v))
  const r = await fetch(u)
  const data = JSON.parse(await r.text())
  if (!r.ok) { const e = new Error(`GET ${path} -> ${r.status}`); e.detail = data; throw e }
  return data
}

async function postForm(path, form) {
  const u = new URL(`https://api.trello.com/1/${path}`)
  u.searchParams.set("key", key); u.searchParams.set("token", token)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) if (v != null && v !== "") body.set(k, String(v))
  const r = await fetch(u, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() })
  const data = JSON.parse(await r.text())
  if (!r.ok) { const e = new Error(`POST ${path} -> ${r.status}`); e.detail = data; throw e }
  return data
}

const CARD = {
  title: "[FE] Unificación /events — Meetup + Fast Date en feed único con filtros y cards diferenciadas",
  desc: `## Contexto
La página /events ahora unifica Meetup y Fast Date en un solo feed usando \`GET /api/activity-feed\` (sin filtro de tipo), que devuelve items con \`type: "MEETUP"\` o \`type: "DATE"\`.

## Cambios realizados
- Una sola llamada a \`activityFeedService.getFeed()\` reemplaza las dos llamadas separadas
- Cards de Meetup: borde azul/primario, icono CalendarDays, muestra participantes, zona, fecha, estado (OPEN/FULL), ubicación
- Cards de Fast Date: borde secundario/rosa, icono Zap, muestra avatar del creador, planes, expiración, compatibilidad
- Filtro unificado: chips ALL | MEETUP | FASTDATE
- Búsqueda por texto aplica a ambos tipos
- Chips de categoría solo visibles cuando se muestran Meetups
- Botones "Crear Meetup" y "Crear Fast Date" en el header

## Endpoint usado
\`GET /api/activity-feed\` — sin \`type\` trae ambos tipos

## Pendiente / mejoras futuras
- [ ] Mostrar Fast Date cards con diseño diferenciado (actualmente usa el mismo componente que antes)
- [ ] Filtros de Fast Date (distancia, compatibilidad) integrados en la barra unificada
- [ ] Paginación o infinite scroll
- [ ] Skeleton loaders por tipo`,
  labels: ["Frontend"],
}

async function main() {
  const labelsOnBoard = await tget(`boards/${BOARD_ID}/labels`)
  const byName = new Map(labelsOnBoard.map((l) => [l.name.trim().toLowerCase(), l.id]))

  // Ensure "Frontend" label exists
  if (!byName.has("frontend")) {
    const created = await postForm("labels", { idBoard: BOARD_ID, name: "Frontend", color: "green" })
    byName.set("frontend", created.id)
    console.log("Etiqueta creada: Frontend", created.id)
  }

  const lists = await tget(`boards/${BOARD_ID}/lists`, { filter: "open" })
  const list = lists.find((l) => PREFERRED_LIST_NAME.test(l.name)) || lists[0]
  console.log("Lista destino:", list.name)

  const idLabels = CARD.labels.map((n) => byName.get(n.toLowerCase())).filter(Boolean).join(",")
  const created = await postForm("cards", { idList: list.id, name: CARD.title, desc: CARD.desc, idLabels })
  console.log("Card creada:", created.shortUrl)
  console.log(created.name)
}

main().catch((e) => { console.error(e); if (e.detail) console.error(JSON.stringify(e.detail, null, 2)); process.exit(1) })
