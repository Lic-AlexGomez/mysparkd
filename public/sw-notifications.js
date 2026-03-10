// Service Worker para notificaciones push (sin caché)
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activado')
  event.waitUntil(self.clients.claim())
})

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Sparkd'
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icon.png',
    badge: '/icon.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Manejar clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.openWindow(event.notification.data || '/')
    )
  }
})
