import api from './api'
import type { CommunityGroup, Post, Comment } from '@/types'

export const communityService = {
  async getGroups(): Promise<CommunityGroup[]> {
    const response = await api.get('/community/groups/')
    return response.data
  },

  async getGroup(slug: string): Promise<CommunityGroup> {
    const response = await api.get(`/community/groups/${slug}/`)
    return response.data
  },

  async joinGroup(slug: string): Promise<void> {
    await api.post(`/community/groups/${slug}/join/`)
  },

  async leaveGroup(slug: string): Promise<void> {
    await api.delete(`/community/groups/${slug}/join/`)
  },

  async getPosts(groupSlug: string): Promise<Post[]> {
    const response = await api.get(`/community/groups/${groupSlug}/posts/`)
    return response.data.results || response.data
  },

  async createPost(groupSlug: string, data: { content: string; is_anonymous?: boolean }): Promise<Post> {
    const response = await api.post(`/community/groups/${groupSlug}/posts/`, data)
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
}
