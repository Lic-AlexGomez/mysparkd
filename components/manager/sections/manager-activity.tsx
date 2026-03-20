"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Users, FileText, Flag, MessageCircle, UserPlus, Heart, Ban } from "lucide-react"

const KPI = [
  { label: "Usuarios activos ahora", value: "1,203", icon: Users,       color: "bg-primary/10 text-primary" },
  { label: "Posts hoy",              value: "480",   icon: FileText,    color: "bg-orange-500/10 text-orange-500" },
  { label: "Reportes pendientes",    value: "7",     icon: Flag,        color: "bg-rose-500/10 text-rose-500", alert: true },
  { label: "Nuevos usuarios hoy",    value: "47",    icon: UserPlus,    color: "bg-emerald-500/10 text-emerald-500" },
  { label: "Matches hoy",            value: "2,341", icon: Heart,       color: "bg-rose-400/10 text-rose-400" },
  { label: "Mensajes hoy",           value: "18,492",icon: MessageCircle, color: "bg-blue-500/10 text-blue-500" },
]

const FEED = [
  { time: "hace 1 min",  icon: UserPlus,      color: "text-emerald-500", text: "Nuevo usuario registrado: @sofia_nueva" },
  { time: "hace 3 min",  icon: Flag,          color: "text-rose-500",    text: "Reporte recibido: post con contenido inapropiado", alert: true },
  { time: "hace 5 min",  icon: FileText,      color: "text-orange-500",  text: "Post bloqueado por moderación IA" },
  { time: "hace 8 min",  icon: Heart,         color: "text-rose-400",    text: "Match creado entre @user_a y @user_b" },
  { time: "hace 12 min", icon: Flag,          color: "text-rose-500",    text: "Reporte de acoso: usuario @user_x91", alert: true },
  { time: "hace 15 min", icon: MessageCircle, color: "text-blue-500",    text: "Pico de mensajes: +340 en los últimos 5 min" },
  { time: "hace 20 min", icon: UserPlus,      color: "text-emerald-500", text: "5 nuevos usuarios registrados" },
  { time: "hace 25 min", icon: Ban,           color: "text-rose-500",    text: "Usuario @user_bad2 baneado por spam" },
  { time: "hace 30 min", icon: FileText,      color: "text-orange-500",  text: "Post viral: 1,200 vistas en 10 min" },
  { time: "hace 35 min", icon: Flag,          color: "text-rose-500",    text: "Reporte resuelto: perfil falso eliminado" },
]

const PENDING_ACTIONS = [
  { label: "Reportes sin revisar",     value: 7,  color: "text-rose-500",    urgent: true },
  { label: "Posts en revisión manual", value: 3,  color: "text-amber-500",   urgent: false },
  { label: "Usuarios con advertencia", value: 12, color: "text-amber-500",   urgent: false },
  { label: "Perfiles incompletos",     value: 89, color: "text-muted-foreground", urgent: false },
]

export function ManagerActivity() {
  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {KPI.map(k => (
          <Card key={k.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${k.color.split(" ")[0]}`}>
                <k.icon className={`h-4 w-4 ${k.color.split(" ")[1]}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-black text-foreground flex items-center gap-1.5">
                  {k.value}
                  {k.alert && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Feed en tiempo real */}
        <Card className="border-border md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Feed en tiempo real
              <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-500 font-normal">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En vivo
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {FEED.map((f, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg ${f.alert ? "bg-rose-500/5 border border-rose-500/10" : "hover:bg-muted/20"}`}>
                <f.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${f.color}`} />
                <span className="text-xs text-foreground flex-1">{f.text}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{f.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Acciones pendientes */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className="h-4 w-4 text-amber-500" /> Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PENDING_ACTIONS.map(a => (
              <div key={a.label} className={`flex items-center justify-between p-2.5 rounded-lg ${a.urgent ? "bg-rose-500/5 border border-rose-500/10" : "bg-muted/20"}`}>
                <span className="text-xs text-foreground">{a.label}</span>
                <span className={`text-lg font-black ${a.color}`}>{a.value}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tiempo resp. promedio</span>
                <span className="font-semibold text-foreground">18 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resueltos hoy</span>
                <span className="font-semibold text-emerald-500">23</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
