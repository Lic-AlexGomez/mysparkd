"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"

export function useUnreadChats() {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const lastFetchRef = useRef(0)

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return
    // No hacer fetch si fue hace menos de 60s
    if (Date.now() - lastFetchRef.current < 60000) return
    lastFetchRef.current = Date.now()
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
    // Polling cada 60s en vez de 30s
    const interval = setInterval(fetchUnread, 60000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  // Refrescar al volver al tab de chat
  useEffect(() => {
    if (pathname === '/chat') fetchUnread()
  }, [pathname, fetchUnread])

  return unreadCount
}
