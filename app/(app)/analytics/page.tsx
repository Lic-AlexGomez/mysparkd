"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, Heart, MessageCircle, Users, BarChart3 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { getFeatureFlags } from "@/lib/utils/feature-flags"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const features = getFeatureFlags(user?.email)

  useEffect(() => {
    if (!features.analyticsPage) {
      toast.error("Esta funcionalidad no está disponible aún")
      router.push('/feed')
    }
  }, [features.analyticsPage, router])

  if (!features.analyticsPage) {
    return null
  }

  const stats = [
    { label: "Vistas de perfil", value: "1,234", change: "+12%", icon: Eye, color: "text-primary" },
    { label: "Likes recibidos", value: "456", change: "+8%", icon: Heart, color: "text-secondary" },
    { label: "Comentarios", value: "89", change: "+15%", icon: MessageCircle, color: "text-accent" },
    { label: "Nuevos seguidores", value: "67", change: "+23%", icon: Users, color: "text-success" },
  ]

  const topPosts = [
    { id: 1, content: "Mi mejor post del mes...", likes: 234, comments: 45, views: 1200 },
    { id: 2, content: "Increíble experiencia...", likes: 189, comments: 32, views: 980 },
    { id: 3, content: "Nuevo proyecto...", likes: 156, comments: 28, views: 850 },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">Estadísticas de tu perfil</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <Badge variant="secondary" className="bg-success/10 text-success border-0 text-xs">
                  {stat.change}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement Rate */}
      <Card className="border-border mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Engagement Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: "68%" }} />
              </div>
            </div>
            <span className="text-2xl font-bold text-foreground">68%</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Tu contenido tiene un 68% de engagement, ¡excelente!
          </p>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            Posts más populares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.map((post, idx) => (
              <div key={post.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{post.content}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {post.likes}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {post.comments}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {post.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
