"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, AlertTriangle, Clock, Flag, Loader2 } from "lucide-react"
import { managerService, type ManagerActivityEvent } from "@/lib/services/manager"
import { toast } from "sonner"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500",
  ACTION_TAKEN: "bg-rose-500/15 text-rose-500",
  REJECTED: "bg-muted text-muted-foreground",
}

export function ManagerActivity() {
  const [events, setEvents] = useState<ManagerActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const load = async (nextPage = 0, append = false) => {
    try {
      if (!append) setIsLoading(true)
      const data = await managerService.activity({ page: nextPage, limit: 20 })
      const rows = Array.isArray(data.events) ? data.events : []
      setEvents((prev) => (append ? [...prev, ...rows] : rows))
      setPage(Number(data.currentPage || nextPage))
      setTotalPages(Number(data.totalPages || 0))
    } catch (error: any) {
      toast.error(error?.message || "No se pudo cargar la actividad de manager")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void load(0, false)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setIsRefreshing(true)
      void load(0, false)
    }, 60_000)
    return () => clearInterval(t)
  }, [])

  const pendingCount = useMemo(
    () => events.filter((e) => String(e.status).toUpperCase() === "PENDING").length,
    [events]
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Eventos visibles</p>
            <p className="text-2xl font-black text-foreground">{events.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-black text-amber-500">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Actualización</p>
              <p className="text-sm font-semibold text-foreground">
                {isRefreshing ? "Refrescando..." : "Automática cada 60s"}
              </p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="h-4 w-4 text-primary" />
            Feed de actividad (API)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay actividad reciente.</p>
          ) : (
            events.map((ev) => (
              <div key={`${ev.reportId}-${ev.createdAt}`} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="text-[10px] border-0 bg-primary/10 text-primary">
                      {ev.type}
                    </Badge>
                    <Badge className={`text-[10px] border-0 ${STATUS_COLORS[ev.status] || "bg-muted text-muted-foreground"}`}>
                      {ev.status}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ev.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-foreground">
                  <span className="font-semibold">@{ev.reporterUsername || "unknown"}</span>
                  {" reportó a "}
                  <span className="font-semibold">@{ev.reportedUsername || "unknown"}</span>
                  {" · "}
                  {ev.targetType}
                </p>
                {String(ev.status).toUpperCase() === "PENDING" && (
                  <p className="mt-1 text-[11px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requiere revisión de moderación
                  </p>
                )}
              </div>
            ))
          )}
          {totalPages > page + 1 && (
            <Button variant="outline" onClick={() => void load(page + 1, true)}>
              Cargar más
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
