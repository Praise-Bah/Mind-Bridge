import api from './api'
import type { AdminStats, AdminUser, PendingProfessional, ModerationReport, PendingGroup } from '@/types'

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const response = await api.get('/admin-panel/stats/')
    return response.data
  },

  async getUsers(params?: { search?: string; role?: string }): Promise<AdminUser[]> {
    const response = await api.get('/admin-panel/users/', { params })
    return response.data.results || response.data
  },

  async banUser(id: string): Promise<void> {
    await api.post(`/admin-panel/users/${id}/ban/`)
  },

  async activateUser(id: string): Promise<void> {
    await api.post(`/admin-panel/users/${id}/activate/`)
  },

  exportUsersCSV(): void {
    window.open(`${api.defaults.baseURL}/admin-panel/users/export/`, '_blank')
  },

  async getPendingProfessionals(): Promise<PendingProfessional[]> {
    const response = await api.get('/admin-panel/professionals/pending/')
    return response.data.results || response.data
  },

  async approveProfessional(id: string): Promise<void> {
    await api.post(`/admin-panel/professionals/${id}/approve/`)
  },

  async rejectProfessional(id: string, reason: string): Promise<void> {
    await api.post(`/admin-panel/professionals/${id}/reject/`, { reason })
  },

  async getReports(includeResolved = false): Promise<ModerationReport[]> {
    const response = await api.get('/admin-panel/reports/', {
      params: includeResolved ? { resolved: 'true' } : {},
    })
    return response.data.results || response.data
  },

  async dismissReport(id: string): Promise<void> {
    await api.post(`/admin-panel/reports/${id}/dismiss/`)
  },

  async deleteReportContent(id: string): Promise<void> {
    await api.post(`/admin-panel/reports/${id}/delete-content/`)
  },

  async warnUser(id: string): Promise<void> {
    await api.post(`/admin-panel/reports/${id}/warn-user/`)
  },

  async banReportedUser(id: string): Promise<void> {
    await api.post(`/admin-panel/reports/${id}/ban-user/`)
  },

  async createVideo(data: FormData | Record<string, unknown>): Promise<void> {
    await api.post('/admin-panel/videos/', data)
  },

  async updateVideo(id: string, data: Record<string, unknown>): Promise<void> {
    await api.patch(`/admin-panel/videos/${id}/`, data)
  },

  async deleteVideo(id: string): Promise<void> {
    await api.delete(`/admin-panel/videos/${id}/`)
  },

  async getPendingGroups(): Promise<PendingGroup[]> {
    const response = await api.get('/admin-panel/groups/pending/')
    return response.data.results || response.data
  },

  async approveGroup(id: string): Promise<void> {
    await api.post(`/admin-panel/groups/${id}/approve/`)
  },

  async rejectGroup(id: string, reason: string): Promise<void> {
    await api.post(`/admin-panel/groups/${id}/reject/`, { reason })
  },

  async sendEmailCampaign(data: {
    subject: string
    message: string
    segment: string
  }): Promise<{ status: string; sent_to: number }> {
    const response = await api.post('/admin-panel/email-campaign/', data)
    return response.data
  },
}
