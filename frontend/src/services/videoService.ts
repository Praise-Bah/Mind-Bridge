import api from './api'
import type { Video } from '@/types'

export const videoService = {
  async getVideos(params?: Record<string, string>): Promise<Video[]> {
    const response = await api.get('/videos/', { params })
    return response.data.results || response.data
  },

  async getVideo(id: string): Promise<Video> {
    const response = await api.get(`/videos/${id}/`)
    return response.data
  },

  async getCategories(): Promise<{ id: string; name: string; slug: string }[]> {
    const response = await api.get('/videos/categories/')
    return response.data
  },

  async toggleBookmark(videoId: string): Promise<void> {
    await api.post(`/videos/${videoId}/bookmark/`)
  },

  async getBookmarks(): Promise<{ video: Video }[]> {
    const response = await api.get('/videos/bookmarks/')
    return response.data.results || response.data
  },

  async recordWatch(videoId: string, data: { watch_duration_seconds: number; completed: boolean }): Promise<void> {
    await api.post(`/videos/${videoId}/watch/`, data)
  },

  async getWatchHistory(): Promise<{ video: Video; watched_at: string }[]> {
    const response = await api.get('/videos/history/')
    return response.data.results || response.data
  },
}
