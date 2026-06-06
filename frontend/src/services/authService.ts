import api from './api'
import type { User, LoginCredentials, RegisterData, AuthResponse, ProfessionalApplicationStatus } from '@/types'

export interface VerifyEmailData {
  email: string
  code: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  email: string
  code: string
  new_password: string
  new_password_confirm: string
}

export interface GoogleAuthData {
  token: string
  role?: 'user' | 'professional'
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  },

  async register(data: RegisterData & { role?: 'user' | 'professional' }): Promise<User> {
    const response = await api.post('/auth/register/', data)
    return response.data
  },

  async verifyEmail(data: VerifyEmailData): Promise<AuthResponse & { message: string }> {
    const response = await api.post('/auth/verify-email/', data)
    return response.data
  },

  async resendOTP(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/resend-otp/', { email })
    return response.data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post('/auth/forgot-password/', { email })
    return response.data
  },

  async verifyResetCode(email: string, code: string): Promise<{ message: string; valid: boolean }> {
    const response = await api.post('/auth/verify-reset-code/', { email, code })
    return response.data
  },

  async resetPassword(data: ResetPasswordData): Promise<{ message: string }> {
    const response = await api.post('/auth/reset-password/', data)
    return response.data
  },

  async googleAuth(data: GoogleAuthData): Promise<AuthResponse & { user: User; created: boolean }> {
    const response = await api.post('/auth/google/', data)
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

  async getMyApplication(): Promise<ProfessionalApplicationStatus> {
    const response = await api.get('/auth/my-application/')
    return response.data
  },
}
