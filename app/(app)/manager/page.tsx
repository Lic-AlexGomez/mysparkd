"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFeatureFlags } from "@/hooks/use-feature-flags"
import { ManagerPanel } from "@/components/manager/manager-panel"

export default function ManagerPage() {
  const router = useRouter()
  const features = useFeatureFlags()

  useEffect(() => {
    if (!features.managerPanel) router.replace("/feed")
  }, [features.managerPanel, router])

  if (!features.managerPanel) return null

  return <ManagerPanel />
}
