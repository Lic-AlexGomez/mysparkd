"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { AdminPanel } from "@/components/admin-panel"

export default function ManagerPage() {
  const router = useRouter()
  const features = useFeatureFlags()

  useEffect(() => {
    if (!features.managerPanel) router.replace("/feed")
  }, [features.managerPanel, router])

  if (!features.managerPanel) return null

  return <AdminPanel role="manager" />
}
