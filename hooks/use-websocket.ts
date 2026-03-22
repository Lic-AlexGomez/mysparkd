import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { Message } from '@/lib/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sparkd1-0.onrender.com'
const PRESENCE_PING_INTERVAL = 30_000 // 30s — más realtime

export interface PresenceEvent {
  userId: string
  status: 'ONLINE' | 'OFFLINE'
}

export interface TypingEvent {
  chatId: string
  userId: string
}

export interface ReadEvent {
  chatId: string
  seenBy: string
  timestamp: string
}

export interface WebSocketCallbacks {
  onMessage?: (message: Message) => void
  onPresence?: (event: PresenceEvent) => void
  onPresenceSnapshot?: (events: PresenceEvent[]) => void
  onTyping?: (event: TypingEvent) => void
  onRead?: (event: ReadEvent) => void
  onChatUpdated?: (chatId: string) => void
  onPollVoted?: (optionId: string) => void
  onPollState?: (poll: any) => void
}

export function useWebSocket(userId: string | undefined, callbacks: WebSocketCallbacks | ((message: Message) => void)) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const callbacksRef = useRef<WebSocketCallbacks>({})
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Normalizar callbacks — soporta tanto el formato viejo (función) como el nuevo (objeto)
  useEffect(() => {
    if (typeof callbacks === 'function') {
      callbacksRef.current = { onMessage: callbacks }
    } else {
      callbacksRef.current = callbacks
    }
  }, [callbacks])

  const connect = useCallback(() => {
    if (!userId || clientRef.current?.active) return

    const token = localStorage.getItem('sparkd_token')
    if (!token) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        setIsConnected(true)
        // ── Mensajes de chat ──────────────────────────────────────
        client.subscribe('/user/queue/messages', (frame) => {
          const msg = JSON.parse(frame.body) as Message
          callbacksRef.current.onMessage?.(msg)
        })

        // ── Presencia global ──────────────────────────────────────
        client.subscribe('/topic/presence', (frame) => {
          const event = JSON.parse(frame.body) as PresenceEvent
          callbacksRef.current.onPresence?.(event)
        })

        // ── Snapshot inicial de presencia ─────────────────────────
        client.subscribe('/user/queue/presence-snapshot', (frame) => {
          const events = JSON.parse(frame.body) as PresenceEvent[]
          callbacksRef.current.onPresenceSnapshot?.(events)
        })

        // ── Al conectar, emitir propio ping para que el backend
        //    registre presencia y otros usuarios vean ONLINE ────────
        setTimeout(() => {
          if (client.active) {
            client.publish({ destination: '/app/presence.ping', body: '' })
          }
        }, 500)

        // ── Typing indicator ──────────────────────────────────────
        client.subscribe('/user/queue/typing', (frame) => {
          const event = JSON.parse(frame.body) as TypingEvent
          callbacksRef.current.onTyping?.(event)
        })

        // ── Read receipts ─────────────────────────────────────────
        client.subscribe('/user/queue/read', (frame) => {
          const event = JSON.parse(frame.body) as ReadEvent
          callbacksRef.current.onRead?.(event)
        })

        // ── Chat actualizado (nuevo mensaje en otro chat) ─────────
        client.subscribe('/user/queue/chat-updated', (frame) => {
          const chatId = JSON.parse(frame.body) as string
          callbacksRef.current.onChatUpdated?.(chatId)
        })

        // ── Poll votado (confirmación personal) ───────────────────
        client.subscribe('/user/queue/poll-voted', (frame) => {
          const data = JSON.parse(frame.body) as { optionId: string }
          callbacksRef.current.onPollVoted?.(data.optionId)
        })

        // ── Poll state personal (tras votar) ──────────────────────
        client.subscribe('/user/queue/poll-state', (frame) => {
          const poll = JSON.parse(frame.body)
          callbacksRef.current.onPollState?.(poll)
        })

        // ── Ping de presencia cada 90s ────────────────────────────
        pingIntervalRef.current = setInterval(() => {
          if (client.active) {
            client.publish({ destination: '/app/presence.ping', body: '' })
          }
        }, PRESENCE_PING_INTERVAL)
      },

      onDisconnect: () => {
        setIsConnected(false)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
      },

      onStompError: (frame) => console.error('[WS] STOMP error:', frame),
      onWebSocketError: (event) => console.error('[WS] WebSocket error:', event),
    })

    client.activate()
    clientRef.current = client
  }, [userId])

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (!clientRef.current?.active || !isConnected) return false
    const token = localStorage.getItem('sparkd_token')
    const body = { chatId, content, token }
    console.log('[WS sendMessage] payload:', body)
    try {
      clientRef.current.publish({
        destination: '/app/chat.send',
        body: JSON.stringify(body),
      })
      return true
    } catch {
      return false
    }
  }, [isConnected])

  const sendTyping = useCallback((chatId: string) => {
    if (!clientRef.current?.active || !isConnected) return
    const token = localStorage.getItem('sparkd_token')
    const body = { chatId, token }
    console.log('[WS sendTyping] payload:', body)
    clientRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(body),
    })
  }, [isConnected])

  const sendSeen = useCallback((chatId: string) => {
    if (!clientRef.current?.active || !isConnected) return
    const token = localStorage.getItem('sparkd_token')
    const body = { chatId, token }
    try {
      clientRef.current.publish({
        destination: '/app/chat.seen',
        body: JSON.stringify(body),
      })
    } catch {
      // ignorar si no hay conexión
    }
  }, [isConnected])

  // ── Votar en poll via WebSocket ───────────────────────────────────────────
  const sendPollVote = useCallback((optionId: string) => {
    if (!clientRef.current?.active || !isConnected) return false
    try {
      clientRef.current.publish({
        destination: '/app/poll.vote',
        body: JSON.stringify({ optionId }),
      })
      return true
    } catch {
      return false
    }
  }, [isConnected])

  // ── Suscribirse a un poll en tiempo real ──────────────────────────────────
  const subscribeToPoll = useCallback((pollId: string, onUpdate: (poll: any) => void) => {
    if (!clientRef.current?.active) return () => {}
    const sub = clientRef.current.subscribe(`/topic/polls/${pollId}`, (frame) => {
      onUpdate(JSON.parse(frame.body))
    })
    return () => sub.unsubscribe()
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    sendMessage,
    sendTyping,
    sendSeen,
    sendPollVote,
    subscribeToPoll,
    isConnected,
    client: clientRef,
  }
}
