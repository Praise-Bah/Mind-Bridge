import api from './api'
import type { User, UserGoal, Booking, Post } from '@/types'

export interface ProfileOverview {
  user: {
    id: string
    username: string
    first_name: string
    last_name: string
    avatar: string | null
    bio: string
    joined_date: string
    is_professional: boolean
  }
  streak: {
    current_streak: number
    longest_streak: number
  }
  achievements: {
    earned: number
    total: number
  }
  bookings: Booking[]
  saved_content: {
    videos: number
    posts: number
  }
  goals: {
    total: number
    completed: number
  }
  recent_moods: Array<{
    recorded_date: string
    mood_score: number
    mood_tag: string
  }>
}

export interface MoodCalendarDay {
  date: string
  mood_score: number | null
  has_entry: boolean
}

export interface CreateGoalData {
  title: string
  description?: string
  category: 'wellness' | 'social' | 'professional' | 'personal'
  target_date: string
}

export interface UpdateGoalData {
  title?: string
  description?: string
  category?: 'wellness' | 'social' | 'professional' | 'personal'
  target_date?: string
  is_completed?: boolean
  progress?: number
}

export const profileService = {
  async getProfileOverview(): Promise<ProfileOverview> {
    const response = await api.get('/users/profile/overview/')
    return response.data
  },

  async getMoodCalendar(year: number, month: number): Promise<MoodCalendarDay[]> {
    const response = await api.get('/users/moods/calendar/', {
      params: { year, month }
    })
    return response.data
  },

  async getGoals(): Promise<UserGoal[]> {
    const response = await api.get('/users/goals/')
    return response.data.results || response.data
  },

  async createGoal(data: CreateGoalData): Promise<UserGoal> {
    const response = await api.post('/users/goals/', data)
    return response.data
  },

  async updateGoal(id: string, data: UpdateGoalData): Promise<UserGoal> {
    const response = await api.patch(`/users/goals/${id}/`, data)
    return response.data
  },

  async deleteGoal(id: string): Promise<void> {
    await api.delete(`/users/goals/${id}/`)
  },

  async getSavedPosts(): Promise<Post[]> {
    const response = await api.get('/community/saved-posts/')
    return response.data.results || response.data
  },

  async getRecentBookings(): Promise<Booking[]> {
    const response = await api.get('/professionals/bookings/')
    const bookings = response.data.results || response.data
    return bookings.filter((booking: Booking) => booking.status === 'completed')
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/users/profile/', data)
    return response.data
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await api.patch('/users/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }
}
