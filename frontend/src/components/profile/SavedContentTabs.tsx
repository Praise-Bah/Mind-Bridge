import { useState, useEffect } from 'react'
import { Bookmark, Video, MessageSquare, ExternalLink } from 'lucide-react'
import type { Video as VideoType, Post as PostType } from '@/types'
import { videoService } from '@/services/videoService'

interface SavedContentTabsProps {
  videoCount: number
  postCount: number
}

export default function SavedContentTabs({ videoCount, postCount }: SavedContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'videos' | 'posts'>('videos')
  const [videos, setVideos] = useState<VideoType[]>([])
  const [posts] = useState<PostType[]>([])
  const [loading, setLoading] = useState(false)

  const loadContent = async () => {
    if (activeTab === 'videos' && videos.length === 0) {
      try {
        setLoading(true)
        const bookmarkedVideos = await videoService.getBookmarks()
        setVideos(bookmarkedVideos.map(item => item.video))
      } catch (error) {
        console.error('Failed to load saved videos:', error)
      } finally {
        setLoading(false)
      }
    }
    // TODO: Load saved posts when API is ready
  }

  useEffect(() => {
    loadContent()
  }, [activeTab])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4">
                <div className="w-32 h-20 bg-gray-700 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'videos') {
      if (videos.length === 0) {
        return (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No saved videos yet</p>
            <p className="text-gray-500 text-sm mt-2">Bookmark videos to see them here!</p>
          </div>
        )
      }

      return (
        <div className="space-y-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => window.open(`/videos/${video.id}`, '_blank')}
            >
              {/* Thumbnail */}
              <div className="relative w-32 h-20 bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-gray-600" />
                  </div>
                )}
                
                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
                  {formatDuration(video.duration_seconds)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white mb-1 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                  {video.description}
                </p>
                
                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{video.category_name}</span>
                  <span>{video.view_count} views</span>
                  {video.is_completed && (
                    <span className="text-green-400">✓ Watched</span>
                  )}
                </div>
              </div>

              {/* External Link */}
              <div className="flex items-center text-gray-400">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Posts tab
    if (posts.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No saved posts yet</p>
          <p className="text-gray-500 text-sm mt-2">Save posts to see them here!</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => window.open(`/community/${post.group}/posts/${post.id}`, '_blank')}
          >
            <h3 className="font-medium text-white mb-1 line-clamp-2">
              {post.content}
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{post.group_name}</span>
              <span>{post.comments_count} comments</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-5 h-5 text-green-400" />
        <h2 className="text-xl font-semibold text-white">Saved Content</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'videos'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Videos</span>
          {videoCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {videoCount}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'posts'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Posts</span>
          {postCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {postCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {renderTabContent()}
      </div>
    </div>
  )
}
