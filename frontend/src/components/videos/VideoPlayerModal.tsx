import { useEffect, useRef, useState } from 'react'
import { X, ThumbsUp, ThumbsDown, Share2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Video } from '@/types'
import { videoService } from '@/services/videoService'

interface VideoPlayerModalProps {
  video: Video
  onClose: () => void
  onShare: (video: Video) => void
}

export default function VideoPlayerModal({ video, onClose, onShare }: VideoPlayerModalProps) {
  const [userRating, setUserRating] = useState<'helpful' | 'not_helpful' | null>(video.user_rating)
  const [helpfulCount, setHelpfulCount] = useState(video.helpful_count ?? 0)
  const [notHelpfulCount, setNotHelpfulCount] = useState(video.not_helpful_count ?? 0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      const watchDuration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      if (watchDuration > 5) {
        videoService.recordWatch(video.id, {
          watch_duration_seconds: watchDuration,
          completed: watchDuration > (video.duration_seconds * 0.85),
        }).catch(() => {})
      }
    }
  }, [video.id, video.duration_seconds])

  const handleRate = async (isHelpful: boolean) => {
    try {
      const result = await videoService.rateVideo(video.id, isHelpful)
      setHelpfulCount(result.helpful_count)
      setNotHelpfulCount(result.not_helpful_count)
      if (result.status === 'removed') {
        setUserRating(null)
      } else {
        setUserRating(isHelpful ? 'helpful' : 'not_helpful')
      }
    } catch {}
  }

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen?.()
  }

  const embedUrl = video.youtube_id
    ? `https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0&modestbranding=1`
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-4xl bg-card rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm line-clamp-1 flex-1 pr-4">{video.title}</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleFullscreen} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Fullscreen">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => onShare(video)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {embedUrl ? (
            <iframe
              ref={iframeRef}
              src={embedUrl}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No playable source available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between gap-4 border-t">
          <p className="text-sm text-muted-foreground line-clamp-1 flex-1">{video.description}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Helpful?</span>
            <button
              onClick={() => handleRate(true)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-all',
                userRating === 'helpful'
                  ? 'bg-green-500/10 border-green-500 text-green-600'
                  : 'border-border hover:border-green-500 hover:text-green-600'
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{helpfulCount}</span>
            </button>
            <button
              onClick={() => handleRate(false)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-all',
                userRating === 'not_helpful'
                  ? 'bg-rose-500/10 border-rose-500 text-rose-600'
                  : 'border-border hover:border-rose-500 hover:text-rose-600'
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{notHelpfulCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
