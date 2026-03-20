"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, ProgressRow } from "./shared"
import { Shield, AlertTriangle, Ban, Eye, CheckCircle, XCircle, Flag } from "lucide-react"

const STATS = [
  { label: "Revisados hoy",     value: "1,284", change: +8,  icon: Eye,           color: "bg-blue-500" },
  { label: "Bloqueados hoy",    value: "23",    change: -12, icon: Ban,           color: "bg-rose-500" },
  { label: "Reportes abiertos", value: "7",     change: -3,  icon: Flag,          color: "bg-amber-500" },
  { label: "Tasa de bloqueo",   value: "1.8%",  change: -5,  icon: Shield,        color: "bg-emerald-500" },
]

const BLOCK_REASONS = [
  { label: "Contenido sexual",    value: 42, color: "bg-rose-500" },
  { label: "Violencia",           value: 18, color: "bg-orange-500" },
  { label: "Spam",                value: 15, color: "bg-amber-500" },
  { label: "Acoso",               value: 12, color: "bg-violet-500" },
  { label: "Desinformación",      value: 8,  color: "bg-blue-500" },
  { label: "Otro",                value: 5,  color: "bg-muted-foreground" },
]

const REPORTS = [
  { user: "user_x91",  target: "post",    reason: "Contenido sexual",  date: "hace 10 min", status: "pendiente" },
  { user: "user_k44",  target: "usuario", reason: "Acoso",             date: "hace 25 min", status: "pendiente" },
  { user: "user_m23",  target: "post",    reason: "Spam",              date: "hace 1h",     status: "revisando" },
  { user: "user_p87",  target: "post",    reason: "Violencia",         date: "hace 2h",     status: "resuelto" },
  { user: "user_r12",  target: "usuario", reason: "Perfil falso",      date: "hace 3h",     status: "resuelto" },
  { user: "user_t56",  target: "post",    reason: "Desinformación",    date: "hace 5h",     status: "resuelto" },
]

const MODERATION_STATS = [
  { label: "Posts revisados por IA",    value: "48,291", pct: 100 },
  { label: "Aprobados automáticamente", value: "47,007", pct: 97.3 },
  { label: "Bloqueados por IA",         value: "1,284",  pct: 2.7 },
  { label: "Revisión manual requerida", value: "89",     pct: 0.2 },
]

export function AdminModeration() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Razones de bloqueo */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ban className="h-4 w-4 text-rose-500" /> Razones de bloqueo (OpenAI)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {BLOCK_REASONS.map(r => (
              <ProgressRow key={r.label} label={r.label} value={r.value} max={42} color={r.color} />
            ))}
          </CardContent>
        </Card>

        {/* Pipeline de moderación */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> Pipeline de moderación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {MODERATION_STATS.map(m => (
              <div key={m.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-semibold text-foreground">{m.value} <span className="text-muted-foreground">({m.pct}%)</span></span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">OpenAI Moderation API activa</span>
                <Badge className="ml-auto text-[10px] border-0 bg-emerald-500/15 text-emerald-500">Operativo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reportes */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-500" /> Reportes de usuarios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Reportado por</span><span>Tipo</span><span>Razón</span><span>Fecha</span><span>Estado</span>
          </div>
          <div className="divide-y divide-border">
            {REPORTS.map((r, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                <span className="text-xs font-semibold text-foreground">@{r.user}</span>
                <Badge className="text-[10px] border-0 w-fit bg-muted text-muted-foreground">{r.target}</Badge>
                <span className="text-xs text-foreground">{r.reason}</span>
                <span className="text-xs text-muted-foreground">{r.date}</span>
                <Badge className={`text-[10px] border-0 w-fit ${
                  r.status === "pendiente"  ? "bg-amber-500/15 text-amber-500" :
                  r.status === "revisando"  ? "bg-blue-500/15 text-blue-500" :
                  "bg-emerald-500/15 text-emerald-500"
                }`}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuarios baneados recientes */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-500" /> Usuarios baneados recientemente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { user: "user_bad1", reason: "Acoso reiterado",      date: "hace 2h",  posts: 0 },
              { user: "user_bad2", reason: "Contenido explícito",  date: "hace 1d",  posts: 0 },
              { user: "user_bad3", reason: "Spam masivo",          date: "hace 3d",  posts: 0 },
            ].map((u, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <div className="h-7 w-7 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                  <Ban className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">@{u.user}</p>
                  <p className="text-[11px] text-muted-foreground">{u.reason}</p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{u.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
