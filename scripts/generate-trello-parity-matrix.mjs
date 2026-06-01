/**
 * Genera la matriz de paridad FE (web + mobile + backend) desde el export Trello.
 *
 * Uso: node scripts/generate-trello-parity-matrix.mjs
 * Entrada: docs/trello-frontend-all-lists.json
 * Salida:  docs/trello-fe-parity-matrix.json
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INPUT = path.join(__dirname, "../docs/trello-frontend-all-lists.json")
const OUTPUT = path.join(__dirname, "../docs/trello-fe-parity-matrix.json")
const PENDING_IDS = path.join(__dirname, "../docs/trello-pendiente-frontend-completo.json")

/** idShort -> { backend, web, mobile, targetPlatform } */
const PENDING_AUDIT = {
  245: { backend: "PARTIAL", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  249: { backend: "PARTIAL", web: "MISSING", mobile: "MISSING", targetPlatform: "both" },
  253: { backend: "PARTIAL", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  254: { backend: "PARTIAL", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  256: { backend: "N/A", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  257: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  258: { backend: "DONE", web: "DONE", mobile: "MISSING", targetPlatform: "both" },
  259: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  260: { backend: "PARTIAL", web: "MISSING", mobile: "MISSING", targetPlatform: "both" },
  262: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  289: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  290: { backend: "PARTIAL", web: "MISSING", mobile: "MISSING", targetPlatform: "both" },
  291: { backend: "PARTIAL", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  292: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  293: { backend: "DONE", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  294: { backend: "DONE", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  295: { backend: "PARTIAL", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  302: { backend: "N/A", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  303: { backend: "DONE", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  304: { backend: "DONE", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  305: { backend: "N/A", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  306: { backend: "N/A", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  307: { backend: "PARTIAL", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  308: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  309: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  310: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  311: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  312: { backend: "DONE", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  313: { backend: "N/A", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  314: { backend: "DONE", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  315: { backend: "DONE", web: "N/A", mobile: "DONE", targetPlatform: "mobile" },
  321: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  322: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  323: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  324: { backend: "DONE", web: "PARTIAL", mobile: "MISSING", targetPlatform: "both" },
  325: { backend: "DONE", web: "MISSING", mobile: "PARTIAL", targetPlatform: "both" },
  326: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
  327: { backend: "DONE", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  328: { backend: "DONE", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  341: { backend: "DONE", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  342: { backend: "DONE", web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both" },
  343: { backend: "DONE", web: "MISSING", mobile: "DONE", targetPlatform: "both" },
  344: { backend: "DONE", web: "DONE", mobile: "DONE", targetPlatform: "both" },
}

/** Reglas por nombre para lista de revisión (orden importa). */
const REVISION_NAME_RULES = [
  { test: /sparkling/i, web: "DONE", mobile: "MISSING", targetPlatform: "both", backend: "DONE" },
  {
    test: /stories?|historia/i,
    unless: /sparkling/i,
    web: "DONE",
    mobile: "DONE",
    targetPlatform: "both",
    backend: "DONE",
  },
  { test: /feed.*following|feed para seguidores/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /bookmark|guardados?|💾/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /repost|reshare|sistema de repost/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /mensajes fijados|pinned/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /change.?password|change password/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /privacidad|privacy/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /voice note|nota de voz|voice note/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /reacciones en chat|reactions in chat/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  {
    test: /seguidores|followers|following|contadores de seguidores|follows request/i,
    web: "DONE",
    mobile: "DONE",
    targetPlatform: "both",
    backend: "DONE",
  },
  { test: /busqueda inteligente|intelligent search|search.*completo/i, web: "DONE", mobile: "PARTIAL", targetPlatform: "both", backend: "DONE" },
  { test: /notification/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /date.?cards?|mis cards|my cards|datecards\/mine/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "DONE" },
  { test: /meetup|meet.?up|date-cards\/feed/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /grupos|groups|👥/i, web: "DONE", mobile: "PARTIAL", targetPlatform: "both", backend: "DONE" },
  { test: /poll/i, web: "PARTIAL", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /admin\/users|admin users/i, web: "DONE", mobile: "N/A", targetPlatform: "web", backend: "DONE" },
  { test: /moderator|reportes completos|reports\/all/i, web: "PARTIAL", mobile: "N/A", targetPlatform: "web", backend: "PARTIAL" },
  { test: /verification.*email|verificaci[oó]n de email/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "PARTIAL" },
  { test: /15.?d[ií]as|free trial/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "PARTIAL" },
  { test: /engagement summary|feed engagement/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "MISSING" },
  { test: /preferredLanguage|idioma preferido/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "MISSING" },
  { test: /groups\/analytics|group analytics/i, web: "MISSING", mobile: "MISSING", targetPlatform: "both", backend: "MISSING" },
  { test: /last seen|presencia|presence/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /campo ['"]?read['"]?|doble check|read receipts/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /comentarios paginados|pagination/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "DONE" },
  { test: /resetPassword|reset password/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /system.*message|tipo ["']system["']/i, web: "DONE", mobile: "DONE", targetPlatform: "both", backend: "DONE" },
  { test: /admin\/all\/users|ADMIN\/ALL/i, web: "PARTIAL", mobile: "N/A", targetPlatform: "web", backend: "PARTIAL" },
  { test: /fotos en los grupos|foto de portada/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "PARTIAL" },
  { test: /uiPreferences|apariencia en perfil|ui_preferences/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "MISSING" },
  { test: /fechaRegistro|miembro desde/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "MISSING" },
  { test: /mejorar endpoint.*notifications/i, web: "PARTIAL", mobile: "PARTIAL", targetPlatform: "both", backend: "PARTIAL" },
]

const REVISION_LIST_RE = /terminado.*revision.*frontend/i
const PENDING_LIST_RE = /pendiente de hacer frontend/i

function loadIdLookup() {
  const map = new Map()
  if (fs.existsSync(PENDING_IDS)) {
    const data = JSON.parse(fs.readFileSync(PENDING_IDS, "utf8"))
    for (const c of data.cards || []) {
      if (c.idShort != null) map.set(c.idShort, c.id)
    }
  }
  return map
}

function shortLinkFromUrl(url) {
  const m = String(url || "").match(/trello\.com\/c\/([^/?#]+)/i)
  return m ? m[1] : null
}

function resolveCardId(card, idLookup) {
  if (card.id) return card.id
  const fromLookup = idLookup.get(card.idShort)
  if (fromLookup) return fromLookup
  return shortLinkFromUrl(card.url) || `unknown-${card.idShort}`
}

function extractEndpointHint(name, desc) {
  const text = `${name}\n${desc || ""}`
  const verbs = ["GET", "POST", "PUT", "PATCH", "DELETE"]
  for (const verb of verbs) {
    const re = new RegExp(`${verb}\\s+(/(?:api|auth|moderator)[^\\s\`"'<>\\n]+)`, "i")
    const m = text.match(re)
    if (m) return `${verb.toUpperCase()} ${m[1].replace(/[.,;:]+$/, "")}`
  }
  const pathOnly = text.match(/\/(?:api|auth|moderator)\/[a-z0-9\-/{}\[\]_$.?=&]+/i)
  if (pathOnly) return pathOnly[0].replace(/[.,;:]+$/, "")
  return null
}

function backendField(status, endpointHint) {
  return {
    status,
    endpointHint: endpointHint || null,
  }
}

function inferTargetPlatform(name, desc) {
  const text = `${name} ${desc || ""}`.toLowerCase()
  if (/revenuecat|react-native|fcm|firebase|sign in with apple|app m[oó]vil|mobile only|ios|android/i.test(text)) {
    return "mobile"
  }
  if (/solo web|web only|panel admin|dashboard admin|moderator/i.test(text)) return "web"
  return "both"
}

function targetPlatformDone(web, mobile, targetPlatform) {
  if (targetPlatform === "web") return web === "DONE"
  if (targetPlatform === "mobile") return mobile === "DONE"
  if (targetPlatform === "both") return web === "DONE" && mobile === "DONE"
  return false
}

function computeAction({ web, mobile, targetPlatform, listName }) {
  if (targetPlatformDone(web, mobile, targetPlatform)) return "move"
  if (REVISION_LIST_RE.test(listName)) return "review"
  return "implement"
}

function matchRevisionRule(name) {
  for (const rule of REVISION_NAME_RULES) {
    if (rule.test.test(name) && !(rule.unless && rule.unless.test(name))) return rule
  }
  return null
}

function buildRevisionEntry(card, listName) {
  const isBackendCard = /^\[Backend\]/i.test(card.name)
  const endpointHint = extractEndpointHint(card.name, card.desc)
  const rule = matchRevisionRule(card.name)

  let backendStatus = isBackendCard ? "DONE" : rule?.backend ?? "PARTIAL"
  let web = rule?.web ?? (isBackendCard ? "PARTIAL" : "PARTIAL")
  let mobile = rule?.mobile ?? (isBackendCard ? "PARTIAL" : "PARTIAL")
  let targetPlatform = rule?.targetPlatform ?? inferTargetPlatform(card.name, card.desc)

  const notes = []
  if (isBackendCard) notes.push("[Backend] card — backend assumed DONE")
  if (rule) notes.push(`Matched revision rule: ${rule.test}`)
  if (!rule && !isBackendCard) notes.push("No name rule match — default review")

  return {
    backend: backendField(backendStatus, endpointHint),
    web,
    mobile,
    targetPlatform,
    notes: notes.join("; "),
  }
}

function buildPendingEntry(card) {
  const audit = PENDING_AUDIT[card.idShort]
  const endpointHint = extractEndpointHint(card.name, card.desc)

  if (!audit) {
    const targetPlatform = inferTargetPlatform(card.name, card.desc)
    return {
      backend: backendField("PARTIAL", endpointHint),
      web: "PARTIAL",
      mobile: "PARTIAL",
      targetPlatform,
      notes: "No explicit audit row — inferred PARTIAL",
    }
  }

  return {
    backend: backendField(audit.backend, endpointHint),
    web: audit.web,
    mobile: audit.mobile,
    targetPlatform: audit.targetPlatform,
    notes: "Pending FE audit 2026-05",
  }
}

function buildDefaultEntry(card, listName) {
  const endpointHint = extractEndpointHint(card.name, card.desc)
  const targetPlatform = inferTargetPlatform(card.name, card.desc)
  return {
    backend: backendField("PARTIAL", endpointHint),
    web: "PARTIAL",
    mobile: "PARTIAL",
    targetPlatform,
    notes: `List: ${listName}`,
  }
}

function buildCardEntry(card, listName, idLookup) {
  let parity
  if (PENDING_LIST_RE.test(listName)) {
    parity = buildPendingEntry(card)
  } else if (REVISION_LIST_RE.test(listName)) {
    parity = buildRevisionEntry(card, listName)
  } else {
    parity = buildDefaultEntry(card, listName)
  }

  const action = computeAction({
    web: parity.web,
    mobile: parity.mobile,
    targetPlatform: parity.targetPlatform,
    listName,
  })

  return {
    id: resolveCardId(card, idLookup),
    idShort: card.idShort,
    name: card.name,
    url: card.url,
    listName,
    backend: parity.backend,
    web: parity.web,
    mobile: parity.mobile,
    targetPlatform: parity.targetPlatform,
    action,
    testsPass: false,
    notes: parity.notes,
  }
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Missing input: ${INPUT}`)
    process.exit(1)
  }

  const source = JSON.parse(fs.readFileSync(INPUT, "utf8"))
  const idLookup = loadIdLookup()
  const cards = []

  for (const list of source.lists || []) {
    for (const card of list.cards || []) {
      cards.push(buildCardEntry(card, list.name, idLookup))
    }
  }

  cards.sort((a, b) => (a.idShort || 0) - (b.idShort || 0))

  const moveReady = cards.filter((c) => c.action === "move")

  const output = {
    boardId: source.boardId,
    generatedAt: new Date().toISOString(),
    source: path.basename(INPUT),
    totalCards: cards.length,
    moveReadyCount: moveReady.length,
    cards,
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8")

  console.log(`Wrote ${OUTPUT}`)
  console.log(`Total cards: ${output.totalCards}`)
  console.log(`Move-ready: ${output.moveReadyCount}`)
}

main()
