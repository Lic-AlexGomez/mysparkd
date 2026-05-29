"use client"

import {
  companionNotifyError,
  companionNotifyLoadingEnd,
  companionNotifyLoadingStart,
} from "@/lib/companion/api-bridge"

let installed = false

/** Intercepta fetch global para reacciones del companion (carga lenta / error). */
export function installSparkyFetchInterceptor(): void {
  if (typeof window === "undefined" || installed) return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const rawUrl =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const isSparky = rawUrl.includes("/api/sparky/")
    if (!isSparky) companionNotifyLoadingStart()
    try {
      const res = await original(input, init)
      if (!isSparky) {
        if (!res.ok) companionNotifyError()
        companionNotifyLoadingEnd()
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
