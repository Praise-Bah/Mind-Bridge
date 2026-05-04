import api from './api'
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post('/auth/register/', data)
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/users/profile/')
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/users/profile/', data)
    return response.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
    })
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken })
    return response.data
  },
}
