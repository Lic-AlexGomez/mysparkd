import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Message } from '@/lib/types'

const BACKEND_URL = 'https://sparkd1-0.onrender.com'

export function useWebSocket(userId: string | undefined, onMessage: (message: Message) => void) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    console.log('[WebSocket] Attempting to connect...', { userId, isConnected })
    if (!userId || isConnected) {
      console.log('[WebSocket] Skipping connection:', { userId, isConnected })
      return
    }

    const token = localStorage.getItem('sparkd_token')
    if (!token) {
      console.log('[WebSocket] No token found')
      return
    }

    console.log('[WebSocket] Creating client...')
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        console.log('[WebSocket]', str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WebSocket] Connected')
        setIsConnected(true)
        
        // Suscribirse a mensajes del usuario
        client.subscribe(`/user/queue/messages`, (message) => {
          console.log('[WebSocket] Message received:', message.body)
          const newMessage = JSON.parse(message.body) as Message
          onMessage(newMessage)
        })
      },
      onDisconnect: () => {
        console.log('[WebSocket] Disconnected')
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error('[WebSocket] Error:', frame)
      }
    })

    client.activate()
    clientRef.current = client
  }, [userId, onMessage])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (clientRef.current && isConnected) {
      console.log('[WebSocket] Sending message:', { chatId, content })
      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ chatId, content })
      })
      return true
    }
    console.log('[WebSocket] Not connected, cannot send')
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
