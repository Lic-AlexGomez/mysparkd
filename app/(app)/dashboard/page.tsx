"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { AdminPanel } from "@/components/admin-panel"

export default function DashboardPage() {
  const router = useRouter()
  const features = useFeatureFlags()

  useEffect(() => {
    if (!features.dashboard) router.replace("/feed")
  }, [features.dashboard, router])

  if (!features.dashboard) return null

  return <AdminPanel role="admin" />
}
