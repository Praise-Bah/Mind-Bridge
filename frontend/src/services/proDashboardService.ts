import api from './api'
import type { ProBooking, PatientEntry, EarningsSummary, SessionNote, Availability } from '@/types'

export const proDashboardService = {
  async getTodaySessions(): Promise<ProBooking[]> {
    const r = await api.get('/pro/today-sessions/')
    return r.data.results || r.data
  },

  async getPatients(): Promise<PatientEntry[]> {
    const r = await api.get('/pro/patients/')
    return r.data.results || r.data
  },

  async getEarnings(): Promise<EarningsSummary> {
    const r = await api.get('/pro/earnings/')
    return r.data
  },

  async requestPayout(): Promise<void> {
    await api.post('/pro/earnings/request-payout/')
  },

  async getMyAvailability(): Promise<Availability[]> {
    const r = await api.get('/pro/availability/')
    return r.data.results || r.data
  },

  async createSlot(data: Partial<Availability>): Promise<Availability> {
    const r = await api.post('/pro/availability/', data)
    return r.data
  },

  async updateSlot(id: string, data: Partial<Availability>): Promise<Availability> {
    const r = await api.patch(`/pro/availability/${id}/`, data)
    return r.data
  },

  async deleteSlot(id: string): Promise<void> {
    await api.delete(`/pro/availability/${id}/`)
  },

  async blockSlot(data: { weekday: number; start_time: string; end_time: string }): Promise<Availability> {
    const r = await api.post('/pro/availability/block/', data)
    return r.data
  },

  async getSessionNotes(patientId?: string): Promise<SessionNote[]> {
    const r = await api.get('/pro/session-notes/', {
      params: patientId ? { patient: patientId } : {},
    })
    return r.data.results || r.data
  },

  async createNote(data: { patient: string; content: string }): Promise<SessionNote> {
    const r = await api.post('/pro/session-notes/', data)
    return r.data
  },

  async updateNote(id: string, content: string): Promise<SessionNote> {
    const r = await api.patch(`/pro/session-notes/${id}/`, { content })
    return r.data
  },

  async deleteNote(id: string): Promise<void> {
    await api.delete(`/pro/session-notes/${id}/`)
  },

  async getProfile() {
    const r = await api.get('/pro/profile/')
    return r.data
  },

  async updateProfile(data: FormData | Record<string, unknown>) {
    const r = await api.patch('/pro/profile/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    })
    return r.data
  },

  async getIncomingBookings(statusFilter?: string): Promise<ProBooking[]> {
    const params = statusFilter ? { status: statusFilter } : {}
    const r = await api.get('/pro/bookings/', { params })
    return r.data.results || r.data
  },

  async approveBooking(id: string): Promise<{ status: string }> {
    const r = await api.post(`/pro/bookings/${id}/approve/`)
    return r.data
  },

  async rejectBooking(id: string): Promise<{ status: string }> {
    const r = await api.post(`/pro/bookings/${id}/reject/`)
    return r.data
  },
}
