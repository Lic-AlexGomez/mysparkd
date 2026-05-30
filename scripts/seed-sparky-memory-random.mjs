/**
 * Siembra memoria Sparky con datos de prueba (bond, traits, visitas).
 * Usage:
 *   SPARKY_TEST_USER=test1 SPARKY_TEST_PASSWORD=123456 node scripts/seed-sparky-memory-random.mjs
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

const BASE = (process.env.SPARKY_TEST_BASE_URL || "https://sparkd1-0.onrender.com").replace(/\/$/, "")
const USER = process.env.SPARKY_TEST_USER || "test1"
const PASS = process.env.SPARKY_TEST_PASSWORD || "123456"

const ROUTES = ["feed", "discover", "chat", "profile", "events", "groups", "settings"]
const TRAITS = ["playful", "curious", "warm", "bold", "calm"]
const LEVELS = ["new", "warming", "friend", "close"]

function randomMemory() {
  const bond = Math.floor(Math.random() * 100)
  const visits = {}
  for (let i = 0; i < 4; i++) {
    const r = ROUTES[Math.floor(Math.random() * ROUTES.length)]
    visits[r] = Math.floor(Math.random() * 40) + 1
  }
  return {
    bondPoints: bond,
    relationshipLevel: LEVELS[Math.floor(Math.random() * LEVELS.length)],
    companionId: "sparky",
    traitState: {
      affection: TRAITS[Math.floor(Math.random() * TRAITS.length)],
      energy: Math.random() > 0.5 ? "high" : "medium",
    },
    visitCounts: visits,
    favoriteSections: Object.keys(visits).slice(0, 3),
    momentSummary: [
      "exploró el feed con curiosidad",
      "saludó desde el rinconcito",
      `chispa en ${bond}`,
    ],
    updatedAt: new Date().toISOString(),
  }
}

async function main() {
  let token = process.env.SPARKY_TEST_TOKEN?.trim()
  if (!token) {
    const login = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USER, password: PASS }),
    })
    const data = await login.json()
    if (!login.ok || !data.token) {
      console.error("Login failed", login.status, data)
      process.exit(1)
    }
    token = data.token
    console.log(`Login OK (${USER})`)
  }

  const body = randomMemory()
  console.log("PUT payload:", JSON.stringify(body, null, 2))

  const res = await fetch(`${BASE}/api/sparky/memory`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  console.log(`PUT → ${res.status}`)
  console.log(text.slice(0, 500))
  process.exit(res.ok ? 0 : 1)
}

main()
