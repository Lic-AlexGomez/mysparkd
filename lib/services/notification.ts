interface Notification {
  id: string
  userId: string
  type: 'like' | 'comment' | 'match' | 'message' | 'follow'
  message: string
  read: boolean
  createdAt: string
  relatedUserId?: string
}

class NotificationService {
  private notifications: Notification[] = []

  constructor() {
    this.loadNotifications()
  }

  private loadNotifications() {
    const saved = localStorage.getItem('sparkd_notifications')
    if (saved) {
      this.notifications = JSON.parse(saved)
    }
  }

  private saveNotifications() {
    localStorage.setItem('sparkd_notifications', JSON.stringify(this.notifications))
  }

  create(userId: string, type: Notification['type'], message: string, relatedUserId?: string): Notification {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      relatedUserId,
    }
    this.notifications.push(notification)
    this.saveNotifications()
    return notification
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications.filter(n => n.userId === userId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  getUnreadCount(userId: string): number {
    return this.notifications.filter(n => n.userId === userId && !n.read).length
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead(userId: string) {
    this.notifications.forEach(n => {
      if (n.userId === userId) n.read = true
    })
    this.saveNotifications()
  }
}

export const notificationService = new NotificationService()
