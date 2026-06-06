import api from './api'
import type { User } from '@/types'

export const userService = {
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/users/profile/', data)
    return response.data
  },

  async changePassword(data: { old_password: string; new_password: string }): Promise<void> {
    await api.post('/users/password/change/', data)
  },

  async updateSettings(endpoint: string, data: any): Promise<void> {
    await api.patch(endpoint, data)
  },

  async getPrivacySettings(): Promise<any> {
    const response = await api.get('/users/settings/privacy/')
    return response.data
  },

  async updatePrivacySettings(data: any): Promise<void> {
    await api.patch('/users/settings/privacy/', data)
  },

  async getAppearanceSettings(): Promise<any> {
    const response = await api.get('/users/settings/appearance/')
    return response.data
  },

  async updateAppearanceSettings(data: any): Promise<void> {
    await api.patch('/users/settings/appearance/', data)
  },

  async getNotificationSettings(): Promise<any> {
    const response = await api.get('/users/settings/notifications/')
    return response.data
  },

  async updateNotificationSettings(data: any): Promise<void> {
    await api.patch('/users/settings/notifications/', data)
  },

  async getSessions(): Promise<any[]> {
    const response = await api.get('/users/settings/sessions/')
    return response.data
  },

  async revokeSession(sessionId: string): Promise<void> {
    await api.delete(`/users/settings/sessions/${sessionId}/revoke/`)
  },

  async deactivateAccount(data: { password: string; confirmation: string }): Promise<void> {
    await api.post('/users/settings/deactivate/', data)
  },

  async deleteAccount(data: { password: string; confirmation: string }): Promise<void> {
    await api.post('/users/settings/delete/', data)
  },
}
