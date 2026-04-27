"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiError } from "@/lib/api"
import { Activity, CheckCircle2, Server, XCircle, RefreshCw, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ADMIN_PANEL_API_REFERENCE } from "@/lib/admin-known-endpoints"

const BACKEND_DISPLAY =
  typeof process.env.NEXT_PUBLIC_API_URL === "string" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "https://sparkd1-0.onrender.com"

/** Barra compacta: comprueba sesión+proxy con GET /api/profile/me (no implica listado de usuarios). */
export function AdminApiHealthStrip() {
  const [ms, setMs] = useState<number | null>(null)
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle")
  const [errorLine, setErrorLine] = useState<string | null>(null)
  const [pinging, setPinging] = useState(false)

  const ping = useCallback(async () => {
    setPinging(true)
    setErrorLine(null)
    const t0 = performance.now()
    try {
      await api.get("/api/profile/me")
      setMs(Math.round(performance.now() - t0))
      setStatus("ok")
    } catch (e) {
      setMs(null)
      setStatus("err")
      if (e instanceof ApiError) {
        setErrorLine(e.message)
      } else {
        setErrorLine("Error de red o tiempo agotado.")
      }
    } finally {
      setPinging(false)
    }
  }, [])

  useEffect(() => {
    void ping()
  }, [ping])

  return (
    <div className="space-y-2">
    <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-card/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:items-center">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/80">
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-foreground">Conexión y backend</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground" title={BACKEND_DISPLAY}>
            {BACKEND_DISPLAY}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px]",
            status === "ok" && "border-emerald-500/30 bg-emerald-500/5 text-emerald-600",
            status === "err" && "border-rose-500/30 bg-rose-500/5 text-rose-600",
            status === "idle" && "border-border/80 bg-muted/30 text-muted-foreground"
          )}
        >
          {pinging ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : status === "ok" ? (
            <CheckCircle2 className="h-3 w-3 shrink-0" />
          ) : status === "err" ? (
            <XCircle className="h-3 w-3 shrink-0" />
          ) : (
            <Activity className="h-3 w-3 shrink-0 opacity-60" />
          )}
          <span className="max-w-[14rem] truncate">
            {pinging
              ? "Comprobando…"
              : status === "ok"
                ? `Sesión API OK${ms != null ? ` · ${ms}ms` : ""}`
                : status === "err"
                  ? (errorLine ?? "Error")
                  : "—"}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-[10px]"
          onClick={() => void ping()}
          disabled={pinging}
        >
          <RefreshCw className={cn("h-3 w-3", pinging && "animate-spin")} />
          Ping
        </Button>
      </div>
    </div>

    <details className="group rounded-lg border border-border/60 bg-muted/20 text-[10px] text-muted-foreground">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-2.5 py-1.5 font-medium text-foreground/80 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-3 w-3 shrink-0 transition group-open:rotate-180" />
        Rutas de API usadas en este panel
      </summary>
      <ul className="space-y-1.5 border-t border-border/50 px-2.5 py-2">
        {ADMIN_PANEL_API_REFERENCE.map((row) => (
          <li key={row.area}>
            <span className="text-foreground/90">{row.area}</span>{" "}
            <span className="text-muted-foreground/80">({row.methods})</span>
            <div className="mt-0.5 font-mono text-[9px] leading-relaxed text-muted-foreground">
              {row.paths.join(" · ")}
            </div>
          </li>
        ))}
      </ul>
    </details>
    </div>
  )
}
