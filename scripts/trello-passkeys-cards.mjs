/**
 * Tarjetas Trello: Implementación de Passkeys/WebAuthn para Sparkd
 * Basado en el plan de documentación PASSKEYS_PLAN.md
 * 
 * Uso: node scripts/trello-passkeys-cards.mjs
 */
import fs from "fs"

const envPath = new URL("../.env.local", import.meta.url)
const raw = fs.readFileSync(envPath, "utf8")
const get = (name) => {
  const m = raw.match(new RegExp("^" + name + "=(.+)$", "m"))
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
  { name: "Auth", color: "orange" },
  { name: "Security", color: "red" }
]

const AUDIT_NOTE =
  "Tarjetas generadas desde PASSKEYS_PLAN.md - Implementación de Passkeys/WebAuthn para Sparkd Mobile"

const CARDS = [
  {
    title: "[BE] Modelo de Base de Datos para Passkeys",
    labels: ["Backend", "Security"],
    desc: AUDIT_NOTE + "\n\n**Problema:** Necesitamos almacenar las passkeys registradas por los usuarios para autenticación WebAuthn.\n\n**Detalles:**\n- Crear tabla `passkeys` con los siguientes campos:\n  * `id` (PK, auto-increment)\n  * `user_id` (FK a tabla users)\n  * `public_key` (TEXT, clave pública del credential en formato COSE)\n  * `credential_id` (TEXT, ID único del credential, base64url)\n  * `counter` (BIGINT, para prevenir replay attacks, inicia en 0)\n  * `device_name` (VARCHAR, nombre descriptivo del dispositivo)\n  * `created_at` (TIMESTAMP)\n  * `updated_at` (TIMESTAMP)\n- Añadir índices: `user_id` para búsquedas rápidas, `credential_id` para unicidad\n- Considerar constraint único en (`user_id`, `credential_id`)\n- Documentar el esquema en migraciones de base de datos\n\n**Referencia:** Ver sección \"Cambios Backend Necesarios\" en PASSKEYS_PLAN.md"
    },
  {
    title: "[BE] POST /auth/passkeys/register/options - Generar desafío de registro",
    labels: ["Backend", "API", "Auth"],
    desc: AUDIT_NOTE + "\n\n**Problema:** Necesitamos un endpoint que genere las opciones para el registro de una nueva passkey según la especificación WebAuthn.\n\n**Detalles:**\n- Ruta: POST /auth/passkeys/register/options\n- Body: { userId: string, username: string, displayName: string }\n- Validar que el usuario exista\n- Generar challenge criptográficamente seguro (al menos 16 bytes)\n- Construir objeto de opciones según WebAuthn Level 3:\n  * rp: { name: \"Sparkd\", id: \"mysparkd.com\" }\n  * user: { id: base64url(userId), name: username, displayName: displayName }\n  * pubKeyCredParams: [ {type: \"public-key\", alg: -7}, {type: \"public-key\", alg: -257} ]\n  * timeout: 60000\n  * attestation: \"none\"\n  * authenticatorSelection: { \n      authenticatorAttachment: \"platform\",\n      requireResidentKey: false, \n      userVerification: \"preferred\" \n    }\n- Devolver las opciones como JSON\n- Manejar errores: usuario no encontrado, fallo al generar challenge"
    },
  {
    title: "[BE] POST /auth/passkeys/register/verify - Verificar registro de passkey",
    labels: ["Backend", "API", "Auth"],
    desc: AUDIT_NOTE + "\n\n**Problema:** Necesitamos verificar la respuesta del authenticator durante el registro de una passkey y almacenarla de forma segura.\n\n**Detalles:**\n- Ruta: POST /auth/passkeys/register/verify\n- Body: Estándar de credential de WebAuthn (id, rawId, response, type)\n- Validar todos los campos requeridos\n- Recuperar el challenge generado previamente (debería estar en sesión o cache temporal)\n- Verificar:\n  * Que el challenge coincida\n  * Que el origen (origin) sea correcto\n  * Que el tipo sea \"public-key\"\n  * Que la attestation object sea válida (opcional, podemos aceptar \"none\")\n  * Que el clientDataJSON sea válido y tenga el challenge correcto\n  * Verificar la firma si se proporciona attestation\n- Extraer y validar la clave pública del credential\n- Almacenar en la tabla passkeys:\n  * user_id (del challenge/session)\n  * public_key (clave pública en formato COSE)\n  * credential_id (rawId)\n  * counter (0 inicial)\n  * device_name (opcional, del clientDataJSON o pedir al usuario)\n- Incrementar/actualizar timestamp\n- Devolver éxito y el ID de la passkey creada\n- Manejar errores: challenge inválido, verificación fallida, credential duplicado"
    },
  {
    title: "[BE] POST /auth/passkeys/login/options - Generar desafío de autenticación",
    labels: ["Backend", "API", "Auth"],
    desc: AUDIT_NOTE + "\n\n**Problema:** Necesitamos un endpoint que genere las opciones para autenticación con passkey según WebAuthn.\n\n**Detalles:**\n- Ruta: POST /auth/passkeys/login/options\n- Body: { userId: string } (opcional, si se conoce el usuario)\n- Si se proporciona userId, validar que exista y recuperar sus passkeys\n- Si no se proporciona, devolver allowCredentials vacío (el usuario deberá seleccionar su cuenta de otra manera)\n- Generar challenge criptográficamente seguro\n- Construir opciones de autenticación:\n  * challenge: el generated challenge\n  * timeout: 60000\n  * rpId: \"mysparkd.com\"\n  * allowCredentials: array de objetos para cada passkey registrada del usuario\n    * Cada objeto: { type: \"public-key\", id: credential_id (base64url), transports: [\"internal\"] }\n  * userVerification: \"preferred\"\n- Devolver las opciones como JSON\n- Guardar el challenge asociado al usuario/session para verificación posterior\n- Manejar errores: usuario no encontrado (si se proporcionó), fallo al generar challenge"
    },
  {
    title: "[BE] POST /auth/passkeys/login/verify - Verificar autenticación con passkey",
    labels: ["Backend", "API", "Auth"],
    desc: AUDIT_NOTE + "\n\n**Problema:** Necesitamos verificar la respuesta del authenticator durante el login con passkey y crear una sesión de usuario.\n\n**Detalles:**\n- Ruta: POST /auth/passkeys/login/verify\n- Body: Estándar de credential de WebAuthn (id, rawId, response, type)\n- Validar todos los campos requeridos\n- Recuperar el challenge generado previamente (debería estar en sesión o cache temporal)\n- Encontrar la passkey en la base de datos por credential_id (rawId)\n- Si no se encuentra, error de credencial no registrada\n- Verificar:\n  * Que el challenge coincida con el almacenado para este usuario/session\n  * Que el origen (origin) sea correcto\n  * Que el tipo sea \"public-key\"\n  * Que el authenticatorData sea válido y tenga el rpIdHash correcto\n  * Que el clientDataJSON sea válido y tenga el challenge y origen correctos\n  * Verificar la signature usando la clave pública almacenada\n  * Check del counter: el nuevo counter debe ser mayor que el almacenado (prevenir replay attacks)\n- Si todo es válido:\n  * Actualizar el counter en la base de datos con el nuevo valor\n  * Actualizar updated_at timestamp\n  * Generar JWT token de sesión (igual que en login normal)\n  * Recuperar datos completos del usuario\n  * Devolver: { success: true, token: jwtToken, user: { id, username, ... } }\n- Manejar errores: challenge inválido, credencial no encontrada, verificación fallida, counter inválido (replay attack), firma inválida"
    },
  {
    title: "[BE] Integrar passkeys con sistema de autenticación existente",
    labels: ["Backend", "API", "Auth", "Security"],
    desc: AUDIT_NOTE + "\n\n**Problema:** Necesitamos asegurar que el nuevo sistema de passkeys funcione junto con los métodos existentes (email/password, Google) sin conflictos.\n\n**Detalles:**\n- Revisar y actualizar el flujo de login en el frontend para incluir opción de passkey\n- Asegurar que las cookies/sessions de passkey sean compatibles con las existentes\n- Documentar en la API que passkeys son un método alternativo de autenticación\n- Asegurar que el logout elimine tanto sesiones normales como las creadas por passkey\n- Verificar que los middlewares de autenticación acepten tokens generados por passkeys\n- Considerar tasa de intentos (rate limiting) específicamente para endpoints de passkeys\n- Asegurar que los endpoints de passkeys tengan los mismos requisitos de seguridad (HTTPS, headers de seguridad, etc.) que otros endpoints de auth\n- Actualizar documentación de OpenAPI/Swagger para incluir los nuevos endpoints\n- Probar flujos completos: registro de passkey → login con passkey → logout → login normal"
    }
]

async function tget(path, query = {}) {
  const u = new URL("https://api.trello.com/1/" + path)
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
    const err = new Error("Trello GET " + path + " -> " + r.status)
    err.detail = data
    throw err
  }
  return data
}

function postForm(path, form) {
  const u = new URL("https://api.trello.com/1/" + path)
  u.searchParams.set("key", key)
  u.searchParams.set("token", token)
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(form)) {
    if (v != null && v !== "") body.set(k, String(v))
  }
  return fetch(u, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  }).then(async (r) => {
    const text = await r.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    if (!r.ok) {
      const err = new Error("Trello POST " + path + " -> " + r.status)
      err.detail = data
      throw err
    }
    return data
  })
}

async function main() {
  const labelsOnBoard = await tget("boards/" + BOARD_ID + "/labels")
  const byName = new Map(labelsOnBoard.map(l => [l.name.trim().toLowerCase(), l.id]))

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

  const listsOpen = await tget("boards/" + BOARD_ID + "/lists", { filter: "open" })
  const list =
    listsOpen.find(l => PREFERRED_LIST_NAME.test(l.name)) || listsOpen[0]
  if (!list) throw new Error("no list")

  const urls = []
  for (const card of CARDS) {
    const idLabels = card.labels
      .map(n => byName.get(n.toLowerCase()))
      .filter(Boolean)
      .join(",")
    const created = await postForm("cards", {
      idList: list.id,
      name: card.title,
      desc: card.desc,
      ...(idLabels ? { idLabels } : {}),
    })
    urls.push(created.shortUrl)
    console.log("Card:", created.shortUrl, "-", card.title.substring(0, 72))
  }

  console.log("\nTotal:", urls.length)
}

main().catch(e => {
  console.error(e)
  if (e.detail) console.error(JSON.stringify(e.detail, null, 2))
  process.exit(1)
})