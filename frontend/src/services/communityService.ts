import api from './api'
import type { CommunityGroup, Post, Comment, Message } from '@/types'

export const communityService = {
  async getGroups(): Promise<CommunityGroup[]> {
    const response = await api.get('/community/groups/')
    return response.data.results || response.data || []
  },

  async getGroup(slug: string): Promise<CommunityGroup> {
    const response = await api.get(`/community/groups/${slug}/`)
    return response.data
  },

  async createGroup(data: FormData): Promise<CommunityGroup> {
    const response = await api.post('/community/groups/create/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async joinGroup(slug: string): Promise<void> {
    await api.post(`/community/groups/${slug}/join/`)
  },

  async leaveGroup(slug: string): Promise<void> {
    await api.delete(`/community/groups/${slug}/join/`)
  },

  async generateInvite(slug: string): Promise<{
    invite_code: string
    invite_url: string
    expires_at: string
  }> {
    const response = await api.post(`/community/groups/${slug}/invite/`)
    return response.data
  },

  async joinByInvite(inviteCode: string): Promise<{
    status: string
    group_name: string
  }> {
    const response = await api.post(`/community/join/${inviteCode}/`)
    return response.data
  },

  async getPosts(groupSlug: string): Promise<Post[]> {
    const response = await api.get(`/community/groups/${groupSlug}/posts/`)
    return response.data.results || response.data
  },

  async createPost(groupSlug: string, data: FormData): Promise<Post> {
    const response = await api.post(`/community/groups/${groupSlug}/posts/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async getPost(postId: string): Promise<Post> {
    const response = await api.get(`/community/posts/${postId}/`)
    return response.data
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/community/posts/${postId}/`)
  },

  async getComments(postId: string): Promise<Comment[]> {
    const response = await api.get(`/community/posts/${postId}/comments/`)
    return response.data.results || response.data
  },

  async createComment(postId: string, data: { content: string; is_anonymous?: boolean; parent?: string }): Promise<Comment> {
    const response = await api.post(`/community/posts/${postId}/comments/`, data)
    return response.data
  },

  async toggleReaction(postId: string, reactionType: string): Promise<void> {
    await api.post(`/community/posts/${postId}/react/`, { reaction_type: reactionType })
  },

  async getFeed(): Promise<Post[]> {
    const response = await api.get('/community/feed/')
    return response.data.results || response.data
  },

  async reportPost(postId: string, reason: string, details?: string): Promise<void> {
    await api.post(`/community/posts/${postId}/report/`, { reason, details: details || '' })
  },

  async reportComment(commentId: string, reason: string, details?: string): Promise<void> {
    await api.post(`/community/comments/${commentId}/report/`, { reason, details: details || '' })
  },

  async pinPost(postId: string): Promise<{ is_pinned: boolean }> {
    const response = await api.post(`/community/posts/${postId}/pin/`)
    return response.data
  },

  async savePost(postId: string): Promise<{ status: string }> {
    const response = await api.post(`/community/posts/${postId}/save/`)
    return response.data
  },

  async saveComment(commentId: string): Promise<{ status: string }> {
    const response = await api.post(`/community/comments/${commentId}/save/`)
    return response.data
  },

  async generateQuestions(groupId: string, creationReason: string): Promise<string[]> {
    const response = await api.post(`/community/groups/${groupId}/questions/`, {
      creation_reason: creationReason,
    })
    return response.data.questions
  },

  async submitAnswers(groupId: string, answers: string[]): Promise<void> {
    await api.post(`/community/groups/${groupId}/answers/`, { answers })
  },

  async getReviewStatus(groupId: string): Promise<{
    review_step: string
    ai_total_score: number | null
    ai_review_summary: string
    approval_status: string
    is_approved: boolean
  }> {
    const response = await api.get(`/community/groups/${groupId}/review-status/`)
    return response.data
  },

  async getGroupChat(slug: string): Promise<{ conversation_id: string; group_name: string; group_slug: string }> {
    const response = await api.get(`/chat/group/${slug}/`)
    return response.data
  },

  async getGroupChatMessages(slug: string): Promise<Message[]> {
    const response = await api.get(`/chat/group/${slug}/messages/`)
    return response.data.results || response.data
  },

  async sendGroupChatMessage(slug: string, content: string): Promise<Message> {
    const response = await api.post(`/chat/group/${slug}/messages/`, { content })
    return response.data
  },
}
