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
}
