/**
 * Crea en Trello cards de trabajo backend faltantes para integrar el panel
 * (y opcionalmente etiquetas), usando credenciales de .env.local
 *
 * Uso: node scripts/trello-bulk-endpoints.mjs
 *
 * No idempotente: volver a ejecutar duplica cards. Las etiquetas sí se omiten si ya existen (mismo nombre).
 */
import fs from "fs"
const envPath = new URL("../.env.local", import.meta.url)
const raw = fs.readFileSync(envPath, "utf8")
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

const BOARD_ID = "69b316a06238dae98730288d" // Sparkd
const PREFERRED_LIST_NAME = /pendiente de hacer backend/i

/** Etiquetas a asegurar: nombre y color (Trello) */
const LABELS_TO_ENSURE = [
  { name: "Backend", color: "blue" },
  { name: "API", color: "green" },
  { name: "Panel Admin", color: "purple" },
  { name: "Panel Manager", color: "sky" },
  { name: "Analítica", color: "orange" },
  { name: "Bloqueado front", color: "red" },
]

const CARDS = [
  {
    title: "[API] Admin overview — series reales (matches 7d, ingresos diarios)",
    labels: ["Backend", "API", "Panel Admin", "Analítica"],
    desc: `Contexto: dashboard admin "Overview" tiene mini-barras "Matches (7d)" e "Ingresos diarios" aún con datos demo.

Necesidad: endpoints o campos en stats que alimenten series temporales, por ejemplo:
- GET /api/admin/analytics/matches-daily?days=7
- GET /api/admin/analytics/revenue-daily?days=7
o extender GET /admin/stats|/api/admin/growth con series.

Front: reemplaza series fijas en admin-overview (badges "Demo" hasta conectar).`,
  },
  {
    title: "[API] Admin contenido — estadísticas de posts y moderación (content-stats)",
    labels: ["Backend", "API", "Panel Admin"],
    desc: `Sección "Contenido" del admin es 100% demo.

Propuesta: GET /api/admin/content-stats
- conteos: posts, reportados, eliminados, con media, etc. (acordar contrato)
- optional paginado top posts

Front: admin-content.tsx hoy usa datos fijos.`,
  },
  {
    title: "[API] Admin ingresos / facturación — MRR, transacciones, cancelaciones (Stripe o interno)",
    labels: ["Backend", "API", "Panel Admin", "Analítica"],
    desc: `Sección "Ingresos" es demo (MRR, transacciones, cancelaciones).

Necesita backend: agregación desde Stripe/suscripciones o tablas de billing.
Ej.: GET /api/admin/revenue/summary, series temporales, churn.

Front: admin-revenue conecta cuando exista contrato JSON.`,
  },
  {
    title: "[API] Admin engagement — swipes, matches, embudo (funnel)",
    labels: ["Backend", "API", "Panel Admin", "Analítica"],
    desc: `Sección "Engagement" usa datos estáticos.

Necesita: endpoints de producto analítica (o exportación) p. ej. 
GET /api/admin/analytics/engagement con métricas acordadas.

Front: admin-engagement.`,
  },
  {
    title: "[API] Admin geografía e idioma — agregación por región/idioma",
    labels: ["Backend", "API", "Panel Admin", "Analítica"],
    desc: `Sección "Geografía" es demo.

Necesita: agregación server-side (no exponer PII) p. ej. 
GET /api/admin/geo o campos en stats por país/idioma.

Front: admin-geo.`,
  },
  {
    title: "[API] Admin notificaciones — métricas de envío, campañas, canales (FCM, etc.)",
    labels: ["Backend", "API", "Panel Admin"],
    desc: `Sección "Notificaciones" es demo; sin conexión a métricas reales de push.

Necesita: endpoints o integración con proveedor; definir mínimo viable (envíos, entregados, errores).

Front: admin-notifications.`,
  },
  {
    title: "[API] Admin A/B testing — experimentos (CRUD o lectura de flags)",
    labels: ["Backend", "API", "Panel Admin"],
    desc: `Sección A/B es simulada.

Necesita: modelo de experimentos/variantes y API (aunque sea lectura) o feature flags con auditoría.

Front: admin-abtesting.`,
  },
  {
    title: "[API] Admin benchmarks / comparativas — (opcional) fuente de datos o integración",
    labels: ["Backend", "API", "Panel Admin"],
    desc: `Sección "Benchmarks" no conecta a servicios.

Decidir: ¿benchmarks manuales, CSV, o integración? Mínimo: endpoint con lectura o descartar sección.
Front: admin-benchmarks.`,
  },
  {
    title: "[API] Admin auditoría — GET /api/admin/audit-log (paginado, filtros)",
    labels: ["Backend", "API", "Panel Admin"],
    desc: `Sección "Auditoría" es filas fijas.

Necesita: log de acciones admin/moderación persistido y
GET /api/admin/audit-log?from&to&actor&action&page&size

Front: admin-auditlog.`,
  },
  {
    title: "[API] Admin sistema / observabilidad — salud, métricas, tráfico (o actuator proxy)",
    labels: ["Backend", "API", "Panel Admin"],
    desc: `Sección "Sistema" (salud, logs, tráfico) es demo.

Opciones: exponer agregados seguros, vincular a APM, o 503/health mínimo.
GET /api/admin/health, métricas agregadas; sin filtrar secretos.

Front: admin-system.`,
  },
  {
    title: "[API] Manager actividad — feed de actividad en vivo (o WebSocket/ SSE)",
    labels: ["Backend", "API", "Panel Manager", "Analítica"],
    desc: `Sección Manager "Actividad" simula un feed fijo.

Necesita: eventos recientes (reportes, posts, baneos) o stream.
GET /api/manager/activity?limit=… (rol MANAGER/ADMIN)

Front: manager-activity.`,
  },
  {
    title: "[API] Manager usuarios — listado con permisos manager (reutilizar o variante de admin users)",
    labels: ["Backend", "API", "Panel Manager"],
    desc: `Tabla de usuarios de ejemplo. 

Opción A: GET /api/manager/users con permisos acotados.
Opción B: reutilizar GET /api/admin/users con policy por rol.
Definir qué columnas/acciones puede ver un manager.

Front: manager-users.`,
  },
  {
    title: "[API] Manager contenido — cola o listado de posts a moderar (ocultar, restaurar, eliminar)",
    labels: ["Backend", "API", "Panel Manager"],
    desc: `Posts en manager son demo.

Necesita: listado y acciones de moderación bajo rol MANAGER.
GET /api/manager/posts?status=…, POST acciones, coherente con reglas de producto.

Front: manager-content.`,
  },
  {
    title: "[API] Manager mensajes — inspección de conversaciones (sólo si producto/ legal lo permite)",
    labels: ["Backend", "API", "Panel Manager", "Bloqueado front"],
    desc: `Chats de ejemplo. 

Alta sensibilidad (privacidad). Si se implementa: acuerdo legal, mínimo de datos, audit log, rate limits.
Definir si la card se pospone: puede quedar "bloqueada" hasta criterio producto.

Front: manager-messages.`,
  },
  {
    title: "[API] Referencia: GET /api/admin/users, roles, mod reports — alinear y documentar (OpenAPI)",
    labels: ["Backend", "API", "Panel Admin", "Panel Manager"],
    desc: `Rutas ya usadas en front (proxy): /api/admin/users, /admin/stats, /admin/growth, /api/administrator/user-roles/assign, reportes moderator/admin.

Necesidad: documento único o OpenAPI, versionado y manejo de 403/404/500; evitar /admin/* vs /api/admin/* incoherente en despliegues.

No es "nuevo" endpoint salvo alineación; label para seguimiento de contrato.
Front: lib/admin-known-endpoints, reportService, admin-users.`,
  },
]

/** GET: key/token en query; `query` añade más query params. */
async function tget(path, query = {}) {
  const u = new URL(`https://api.trello.com/1/${path}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  for (const [k, v] of Object.entries(query)) {
    u.searchParams.set(k, String(v))
  }
  const r = await fetch(u)
  const text = await r.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (!r.ok) {
    const err = new Error(`Trello GET ${path} -> ${r.status}`)
    err.detail = data
    throw err
  }
  return data
}

/** POST form: key+token en query, resto en body (Trello). */
function postForm(path, form) {
  const u = new URL(`https://api.trello.com/1/${path}`)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) {
    if (v != null && v !== "") body.set(k, String(v))
  }
  return fetch(u, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  }).then(async (r) => {
    const text = await r.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    if (!r.ok) {
      const err = new Error(`Trello POST ${path} -> ${r.status}`)
      err.detail = data
      throw err
    }
    return data
  })
}

async function main() {
  const labelsOnBoard = await tget(`boards/${BOARD_ID}/labels`)
  if (!Array.isArray(labelsOnBoard)) throw new Error("no labels array")

  const byName = new Map(
    labelsOnBoard.map((l) => [l.name.trim().toLowerCase(), l.id])
  )

  for (const { name, color } of LABELS_TO_ENSURE) {
    if (!byName.has(name.toLowerCase())) {
      const created = await postForm("labels", {
        idBoard: BOARD_ID,
        name,
        color,
      })
      byName.set(name.toLowerCase(), created.id)
      console.log("Etiqueta creada:", name, created.id)
    }
  }

  const listsOpen = await tget(`boards/${BOARD_ID}/lists`, { filter: "open" })
  const list = listsOpen.find((l) => PREFERRED_LIST_NAME.test(l.name)) || listsOpen[0]
  if (!list) throw new Error("no list")
  console.log("Lista destino:", list.name, list.id)

  const results = []
  for (const card of CARDS) {
    const idLabels = card.labels
      .map((n) => byName.get(n.toLowerCase()))
      .filter(Boolean)
      .join(",")
    const form = {
      idList: list.id,
      name: card.title,
      desc: card.desc,
    }
    if (idLabels) form.idLabels = idLabels
    const created = await postForm("cards", form)
    results.push(created)
    console.log("Card:", created.name?.slice(0, 50) + "…", created.shortUrl)
  }

  console.log("\nTotal cards creadas:", results.length)
  results.forEach((c) => console.log(c.shortUrl, "-", c.name))
}

main().catch((e) => {
  console.error(e)
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2))
  process.exit(1)
})
