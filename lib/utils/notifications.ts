import { api } from '@/lib/api'

export async function createNotification(
  userId: string,
  type: 'like' | 'comment' | 'match' | 'message' | 'follow',
  message: string,
  relatedUserId?: string
) {
  try {
    // Intentar crear en el backend
    await api.post('/api/notifications/create', {
      userId,
      type,
      message,
      relatedUserId
    })
  } catch (error) {
    // Si falla, crear localmente como fallback
    const { notificationService } = await import('@/lib/services/notification')
    notificationService.create(userId, type, message, relatedUserId)
  }
}
