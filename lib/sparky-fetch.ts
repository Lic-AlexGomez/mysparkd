"use client"

import {
  companionNotifyError,
  companionNotifyLoadingEnd,
  companionNotifyLoadingStart,
} from "@/lib/companion/api-bridge"

let installed = false

function isSparkyMemoryPut(url: string, init?: RequestInit): boolean {
  if (!url.includes("/api/sparky/memory")) return false
  const method = (init?.method ?? "GET").toUpperCase()
  return method === "PUT" || method === "PATCH"
}

/** Intercepta fetch global para reacciones del companion (carga lenta / error). */
export function installSparkyFetchInterceptor(): void {
  if (typeof window === "undefined" || installed) return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const isSparky = rawUrl.includes("/api/sparky/")
    const isMemoryPut = isSparkyMemoryPut(rawUrl, init)
    if (!isSparky) companionNotifyLoadingStart()
    try {
      const res = await original(input, init)
      if (!isSparky) {
        if (!res.ok) companionNotifyError()
        companionNotifyLoadingEnd()
      }
      // 429 en memoria: esperado si hay ráfagas; la cola en sparky-memory-api reintenta.
      if (isMemoryPut && res.status === 429) {
        return res
      }
      return res
    } catch (e) {
      if (!isSparky) {
        companionNotifyError()
        companionNotifyLoadingEnd()
      }
      throw e
    }
  }
}
