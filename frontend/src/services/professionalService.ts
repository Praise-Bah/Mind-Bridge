import api from './api'
import type { Professional, Booking, Review, Availability, Specialization } from '@/types'

export const professionalService = {
  async getProfessionals(params?: Record<string, string>): Promise<Professional[]> {
    const response = await api.get('/professionals/', { params })
    return response.data.results || response.data
  },

  async getProfessional(id: string): Promise<Professional> {
    const response = await api.get(`/professionals/${id}/`)
    return response.data
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

  async createReview(bookingId: string, data: { rating: number; comment: string }): Promise<Review> {
    const response = await api.post(`/professionals/bookings/${bookingId}/review/`, data)
    return response.data
  },

  async getSpecializations(): Promise<Specialization[]> {
    const response = await api.get('/professionals/specializations/')
    return response.data.results || response.data
  },

  async toggleFavourite(id: string): Promise<{ is_favourite: boolean }> {
    const response = await api.post(`/professionals/${id}/favourite/`)
    return response.data
  },

  async getFavourites(): Promise<Professional[]> {
    const response = await api.get('/professionals/favourites/')
    const items: Array<{ professional: Professional }> = response.data.results || response.data
    return items.map(item => item.professional)
  },

  async getAvailability(professionalId: string): Promise<Availability[]> {
    const response = await api.get(`/professionals/${professionalId}/availability/`)
    return response.data.results || response.data
  },

  async getReviews(professionalId: string): Promise<Review[]> {
    const response = await api.get(`/professionals/${professionalId}/reviews/`)
    return response.data.results || response.data
  },
}
