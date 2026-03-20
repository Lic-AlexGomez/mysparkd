"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { Dashboard } from "@/components/dashboard/dashboard"

export default function DashboardPage() {
  const router = useRouter()
  const features = useFeatureFlags()

  useEffect(() => {
    if (!features.dashboard) {
      router.replace("/feed")
    }
  }, [features.dashboard, router])

  if (!features.dashboard) return null

  return <Dashboard />
}
