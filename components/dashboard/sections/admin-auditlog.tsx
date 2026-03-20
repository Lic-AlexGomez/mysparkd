"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StatCard } from "./shared"
import { ScrollText, Search, User, Settings, Shield, DollarSign, AlertTriangle } from "lucide-react"

const STATS = [
  { label: "Eventos hoy",      value: "48,291", icon: ScrollText,    color: "bg-primary" },
  { label: "Admins activos",   value: "1",      icon: User,          color: "bg-violet-500" },
  { label: "Cambios config.",  value: "3",      icon: Settings,      color: "bg-amber-500" },
  { label: "Alertas",          value: "2",      icon: AlertTriangle, color: "bg-rose-500" },
]

const LOGS = [
  { time: "10:42:18", user: "admin (tú)",    action: "Accedió al dashboard",           category: "auth",    ip: "192.168.1.1",  severity: "info" },
  { time: "10:38:02", user: "sistema",       action: "Sync Redis → DB completado",     category: "sistema", ip: "—",            severity: "info" },
  { time: "10:31:45", user: "admin (tú)",    action: "Revisó reporte #7 (acoso)",      category: "mod",     ip: "192.168.1.1",  severity: "info" },
  { time: "10:15:33", user: "sistema",       action: "Post bloqueado por OpenAI",      category: "mod",     ip: "—",            severity: "warn" },
  { time: "09:58:12", user: "sistema",       action: "Error Redis en POST /api/polls", category: "error",   ip: "—",            severity: "error" },
  { time: "09:44:01", user: "admin (tú)",    action: "Baneó usuario @user_bad1",       category: "mod",     ip: "192.168.1.1",  severity: "warn" },
  { time: "09:30:22", user: "sistema",       action: "Backup automático completado",   category: "sistema", ip: "—",            severity: "info" },
  { time: "09:12:08", user: "sistema",       action: "Nuevo usuario registrado (x47)", category: "users",   ip: "—",            severity: "info" },
  { time: "08:55:44", user: "admin (tú)",    action: "Actualizó feature flags",        category: "config",  ip: "192.168.1.1",  severity: "warn" },
  { time: "08:40:19", user: "sistema",       action: "Stripe webhook procesado",       category: "revenue", ip: "—",            severity: "info" },
  { time: "08:22:33", user: "sistema",       action: "3 suscripciones renovadas",      category: "revenue", ip: "—",            severity: "info" },
  { time: "08:01:00", user: "sistema",       action: "Servidor iniciado correctamente","category": "sistema", ip: "—",           severity: "info" },
]

const CATEGORY_COLORS: Record<string, string> = {
  auth:    "bg-violet-500/15 text-violet-500",
  sistema: "bg-blue-500/15 text-blue-500",
  mod:     "bg-amber-500/15 text-amber-500",
  error:   "bg-rose-500/15 text-rose-500",
  users:   "bg-emerald-500/15 text-emerald-500",
  config:  "bg-orange-500/15 text-orange-500",
  revenue: "bg-teal-500/15 text-teal-500",
}

const SEVERITY_COLORS: Record<string, string> = {
  info:  "bg-blue-500",
  warn:  "bg-amber-500",
  error: "bg-rose-500 animate-pulse",
}

export function AdminAuditLog() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("todos")

  const filtered = LOGS.filter(l => {
    const matchSearch = l.action.toLowerCase().includes(search.toLowerCase()) || l.user.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === "todos" || l.severity === filter || l.category === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Resumen por categoría */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Autenticación",  count: 12, color: "text-violet-500" },
          { label: "Moderación",     count: 8,  color: "text-amber-500" },
          { label: "Sistema",        count: 18, color: "text-blue-500" },
          { label: "Ingresos",       count: 6,  color: "text-teal-500" },
          { label: "Usuarios",       count: 47, color: "text-emerald-500" },
          { label: "Configuración",  count: 3,  color: "text-orange-500" },
          { label: "Errores",        count: 2,  color: "text-rose-500" },
          { label: "Otros",          count: 4,  color: "text-muted-foreground" },
        ].map(c => (
          <Card key={c.label} className="border-border">
            <CardContent className="p-3">
              <p className={`text-xl font-black ${c.color}`}>{c.count}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Log table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-sm flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-primary" /> Log de auditoría
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {["todos", "error", "warn", "info"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                    filter === f ? "bg-primary text-black border-primary" : "border-border text-muted-foreground hover:border-primary"
                  }`}
                >
                  {f}
                </button>
              ))}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-7 h-7 text-xs bg-muted border-border w-36"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Hora</span><span>Usuario</span><span className="col-span-2">Acción</span><span>Categoría</span>
          </div>
          <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {filtered.map((l, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-4 py-2.5 items-center hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${SEVERITY_COLORS[l.severity]}`} />
                  <span className="text-[11px] font-mono text-muted-foreground">{l.time}</span>
                </div>
                <span className="text-xs text-foreground truncate">{l.user}</span>
                <span className="col-span-2 text-xs text-foreground">{l.action}</span>
                <Badge className={`text-[10px] border-0 w-fit ${CATEGORY_COLORS[l.category] || "bg-muted text-muted-foreground"}`}>
                  {l.category}
                </Badge>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                Sin resultados para "{search}"
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
