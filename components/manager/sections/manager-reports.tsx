"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flag, XCircle, Eye, Ban, Clock, Loader2 } from "lucide-react"
import { reportService, type ModerationReport } from "@/lib/services/report"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const STATUS_COLORS: Record<string, string> = {
  PENDING:      "bg-rose-500/15 text-rose-500",
  ACTION_TAKEN: "bg-emerald-500/15 text-emerald-500",
  REJECTED:     "bg-muted text-muted-foreground",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:      "pendiente",
  ACTION_TAKEN: "resuelto",
  REJECTED:     "descartado",
}

type ManagerReportsProps = {
  /** Sidebar badge: refresh pending count after list changes (resolve/dismiss). */
  onReportsMutated?: () => void
}

export function ManagerReports({ onReportsMutated }: ManagerReportsProps) {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState("todos")
  const [selected, setSelected] = useState<string | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await reportService.listAdminReports()
      setReports(data)
      if (data.length > 0) setSelected(data[0].id)
      else setSelected(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar los reportes"
      setLoadError(message)
      setReports([])
      setSelected(null)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const handleDisable = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await reportService.resolveAdminReport(reportId)
      toast.success("Usuario deshabilitado")
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ACTION_TAKEN' } : r))
      onReportsMutated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al deshabilitar usuario")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await reportService.dismissAdminReport(reportId)
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'REJECTED' } : r))
      toast.success("Reporte descartado")
      onReportsMutated?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descartar el reporte")
    } finally {
      setActionLoading(null)
    }
  }

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es })
    } catch {
      return "—"
    }
  }

  const filtered = reports.filter(r => {
    if (filter === "todos") return true
    if (filter === "pendiente") return r.status === "PENDING"
    if (filter === "resuelto") return r.status === "ACTION_TAKEN"
    if (filter === "descartado") return r.status === "REJECTED"
    return true
  })

  const selectedReport = reports.find(r => r.id === selected)

  const counts = {
    pendiente: reports.filter(r => r.status === "PENDING").length,
    resuelto:  reports.filter(r => r.status === "ACTION_TAKEN").length,
    descartado: reports.filter(r => r.status === "REJECTED").length,
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  if (loadError) return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 px-4 text-center">
      <Flag className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-medium text-foreground">No se pudieron cargar los reportes</p>
        <p className="text-xs text-muted-foreground">{loadError}</p>
        <p className="text-xs text-muted-foreground">
          Comprueba tu conexión y que tengas permisos de moderador. Si el problema continúa, el backend puede no exponer aún los listados.
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => void fetchReports()}>
        Reintentar
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendientes",  count: counts.pendiente,  color: "text-rose-500",    bg: "bg-rose-500/10",    id: "pendiente" },
          { label: "Resueltos",   count: counts.resuelto,   color: "text-emerald-500", bg: "bg-emerald-500/10", id: "resuelto" },
          { label: "Descartados", count: counts.descartado, color: "text-muted-foreground", bg: "bg-muted/30",  id: "descartado" },
        ].map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)}
            className={`p-4 rounded-xl border transition-all text-left ${filter === s.id ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["todos", "pendiente", "resuelto", "descartado"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${filter === f ? "bg-secondary text-white border-secondary" : "border-border text-muted-foreground hover:border-secondary"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista */}
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {reports.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 px-6 gap-2 text-center">
                  <Flag className="h-10 w-10 text-muted-foreground/80" />
                  <p className="text-sm text-muted-foreground font-medium">Cola de moderación vacía</p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    No hay reportes en el servidor en este momento. Cuando un usuario reporte un perfil, publicación o mensaje, aparecerá aquí con su estado (pendiente, resuelto o descartado).
                  </p>
                </div>
              )}
              {filtered.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r.id === selected ? null : r.id)}
                  className={`p-4 cursor-pointer transition-colors ${selected === r.id ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{r.reasonName}</span>
                      <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">{r.targetType}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] border-0 ${STATUS_COLORS[r.status] || "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABELS[r.status] || r.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(r.createdAt)}
                      </span>
                    </div>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>Reportado por: <span className="text-foreground">@{r.reporterUsername}</span></span>
                    <span>Contra: <span className="text-foreground">@{r.reportedUsername}</span></span>
                  </div>
                </div>
              ))}
              {reports.length > 0 && filtered.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No hay reportes en esta categoría
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalle + acciones */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className="h-4 w-4 text-secondary" />
              {selectedReport ? "Detalle del reporte" : "Selecciona un reporte"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-3">
                <Badge className={`text-[10px] border-0 ${STATUS_COLORS[selectedReport.status] || "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[selectedReport.status] || selectedReport.status}
                </Badge>

                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-1">{selectedReport.reasonName}</p>
                  {selectedReport.description && (
                    <p className="text-xs text-muted-foreground">{selectedReport.description}</p>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    ["Tipo",          selectedReport.targetType],
                    ["Reportado por", `@${selectedReport.reporterUsername}`],
                    ["Contra",        `@${selectedReport.reportedUsername}`],
                    ["Fecha",         getTimeAgo(selectedReport.createdAt)],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>

                {selectedReport.status === "PENDING" && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        if (selectedReport.targetType === 'POST' || selectedReport.targetType === 'COMMENT') {
                          window.open(`/feed?post=${selectedReport.targetId}`, '_blank')
                        } else {
                          window.open(`/profile/${selectedReport.reportedId}`, '_blank')
                        }
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Ver contenido reportado
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                      disabled={actionLoading === selectedReport.id}
                      onClick={() => handleDisable(selectedReport.id)}
                    >
                      {actionLoading === selectedReport.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        : <Ban className="h-3.5 w-3.5 mr-1.5" />
                      }
                      Deshabilitar a @{selectedReport.reportedUsername}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8 border-muted text-muted-foreground hover:bg-muted/30"
                      disabled={actionLoading === selectedReport.id}
                      onClick={() => handleDismiss(selectedReport.id)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Desestimar reporte
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Haz clic en un reporte para ver sus detalles y tomar acción
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
