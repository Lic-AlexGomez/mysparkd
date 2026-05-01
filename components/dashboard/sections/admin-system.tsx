"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "./shared"
import { Activity, Cloud, Database, Loader2, Server } from "lucide-react"
import { adminService, type AdminSystemHealth } from "@/lib/services/admin"
import { toast } from "sonner"

const formatUptime = (seconds?: number) => {
  if (seconds == null || Number.isNaN(seconds)) return "—"
  const s = Math.max(0, Math.floor(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h || d) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(" ")
}

const statusBadge = (status?: string) => {
  const up = String(status || "").toUpperCase() === "UP" || String(status || "").toUpperCase() === "PONG"
  return up
    ? "bg-emerald-500/15 text-emerald-500"
    : String(status || "").toUpperCase() === "WARN"
      ? "bg-amber-500/15 text-amber-500"
      : "bg-rose-500/15 text-rose-500"
}

const heapColor = (pct?: number) => {
  if (pct == null || Number.isNaN(pct)) return "bg-muted-foreground"
  if (pct >= 80) return "bg-rose-500"
  if (pct >= 60) return "bg-amber-500"
  return "bg-emerald-500"
}

export function AdminSystem() {
  const [health, setHealth] = useState<AdminSystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const h = await adminService.getSystemHealth()
      setHealth(h)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "No se pudo leer salud del sistema"
      toast.error(msg)
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const t = setInterval(() => {
      void refresh()
    }, 30_000)
    return () => clearInterval(t)
  }, [refresh])

  const dbStatus = health?.database?.status
  const redisStatus = health?.redis?.status
  const heapPct = health?.jvm?.heapUsedPct
  const heapUsed = health?.jvm?.heapUsedMb
  const heapMax = health?.jvm?.heapMaxMb

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Base de datos"
          value={String(dbStatus || "—")}
          icon={Database}
          color="bg-blue-500"
        />
        <StatCard
          label="Redis"
          value={String(redisStatus || "—")}
          icon={Server}
          color="bg-amber-500"
        />
        <StatCard
          label="Heap JVM"
          value={heapPct != null ? `${heapPct}%` : "—"}
          icon={Activity}
          color="bg-emerald-500"
        />
        <StatCard
          label="Uptime JVM"
          value={formatUptime(health?.jvm?.uptimeSeconds)}
          icon={Cloud}
          color="bg-primary"
        />
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" /> Salud del sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !health ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !health ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Última lectura:</span>
                <span className="font-mono text-foreground">{health.timestamp}</span>
                {health.jvm?.javaVersion && (
                  <>
                    <span>·</span>
                    <span>Java {health.jvm.javaVersion}</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      PostgreSQL
                    </p>
                    <Badge className={`text-[10px] border-0 ${statusBadge(dbStatus)}`}>{dbStatus || "—"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {health.database?.product} {health.database?.version ? `· ${health.database.version}` : ""}
                  </p>
                  {health.database?.error && (
                    <p className="text-[11px] text-rose-500">{health.database.error}</p>
                  )}
                </div>

                <div className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Server className="h-4 w-4 text-amber-500" />
                      Redis
                    </p>
                    <Badge className={`text-[10px] border-0 ${statusBadge(redisStatus)}`}>{redisStatus || "—"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Respuesta: <span className="font-mono">{health.redis?.response || "—"}</span>
                  </p>
                  {health.redis?.error && <p className="text-[11px] text-rose-500">{health.redis.error}</p>}
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    Memoria heap
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {heapUsed ?? "—"} / {heapMax ?? "—"} MB
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${heapColor(heapPct)}`}
                    style={{ width: `${Math.min(heapPct ?? 0, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Uptime: <span className="font-semibold text-foreground">{formatUptime(health.jvm?.uptimeSeconds)}</span>
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => void refresh()}
                >
                  Refrescar ahora
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
