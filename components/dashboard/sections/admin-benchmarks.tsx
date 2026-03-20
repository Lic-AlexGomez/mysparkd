"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "./shared"
import { BarChart3, TrendingUp, TrendingDown, Minus, Crown, Users, Heart, DollarSign } from "lucide-react"

const STATS = [
  { label: "Posición mercado",  value: "#3",    icon: BarChart3,  color: "bg-primary" },
  { label: "NPS score",         value: "67",    icon: TrendingUp, color: "bg-emerald-500" },
  { label: "Rating app",        value: "4.3★",  icon: Crown,      color: "bg-amber-500" },
  { label: "Reseñas totales",   value: "1,240", icon: Users,      color: "bg-blue-500" },
]

const COMPETITORS = [
  {
    name: "Tinder",
    users: "75M",
    mrr: "$50M+",
    matchRate: "1.2%",
    retention: "35%",
    rating: "3.8",
    premium: "$12.99",
    strengths: ["Marca global", "Base enorme"],
    weaknesses: ["Caro", "Superficial"],
  },
  {
    name: "Bumble",
    users: "42M",
    mrr: "$20M+",
    matchRate: "2.1%",
    retention: "38%",
    rating: "4.1",
    premium: "$9.99",
    strengths: ["Seguridad", "Mujeres primero"],
    weaknesses: ["Menos usuarios LATAM"],
  },
  {
    name: "Badoo",
    users: "28M",
    mrr: "$8M+",
    matchRate: "3.4%",
    retention: "31%",
    rating: "3.9",
    premium: "$7.99",
    strengths: ["Popular LATAM", "Gratis"],
    weaknesses: ["UX anticuada", "Spam"],
  },
  {
    name: "✨ Sparkd",
    users: "12.8K",
    mrr: "$4,460",
    matchRate: "6.7%",
    retention: "42%",
    rating: "4.3",
    premium: "$4.99",
    strengths: ["Precio", "Retención", "Match rate"],
    weaknesses: ["Base pequeña", "Solo LATAM"],
    isUs: true,
  },
]

const METRICS_COMPARE = [
  { metric: "Match rate",    sparkd: 6.7,  industry: 2.1,  unit: "%",  better: true },
  { metric: "Retención 7d", sparkd: 42,   industry: 35,   unit: "%",  better: true },
  { metric: "Precio premium",sparkd: 4.99, industry: 9.99, unit: "$",  better: true },
  { metric: "Rating app",   sparkd: 4.3,  industry: 3.9,  unit: "★",  better: true },
  { metric: "Usuarios",     sparkd: 12847, industry: 1000000, unit: "", better: false },
  { metric: "MRR",          sparkd: 4460, industry: 500000, unit: "$", better: false },
]

export function AdminBenchmarks() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Tabla comparativa */}
      <Card className="border-border overflow-x-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Comparativa de competidores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span>App</span><span>Usuarios</span><span>Match rate</span><span>Retención</span><span>Premium</span><span>Rating</span>
            </div>
            <div className="divide-y divide-border">
              {COMPETITORS.map((c, i) => (
                <div key={i} className={`grid grid-cols-6 gap-2 px-4 py-3 items-center ${c.isUs ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/20"}`}>
                  <span className={`text-xs font-bold ${c.isUs ? "text-primary" : "text-foreground"}`}>{c.name}</span>
                  <span className="text-xs text-foreground">{c.users}</span>
                  <span className={`text-xs font-semibold ${c.isUs ? "text-emerald-500" : "text-foreground"}`}>{c.matchRate}</span>
                  <span className={`text-xs font-semibold ${c.isUs ? "text-emerald-500" : "text-foreground"}`}>{c.retention}</span>
                  <span className={`text-xs font-semibold ${c.isUs ? "text-emerald-500" : "text-foreground"}`}>{c.premium}/mes</span>
                  <span className={`text-xs font-semibold ${c.isUs ? "text-emerald-500" : "text-foreground"}`}>{c.rating}★</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sparkd vs industria */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" /> Sparkd vs promedio industria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {METRICS_COMPARE.map(m => (
            <div key={m.metric} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-32 shrink-0">{m.metric}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className={`text-xs font-bold w-16 ${m.better ? "text-emerald-500" : "text-rose-500"}`}>
                  {m.unit === "$" && m.metric !== "MRR" ? "$" : ""}{typeof m.sparkd === "number" && m.sparkd > 999 ? m.sparkd.toLocaleString() : m.sparkd}{m.unit !== "$" || m.metric === "MRR" ? m.unit : ""}
                </span>
                <span className="text-[10px] text-muted-foreground">vs</span>
                <span className="text-xs text-muted-foreground w-20">
                  {m.unit === "$" && m.metric !== "MRR" ? "$" : ""}{typeof m.industry === "number" && m.industry > 999 ? m.industry.toLocaleString() : m.industry}{m.unit !== "$" || m.metric === "MRR" ? m.unit : ""} industria
                </span>
              </div>
              {m.better
                ? <Badge className="text-[10px] border-0 bg-emerald-500/15 text-emerald-500 shrink-0 flex items-center gap-0.5"><TrendingUp className="h-2.5 w-2.5" />Mejor</Badge>
                : <Badge className="text-[10px] border-0 bg-rose-500/15 text-rose-500 shrink-0 flex items-center gap-0.5"><TrendingDown className="h-2.5 w-2.5" />Por crecer</Badge>
              }
            </div>
          ))}
        </CardContent>
      </Card>

      {/* FODA */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { title: "Fortalezas", color: "border-emerald-500/30 bg-emerald-500/5", badge: "bg-emerald-500/15 text-emerald-500",
            items: ["Match rate 6.7% (3x industria)", "Precio más competitivo ($4.99)", "Retención 42% (mejor que Tinder)", "Comunidad LATAM enfocada", "Moderación IA activa"] },
          { title: "Debilidades", color: "border-rose-500/30 bg-rose-500/5", badge: "bg-rose-500/15 text-rose-500",
            items: ["Base de usuarios pequeña", "Redis inestable (free tier)", "Sin app nativa (solo PWA)", "Equipo pequeño", "Sin marketing pagado aún"] },
          { title: "Oportunidades", color: "border-blue-500/30 bg-blue-500/5", badge: "bg-blue-500/15 text-blue-500",
            items: ["Mercado LATAM sin líder claro", "Crecimiento orgánico fuerte", "Expansión a más países", "Partnerships con influencers", "Funciones de comunidad (grupos)"] },
          { title: "Amenazas", color: "border-amber-500/30 bg-amber-500/5", badge: "bg-amber-500/15 text-amber-500",
            items: ["Tinder expandiéndose a LATAM", "Costos de infraestructura", "Regulaciones de privacidad", "Competidores locales", "Dependencia de Render free"] },
        ].map(s => (
          <Card key={s.title} className={`border ${s.color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${s.badge.includes("emerald") ? "bg-emerald-500" : s.badge.includes("rose") ? "bg-rose-500" : s.badge.includes("blue") ? "bg-blue-500" : "bg-amber-500"}`} />
                  <span className="text-xs text-foreground">{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
