"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, MiniBar, ProgressRow } from "./shared"
import { Bell, Send, CheckCircle, XCircle, Smartphone, TrendingUp } from "lucide-react"

const STATS = [
  { label: "Enviadas hoy",     value: "24,831", change: +18, icon: Send,         color: "bg-primary" },
  { label: "Tasa apertura",    value: "34.2%",  change: +3,  icon: Bell,         color: "bg-amber-500" },
  { label: "Tasa de click",    value: "12.8%",  change: +5,  icon: CheckCircle,  color: "bg-emerald-500" },
  { label: "Opt-out hoy",      value: "8",      change: -2,  icon: XCircle,      color: "bg-rose-500" },
]

const PUSH_DAILY = [18000, 21000, 19500, 24000, 28000, 31000, 24831]

const NOTIF_TYPES = [
  { label: "Nuevo match",       sent: 8420, opened: 7180, rate: 85 },
  { label: "Mensaje recibido",  sent: 9840, opened: 7380, rate: 75 },
  { label: "Alguien te dio like", sent: 4200, opened: 2940, rate: 70 },
  { label: "Nuevo seguidor",    sent: 1840, opened: 1100, rate: 60 },
  { label: "Post comentado",    sent: 531,  opened: 265,  rate: 50 },
]

const CAMPAIGNS = [
  { name: "Reactivación 7d inactivos",  sent: 1240, opened: 496, clicked: 186, status: "activa" },
  { name: "Bienvenida nuevos usuarios", sent: 347,  opened: 312, clicked: 208, status: "activa" },
  { name: "Promo Premium 50% off",      sent: 8920, opened: 2230, clicked: 890, status: "completada" },
  { name: "Recordatorio perfil incompleto", sent: 2100, opened: 840, clicked: 420, status: "activa" },
]

const CHANNELS = [
  { label: "Firebase Push",  value: 78, color: "bg-amber-500" },
  { label: "In-app",         value: 18, color: "bg-primary" },
  { label: "Email",          value: 4,  color: "bg-blue-500" },
]

export function AdminNotifications() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Push enviadas (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">24,831 <span className="text-sm font-normal text-muted-foreground">hoy</span></p>
            <MiniBar data={PUSH_DAILY.map(v => v / 1000)} color="bg-primary" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-secondary" /> Canales de envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CHANNELS.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${c.color} shrink-0`} />
                <span className="text-xs text-foreground flex-1">{c.label}</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.value}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{c.value}%</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Tokens activos</span><span className="font-semibold text-foreground">7,840</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tokens inválidos</span><span className="font-semibold text-rose-500">312</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Opt-in rate</span><span className="font-semibold text-foreground">61%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Por tipo de notificación */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Rendimiento por tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Tipo</span><span>Enviadas</span><span>Apertura</span>
          </div>
          <div className="divide-y divide-border">
            {NOTIF_TYPES.map((n, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                <span className="col-span-2 text-xs text-foreground">{n.label}</span>
                <span className="text-xs font-semibold text-foreground">{n.sent.toLocaleString()}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${n.rate}%` }} />
                  </div>
                  <span className="text-xs font-bold text-emerald-500 w-8">{n.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campañas */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-500" /> Campañas push
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Campaña</span><span>Enviadas</span><span>Clicks</span><span>Estado</span>
          </div>
          <div className="divide-y divide-border">
            {CAMPAIGNS.map((c, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                <span className="col-span-2 text-xs text-foreground">{c.name}</span>
                <span className="text-xs font-semibold text-foreground">{c.sent.toLocaleString()}</span>
                <div>
                  <span className="text-xs font-semibold text-foreground">{c.clicked}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">({Math.round((c.clicked / c.sent) * 100)}%)</span>
                </div>
                <Badge className={`text-[10px] border-0 w-fit ${c.status === "activa" ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
