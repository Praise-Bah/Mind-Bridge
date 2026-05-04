import api from './api'
import type { AISession } from '@/types'

export const aiService = {
  async getSessions(): Promise<AISession[]> {
    const response = await api.get('/ai/sessions/')
    return response.data.results || response.data
  },

  async getSession(id: string): Promise<AISession> {
    const response = await api.get(`/ai/sessions/${id}/`)
    return response.data
  },

  async createSession(): Promise<AISession> {
    const response = await api.post('/ai/sessions/', { title: 'New Chat' })
    return response.data
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/ai/sessions/${id}/`)
  },

  async sendMessage(message: string, sessionId?: string): Promise<{ session_id: string; response: string }> {
    const response = await api.post('/ai/chat/', { message, session_id: sessionId })
    return response.data
  },

  streamMessage(message: string, sessionId?: string): EventSource {
    const token = localStorage.getItem('token')
    const url = new URL('/api/v1/ai/chat/stream/', window.location.origin)
    url.searchParams.set('message', message)
    if (sessionId) url.searchParams.set('session_id', sessionId)
    if (token) url.searchParams.set('token', token)
    
    return new EventSource(url.toString())
  },
}
