"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Eye, Heart, MessageCircle, Users, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { useI18n } from "@/lib/i18n"
import { profileAnalyticsService, type UserAnalytics } from "@/lib/services/profile-analytics"

export default function AnalyticsPage() {
  const { te } = useI18n()
  const router = useRouter()
  const features = useFeatureFlags()
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!features.analyticsPage) {
      toast.error(te("Esta funcionalidad no está disponible aún", "This feature is not available yet"))
      router.push("/feed")
      return
    }
    profileAnalyticsService
      .getMine()
      .then(setAnalytics)
      .finally(() => setLoading(false))
  }, [features.analyticsPage, router, te])

  if (!features.analyticsPage) return null

  const stats = [
    { label: te("Vistas de perfil", "Profile views"), value: analytics?.profileViews ?? 0, icon: Eye, color: "text-primary" },
    { label: te("Likes recibidos", "Likes received"), value: analytics?.likesReceived ?? 0, icon: Heart, color: "text-secondary" },
    { label: te("Comentarios", "Comments"), value: analytics?.commentsReceived ?? 0, icon: MessageCircle, color: "text-accent" },
    { label: te("Nuevos seguidores", "New followers"), value: analytics?.newFollowers ?? 0, icon: Users, color: "text-success" },
  ]

  const engagementPct =
    analytics?.engagementRate != null ? Math.min(100, Math.round(analytics.engagementRate * 100)) : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">{te("Analíticas", "Analytics")}</h1>
        <p className="text-muted-foreground">{te("Estadísticas de tu perfil", "Your profile stats")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="pt-6">
                  <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                {te("Tasa de engagement", "Engagement rate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${engagementPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-foreground">{engagementPct}%</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {te("Posts", "Posts")}: {analytics?.postsCount ?? 0} · {te("Reposts", "Reposts")}:{" "}
                {analytics?.repostsReceived ?? 0} · {te("Guardados", "Bookmarks")}:{" "}
                {analytics?.bookmarksReceived ?? 0}
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
