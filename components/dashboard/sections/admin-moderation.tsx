"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "./shared"
import { Shield, Ban, Eye, Flag, Loader2, CheckCircle, XCircle } from "lucide-react"
import { reportService, type ModerationReport } from "@/lib/services/report"
import { toast } from "sonner"

export function AdminModeration() {
  const [reports, setReports] = useState<ModerationReport[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      const data = await reportService.listAdminReports()
      setReports(data)
    } catch {
      // fallback seguro: servicio retorna [] cuando no hay endpoint disponible
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const handleResolve = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await reportService.resolveAdminReport(reportId)
      toast.success("Reporte resuelto — usuario deshabilitado")
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ACTION_TAKEN' } : r))
    } catch {
      toast.error("Error al resolver reporte")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDismiss = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await reportService.dismissAdminReport(reportId)
      toast.success("Reporte descartado")
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'REJECTED' } : r))
    } catch {
      toast.error("Error al descartar reporte")
    } finally {
      setActionLoading(null)
    }
  }

  const pending  = reports.filter(r => r.status === 'PENDING')
  const resolved = reports.filter(r => r.status === 'ACTION_TAKEN')

  const STATS = [
    { label: "Pendientes",    value: String(pending.length),                  change: 0, icon: Flag,   color: "bg-amber-500" },
    { label: "Acción tomada", value: String(resolved.length),                 change: 0, icon: Ban,    color: "bg-rose-500" },
    { label: "Total",         value: String(reports.length),                  change: 0, icon: Eye,    color: "bg-blue-500" },
    { label: "Moderación IA", value: "Activa",                                change: 0, icon: Shield, color: "bg-emerald-500" },
  ]

  const statusColor = (status: string) => {
    if (status === 'PENDING')     return "bg-amber-500/15 text-amber-500"
    if (status === 'ACTION_TAKEN') return "bg-rose-500/15 text-rose-500"
    if (status === 'REJECTED')    return "bg-muted text-muted-foreground"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Reportes pendientes */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-500" /> Reportes pendientes
            {pending.length > 0 && (
              <Badge className="ml-1 text-[10px] border-0 bg-amber-500 text-white">{pending.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {reports.length === 0 ? "Endpoint pendiente de implementación en el backend" : "No hay reportes pendientes"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Reportado por</span>
                <span>Reportado</span>
                <span>Razón</span>
                <span>Tipo</span>
                <span>Fecha</span>
                <span className="col-span-2">Acciones</span>
              </div>
              <div className="divide-y divide-border">
                {pending.map(r => (
                  <div key={r.id} className="grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                    <span className="text-xs font-semibold text-foreground">@{r.reporterUsername}</span>
                    <span className="text-xs text-foreground">@{r.reportedUsername}</span>
                    <span className="text-xs text-foreground">{r.reasonName}</span>
                    <Badge className="text-[10px] border-0 w-fit bg-muted text-muted-foreground">{r.targetType}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('es')}
                    </span>
                    <div className="col-span-2 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        disabled={actionLoading === r.id}
                        onClick={() => handleResolve(r.id)}
                      >
                        {actionLoading === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deshabilitar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={actionLoading === r.id}
                        onClick={() => handleDismiss(r.id)}
                      >
                        Descartar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Historial */}
      {reports.filter(r => r.status !== 'PENDING').length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" /> Historial
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {reports.filter(r => r.status !== 'PENDING').map(r => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">@{r.reportedUsername}</p>
                    <p className="text-[11px] text-muted-foreground">{r.reasonName} · {r.targetType}</p>
                  </div>
                  <Badge className={`text-[10px] border-0 ${statusColor(r.status)}`}>
                    {r.status === 'ACTION_TAKEN' ? 'Acción tomada' : 'Descartado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado del sistema */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" /> Estado del sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">OpenAI Moderation API</span>
            <Badge className="ml-auto text-[10px] border-0 bg-emerald-500/15 text-emerald-500">Operativo</Badge>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Sistema de reportes</span>
            <Badge className="ml-auto text-[10px] border-0 bg-emerald-500/15 text-emerald-500">Activo</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
