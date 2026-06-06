import { useState } from 'react'
import { Heart, CheckCircle, Play, Clock, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Video } from '@/types'

interface VideoCardProps {
  video: Video
  onPlay: (video: Video) => void
  onBookmark: (videoId: string) => void
  onShare: (video: Video) => void
}

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getThumbnail(video: Video): string {
  if (video.thumbnail) return video.thumbnail as string
  if (video.youtube_id) return `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`
  return '/logo.png'
}

export default function VideoCard({ video, onPlay, onBookmark, onShare }: VideoCardProps) {
  const [bookmarked, setBookmarked] = useState(video.is_bookmarked)
  const [bookmarkAnim, setBookmarkAnim] = useState(false)

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarked((prev) => !prev)
    setBookmarkAnim(true)
    setTimeout(() => setBookmarkAnim(false), 600)
    onBookmark(video.id)
  }

  const moodTag = Array.isArray(video.mood_tags) ? video.mood_tags[0] : video.mood_tags

  return (
    <div
      className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-[#00BFFF]/40 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img
          src={getThumbnail(video)}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
        />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-[#00BFFF] ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Completed badge */}
        {video.is_completed && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span>Watched</span>
          </div>
        )}

        {/* Duration */}
        {video.duration_seconds > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
            <Clock className="w-3 h-3" />
            {formatDuration(video.duration_seconds)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium line-clamp-2 flex-1 leading-snug">{video.title}</h3>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onShare(video) }}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title="Share video"
            >
              <Share2 className="w-4 h-4 text-muted-foreground hover:text-[#00BFFF]" />
            </button>
            <button
              onClick={handleBookmark}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              title={bookmarked ? 'Remove bookmark' : 'Save video'}
            >
              <Heart
                className={cn(
                  'w-4 h-4 transition-all duration-300',
                  bookmarked ? 'text-rose-500 fill-rose-500' : 'text-muted-foreground',
                  bookmarkAnim && 'scale-125'
                )}
              />
            </button>
          </div>
        </div>

        {moodTag && (
          <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded-full bg-[#00BFFF]/10 text-[#00BFFF] capitalize">
            {moodTag}
          </span>
        )}
      </div>
    </div>
  )
}
