import api from './api'
import type { JournalEntry } from '@/types'

export const journalService = {
  async getEntries(params?: Record<string, string>): Promise<JournalEntry[]> {
    const response = await api.get('/journals/', { params })
    return response.data.results || response.data
  },

  async getEntry(id: string): Promise<JournalEntry> {
    const response = await api.get(`/journals/${id}/`)
    return response.data
  },

  async createEntry(data: Partial<JournalEntry>): Promise<JournalEntry> {
    const response = await api.post('/journals/', data)
    return response.data
  },

  async updateEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
    const response = await api.patch(`/journals/${id}/`, data)
    return response.data
  },

  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/journals/${id}/`)
  },

  async getDailyPrompt(): Promise<{ id: string; prompt_text: string; category: string } | null> {
    try {
      const response = await api.get('/journals/prompt/')
      return response.data
    } catch {
      return null
    }
  },

  async getInsights(): Promise<{
    insights: any
    streak: number
    mood_trends: any[]
    total_entries: number
    entries_with_mood: number
  }> {
    const response = await api.get('/journals/insights/')
    return response.data
  },

  async getMoodAffirmation(): Promise<{ affirmation: string }> {
    const response = await api.get('/journals/affirmation/')
    return response.data
  },

  async getReflectionPrompt(): Promise<{ prompt: string }> {
    const response = await api.get('/journals/reflection/')
    return response.data
  },

  async getStatistics(): Promise<{
    total_entries: number
    entries_this_month: number
    current_streak: number
    mood_distribution: Record<number, number>
    top_tags: Array<[string, number]>
    avg_words_per_entry: number
  }> {
    const response = await api.get('/journals/statistics/')
    return response.data
  },
}
