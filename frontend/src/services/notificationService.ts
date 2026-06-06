import api from './api'
import type { Notification } from '@/types'

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications/')
    return response.data.results || response.data
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count/')
    return response.data.unread_count
  },

  async markAsRead(id: string): Promise<{ unread_count: number }> {
    const response = await api.post(`/notifications/${id}/mark-read/`)
    return response.data
  },

  async markAllAsRead(): Promise<{ unread_count: number }> {
    const response = await api.post('/notifications/mark-read/')
    return response.data
  },

  async deleteNotification(id: string): Promise<{ unread_count: number }> {
    const response = await api.delete(`/notifications/${id}/delete/`)
    return response.data
  },

  async getPreferences(): Promise<Record<string, boolean>> {
    const response = await api.get('/notifications/preferences/')
    return response.data
  },

  async updatePreferences(data: Record<string, boolean>): Promise<void> {
    await api.patch('/notifications/preferences/', data)
  },
}
