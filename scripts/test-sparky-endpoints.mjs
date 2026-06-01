/**
 * Smoke test Sparky endpoints (Render + optional Next proxy).
 * Usage: node scripts/test-sparky-endpoints.mjs
 *
 * Env:
 *   SPARKY_TEST_BASE_URL   — default https://sparkd1-0.onrender.com
 *   SPARKY_TEST_PROXY_URL  — default http://localhost:3000 (Next /api/proxy)
 *   SPARKY_TEST_TOKEN      — JWT (p. ej. localStorage sparkd_token en DevTools)
 *   SPARKY_TEST_USER / SPARKY_TEST_PASSWORD — login si no hay token
 */

import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const p = resolve(__dir, "../.env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}
loadEnvLocal()

const BASE = (process.env.SPARKY_TEST_BASE_URL || "https://sparkd1-0.onrender.com").replace(
  /\/$/,
  ""
)
const PROXY = (process.env.SPARKY_TEST_PROXY_URL || "http://localhost:3000").replace(/\/$/, "")
const USER = process.env.SPARKY_TEST_USER || "testuser"
const PASS = process.env.SPARKY_TEST_PASSWORD || "123456"

const OK = new Set([200, 201, 204])

async function req(method, path, { base = BASE, token, body } = {}) {
  const headers = { Accept: "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const started = Date.now()
  let res
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    return { method, path, status: 0, ok: false, ms: Date.now() - started, error: String(e) }
  }
  const text = await res.text()
  let preview = text.slice(0, 120).replace(/\s+/g, " ")
  if (text.length > 120) preview += "…"
  return {
    method,
    path,
    status: res.status,
    ok: OK.has(res.status),
    ms: Date.now() - started,
    preview,
  }
}

async function login() {
  if (process.env.SPARKY_TEST_TOKEN) return process.env.SPARKY_TEST_TOKEN.trim()
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: USER, password: PASS }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.token) {
    throw new Error(`Login failed HTTP ${res.status}: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return data.token
}

const AUTH_TESTS = [
  { name: "GET memory", method: "GET", path: "/api/sparky/memory", expect: [200] },
  {
    name: "PUT memory",
    method: "PUT",
    path: "/api/sparky/memory",
    expect: [200],
    body: { bondPoints: 10, relationshipLevel: "new" },
  },
  {
    name: "GET memory (after PUT)",
    method: "GET",
    path: "/api/sparky/memory",
    expect: [200],
  },
  {
    name: "POST /api/sparky (free_chat)",
    method: "POST",
    path: "/api/sparky",
    expect: [200],
    body: {
      tier: "auto",
      task: "free_chat",
      userMessage: "hola",
      sparkyContext: { routeKey: "feed" },
    },
  },
  {
    name: "POST /api/ai (legacy)",
    method: "POST",
    path: "/api/ai",
    expect: [200],
    body: { type: "suggestions", otherUsername: "alex" },
  },
  { name: "GET /api/sparky/context", method: "GET", path: "/api/sparky/context", expect: [200] },
  { name: "DELETE memory", method: "DELETE", path: "/api/sparky/memory", expect: [204] },
  { name: "GET memory (empty)", method: "GET", path: "/api/sparky/memory", expect: [200] },
]

function withProxyPrefix(list) {
  return list.map((t) => ({
    ...t,
    path: t.path.startsWith("/api/proxy") ? t.path : `/api/proxy${t.path}`,
  }))
}

async function runSuite(label, baseUrl, token, suiteTests) {
  console.log(`\n── ${label}: ${baseUrl} ──\n`)
  const rows = []
  for (const t of suiteTests) {
    const path = t.path
    const r = await req(t.method, path, {
      base: baseUrl,
      token: t.noToken ? undefined : token,
      body: t.body,
    })
    const expect = t.expect || [200, 201]
    const pass = expect.includes(r.status)
    rows.push({ ...t, path, ...r, pass, expect: expect.join("|") })
    const icon = pass ? "✓" : "✗"
    console.log(
      `${icon} ${t.method.padEnd(6)} ${path.padEnd(36)} → ${r.status || "ERR"} (expect ${expect.join("|")}) ${r.ms}ms`
    )
    if (!pass && r.preview) console.log(`    ${r.preview}`)
    if (r.error) console.log(`    ${r.error}`)
  }
  return rows
}

async function main() {
  console.log(`\nSparky endpoint smoke\n`)
  let token = null
  try {
    token = await login()
    console.log(`Auth: login OK (${USER})`)
  } catch (e) {
    console.log(`Auth: ${e.message}`)
    console.log(`      Sin JWT no se puede validar 200/204 en Render (solo 401).\n`)
    console.log(`      Pasa SPARKY_TEST_TOKEN=<jwt de localStorage sparkd_token>\n`)
  }

  const allRows = []
  const ANON_TESTS = [
    { name: "GET memory sin JWT", method: "GET", path: "/api/sparky/memory", expect: [401] },
  ]
  const ANON_PROXY_TESTS = [
    {
      name: "GET proxy memory sin JWT",
      method: "GET",
      path: "/api/proxy/api/sparky/memory",
      expect: [401],
    },
  ]

  if (token) {
    allRows.push(...(await runSuite("Render (autenticado)", BASE, token, AUTH_TESTS)))
    try {
      allRows.push(
        ...(await runSuite("Next proxy (autenticado)", PROXY, token, withProxyPrefix(AUTH_TESTS)))
      )
    } catch (e) {
      console.log(`\nNext proxy skip: ${e.message}\n`)
    }
  } else {
    allRows.push(...(await runSuite("Render (sin token)", BASE, null, ANON_TESTS)))
    try {
      allRows.push(...(await runSuite("Next proxy (sin token)", PROXY, null, ANON_PROXY_TESTS)))
    } catch {
      console.log("Next en :3000 no responde (arranca npm run dev).\n")
    }
  }

  const failed = allRows.filter((r) => !r.pass)
  console.log(`\n══ Resumen: ${allRows.length - failed.length}/${allRows.length} OK ══\n`)
  if (!token) {
    console.log("Contrato esperado (con JWT válido):")
    console.log("  GET  /api/sparky/memory     → 200")
    console.log("  PUT  /api/sparky/memory     → 200")
    console.log("  DELETE /api/sparky/memory   → 204")
    console.log("  POST /api/sparky            → 200")
    console.log("  POST /api/ai                → 200")
    console.log("  GET  /api/sparky/context     → 200 (si gateway desplegado)\n")
  }
  process.exit(failed.length ? 1 : 0)
}

main()
