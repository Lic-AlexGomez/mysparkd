import { useEffect, useRef, useCallback, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type { EventCapacityUpdate, EventGroupSocketPayload, Message } from '@/lib/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sparkd1-0.onrender.com'
const PRESENCE_PING_INTERVAL = 30_000

// ── Singleton: una sola conexión WS compartida por toda la app ────────────────
let sharedClient: Client | null = null
let sharedConnected = false
let consumerCount = 0
let pingInterval: NodeJS.Timeout | null = null
const connectedListeners = new Set<(v: boolean) => void>()

function notifyConnected(v: boolean) {
  sharedConnected = v
  connectedListeners.forEach(fn => fn(v))
}

function ensureConnected(userId: string) {
  if (sharedClient?.active) return

  const token = localStorage.getItem('sparkd_token')
  if (!token) return

  const client = new Client({
    webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: () => {
      notifyConnected(true)

      const publishPresencePing = () => {
        // Guard against reconnect windows where socket is active but STOMP isn't fully ready.
        if (!client.active || !sharedConnected) return
        try {
          client.publish({ destination: '/app/presence.ping', body: '' })
        } catch {
          // Ignore transient publish errors during reconnect.
        }
      }

      setTimeout(() => {
        publishPresencePing()
      }, 500)

      pingInterval = setInterval(() => {
        publishPresencePing()
      }, PRESENCE_PING_INTERVAL)
    },

    onDisconnect: () => {
      notifyConnected(false)
      if (pingInterval) { clearInterval(pingInterval); pingInterval = null }
    },

    onStompError: (frame) => console.error('[WS] STOMP error:', frame),
    onWebSocketError: (event) => {
      // SockJS can emit an empty object during transient reconnects; avoid noisy logs.
      const hasUsefulPayload =
        !!event && (Object.keys(event as Record<string, unknown>).length > 0)
      if (hasUsefulPayload) {
        console.error('[WS] WebSocket error:', event)
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('[WS] WebSocket transient reconnect')
      }
    },
  })

  client.activate()
  sharedClient = client
}

function teardown() {
  if (pingInterval) { clearInterval(pingInterval); pingInterval = null }
  sharedClient?.deactivate()
  sharedClient = null
  notifyConnected(false)
}
// ─────────────────────────────────────────────────────────────────────────────

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
  onMessageEdited?: (message: Message) => void
  onMessageDeleted?: (messageId: string) => void
  onMessagePinned?: (event: unknown) => void
  onEventGroup?: (payload: EventGroupSocketPayload) => void
  onEventCapacity?: (payload: EventCapacityUpdate) => void
}

export function useWebSocket(userId: string | undefined, callbacks: WebSocketCallbacks | ((message: Message) => void)) {
  const [isConnected, setIsConnected] = useState(sharedConnected)
  const callbacksRef = useRef<WebSocketCallbacks>({})
  const subsRef = useRef<Array<{ unsubscribe: () => void }>>([])

  // Normalizar callbacks
  useEffect(() => {
    callbacksRef.current = typeof callbacks === 'function' ? { onMessage: callbacks } : callbacks
  }, [callbacks])

  // Sincronizar estado de conexión con el singleton
  useEffect(() => {
    const listener = (v: boolean) => setIsConnected(v)
    connectedListeners.add(listener)
    return () => { connectedListeners.delete(listener) }
  }, [])

  // Suscribirse a los topics cuando el cliente esté conectado
  const subscribe = useCallback(() => {
    const client = sharedClient
    if (!client?.active) return

    // Limpiar suscripciones anteriores
    subsRef.current.forEach(s => s.unsubscribe())
    subsRef.current = []

    subsRef.current.push(
      client.subscribe('/user/queue/messages', (frame) => {
        callbacksRef.current.onMessage?.(JSON.parse(frame.body) as Message)
      }),
      client.subscribe('/topic/presence', (frame) => {
        callbacksRef.current.onPresence?.(JSON.parse(frame.body) as PresenceEvent)
      }),
      client.subscribe('/user/queue/presence-snapshot', (frame) => {
        callbacksRef.current.onPresenceSnapshot?.(JSON.parse(frame.body) as PresenceEvent[])
      }),
      client.subscribe('/user/queue/typing', (frame) => {
        callbacksRef.current.onTyping?.(JSON.parse(frame.body) as TypingEvent)
      }),
      client.subscribe('/user/queue/read', (frame) => {
        callbacksRef.current.onRead?.(JSON.parse(frame.body) as ReadEvent)
      }),
      client.subscribe('/user/queue/chat-updated', (frame) => {
        callbacksRef.current.onChatUpdated?.(JSON.parse(frame.body) as string)
      }),
      client.subscribe('/user/queue/poll-voted', (frame) => {
        callbacksRef.current.onPollVoted?.((JSON.parse(frame.body) as { optionId: string }).optionId)
      }),
      client.subscribe('/user/queue/poll-state', (frame) => {
        callbacksRef.current.onPollState?.(JSON.parse(frame.body))
      }),
      client.subscribe('/user/queue/message-edited', (frame) => {
        callbacksRef.current.onMessageEdited?.(JSON.parse(frame.body) as Message)
      }),
      client.subscribe('/user/queue/message-deleted', (frame) => {
        callbacksRef.current.onMessageDeleted?.(JSON.parse(frame.body) as string)
      }),
      client.subscribe('/user/queue/message-pinned', (frame) => {
        callbacksRef.current.onMessagePinned?.(JSON.parse(frame.body))
      }),
    )
  }, [])

  useEffect(() => {
    if (!userId) return

    consumerCount++
    ensureConnected(userId)

    // Si ya está conectado, suscribirse inmediatamente
    if (sharedConnected) {
      subscribe()
    }

    // Suscribirse cuando conecte
    const onConnect = (v: boolean) => { if (v) subscribe() }
    connectedListeners.add(onConnect)

    return () => {
      connectedListeners.delete(onConnect)
      subsRef.current.forEach(s => s.unsubscribe())
      subsRef.current = []
      consumerCount--
      // Solo desconectar cuando no queda ningún consumidor
      if (consumerCount <= 0) {
        consumerCount = 0
        teardown()
      }
    }
  }, [userId, subscribe])

  const sendMessage = useCallback((chatId: string, content: string) => {
    if (!sharedClient?.active || !sharedConnected) return false
    const token = localStorage.getItem('sparkd_token')
    try {
      sharedClient.publish({
        destination: '/app/chat.send',
        body: JSON.stringify({ chatId, content, token }),
      })
      return true
    } catch { return false }
  }, [])

  const sendTyping = useCallback((chatId: string) => {
    if (!sharedClient?.active || !sharedConnected) return
    const token = localStorage.getItem('sparkd_token')
    sharedClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ chatId, token }),
    })
  }, [])

  const sendSeen = useCallback((chatId: string) => {
    if (!sharedClient?.active || !sharedConnected) return
    const token = localStorage.getItem('sparkd_token')
    try {
      sharedClient.publish({
        destination: '/app/chat.seen',
        body: JSON.stringify({ chatId, token }),
      })
    } catch { /* ignorar */ }
  }, [])

  const sendPollVote = useCallback((optionId: string) => {
    if (!sharedClient?.active || !sharedConnected) return false
    try {
      sharedClient.publish({
        destination: '/app/poll.vote',
        body: JSON.stringify({ optionId }),
      })
      return true
    } catch { return false }
  }, [])

  const subscribeToPoll = useCallback((pollId: string, onUpdate: (poll: any) => void) => {
    if (!sharedClient?.active) return () => {}
    const sub = sharedClient.subscribe(`/topic/polls/${pollId}`, (frame) => {
      onUpdate(JSON.parse(frame.body))
    })
    return () => sub.unsubscribe()
  }, [])

  const subscribeToGroup = useCallback((groupId: string, onUpdate: (event: any) => void) => {
    let sub: { unsubscribe: () => void } | null = null
    const trySubscribe = () => {
      if (!sharedClient?.active || !sharedConnected) return
      if (sub) return
      sub = sharedClient.subscribe(`/topic/group/${groupId}`, (frame) => {
        try {
          onUpdate(JSON.parse(frame.body))
        } catch {
          // Keep the subscriber resilient to malformed payloads.
        }
      })
    }

    // Attempt immediate subscribe when already connected.
    trySubscribe()

    // If not connected yet, subscribe as soon as connection is ready.
    const onConnect = (connected: boolean) => {
      if (connected) trySubscribe()
    }
    connectedListeners.add(onConnect)

    return () => {
      connectedListeners.delete(onConnect)
      sub?.unsubscribe()
      sub = null
    }
  }, [])

  const subscribeToEventGroup = useCallback((eventId: string, onUpdate: (event: EventGroupSocketPayload) => void) => {
    let sub: { unsubscribe: () => void } | null = null
    const trySubscribe = () => {
      if (!sharedClient?.active || !sharedConnected) return
      if (sub) return
      sub = sharedClient.subscribe(`/topic/event-group/${eventId}`, (frame) => {
        try {
          onUpdate(JSON.parse(frame.body) as EventGroupSocketPayload)
        } catch {
          // Keep event subscriber resilient to malformed payloads.
        }
      })
    }

    trySubscribe()

    const onConnect = (connected: boolean) => {
      if (connected) trySubscribe()
    }
    connectedListeners.add(onConnect)

    return () => {
      connectedListeners.delete(onConnect)
      sub?.unsubscribe()
      sub = null
    }
  }, [])

  const subscribeToEventCapacity = useCallback((eventId: string, onUpdate: (event: EventCapacityUpdate) => void) => {
    let sub: { unsubscribe: () => void } | null = null
    const trySubscribe = () => {
      if (!sharedClient?.active || !sharedConnected) return
      if (sub) return
      sub = sharedClient.subscribe(`/topic/event/${eventId}/capacity`, (frame) => {
        try {
          onUpdate(JSON.parse(frame.body) as EventCapacityUpdate)
        } catch {
          // Keep capacity subscriber resilient to malformed payloads.
        }
      })
    }

    trySubscribe()

    const onConnect = (connected: boolean) => {
      if (connected) trySubscribe()
    }
    connectedListeners.add(onConnect)

    return () => {
      connectedListeners.delete(onConnect)
      sub?.unsubscribe()
      sub = null
    }
  }, [])

  return {
    sendMessage,
    sendTyping,
    sendSeen,
    sendPollVote,
    subscribeToPoll,
    subscribeToGroup,
    subscribeToEventGroup,
    subscribeToEventCapacity,
    isConnected,
    client: { current: sharedClient },
  }
}
