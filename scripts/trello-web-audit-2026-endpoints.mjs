/**
 * Auditoría web v0-social (2026-05): crea tarjetas BE/API en Trello con huecos detectados.
 * Lista destino: «Pendiente de hacer backend» (misma convención que trello-fe-be-gap-cards.mjs).
 *
 * Uso: node scripts/trello-web-audit-2026-endpoints.mjs
 */
import fs from "fs"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, "../.env.local")
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

const BOARD_ID = "69b316a06238dae98730288d"
const PREFERRED_LIST_NAME = /pendiente de hacer backend/i

const LABELS_TO_ENSURE = [
  { name: "Backend", color: "blue" },
  { name: "API", color: "green" },
]

const AUDIT_REF =
  "Auditoría FE `v0-social` 2026-05-10: rutas en `lib/services/*`, `app/(app)/*`, proxy `/api/proxy`."

/** Tarjetas nuevas (no sustituyen las ya creadas por trello-fe-be-gap-cards.mjs). */
const CARDS = [
  {
    title: "[BE][Audit 2026] Eventos: rating post-evento + promedio en detalle",
    labels: ["Backend", "API"],
    desc: `${AUDIT_REF}

**Contexto:** El FE no implementa calificación; no hay llamadas a rating en \`lib/services/event.ts\`. Producto esperaba modal post-\`FINISHED\`, estrellas 1–5, comentario opcional, una vez por usuario aprobado (no creador).

**Contrato propuesto (borrador):**
- \`POST /api/events/{eventId}/ratings\` body: \`{ stars: 1-5, comment?: string }\` → 201 o 409 si ya votó.
- \`GET /api/events/{eventId}\` (o sub-recurso): incluir \`averageRating?: number\`, \`ratingCount?: number\`, \`myRating?: { stars, comment }\`.
- Notificación programada día siguiente al evento: fu fuera de alcance FE en esta tarjeta.

**Criterio FE:** cuando exista contrato estable, enlazar \`events/[eventId]/page.tsx\`.`,
  },
  {
    title: "[BE][Audit 2026] Analytics de usuario (reemplazar datos demo en /analytics)",
    labels: ["Backend", "API"],
    desc: `${AUDIT_REF}

**Problema:** \`app/(app)/analytics/page.tsx\` usa números y posts **hardcodeados** (p. ej. vistas 1.234, engagement 68%). No hay llamadas API.

**Propuesta:** 
- \`GET /api/profile/me/analytics\` o \`GET /api/users/me/stats?range=30d\` con series agregadas (vistas perfil, likes recibidos, comentarios, nuevos seguidores, engagement estimado, top posts por métrica).
- Paginación opcional para «top posts».

**FE:** sustituir mocks por hooks cuando el DTO exista.`,
  },
  {
    title: "[BE][Audit 2026] Perfil público: stats de eventos (creados / cancelados) para reputación",
    labels: ["Backend", "API"],
    desc: `${AUDIT_REF}

**Contexto:** UX documentada: contadores eventos creados y cancelados junto a reputación (perfil ajeno). Hoy \`GET /api/profile/{userId}\` puede no exponer estos totales.

**Propuesta:** Extender DTO de perfil con \`eventsCreatedCount\`, \`eventsCancelledCount\` (o sub-recurso \`GET /api/profile/{id}/event-stats\`).

**FE:** ya muestra reputación en \`profile/[userId]/page.tsx\`; añadir chips cuando vengan campos.`,
  },
  {
    title: "[BE][Audit 2026] «Liked me»: desbloqueo one-time (no solo suscripción)",
    labels: ["Backend", "API"],
    desc: `${AUDIT_REF}

**Contexto:** \`components/matches/likes-section.tsx\` usa solo premium (\`user.premium\` / \`usePremiumStatus\`). Producto mencionó plan one-time.

**Propuesta:** 
- \`POST /api/swipes/liked-me/checkout\` (Stripe Payment Link / Checkout Session) o \`POST /api/purchases/liked-me-unlock\`.
- \`GET /api/swipes/liked-me\` debe responder 200 si usuario tiene flag \`likedMeUnlockedUntil\` o compra válida.

Coordinar con monetización.`,
  },
  {
    title: "[BE][Audit 2026] GET /api/reactions/users/{postId} — alinear con query params",
    labels: ["Backend", "API"],
    desc: `${AUDIT_REF}

**Problema:** \`components/feed/reactions-modal.tsx\` llama \`GET /api/reactions/users/\${postId}\` **sin** \`targetType\` ni \`reactionType\`. La documentación interna (\`docs/ENDPOINTS_BACKEND_REFERENCIA.md\`) sugiere query params.

**Propuesta:** 
- Backend acepta POST id sin params **o**
- FE actualiza a \`/api/reactions/users/{id}?targetType=POST\` (tarjeta FE separada).

Verificar contrato real en Spring y unificar.`,
  },
  {
    title: "[BE][Audit 2026] Admin Stripe: métricas dashboard vs lista StripeMetris",
    labels: ["Backend", "API"],
    desc: `${AUDIT_REF}

**Contexto:** \`lib/services/admin.ts\` consume solo subconjunto (MRR, active subs, cancellations, revenue daily, churn). Documentación histórica Stripe admin lista más rutas (refunds, disputes, ARPU, LTV, cohorts, etc.).

**Propuesta:** Inventario de endpoints ya implementados en Spring + priorizar los que faltan para el dashboard admin de ingresos.

**FE:** ampliar sección revenue cuando existan JSON estables.`,
  },
]

async function tget(pathStr, query = {}) {
  const u = new URL(`https://api.trello.com/1/${pathStr}`)
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
    const err = new Error(`Trello GET ${pathStr} -> ${r.status}`)
    err.detail = data
    throw err
  }
  return data
}

function postForm(pathStr, form) {
  const u = new URL(`https://api.trello.com/1/${pathStr}`)
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
      const err = new Error(`Trello POST ${pathStr} -> ${r.status}`)
      err.detail = data
      throw err
    }
    return data
  })
}

async function main() {
  const labelsOnBoard = await tget(`boards/${BOARD_ID}/labels`)
  const byName = new Map(labelsOnBoard.map((l) => [l.name.trim().toLowerCase(), l.id]))

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
  const list =
    listsOpen.find((l) => PREFERRED_LIST_NAME.test(l.name)) || listsOpen[0]
  if (!list) throw new Error("No open list on board")

  const urls = []
  for (const card of CARDS) {
    const idLabels = card.labels
      .map((n) => byName.get(n.toLowerCase()))
      .filter(Boolean)
      .join(",")
    const created = await postForm("cards", {
      idList: list.id,
      name: card.title,
      desc: card.desc,
      ...(idLabels ? { idLabels } : {}),
    })
    urls.push(created.shortUrl || created.url)
    console.log("Card:", created.shortUrl || created.id, "-", card.title.slice(0, 70))
  }

  console.log("\nTotal creadas:", urls.length)
}

main().catch((e) => {
  console.error(e)
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2))
  process.exit(1)
})
