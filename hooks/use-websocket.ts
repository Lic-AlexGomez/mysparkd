import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Message } from '@/lib/types'

const BACKEND_URL = 'https://sparkd1-0.onrender.com'
const IS_DEV = typeof window !== 'undefined' && window.location.hostname === 'localhost'

export function useWebSocket(userId: string | undefined, onMessage: (message: Message) => void) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    // Deshabilitar WebSocket en desarrollo para evitar CORS
    if (IS_DEV) {
      console.log('[WebSocket] Disabled in development mode')
      return
    }

    if (!userId || isConnected || clientRef.current?.active) return

    const token = localStorage.getItem('sparkd_token')
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true)
        
        client.subscribe(`/user/queue/messages`, (message) => {
          const newMessage = JSON.parse(message.body) as Message
          onMessage(newMessage)
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error('[WebSocket] Error:', frame)
      }
    })

    client.activate()
    clientRef.current = client
  }, [userId, onMessage, isConnected])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (clientRef.current?.active && isConnected) {
      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ chatId, content })
      })
      return true
    }
    return false
  }, [isConnected])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    sendMessage,
    isConnected
  }
}
