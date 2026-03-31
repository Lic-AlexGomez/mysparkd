"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard, ProgressRow } from "./shared"
import { Shield, AlertTriangle, Ban, Eye, CheckCircle, XCircle, Flag, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

const BLOCK_REASONS = [
  { label: "Contenido sexual",    value: 42, color: "bg-rose-500" },
  { label: "Violencia",           value: 18, color: "bg-orange-500" },
  { label: "Spam",                value: 15, color: "bg-amber-500" },
  { label: "Acoso",               value: 12, color: "bg-violet-500" },
  { label: "Desinformación",      value: 8,  color: "bg-blue-500" },
  { label: "Otro",                value: 5,  color: "bg-muted-foreground" },
]

interface Report {
  id: string
  reporterId: string
  reporterUsername: string
  reportedId: string
  reportedUsername: string
  targetId: string
  targetType: string
  reasonId: string
  reasonName: string
  description: string
  status: string
  createdAt: string
}

export function AdminModeration() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = async () => {
    try {
      const data = await api.get<Report[]>('/moderator/reports')
      setReports(data)
    } catch {
      // silent — puede que el usuario no sea moderador
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const handleDisable = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await api.post(`/moderator/reports/${reportId}/disable`)
      toast.success("Usuario deshabilitado")
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'ACTION_TAKEN' } : r))
    } catch {
      toast.error("Error al deshabilitar usuario")
    } finally {
      setActionLoading(null)
    }
  }

  const handleEnable = async (userId: string) => {
    setActionLoading(userId)
    try {
      await api.post(`/moderator/users/${userId}/enable`)
      toast.success("Usuario habilitado")
      fetchReports()
    } catch {
      toast.error("Error al habilitar usuario")
    } finally {
      setActionLoading(null)
    }
  }

  const STATS = [
    { label: "Reportes pendientes", value: String(reports.filter(r => r.status === 'PENDING').length), change: 0, icon: Flag,   color: "bg-amber-500" },
    { label: "Acción tomada",       value: String(reports.filter(r => r.status === 'ACTION_TAKEN').length), change: 0, icon: Ban, color: "bg-rose-500" },
    { label: "Total reportes",      value: String(reports.length), change: 0, icon: Eye,    color: "bg-blue-500" },
    { label: "Moderación IA",       value: "Activa", change: 0,               icon: Shield, color: "bg-emerald-500" },
  ]

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
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : reports.filter(r => r.status === 'PENDING').length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay reportes pendientes</p>
          ) : (
            <>
              <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Reportado por</span><span>Reportado</span><span>Razón</span><span>Tipo</span><span>Fecha</span><span>Acción</span>
              </div>
              <div className="divide-y divide-border">
                {reports.filter(r => r.status === 'PENDING').map(r => (
                  <div key={r.id} className="grid grid-cols-6 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                    <span className="text-xs font-semibold text-foreground">@{r.reporterUsername}</span>
                    <span className="text-xs text-foreground">@{r.reportedUsername}</span>
                    <span className="text-xs text-foreground">{r.reasonName}</span>
                    <Badge className="text-[10px] border-0 w-fit bg-muted text-muted-foreground">{r.targetType}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('es')}</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      disabled={actionLoading === r.id}
                      onClick={() => handleDisable(r.id)}
                    >
                      {actionLoading === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Deshabilitar"}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reportes resueltos */}
      {reports.filter(r => r.status === 'ACTION_TAKEN').length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-500" /> Usuarios deshabilitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.filter(r => r.status === 'ACTION_TAKEN').map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <div className="h-7 w-7 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                    <Ban className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">@{r.reportedUsername}</p>
                    <p className="text-[11px] text-muted-foreground">{r.reasonName}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    disabled={actionLoading === r.reportedId}
                    onClick={() => handleEnable(r.reportedId)}
                  >
                    {actionLoading === r.reportedId ? <Loader2 className="h-3 w-3 animate-spin" /> : "Habilitar"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline de moderación */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" /> Estado del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">OpenAI Moderation API</span>
            <Badge className="ml-auto text-[10px] border-0 bg-emerald-500/15 text-emerald-500">Operativo</Badge>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Sistema de reportes</span>
            <Badge className="ml-auto text-[10px] border-0 bg-emerald-500/15 text-emerald-500">Activo</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
