/**
 * Primary event catalog HTTP base (path prefix includes `/api` when upstream expects it).
 * Set EZPLORO_API_BASE_URL or NEXT_PUBLIC_READONLY_EVENTS_API_URL (e.g. …/api).
 *
 * Catalog auth: Ezploro often rejects the Sparkd JWT. Set EZPLORO_API_TOKEN (or
 * EZPLORO_SERVER_BEARER / EZPLORO_BEARER_TOKEN) for server-side Bearer on GET /events.
 */

const DEFAULT_CATALOG = "https://api-v3-backend-ezploro.apps.ezploro.com/api"

export function getEventInfrastructureBaseUrl(): string {
  const raw =
    process.env.EZPLORO_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_EZPLORO_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_READONLY_EVENTS_API_URL?.trim()
  return (raw || DEFAULT_CATALOG).replace(/\/+$/, "")
}
