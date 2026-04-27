import { api } from '@/lib/api'

export async function createNotification(
  userId: string,
  type: 'like' | 'comment' | 'match' | 'message' | 'follow' | 'reaction',
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
    notificationService.addLocalNotification({
      notificationId: `local-${Date.now()}`,
      senderId: relatedUserId || "local",
      senderUsername: "Sistema",
      receiverId: userId,
      receiverUsername: "",
      title: type,
      data: message,
      read: false,
      createdAt: new Date().toISOString(),
      targetType: "POST",
      targetId: undefined,
    })
  }
}
