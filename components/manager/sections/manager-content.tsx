"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileText, Search, Eye, Trash2, Lock, Image, Video, AlignLeft, BarChart3 } from "lucide-react"

const POSTS = [
  { id: "p1", user: "sofia_m",   body: "¡Increíble atardecer en Caracas 🌆",          type: "image", status: "activo",   likes: 312, views: 2100, reports: 0, date: "hace 2h" },
  { id: "p2", user: "jose_r",    body: "Nuevo proyecto de música 🎵 ¿quién se apunta?", type: "text",  status: "activo",   likes: 245, views: 1840, reports: 0, date: "hace 4h" },
  { id: "p3", user: "user_x91",  body: "Contenido que fue reportado por usuarios...",   type: "text",  status: "reportado",likes: 12,  views: 340,  reports: 3, date: "hace 5h" },
  { id: "p4", user: "pedro_g",   body: "Video del partido de ayer ⚽",                  type: "video", status: "activo",   likes: 189, views: 1200, reports: 0, date: "hace 6h" },
  { id: "p5", user: "sistema",   body: "Post bloqueado por moderación IA",              type: "text",  status: "bloqueado",likes: 0,   views: 0,    reports: 0, date: "hace 8h" },
  { id: "p6", user: "ana_lopez", body: "Reflexión del día: el tiempo vale oro ✨",       type: "text",  status: "activo",   likes: 156, views: 980,  reports: 0, date: "hace 1d" },
  { id: "p7", user: "miguel_v",  body: "Encuesta: ¿cuál es tu app favorita?",           type: "poll",  status: "activo",   likes: 89,  views: 640,  reports: 1, date: "hace 1d" },
  { id: "p8", user: "carlos_r",  body: "Foto desde el teleférico 📸",                   type: "image", status: "activo",   likes: 134, views: 870,  reports: 0, date: "hace 2d" },
]

const TYPE_ICONS: Record<string, any> = {
  text:  AlignLeft,
  image: Image,
  video: Video,
  poll:  BarChart3,
}

const STATUS_COLORS: Record<string, string> = {
  activo:    "bg-emerald-500/15 text-emerald-500",
  reportado: "bg-rose-500/15 text-rose-500",
  bloqueado: "bg-muted text-muted-foreground",
}

export function ManagerContent() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("todos")
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = POSTS.filter(p => {
    const matchSearch = p.body.toLowerCase().includes(search.toLowerCase()) || p.user.includes(search.toLowerCase())
    const matchFilter = filter === "todos" || p.status === filter || p.type === filter
    return matchSearch && matchFilter
  })

  const selectedPost = POSTS.find(p => p.id === selected)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["todos", "activo", "reportado", "bloqueado", "image", "video", "poll"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f ? "bg-secondary text-white border-secondary" : "border-border text-muted-foreground hover:border-secondary"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar post..." className="pl-8 h-8 text-xs bg-muted border-border w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border lg:col-span-2">
          <CardContent className="p-0">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              <span className="col-span-2">Post</span><span>Estado</span><span>Likes</span><span>Acciones</span>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filtered.map(p => {
                const TypeIcon = TYPE_ICONS[p.type] || AlignLeft
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelected(p.id === selected ? null : p.id)}
                    className={`grid grid-cols-5 gap-2 px-4 py-3 items-center cursor-pointer transition-colors ${selected === p.id ? "bg-secondary/5 border-l-2 border-secondary" : "hover:bg-muted/20"}`}
                  >
                    <div className="col-span-2 flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground truncate">{p.body}</p>
                        <p className="text-[10px] text-muted-foreground">@{p.user} · {p.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge className={`text-[10px] border-0 ${STATUS_COLORS[p.status]}`}>{p.status}</Badge>
                      {p.reports > 0 && <span className="text-[10px] text-rose-500 font-bold">⚠{p.reports}</span>}
                    </div>
                    <span className="text-xs text-foreground font-medium">{p.likes}</span>
                    <div className="flex gap-1">
                      <button className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center hover:bg-rose-500/20 transition-colors">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detalle */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-secondary" />
              {selectedPost ? "Detalle del post" : "Selecciona un post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPost ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${selectedPost.status === "reportado" ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-muted/20"}`}>
                  <p className="text-xs text-foreground">{selectedPost.body}</p>
                </div>
                <div className="space-y-1.5 text-xs">
                  {[
                    ["Autor",    `@${selectedPost.user}`],
                    ["Tipo",     selectedPost.type],
                    ["Estado",   selectedPost.status],
                    ["Likes",    selectedPost.likes],
                    ["Vistas",   selectedPost.views],
                    ["Reportes", selectedPost.reports],
                    ["Fecha",    selectedPost.date],
                  ].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className={`font-semibold ${k === "Reportes" && Number(v) > 0 ? "text-rose-500" : "text-foreground"}`}>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="outline" className="w-full text-xs h-8">
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver post completo
                  </Button>
                  {selectedPost.status === "activo" && (
                    <Button size="sm" variant="outline" className="w-full text-xs h-8 border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                      <Lock className="h-3.5 w-3.5 mr-1.5" /> Bloquear post
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="w-full text-xs h-8 border-rose-500/30 text-rose-500 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar post
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                Haz clic en un post para ver sus detalles
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
