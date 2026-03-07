"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"

export function usePremiumStatus() {
  const [isPremium, setIsPremium] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkPremiumStatus()
  }, [])

  const checkPremiumStatus = async () => {
    try {
      const data = await api.get<{ active: boolean }>("/api/user-subscription/status")
      setIsPremium(data.active)
    } catch {
      setIsPremium(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { isPremium, isLoading, refresh: checkPremiumStatus }
}
