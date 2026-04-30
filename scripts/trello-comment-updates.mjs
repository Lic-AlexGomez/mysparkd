import fs from "node:fs"
import path from "node:path"

function readEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return {}
  const txt = fs.readFileSync(envPath, "utf8")
  const out = {}
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    const idx = line.indexOf("=")
    if (idx < 0) continue
    const k = line.slice(0, idx).trim()
    let v = line.slice(idx + 1).trim()
    v = v.replace(/^['"]|['"]$/g, "")
    out[k] = v
  }
  return out
}

async function postComment({ apiKey, token, cardId, text }) {
  const url = new URL(`https://api.trello.com/1/cards/${cardId}/actions/comments`)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("token", token)

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ text }).toString(),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Trello ${res.status} for ${cardId}: ${body}`)
  }
}

const envLocal = readEnvLocal()
const apiKey = process.env.TRELLO_API_KEY || envLocal.TRELLO_API_KEY
const token = process.env.TRELLO_TOKEN || envLocal.TRELLO_TOKEN

if (!apiKey || !token) {
  throw new Error("Missing Trello credentials. Set TRELLO_API_KEY/TRELLO_TOKEN in .env.local or environment.")
}

const comments = [
  {
    cardId: "69eed1af47cae34c2347b017", // #195
    text:
      "✅ FE #195 Manager Activity\n" +
      "- Conectado a managerService (API real)\n" +
      "- Paginación (Cargar más) + auto-refresh cada 60s\n" +
      "- Estados loading/empty/error (toast) + badges por status\n\n" +
      "Archivos: components/manager/sections/manager-activity.tsx, lib/services/manager.ts",
  },
  {
    cardId: "69eed1b00fda1390cfcd3d18", // #196
    text:
      "✅ FE #196 Manager Users\n" +
      "- Conectado a managerService.users (API real)\n" +
      "- Búsqueda por username con debounce\n" +
      "- Paginación + filtros UI (activo/advertido/baneado)\n" +
      "- Estados loading/empty/error (toast)\n\n" +
      "Archivos: components/manager/sections/manager-users.tsx, lib/services/manager.ts",
  },
  {
    cardId: "69eed1b0088f8500a1b78cf9", // #197
    text:
      "✅ FE #197 Manager Content (Moderación)\n" +
      "- Conectado a managerService.contentQueue + acciones hide/restore/delete\n" +
      "- Paginación + búsqueda + filtros por status\n" +
      "- Confirmación antes de acciones (incluye delete irreversible)\n\n" +
      "Archivos: components/manager/sections/manager-content.tsx, lib/services/manager.ts",
  },
  {
    cardId: "69f2a9c39da3e598e33904f9", // #222
    text:
      "✅ FE #222 Invite links (gestión avanzada)\n" +
      "- UI para listar/seleccionar link activo, crear nuevo (rol, expiración, maxUses) y desactivar\n" +
      "- Copiar link usa el link seleccionado\n" +
      "- Usa groupService.inviteLinks.list/create/remove\n\n" +
      "Archivos: app/(app)/groups/page.tsx, lib/services/group.ts\n\n" +
      "Nota: esta implementación aplica a /api/groups/{groupId}/invite-links (no a eventos).",
  },
  {
    cardId: "69f2bdeb8d64ab63d2b86dad", // #228
    text:
      "✅ FE #228 Likes paywall/blur\n" +
      "- Preview de cards en blur detrás del paywall para no-premium\n" +
      "- Sin lógica de unlock one-time (solo UI/teaser)\n\n" +
      "Archivo: app/(app)/likes/page.tsx",
  },
]

for (const c of comments) {
  await postComment({ apiKey, token, ...c })
}

console.log(`Posted ${comments.length} Trello comments.`)

