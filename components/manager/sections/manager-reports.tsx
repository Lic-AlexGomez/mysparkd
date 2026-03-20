"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Flag, CheckCircle, XCircle, Eye, AlertTriangle, Ban, Clock } from "lucide-react"

const REPORTS = [
  { id: "r1", reporter: "user_a12",  target: "post",    targetUser: "user_x91",  reason: "Contenido sexual",    detail: "El post contiene imágenes inapropiadas para la plataforma.", date: "hace 10 min", status: "pendiente", priority: "alta" },
  { id: "r2", reporter: "user_b34",  target: "usuario", targetUser: "user_k44",  reason: "Acoso",               detail: "Este usuario me ha enviado mensajes amenazantes repetidamente.", date: "hace 25 min", status: "pendiente", priority: "alta" },
  { id: "r3", reporter: "user_c56",  target: "post",    targetUser: "miguel_v",  reason: "Spam",                detail: "Publica el mismo contenido repetidamente con links externos.", date: "hace 1h",     status: "revisando", priority: "media" },
  { id: "r4", reporter: "user_d78",  target: "usuario", targetUser: "user_p87",  reason: "Perfil falso",        detail: "Usa fotos de otra persona y nombre falso.", date: "hace 2h",     status: "revisando", priority: "media" },
  { id: "r5", reporter: "user_e90",  target: "post",    targetUser: "carlos_r",  reason: "Desinformación",      detail: "Comparte noticias falsas sobre eventos recientes.", date: "hace 3h",     status: "resuelto",  priority: "baja" },
  { id: "r6", reporter: "user_f11",  target: "usuario", targetUser: "user_r12",  reason: "Violencia",           detail: "Amenazas directas en comentarios.", date: "hace 5h",     status: "resuelto",  priority: "alta" },
  { id: "r7", reporter: "user_g22",  target: "post",    targetUser: "ana_lopez", reason: "Otro",                detail: "Contenido que no cumple con las normas de la comunidad.", date: "hace 6h",     status: "resuelto",  priority: "baja" },
]

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-rose-500/15 text-rose-500",
  revisando: "bg-amber-500/15 text-amber-500",
  resuelto:  "bg-emerald-500/15 text-emerald-500",
}

const PRIORITY_COLORS: Record<string, string> = {
  alta:  "bg-rose-500",
  media: "bg-amber-500",
  baja:  "bg-blue-500",
}

export function ManagerReports() {
  const [filter, setFilter] = useState("pendiente")
  const [selected, setSelected] = useState<string | null>("r1")

  const filtered = REPORTS.filter(r => filter === "todos" || r.status === filter)
  const selectedReport = REPORTS.find(r => r.id === selected)

  const counts = {
    pendiente: REPORTS.filter(r => r.status === "pendiente").length,
    revisando: REPORTS.filter(r => r.status === "revisando").length,
    resuelto:  REPORTS.filter(r => r.status === "resuelto").length,
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendientes", count: counts.pendiente, color: "text-rose-500",    bg: "bg-rose-500/10",    id: "pendiente" },
          { label: "Revisando",  count: counts.revisando, color: "text-amber-500",   bg: "bg-amber-500/10",   id: "revisando" },
          { label: "Resueltos",  count: counts.resuelto,  color: "text-emerald-500", bg: "bg-emerald-500/10", id: "resuelto" },
        ].map(s => (
          <button key={s.id} onClick={() => setFilter(s.id)}
            className={`p-4 rounded-xl border transition-all text-left ${filter === s.id ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {["todos", "pendiente", "revisando", "resuelto"].map(f => (
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
              {filtered.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelected(r.id === selected ? null : r.id)}
                  className={`p-4 cursor-pointer transition-colors ${selected === r.id ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[r.priority]}`} />
                      <span className="text-xs font-semibold text-foreground">{r.reason}</span>
                      <Badge className="text-[10px] border-0 bg-muted text-muted-foreground">{r.target}</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] border-0 ${STATUS_COLORS[r.status]}`}>{r.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{r.date}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{r.detail}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span>Reportado por: <span className="text-foreground">@{r.reporter}</span></span>
                    <span>Contra: <span className="text-foreground">@{r.targetUser}</span></span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] border-0 ${STATUS_COLORS[selectedReport.status]}`}>{selectedReport.status}</Badge>
                  <Badge className={`text-[10px] border-0 ${PRIORITY_COLORS[selectedReport.priority]} text-white`}>
                    prioridad {selectedReport.priority}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <p className="text-xs font-semibold text-foreground mb-1">{selectedReport.reason}</p>
                  <p className="text-xs text-muted-foreground">{selectedReport.detail}</p>
                </div>

                <div className="space-y-1.5 text-xs">
                  {[
                    ["Tipo",         selectedReport.target],
                    ["Reportado por",`@${selectedReport.reporter}`],
                    ["Contra",       `@${selectedReport.targetUser}`],
                    ["Fecha",        selectedReport.date],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-foreground">{v}</span>
                    </div>
                  ))}
                </div>

                {selectedReport.status !== "resuelto" && (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border">
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver contenido reportado
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Advertir a @{selectedReport.targetUser}
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                      <Ban className="h-3.5 w-3.5 mr-1.5" /> Banear a @{selectedReport.targetUser}
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10">
                      <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Marcar como resuelto
                    </Button>
                    <Button size="sm" variant="outline" className="w-full text-xs h-8">
                      <XCircle className="h-3.5 w-3.5 mr-1.5" /> Desestimar reporte
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
