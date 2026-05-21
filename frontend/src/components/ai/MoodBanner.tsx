import { X, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MoodBannerProps {
  mood: string
  videoTitle?: string
  videoId?: string
  isVisible: boolean
  onDismiss: () => void
  onWatchVideo?: () => void
}

const MOOD_COLORS: Record<string, string> = {
  anxious: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  sad: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  stressed: 'from-red-500/20 to-pink-500/20 border-red-500/30',
  overwhelmed: 'from-purple-500/20 to-violet-500/20 border-purple-500/30',
  calm: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
}

const MOOD_EMOJIS: Record<string, string> = {
  anxious: '😰',
  sad: '😢',
  stressed: '😤',
  overwhelmed: '🌊',
  calm: '😌',
}

export default function MoodBanner({
  mood,
  videoTitle,
  videoId,
  isVisible,
  onDismiss,
  onWatchVideo,
}: MoodBannerProps) {
  if (!isVisible) return null

  const colorClass = MOOD_COLORS[mood.toLowerCase()] || MOOD_COLORS.calm
  const emoji = MOOD_EMOJIS[mood.toLowerCase()] || '💭'

  return (
    <div
      className={cn(
        'mx-4 mb-4 p-4 rounded-xl border bg-gradient-to-r',
        'animate-slide-down',
        colorClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-medium">
              I sense you might be feeling {mood.toLowerCase()}
            </p>
            {videoTitle && (
              <p className="text-sm text-muted-foreground mt-1">
                I found a video that might help: "{videoTitle}"
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {videoId && onWatchVideo && (
        <button
          onClick={onWatchVideo}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 hover:bg-background/80 text-sm font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          Watch Video
        </button>
      )}
    </div>
  )
}
