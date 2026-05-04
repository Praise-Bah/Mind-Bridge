import api from './api'
import type { Conversation, Message } from '@/types'

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations/')
    return response.data.results || response.data
  },

  async getConversation(id: string): Promise<Conversation> {
    const response = await api.get(`/chat/conversations/${id}/`)
    return response.data
  },

  async createConversation(participantIds: string[]): Promise<Conversation> {
    const response = await api.post('/chat/conversations/', { participants: participantIds })
    return response.data
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await api.get(`/chat/conversations/${conversationId}/messages/`)
    return response.data.results || response.data
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages/`, { content })
    return response.data
  },

  async markAsRead(conversationId: string): Promise<void> {
    await api.post(`/chat/conversations/${conversationId}/read/`)
  },
}
