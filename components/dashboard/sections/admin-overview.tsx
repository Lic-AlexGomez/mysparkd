"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, SectionTitle, MiniBar, ProgressRow } from "./shared"
import {
  Users, Zap, Heart, MessageCircle, DollarSign,
  TrendingUp, Eye, FileText, Shield, Activity,
  UserPlus, Crown, BarChart3, Globe
} from "lucide-react"

const KPI = [
  { label: "Usuarios totales",    value: "12,847", change: +8,  icon: Users,       color: "bg-violet-500" },
  { label: "Activos hoy",         value: "1,203",  change: +12, icon: Activity,    color: "bg-primary" },
  { label: "Nuevos esta semana",  value: "347",    change: +23, icon: UserPlus,    color: "bg-emerald-500" },
  { label: "Premium activos",     value: "892",    change: +5,  icon: Crown,       color: "bg-amber-500" },
  { label: "Matches hoy",         value: "2,341",  change: +18, icon: Heart,       color: "bg-rose-500" },
  { label: "Mensajes hoy",        value: "18,492", change: +31, icon: MessageCircle, color: "bg-blue-500" },
  { label: "Posts publicados",    value: "4,128",  change: -3,  icon: FileText,    color: "bg-orange-500" },
  { label: "MRR",                 value: "$4,460", change: +5,  icon: DollarSign,  color: "bg-teal-500" },
]

const DAILY_USERS   = [820, 940, 880, 1100, 1250, 1380, 1203]
const DAILY_MATCHES = [1800, 2100, 1950, 2400, 2800, 3100, 2341]
const DAILY_REVENUE = [120, 145, 130, 160, 175, 190, 143]

const TOP_COUNTRIES = [
  { label: "Venezuela",   value: 4820 },
  { label: "Colombia",    value: 2340 },
  { label: "México",      value: 1890 },
  { label: "Argentina",   value: 1240 },
  { label: "España",      value: 980 },
  { label: "Otros",       value: 1577 },
]

const RECENT_EVENTS = [
  { time: "hace 2 min",  text: "Nuevo usuario registrado",         type: "user" },
  { time: "hace 5 min",  text: "Suscripción premium activada",     type: "revenue" },
  { time: "hace 8 min",  text: "Post bloqueado por moderación",    type: "mod" },
  { time: "hace 12 min", text: "Match creado entre 2 usuarios",    type: "match" },
  { time: "hace 15 min", text: "Nuevo usuario registrado",         type: "user" },
  { time: "hace 18 min", text: "Reporte de contenido recibido",    type: "mod" },
  { time: "hace 22 min", text: "Suscripción premium activada",     type: "revenue" },
  { time: "hace 30 min", text: "Error de conexión Redis resuelto", type: "system" },
]

const EVENT_COLORS: Record<string, string> = {
  user:    "bg-violet-500",
  revenue: "bg-amber-500",
  mod:     "bg-rose-500",
  match:   "bg-rose-400",
  system:  "bg-blue-500",
}

export function AdminOverview() {
  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI.map(k => <StatCard key={k.label} {...k} />)}
      </div>

      {/* Gráficas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Usuarios activos (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">1,203</p>
            <MiniBar data={DAILY_USERS} color="bg-primary" />
            <div className="flex justify-between mt-1">
              {["L","M","X","J","V","S","D"].map(d => (
                <span key={d} className="text-[10px] text-muted-foreground flex-1 text-center">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Matches (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">2,341</p>
            <MiniBar data={DAILY_MATCHES} color="bg-rose-500" />
            <div className="flex justify-between mt-1">
              {["L","M","X","J","V","S","D"].map(d => (
                <span key={d} className="text-[10px] text-muted-foreground flex-1 text-center">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" /> Ingresos diarios ($)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-foreground mb-3">$143</p>
            <MiniBar data={DAILY_REVENUE} color="bg-amber-500" />
            <div className="flex justify-between mt-1">
              {["L","M","X","J","V","S","D"].map(d => (
                <span key={d} className="text-[10px] text-muted-foreground flex-1 text-center">{d}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Países + Actividad reciente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-secondary" /> Usuarios por país
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {TOP_COUNTRIES.map(c => (
              <ProgressRow key={c.label} label={c.label} value={c.value} max={4820} color="bg-secondary" />
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Actividad en tiempo real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {RECENT_EVENTS.map((e, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${EVENT_COLORS[e.type]}`} />
                  <span className="text-xs text-foreground flex-1">{e.text}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{e.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salud general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tasa de conversión",  value: "6.9%",  good: true },
          { label: "Retención 7d",        value: "42%",   good: true },
          { label: "Churn mensual",       value: "3.2%",  good: true },
          { label: "Contenido bloqueado", value: "1.8%",  good: true },
        ].map(m => (
          <Card key={m.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-xl font-black text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
              <Badge className={`mt-2 text-[10px] border-0 ${m.good ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"}`}>
                {m.good ? "Saludable" : "Atención"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
