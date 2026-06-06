import { Play, Clock, Bookmark } from 'lucide-react'
import type { Video } from '@/types'

interface FeaturedVideoProps {
  video: Video
  onPlay: (video: Video) => void
  onBookmark: (videoId: string) => void
}

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getThumbnail(video: Video): string {
  if (video.thumbnail) return video.thumbnail as string
  if (video.youtube_id) return `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`
  return '/logo.png'
}

export default function FeaturedVideo({ video, onPlay, onBookmark }: FeaturedVideoProps) {
  const moodTag = Array.isArray(video.mood_tags) ? video.mood_tags[0] : video.mood_tags

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-card group cursor-pointer" onClick={() => onPlay(video)}>
      {/* Thumbnail */}
      <div className="relative aspect-[16/7] overflow-hidden">
        <img
          src={getThumbnail(video)}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Featured badge */}
        <div className="absolute top-4 left-4">
          <span className="bg-gradient-to-r from-[#00BFFF] to-[#7C5CBF] text-white text-xs font-semibold px-3 py-1 rounded-full">
            ✦ Featured
          </span>
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
            <Play className="w-7 h-7 text-[#00BFFF] ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              {moodTag && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-white/20 text-white/90 capitalize mb-2">
                  {moodTag}
                </span>
              )}
              <h2 className="text-white text-lg font-semibold leading-snug line-clamp-2">{video.title}</h2>
              {video.duration_seconds > 0 && (
                <div className="flex items-center gap-1 mt-1 text-white/70 text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(video.duration_seconds)}
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onBookmark(video.id) }}
              className="flex-shrink-0 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="Save video"
            >
              <Bookmark className={`w-5 h-5 ${video.is_bookmarked ? 'text-[#00BFFF] fill-[#00BFFF]' : 'text-white'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
