import api from './api'
import type { Professional, Booking } from '@/types'

export const professionalService = {
  async getProfessionals(params?: Record<string, string>): Promise<Professional[]> {
    const response = await api.get('/professionals/', { params })
    return response.data.results || response.data
  },

  async getProfessional(id: string): Promise<Professional> {
    const response = await api.get(`/professionals/${id}/`)
    return response.data
  },

  async getAvailability(professionalId: string): Promise<unknown[]> {
    const response = await api.get(`/professionals/${professionalId}/availability/`)
    return response.data
  },

  async getReviews(professionalId: string): Promise<unknown[]> {
    const response = await api.get(`/professionals/${professionalId}/reviews/`)
    return response.data.results || response.data
  },

  async getBookings(): Promise<Booking[]> {
    const response = await api.get('/professionals/bookings/')
    return response.data.results || response.data
  },

  async createBooking(data: Partial<Booking>): Promise<Booking> {
    const response = await api.post('/professionals/bookings/', data)
    return response.data
  },

  async cancelBooking(bookingId: string): Promise<void> {
    await api.post(`/professionals/bookings/${bookingId}/cancel/`)
  },

  async createReview(bookingId: string, data: { rating: number; comment: string }): Promise<void> {
    await api.post(`/professionals/bookings/${bookingId}/review/`, data)
  },
}
