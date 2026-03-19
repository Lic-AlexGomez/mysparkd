"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export function useUnreadChats() {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const chats = await api.get<any[]>("/api/chat/chats")
      const total = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0)
      setUnreadCount(total)
    } catch {
      // silent
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  return unreadCount
}
