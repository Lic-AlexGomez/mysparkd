import { api } from '@/lib/api'

export interface Notification {
  notificationId: string
  senderId: string
  senderUsername: string
  receiverId: string
  receiverUsername: string
  title: string
  data: string
  targetId?: string
  targetType?: string
  read: boolean
  createdAt: string
  senderProfilePicture?: string
}

class NotificationService {
  private notifications: Notification[] = []
  private onUpdateCallback: (() => void) | null = null

  setOnUpdate(callback: () => void) {
    this.onUpdateCallback = callback
  }

  async fetchNotifications(
    userId: string,
    opts?: { page?: number; size?: number }
  ): Promise<Notification[]> {
    try {
      const q = new URLSearchParams()
      if (opts?.page !== undefined) q.set("page", String(opts.page))
      if (opts?.size !== undefined) q.set("size", String(opts.size))
      const qs = q.toString()
      const data = await api.get<Notification[]>(
        `/api/notifications/${userId}${qs ? `?${qs}` : ""}`
      )
      this.notifications = data
      return this.notifications
    } catch (e) {
      console.error('[notifications] error fetching:', e)
      return this.notifications
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const res = await api.get<{ unread: number } | number>(`/api/notifications/${userId}/count`)
      // backend devuelve { unread: N }
      if (typeof res === 'object' && res !== null && 'unread' in res) return res.unread
      if (typeof res === 'number') return res
      return this.notifications.filter(n => n.receiverId === userId && !n.read).length
    } catch {
      return this.notifications.filter(n => n.receiverId === userId && !n.read).length
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/api/notifications/${notificationId}/read`)
      const notification = this.notifications.find(n => n.notificationId === notificationId)
      if (notification) {
        notification.read = true
        this.onUpdateCallback?.()
      }
    } catch (e) {
      console.error('[notifications] error marking as read:', e)
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    for (const notification of this.notifications.filter(n => n.receiverId === userId && !n.read)) {
      await this.markAsRead(notification.notificationId)
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/api/notifications/${notificationId}`)
      this.notifications = this.notifications.filter(n => n.notificationId !== notificationId)
      this.onUpdateCallback?.()
    } catch (e) {
      console.error('[notifications] error deleting:', e)
    }
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.receiverId === userId)
  }

  getUnreadNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.receiverId === userId && !n.read)
  }

  addLocalNotification(notification: Notification) {
    this.notifications.unshift(notification)
    this.onUpdateCallback?.()
  }
}

export const notificationService = new NotificationService()