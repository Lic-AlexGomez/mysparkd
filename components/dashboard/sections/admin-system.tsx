"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "./shared"
import { Server, Wifi, Database, Zap, Clock, AlertTriangle, CheckCircle, Activity, Cloud } from "lucide-react"

const STATS = [
  { label: "Uptime",          value: "99.8%",  icon: Server,   color: "bg-emerald-500" },
  { label: "Latencia API",    value: "142ms",  icon: Clock,    color: "bg-blue-500" },
  { label: "WS conectados",   value: "1,203",  icon: Wifi,     color: "bg-primary" },
  { label: "Errores hoy",     value: "3",      icon: AlertTriangle, color: "bg-amber-500" },
]

const SERVICES = [
  { name: "Backend (Spring Boot)",  status: "operativo",  latency: "142ms",  uptime: "99.8%" },
  { name: "Base de datos (PostgreSQL)", status: "operativo", latency: "8ms",  uptime: "99.9%" },
  { name: "Redis",                  status: "degradado",  latency: "—",      uptime: "87.2%" },
  { name: "Cloudinary CDN",         status: "operativo",  latency: "210ms",  uptime: "99.9%" },
  { name: "Stripe",                 status: "operativo",  latency: "320ms",  uptime: "99.9%" },
  { name: "Firebase (Push)",        status: "operativo",  latency: "180ms",  uptime: "99.7%" },
  { name: "OpenAI Moderation",      status: "operativo",  latency: "890ms",  uptime: "99.5%" },
  { name: "WebSocket (STOMP)",      status: "operativo",  latency: "12ms",   uptime: "99.6%" },
]

const RECENT_ERRORS = [
  { time: "hace 2h",  code: "500", endpoint: "POST /api/polls",          msg: "Unable to connect to Redis" },
  { time: "hace 6h",  code: "503", endpoint: "GET /api/feed",            msg: "Connection timeout" },
  { time: "hace 1d",  code: "400", endpoint: "POST /api/posts/new",      msg: "Content moderation failed" },
]

const API_ENDPOINTS = [
  { endpoint: "/api/feed",          calls: 48200, p95: "210ms", errors: 0 },
  { endpoint: "/api/swipes",        calls: 34800, p95: "95ms",  errors: 0 },
  { endpoint: "/api/chat",          calls: 28400, p95: "140ms", errors: 1 },
  { endpoint: "/api/posts",         calls: 12300, p95: "380ms", errors: 2 },
  { endpoint: "/api/polls",         calls: 890,   p95: "—",     errors: 1 },
  { endpoint: "/api/profile",       calls: 8900,  p95: "120ms", errors: 0 },
  { endpoint: "/api/notifications", calls: 6200,  p95: "88ms",  errors: 0 },
]

export function AdminSystem() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Estado de servicios */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" /> Estado de servicios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Servicio</span><span>Latencia</span><span>Estado</span>
          </div>
          <div className="divide-y divide-border">
            {SERVICES.map((s, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                <div className="col-span-2 flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${
                    s.status === "operativo" ? "bg-emerald-500" :
                    s.status === "degradado" ? "bg-amber-500 animate-pulse" :
                    "bg-rose-500 animate-pulse"
                  }`} />
                  <span className="text-xs text-foreground">{s.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{s.latency}</span>
                <Badge className={`text-[10px] border-0 w-fit ${
                  s.status === "operativo" ? "bg-emerald-500/15 text-emerald-500" :
                  s.status === "degradado" ? "bg-amber-500/15 text-amber-500" :
                  "bg-rose-500/15 text-rose-500"
                }`}>{s.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Errores recientes */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Errores recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {RECENT_ERRORS.map((e, i) => (
              <div key={i} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] border-0 bg-rose-500/20 text-rose-500 font-mono">{e.code}</Badge>
                  <span className="text-xs font-mono text-foreground">{e.endpoint}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{e.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{e.msg}</p>
              </div>
            ))}
            {RECENT_ERRORS.length === 0 && (
              <div className="flex items-center gap-2 text-emerald-500">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Sin errores recientes</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recursos del servidor */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Recursos (Render)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "CPU",     value: 34, color: "bg-primary" },
              { label: "RAM",     value: 61, color: "bg-secondary" },
              { label: "Disco",   value: 22, color: "bg-amber-500" },
              { label: "Red",     value: 48, color: "bg-blue-500" },
            ].map(r => (
              <div key={r.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className={`font-bold ${r.value > 80 ? "text-rose-500" : r.value > 60 ? "text-amber-500" : "text-foreground"}`}>
                    {r.value}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Plan Render</span>
                <span className="font-semibold text-foreground">Free (512MB RAM)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cold start</span>
                <span className="font-semibold text-amber-500">~30s (free tier)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoints más usados */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Endpoints más usados (hoy)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Endpoint</span><span>Llamadas</span><span>Errores</span>
          </div>
          <div className="divide-y divide-border">
            {API_ENDPOINTS.map((e, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 items-center hover:bg-muted/20">
                <span className="col-span-2 text-xs font-mono text-foreground">{e.endpoint}</span>
                <span className="text-xs text-foreground font-semibold">{e.calls.toLocaleString()}</span>
                <span className={`text-xs font-semibold ${e.errors > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {e.errors > 0 ? e.errors : "✓"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
