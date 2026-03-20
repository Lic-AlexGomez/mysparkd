"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard, MiniBar, ProgressRow } from "./shared"
import { FileText, Eye, Heart, MessageCircle, Share2, BarChart3, TrendingUp, Image, Video, AlignLeft } from "lucide-react"

const STATS = [
  { label: "Posts totales",    value: "48,291", change: +12, icon: FileText,      color: "bg-orange-500" },
  { label: "Vistas totales",   value: "2.4M",   change: +18, icon: Eye,           color: "bg-violet-500" },
  { label: "Likes totales",    value: "384K",   change: +9,  icon: Heart,         color: "bg-rose-500" },
  { label: "Comentarios",      value: "92K",    change: +14, icon: MessageCircle, color: "bg-blue-500" },
]

const POSTS_DAILY = [320, 410, 380, 490, 520, 610, 480]
const VIEWS_DAILY = [180000, 210000, 195000, 240000, 280000, 310000, 260000]

const TOP_POSTS = [
  { body: "¡Increíble atardecer en Caracas 🌆",    likes: 1240, views: 8900, comments: 234, type: "image" },
  { body: "Nuevo proyecto de música 🎵 ¿quién se apunta?", likes: 980,  views: 7200, comments: 189, type: "text"  },
  { body: "Video del partido de ayer ⚽",           likes: 870,  views: 6800, comments: 312, type: "video" },
  { body: "Reflexión del día: el tiempo vale oro",  likes: 760,  views: 5400, comments: 98,  type: "text"  },
  { body: "Foto desde el teleférico 📸",            likes: 690,  views: 4900, comments: 145, type: "image" },
]

const POST_TYPES = [
  { label: "Solo texto",  value: 22400, pct: 46, icon: AlignLeft, color: "bg-blue-500" },
  { label: "Con imagen",  value: 18300, pct: 38, icon: Image,     color: "bg-violet-500" },
  { label: "Con video",   value: 5800,  pct: 12, icon: Video,     color: "bg-rose-500" },
  { label: "Encuestas",   value: 1791,  pct: 4,  icon: BarChart3, color: "bg-amber-500" },
]

const VISIBILITY = [
  { label: "Público",     value: 38400, color: "bg-emerald-500" },
  { label: "Seguidores",  value: 7200,  color: "bg-primary" },
  { label: "Privado",     value: 2691,  color: "bg-muted-foreground" },
]

export function AdminContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" /> Posts por día (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">480 <span className="text-sm font-normal text-muted-foreground">hoy</span></p>
            <MiniBar data={POSTS_DAILY} color="bg-orange-500" />
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-violet-500" /> Vistas por día (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black mb-3">260K <span className="text-sm font-normal text-muted-foreground">hoy</span></p>
            <MiniBar data={VIEWS_DAILY.map(v => v / 1000)} color="bg-violet-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipos de post */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tipos de contenido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {POST_TYPES.map(t => (
              <div key={t.label} className="flex items-center gap-3">
                <div className={`h-7 w-7 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
                  <t.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-foreground">{t.label}</span>
                    <span className="text-xs font-bold text-foreground">{t.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Visibilidad */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Visibilidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {VISIBILITY.map(v => (
              <ProgressRow key={v.label} label={v.label} value={v.value} max={38400} color={v.color} />
            ))}
            <div className="pt-3 border-t border-border space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Posts permanentes</span>
                <span className="font-semibold text-foreground">71%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Posts temporales</span>
                <span className="font-semibold text-foreground">29%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Posts premium (bloqueados)</span>
                <span className="font-semibold text-foreground">8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de engagement */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Engagement promedio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Likes / post",       value: "7.9",  color: "text-rose-500" },
              { label: "Comentarios / post",  value: "1.9",  color: "text-blue-500" },
              { label: "Vistas / post",       value: "49.7", color: "text-violet-500" },
              { label: "Shares / post",       value: "0.8",  color: "text-emerald-500" },
              { label: "Engagement rate",     value: "6.8%", color: "text-primary" },
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className={`text-sm font-black ${m.color}`}>{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top posts */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Posts más virales
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            <span className="col-span-2">Contenido</span><span>Likes</span><span>Vistas</span>
          </div>
          <div className="divide-y divide-border">
            {TOP_POSTS.map((p, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 px-4 py-3 items-center hover:bg-muted/20">
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <Badge className={`text-[9px] border-0 shrink-0 ${
                    p.type === "image" ? "bg-violet-500/15 text-violet-500" :
                    p.type === "video" ? "bg-rose-500/15 text-rose-500" :
                    "bg-blue-500/15 text-blue-500"
                  }`}>{p.type}</Badge>
                  <span className="text-xs text-foreground truncate">{p.body}</span>
                </div>
                <span className="text-xs font-semibold text-foreground">{p.likes.toLocaleString()}</span>
                <span className="text-xs font-semibold text-foreground">{p.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
