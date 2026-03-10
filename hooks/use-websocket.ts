import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Message } from '@/lib/types'

const BACKEND_URL = 'https://sparkd1-0.onrender.com'

export function useWebSocket(userId: string | undefined, onMessage: (message: Message) => void) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const onMessageRef = useRef(onMessage)

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  const connect = useCallback(() => {
    if (!userId || clientRef.current?.active) return

    const token = localStorage.getItem('sparkd_token')
    if (!token) {
      console.error('[WebSocket] No hay token disponible')
      return
    }

    console.log('[WebSocket] Conectando con userId:', userId)
    console.log('[WebSocket] Token:', token.substring(0, 20) + '...')

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log('[WebSocket] Conectado exitosamente')
        setIsConnected(true)
        
        client.subscribe(`/user/queue/messages`, (message) => {
          console.log('[WebSocket] Mensaje raw recibido:', message.body)
          const newMessage = JSON.parse(message.body) as Message
          console.log('[WebSocket] Mensaje parseado:', newMessage)
          onMessageRef.current(newMessage)
        })
        
        console.log('[WebSocket] Suscrito a /user/queue/messages')
      },
      onDisconnect: () => {
        console.log('[WebSocket] Desconectado')
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error('[WebSocket] Error STOMP:', frame)
      },
      onWebSocketError: (event) => {
        console.error('[WebSocket] Error WebSocket:', event)
      }
    })

    client.activate()
    clientRef.current = client
  }, [userId])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((chatId: string, content: string) => {
    console.log('[WebSocket] Intentando enviar:', { chatId, content: content.substring(0, 50), isConnected, isActive: clientRef.current?.active })
    
    if (clientRef.current?.active && isConnected) {
      try {
        clientRef.current.publish({
          destination: '/app/chat.send',
          body: JSON.stringify({ 
            chatId: chatId,
            content: content 
          })
        })
        console.log('[WebSocket] Mensaje enviado exitosamente')
        return true
      } catch (error) {
        console.error('[WebSocket] Error al enviar:', error)
        return false
      }
    }
    console.log('[WebSocket] No conectado, retornando false')
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
