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

  async markAsRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/mark-read/`)
  },

  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-read/')
  },

  async getPreferences(): Promise<Record<string, boolean>> {
    const response = await api.get('/notifications/preferences/')
    return response.data
  },

  async updatePreferences(data: Record<string, boolean>): Promise<void> {
    await api.patch('/notifications/preferences/', data)
  },
}
